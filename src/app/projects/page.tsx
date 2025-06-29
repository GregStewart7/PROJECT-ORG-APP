'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, FolderPlus, BarChart3, Target, Calendar, CheckCircle2, Clock, TrendingUp, Activity, Sparkles } from 'lucide-react'

import { Project } from '@/types'
import { getProjects, createProject, updateProject, deleteProject } from '@/lib/database'
import { useAuth } from '@/contexts/AuthContext'

import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { ProjectCard } from '@/components/project/ProjectCard'
import { ProjectForm } from '@/components/project/ProjectForm'

export default function ProjectsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
      return
    }
  }, [user, authLoading, router])

  // Load projects
  const loadProjects = async () => {
    if (!user) return
    
    try {
      setLoading(true)
      setError(null)
      
      const response = await getProjects()
      if (response.success && response.data) {
        setProjects(response.data)
      } else {
        setError(response.error || 'Failed to load projects')
      }
    } catch (err) {
      console.error('Error loading projects:', err)
      setError('Failed to load projects')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      loadProjects()
    }
  }, [user])

  const handleCreateProject = async (data: { name: string; description: string | null; due_date: string | null }) => {
    if (!user) return
    
    try {
      setIsCreating(true)
      const response = await createProject({
        name: data.name,
        description: data.description,
        due_date: data.due_date
      })
      
      if (response.success) {
        await loadProjects()
        setShowSuccessMessage(true)
        setSuccessMessage('Project created successfully!')
        setTimeout(() => setShowSuccessMessage(false), 3000)
      } else {
        setError(response.error || 'Failed to create project')
      }
    } catch (err) {
      console.error('Error creating project:', err)
      setError('Failed to create project')
    } finally {
      setIsCreating(false)
    }
  }

  const handleEditProject = async (data: { name: string; description: string | null; due_date: string | null }) => {
    if (!editingProject) return
    
    try {
      const response = await updateProject({
        id: editingProject.id,
        name: data.name,
        description: data.description,
        due_date: data.due_date
      })
      
      if (response.success) {
        await loadProjects()
        setEditingProject(null)
        setShowSuccessMessage(true)
        setSuccessMessage('Project updated successfully!')
        setTimeout(() => setShowSuccessMessage(false), 3000)
      } else {
        setError(response.error || 'Failed to update project')
      }
    } catch (err) {
      console.error('Error updating project:', err)
      setError('Failed to update project')
    }
  }

  const handleDeleteProject = async (projectId: string) => {
    try {
      const response = await deleteProject(projectId)
      
      if (response.success) {
        await loadProjects()
        setShowSuccessMessage(true)
        setSuccessMessage('Project deleted successfully!')
        setTimeout(() => setShowSuccessMessage(false), 3000)
      } else {
        setError(response.error || 'Failed to delete project')
      }
    } catch (err) {
      console.error('Error deleting project:', err)
      setError('Failed to delete project')
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="bg-gradient-to-br from-white to-gray-50/50 hover:shadow-lg transition-all duration-300 animate-pulse" style={{ animationDelay: `${i * 100}ms` }}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="h-4 w-20 bg-gray-200 rounded mb-2"></div>
                      <div className="h-8 w-12 bg-gray-300 rounded"></div>
                    </div>
                    <div className="p-3 bg-gray-100 rounded-xl">
                      <div className="w-6 h-6 bg-gray-200 rounded"></div>
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
      <div className="container mx-auto p-6 space-y-8">
        {/* Enhanced Success Message */}
        {showSuccessMessage && (
          <div className="animate-in slide-in-from-top-4 duration-300">
            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl shadow-sm">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-green-200 rounded-full">
                  <CheckCircle2 className="size-4 text-green-700" />
                </div>
                <p className="text-green-800 font-medium">{successMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Error Message */}
        {error && (
          <div className="animate-in slide-in-from-top-4 duration-300">
            <div className="p-4 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl shadow-sm">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-red-200 rounded-full">
                  <Sparkles className="size-4 text-red-700" />
                </div>
                <p className="text-red-800 font-medium">{error}</p>
              </div>
              <Button 
                variant="link" 
                size="sm" 
                onClick={() => setError(null)}
                className="text-red-600 hover:text-red-800 p-0 h-auto ml-6"
              >
                Dismiss
              </Button>
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

        {/* Enhanced Statistics Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-600 delay-200">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200/50 hover:shadow-lg transition-all duration-300 hover:scale-105 group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium">Total Projects</p>
                  <p className="text-3xl font-bold text-blue-900">{stats.total}</p>
                </div>
                <div className="p-3 bg-blue-200/50 rounded-xl group-hover:bg-blue-300/50 transition-colors">
                  <Target className="size-6 text-blue-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-green-200/50 hover:shadow-lg transition-all duration-300 hover:scale-105 group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium">Upcoming Projects</p>
                  <p className="text-3xl font-bold text-green-900">{stats.upcoming}</p>
                </div>
                <div className="p-3 bg-green-200/50 rounded-xl group-hover:bg-green-300/50 transition-colors">
                  <TrendingUp className="size-6 text-green-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200/50 hover:shadow-lg transition-all duration-300 hover:scale-105 group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-600 text-sm font-medium">Overdue Projects</p>
                  <p className="text-3xl font-bold text-orange-900">{stats.overdue}</p>
                </div>
                <div className="p-3 bg-orange-200/50 rounded-xl group-hover:bg-orange-300/50 transition-colors">
                  <Clock className="size-6 text-orange-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200/50 hover:shadow-lg transition-all duration-300 hover:scale-105 group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 text-sm font-medium">Recent Projects</p>
                  <p className="text-3xl font-bold text-purple-900">{stats.recent}</p>
                </div>
                <div className="p-3 bg-purple-200/50 rounded-xl group-hover:bg-purple-300/50 transition-colors">
                  <Activity className="size-6 text-purple-700" />
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
            <div className="text-center py-16 transform transition-all duration-500 ease-out">
              <Card className="max-w-md mx-auto bg-gradient-to-br from-blue-50 via-white to-purple-50/30 border-blue-200/30 shadow-xl">
                <CardContent className="p-12">
                  <div className="relative mb-8">
                    <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center shadow-lg">
                      <FolderPlus className="size-12 text-blue-600" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center shadow-lg">
                      <Sparkles className="size-4 text-white" />
                    </div>
                  </div>
                  
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    Ready to Get Organized?
                  </h3>
                  <p className="text-gray-600 mb-8 leading-relaxed">
                    Create your first project and start managing your tasks with our professional tools.
                  </p>
                  
                  <Button
                    onClick={() => setIsCreating(true)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-8 py-3 h-auto transition-all duration-300 hover:scale-105 hover:shadow-xl"
                  >
                    <Plus className="size-5 mr-2" />
                    Create Your First Project
                  </Button>
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
          isLoading={isCreating}
        />
      </div>
    </div>
  )
} 