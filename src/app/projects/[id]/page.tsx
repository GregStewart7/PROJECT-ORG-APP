'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { ArrowLeft, Calendar, Clock, Edit, Trash2, FolderOpen, Plus } from 'lucide-react'

import { AuthHeader } from "@/components/common/AuthHeader"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRequireAuth } from "@/contexts/AuthContext"
import { getProject, deleteProject } from "@/lib/database"
import { Project } from "@/types"

export default function ProjectDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const { user, loading } = useRequireAuth()
  
  const [project, setProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch project data when component mounts
  useEffect(() => {
    if (user && !loading && id) {
      fetchProject()
    }
  }, [user, loading, id])

  const fetchProject = async () => {
    if (!id || typeof id !== 'string') {
      setError('Invalid project ID')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)
    
    try {
      const result = await getProject(id)
      
      if (result.success && result.data) {
        setProject(result.data)
      } else {
        setError(result.error || 'Project not found')
      }
    } catch (error) {
      console.error('Error fetching project:', error)
      setError('An unexpected error occurred while loading the project')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = () => {
    // TODO: Implement edit functionality (Task 6.8)
    console.log('Edit project:', project?.id)
  }

  const handleDelete = async () => {
    if (!project) return

    const confirmed = window.confirm(
      `Are you sure you want to delete "${project.name}"?\n\nThis action cannot be undone and will permanently delete the project and all its tasks and notes.`
    )
    
    if (!confirmed) return

    setIsDeleting(true)
    
    try {
      const result = await deleteProject(project.id)
      
      if (result.success) {
        // Navigate back to projects list after successful deletion
        router.push('/projects')
      } else {
        setError(result.error || 'Failed to delete project')
      }
    } catch (error) {
      console.error('Error deleting project:', error)
      setError('An unexpected error occurred while deleting the project')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleBack = () => {
    router.push('/projects')
  }

  const handleAddTask = () => {
    // TODO: Implement add task functionality (Task 9.3)
    console.log('Add task to project:', project?.id)
  }

  const formatDueDate = (dateString: string | null) => {
    if (!dateString) return null
    
    try {
      const date = new Date(dateString)
      const today = new Date()
      const diffTime = date.getTime() - today.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      if (diffDays < 0) {
        return {
          text: `${Math.abs(diffDays)} days overdue`,
          variant: 'overdue' as const,
          className: 'text-red-600 bg-red-50 border-red-200'
        }
      } else if (diffDays === 0) {
        return {
          text: 'Due today',
          variant: 'today' as const,
          className: 'text-orange-600 bg-orange-50 border-orange-200'
        }
      } else if (diffDays <= 7) {
        return {
          text: `Due in ${diffDays} days`,
          variant: 'soon' as const,
          className: 'text-yellow-600 bg-yellow-50 border-yellow-200'
        }
      } else {
        return {
          text: `Due ${format(date, 'MMM d, yyyy')}`,
          variant: 'normal' as const,
          className: 'text-green-600 bg-green-50 border-green-200'
        }
      }
    } catch {
      return null
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AuthHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="flex items-center gap-4">
              <div className="h-8 w-8 bg-muted rounded"></div>
              <div className="h-8 bg-muted rounded w-1/3"></div>
            </div>
            <Card>
              <CardHeader>
                <div className="h-6 bg-muted rounded w-1/2"></div>
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-4 bg-muted rounded w-full"></div>
                  <div className="h-4 bg-muted rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect in useEffect
  }

  if (error && !project) {
    return (
      <div className="min-h-screen bg-background">
        <AuthHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="space-y-6">
            {/* Header with back button */}
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Projects
              </Button>
            </div>

            {/* Error display */}
            <Card className="border-red-200 bg-red-50">
              <CardContent className="flex items-center gap-2 p-6">
                <div className="text-red-600">
                  <h2 className="text-lg font-semibold mb-2">Project Not Found</h2>
                  <p className="text-sm">{error}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AuthHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="flex items-center gap-4">
              <div className="h-8 w-8 bg-muted rounded"></div>
              <div className="h-8 bg-muted rounded w-1/3"></div>
            </div>
            <Card>
              <CardHeader>
                <div className="h-6 bg-muted rounded w-1/2"></div>
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="h-4 bg-muted rounded w-full"></div>
                  <div className="h-4 bg-muted rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    )
  }

  if (!project) {
    return null
  }

  const dueDateInfo = formatDueDate(project.due_date)

  return (
    <div className="min-h-screen bg-background">
      <AuthHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Header with navigation and actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Projects
              </Button>
              <div className="h-6 w-px bg-border"></div>
              <div className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-blue-600" />
                <h1 className="text-2xl font-bold">{project.name}</h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleEdit}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex items-center gap-2 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
              >
                {isDeleting ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="flex items-center gap-2 p-4">
                <div className="text-red-600 text-sm">{error}</div>
              </CardContent>
            </Card>
          )}

          {/* Project Information */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-xl">Project Details</CardTitle>
                  <CardDescription>
                    Created {format(new Date(project.created_at), 'MMMM d, yyyy')}
                    {project.updated_at !== project.created_at && (
                      <span> • Updated {format(new Date(project.updated_at), 'MMMM d, yyyy')}</span>
                    )}
                  </CardDescription>
                </div>
                
                {dueDateInfo && (
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium border ${dueDateInfo.className}`}>
                    <Clock className="h-4 w-4" />
                    {dueDateInfo.text}
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Description */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Description</h3>
                <p className="text-sm leading-relaxed">
                  {project.description || (
                    <span className="text-muted-foreground italic">No description provided</span>
                  )}
                </p>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Created</h3>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(project.created_at), 'MMMM d, yyyy \'at\' h:mm a')}
                  </div>
                </div>

                {project.due_date && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">Due Date</h3>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4" />
                      {format(new Date(project.due_date), 'MMMM d, yyyy')}
                    </div>
                  </div>
                )}
              </div>

              {/* Project ID (for debugging/reference) */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Project ID</h3>
                <code className="text-xs bg-muted px-2 py-1 rounded">{project.id}</code>
              </div>
            </CardContent>
          </Card>

          {/* Tasks Section (placeholder for future implementation) */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Tasks</CardTitle>
                  <CardDescription>
                    Manage tasks for this project
                  </CardDescription>
                </div>
                <Button 
                  onClick={handleAddTask}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Task
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <div className="mb-4">
                  <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                    <Plus className="h-6 w-6" />
                  </div>
                </div>
                <h3 className="text-lg font-medium mb-2">No tasks yet</h3>
                <p className="text-sm mb-4">
                  Tasks will appear here once you add them to this project.
                </p>
                <Button 
                  variant="outline"
                  onClick={handleAddTask}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Your First Task
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
} 