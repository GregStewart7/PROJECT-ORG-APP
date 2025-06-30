'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, FolderPlus, BarChart3, Target, Calendar, CheckCircle2, Clock, TrendingUp, Activity, Sparkles, RefreshCw, Wifi, WifiOff, AlertTriangle, X } from 'lucide-react'

import { Project } from '@/types'
import { getProjects, createProject, updateProject, deleteProject } from '@/lib/database'
import { useAuth } from '@/contexts/AuthContext'

import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { ProjectCard } from '@/components/project/ProjectCard'
import { ProjectForm } from '@/components/project/ProjectForm'
import { AuthHeader } from '@/components/common/AuthHeader'

interface ErrorState {
  message: string
  type: 'network' | 'server' | 'validation' | 'unknown'
  recoverable: boolean
  retryCount: number
}

interface CustomError extends Error {
  status?: number
}

export default function ProjectsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<ErrorState | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true)
  const [isRetrying, setIsRetrying] = useState(false)

  // Enhanced error classification
  const classifyError = (error: any, retryCount: number = 0): ErrorState => {
    if (!navigator.onLine) {
      return {
        message: 'No internet connection. Please check your network and try again.',
        type: 'network',
        recoverable: true,
        retryCount
      }
    }

    if (error?.message?.includes('fetch') || error?.message?.includes('network') || error?.message?.includes('Failed to fetch')) {
      return {
        message: 'Connection failed. Please check your internet connection and try again.',
        type: 'network',
        recoverable: true,
        retryCount
      }
    }

    if (error?.status === 401 || error?.message?.includes('unauthorized')) {
      return {
        message: 'Your session has expired. Please log in again.',
        type: 'validation',
        recoverable: false,
        retryCount
      }
    }

    if (error?.status === 403) {
      return {
        message: 'You don\'t have permission to perform this action.',
        type: 'validation',
        recoverable: false,
        retryCount
      }
    }

    if (error?.status === 429) {
      return {
        message: 'Too many requests. Please wait a moment before trying again.',
        type: 'server',
        recoverable: true,
        retryCount
      }
    }

    if (error?.status >= 500) {
      return {
        message: 'Server error. Our team has been notified. Please try again in a few minutes.',
        type: 'server',
        recoverable: true,
        retryCount
      }
    }

    if (error?.status === 404) {
      return {
        message: 'The requested resource was not found.',
        type: 'validation',
        recoverable: false,
        retryCount
      }
    }

    return {
      message: error?.message || 'An unexpected error occurred. Please try again.',
      type: 'unknown',
      recoverable: true,
      retryCount
    }
  }

  // Enhanced retry mechanism
  const retryWithBackoff = async (operation: () => Promise<any>, maxRetries: number = 3) => {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        if (attempt === maxRetries) {
          throw error
        }
        
        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, attempt) * 1000
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
      return
    }
  }, [user, authLoading, router])

  // Enhanced load projects with retry logic
  const loadProjects = useCallback(async (showRetryIndicator: boolean = false) => {
    if (!user) return
    
    try {
      setLoading(true)
      if (showRetryIndicator) setIsRetrying(true)
      setError(null)
      
      const response = await retryWithBackoff(async () => {
      const result = await getProjects()
        if (!result.success) {
          const customError = new Error(result.error || 'Failed to load projects') as CustomError
          customError.status = 500 // Default status for API errors
          throw customError
        }
        return result
      })
      
      if (response.data) {
        setProjects(response.data)
      }
    } catch (err: any) {
      console.error('Error loading projects:', err)
      const errorState = classifyError(err)
      setError(errorState)
      
      // Auto-retry for network errors after a delay
      if (errorState.type === 'network' && errorState.retryCount < 2) {
        setTimeout(() => {
          loadProjects(true)
        }, 5000)
        setError({
          ...errorState,
          retryCount: errorState.retryCount + 1,
          message: `${errorState.message} Retrying automatically in 5 seconds...`
        })
      }
    } finally {
      setLoading(false)
      setIsRetrying(false)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      loadProjects()
    }
  }, [user, loadProjects])

  // Enhanced retry handler
  const handleRetry = async () => {
    if (error?.type === 'validation' && error.message.includes('session has expired')) {
      router.push('/auth/login')
      return
    }
    
    await loadProjects(true)
  }

  // Network status detection - moved after loadProjects definition
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      // Automatically retry loading projects when coming back online
      if (error?.type === 'network') {
        loadProjects(true)
      }
    }
    
    const handleOffline = () => {
      setIsOnline(false)
      setError({
        message: 'You appear to be offline. Please check your internet connection.',
        type: 'network',
        recoverable: true,
        retryCount: 0
      })
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [error, loadProjects])

  // Enhanced success message handler
  const showSuccess = (message: string) => {
    setSuccessMessage(message)
    setShowSuccessMessage(true)
    setTimeout(() => setShowSuccessMessage(false), 4000)
  }

  const handleCreateProject = async (data: { name: string; description: string | null; due_date: string | null }) => {
    if (!user) return
    
    try {
      setIsCreating(true)
      setError(null)
      
      const response = await retryWithBackoff(async () => {
        const result = await createProject({
          name: data.name,
          description: data.description,
          due_date: data.due_date
        })
        
        if (!result.success) {
          const customError = new Error(result.error || 'Failed to create project') as CustomError
          customError.status = 500
          throw customError
        }
        return result
      })
      
      await loadProjects()
      showSuccess('🎉 Project created successfully!')
    } catch (err: any) {
      console.error('Error creating project:', err)
      const errorState = classifyError(err)
      setError(errorState)
    } finally {
      setIsCreating(false)
    }
  }

  const handleEditProject = async (data: { name: string; description: string | null; due_date: string | null }) => {
    if (!editingProject) return
    
    try {
      setError(null)
      
      const response = await retryWithBackoff(async () => {
        const result = await updateProject({
        id: editingProject.id,
          name: data.name,
          description: data.description,
          due_date: data.due_date
        })
        
        if (!result.success) {
          const customError = new Error(result.error || 'Failed to update project') as CustomError
          customError.status = 500
          throw customError
        }
        return result
      })
      
      await loadProjects()
      setEditingProject(null)
      showSuccess('✅ Project updated successfully!')
    } catch (err: any) {
      console.error('Error updating project:', err)
      const errorState = classifyError(err)
      setError(errorState)
    }
  }

  const handleDeleteProject = async (projectId: string) => {
    try {
      setError(null)
      
      const response = await retryWithBackoff(async () => {
        const result = await deleteProject(projectId)
        
        if (!result.success) {
          const customError = new Error(result.error || 'Failed to delete project') as CustomError
          customError.status = 500
          throw customError
        }
        return result
      })
      
      await loadProjects()
      showSuccess('🗑️ Project deleted successfully!')
    } catch (err: any) {
      console.error('Error deleting project:', err)
      const errorState = classifyError(err)
      setError(errorState)
    }
  }

  const handleViewProject = (projectId: string) => {
    router.push(`/projects/${projectId}`)
  }

  // Calculate project statistics
  const getProjectStats = () => {
    const now = new Date()
    const total = projects.length
    const upcoming = projects.filter(p => p.due_date && new Date(p.due_date) > now).length
    const overdue = projects.filter(p => p.due_date && new Date(p.due_date) < now).length
    const recent = projects.filter(p => {
      const createdDate = new Date(p.created_at)
      const daysDiff = (now.getTime() - createdDate.getTime()) / (1000 * 3600 * 24)
      return daysDiff <= 7
    }).length
    
    return { total, upcoming, overdue, recent }
  }

  const stats = getProjectStats()

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/40">
        <AuthHeader />
        <div className="container mx-auto p-6 space-y-8">
          {/* Header Skeleton */}
          <div className="animate-in fade-in slide-in-from-top-4 duration-600">
            <Card className="bg-gradient-to-r from-blue-600 via-blue-700 to-purple-700 border-0 shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/90 via-blue-700/90 to-purple-700/90 backdrop-blur-sm" />
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl transform translate-x-32 -translate-y-32" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl transform -translate-x-24 translate-y-24" />
              
              <CardContent className="relative z-10 p-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-white/10 backdrop-blur-sm rounded-xl animate-pulse">
                        <div className="w-8 h-8 bg-white/20 rounded"></div>
                      </div>
                      <div>
                        <div className="h-8 w-48 bg-white/20 rounded animate-pulse mb-2"></div>
                        <div className="h-5 w-64 bg-white/10 rounded animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                  <div className="h-12 w-40 bg-white/20 rounded-xl animate-pulse"></div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Statistics Skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="bg-gradient-to-br from-white to-gray-50/50 transition-all duration-300 animate-pulse" style={{ animationDelay: `${i * 100}ms` }}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="h-3 w-16 bg-gray-200 rounded mb-2"></div>
                      <div className="h-6 w-10 bg-gray-300 rounded"></div>
                    </div>
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <div className="w-4 h-4 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Projects Grid Skeleton */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-xl animate-pulse">
                  <div className="w-5 h-5 bg-gray-200 rounded"></div>
                </div>
                <div>
                  <div className="h-6 w-32 bg-gray-200 rounded mb-1"></div>
                  <div className="h-4 w-48 bg-gray-100 rounded"></div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="h-64 animate-pulse" style={{ animationDelay: `${i * 100}ms` }}>
                  <CardHeader>
                    <div className="h-6 w-3/4 bg-gray-200 rounded" />
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="h-4 w-full bg-gray-200 rounded" />
                    <div className="h-4 w-5/6 bg-gray-200 rounded" />
                    <div className="h-4 w-2/3 bg-gray-200 rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/40">
      <AuthHeader />
      <div className="container mx-auto p-6 space-y-8">
        {/* Network Status Indicator */}
        {!isOnline && (
          <div className="animate-in slide-in-from-top-4 duration-300">
            <div className="p-4 bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-xl shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-200 rounded-full">
                  <WifiOff className="size-4 text-orange-700" />
                </div>
                <div className="flex-1">
                  <p className="text-orange-800 font-medium">You're currently offline</p>
                  <p className="text-orange-600 text-sm">Some features may not be available until you reconnect.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Success Message */}
        {showSuccessMessage && (
          <div className="animate-in slide-in-from-top-4 duration-300">
            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-200 rounded-full">
                    <CheckCircle2 className="size-4 text-green-700" />
                  </div>
                  <p className="text-green-800 font-medium">{successMessage}</p>
            </div>
            <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setShowSuccessMessage(false)}
                  className="h-8 w-8 text-green-600 hover:text-green-800 hover:bg-green-100"
                >
                  <X className="size-4" />
            </Button>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Error Message with Recovery Options */}
          {error && (
          <div className="animate-in slide-in-from-top-4 duration-300">
            <div className="p-4 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl shadow-sm">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-red-200 rounded-full flex-shrink-0">
                  {error.type === 'network' ? (
                    <WifiOff className="size-4 text-red-700" />
                  ) : (
                    <AlertTriangle className="size-4 text-red-700" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-red-800 font-medium mb-1">
                    {error.type === 'network' ? 'Connection Problem' : 
                     error.type === 'server' ? 'Server Error' :
                     error.type === 'validation' ? 'Access Error' : 'Unexpected Error'}
                  </p>
                  <p className="text-red-700 text-sm mb-3">{error.message}</p>
                  
                  <div className="flex items-center gap-3">
                    {error.recoverable && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleRetry}
                        disabled={isRetrying}
                        className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                      >
                        {isRetrying ? (
                          <>
                            <RefreshCw className="size-3 mr-2 animate-spin" />
                            Retrying...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="size-3 mr-2" />
                            Try Again
                          </>
                        )}
                      </Button>
                    )}
                    
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setError(null)}
                      className="text-red-600 hover:text-red-800 hover:bg-red-100"
                    >
                      Dismiss
                    </Button>
                    
                    {error.type === 'validation' && error.message.includes('session') && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => router.push('/auth/login')}
                        className="text-blue-600 border-blue-200 hover:bg-blue-50"
                      >
                        Sign In Again
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Dashboard Header */}
        <div className="animate-in fade-in slide-in-from-top-4 duration-600">
          <Card className="bg-gradient-to-r from-blue-600 via-blue-700 to-purple-700 border-0 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/90 via-blue-700/90 to-purple-700/90 backdrop-blur-sm" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl transform translate-x-32 -translate-y-32" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl transform -translate-x-24 translate-y-24" />
            
            <CardContent className="relative z-10 p-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-white/10 backdrop-blur-sm rounded-xl">
                      <BarChart3 className="size-8 text-white" />
                    </div>
                    <div>
                      <h1 className="text-3xl md:text-4xl font-bold text-white">
                        Project Dashboard
                      </h1>
                      <p className="text-blue-100 text-lg">
                        Manage your projects with professional tools
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => setIsCreating(true)}
                  className="bg-white text-blue-700 hover:bg-blue-50 hover:text-blue-800 font-semibold px-6 py-3 h-auto transition-all duration-300 hover:scale-105 hover:shadow-xl border-2 border-white/20"
                  disabled={loading}
                >
                  <Plus className="size-5 mr-2" />
                  Create New Project
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Compact Statistics Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-600 delay-200">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200/50 hover:shadow-md transition-all duration-300 group">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-lg font-medium">Total Projects</p>
                  <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
                </div>
                <div className="p-2 bg-blue-200/50 rounded-lg group-hover:bg-blue-300/50 transition-colors">
                  <Target className="size-4 text-blue-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-green-200/50 hover:shadow-md transition-all duration-300 group">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-lg font-medium">Upcoming</p>
                  <p className="text-2xl font-bold text-green-900">{stats.upcoming}</p>
                </div>
                <div className="p-2 bg-green-200/50 rounded-lg group-hover:bg-green-300/50 transition-colors">
                  <TrendingUp className="size-4 text-green-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200/50 hover:shadow-md transition-all duration-300 group">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-600 text-lg font-medium">Overdue</p>
                  <p className="text-2xl font-bold text-orange-900">{stats.overdue}</p>
                </div>
                <div className="p-2 bg-orange-200/50 rounded-lg group-hover:bg-orange-300/50 transition-colors">
                  <Clock className="size-4 text-orange-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200/50 hover:shadow-md transition-all duration-300 group">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 text-lg font-medium">Recent</p>
                  <p className="text-2xl font-bold text-purple-900">{stats.recent}</p>
                </div>
                <div className="p-2 bg-purple-200/50 rounded-lg group-hover:bg-purple-300/50 transition-colors">
                  <Activity className="size-4 text-purple-700" />
                </div>
                    </div>
                  </CardContent>
                </Card>
        </div>

        {/* Enhanced Projects Section */}
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-600 delay-400">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-gray-100 to-gray-50 border border-gray-200/50">
                <BarChart3 className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Your Projects</h2>
                <p className="text-sm text-gray-600">Manage and track your project portfolio</p>
              </div>
            </div>
            
            {projects.length > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/50">
                <Activity className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">{projects.length} Active</span>
              </div>
            )}
          </div>

          {/* Projects Grid */}
          {projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project, index) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onEdit={setEditingProject}
                  onDelete={handleDeleteProject}
                  onView={handleViewProject}
                  animationDelay={index * 100}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 sm:py-16 px-4 transform transition-all duration-500 ease-out">
              <Card className="max-w-lg mx-auto bg-gradient-to-br from-blue-50 via-white to-purple-50/30 border-blue-200/30 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-200/20 to-purple-200/10 rounded-full blur-2xl -translate-y-16 translate-x-16" />
                <CardContent className="p-8 sm:p-12 relative z-10">
                  <div className="relative mb-6 sm:mb-8">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <FolderPlus className="size-10 sm:size-12 text-blue-600" />
                    </div>
                    <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center shadow-lg">
                      <Sparkles className="size-3 sm:size-4 text-white" />
                    </div>
                  </div>
                  
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">
                    Ready to Get Organized?
                  </h3>
                  <p className="text-gray-600 mb-6 sm:mb-8 leading-relaxed text-sm sm:text-base">
                    Create your first project and start managing your tasks with our professional tools. 
                    Everything you need to boost productivity is right here.
                  </p>
                  
                  <div className="space-y-4">
                <Button 
                      onClick={() => setIsCreating(true)}
                      className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-6 sm:px-8 py-3 h-auto transition-all duration-300 hover:scale-105 hover:shadow-xl text-sm sm:text-base"
                    >
                      <Plus className="size-4 sm:size-5 mr-2" />
                  Create Your First Project
                </Button>
                    
                    <div className="flex items-center justify-center gap-3 sm:gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                        <span>Free Forever</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                        <span>Unlimited</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                        <span>Cloud Sync</span>
                      </div>
                    </div>
                  </div>
              </CardContent>
            </Card>
            </div>
          )}
        </div>

        {/* Project Form Modal */}
      <ProjectForm
          isOpen={isCreating || !!editingProject}
        onClose={() => {
            setIsCreating(false)
          setEditingProject(null)
        }}
        onSubmit={editingProject ? handleEditProject : handleCreateProject}
        initialData={editingProject || undefined}
          mode={editingProject ? 'edit' : 'create'}
      />
      </div>
    </div>
  )
} 