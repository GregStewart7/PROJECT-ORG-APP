'use client'

import { AuthHeader } from "@/components/common/AuthHeader"
import { Button } from "@/components/ui/button"
import { useRequireAuth } from "@/contexts/AuthContext"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getProjects, createProject, updateProject, deleteProject, getProjectCount } from "@/lib/database"
import { Project, CreateProjectData, UpdateProjectData } from "@/types"
import { Plus, AlertCircle } from "lucide-react"
import { ProjectCard } from "@/components/project/ProjectCard"
import { ProjectForm } from "@/components/project/ProjectForm"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function ProjectsPage() {
  const { user, loading } = useRequireAuth()
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [projectCount, setProjectCount] = useState<number>(0)
  const [isLoadingProjects, setIsLoadingProjects] = useState(true)
  const [isProjectFormOpen, setIsProjectFormOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [deletingProject, setDeletingProject] = useState<Project | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Fetch projects when component mounts and user is available
  useEffect(() => {
    if (user && !loading) {
      fetchProjects()
      fetchProjectCount()
    }
  }, [user, loading])

  // Clear messages after a few seconds
  useEffect(() => {
    if (error || successMessage) {
      const timer = setTimeout(() => {
        setError(null)
        setSuccessMessage(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error, successMessage])

  const fetchProjects = async () => {
    setIsLoadingProjects(true)
    try {
      const result = await getProjects()
      if (result.success && result.data) {
        setProjects(result.data)
      } else {
        setError(result.error || 'Failed to fetch projects')
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
      setError('An unexpected error occurred while fetching projects')
    } finally {
      setIsLoadingProjects(false)
    }
  }

  const fetchProjectCount = async () => {
    try {
      const result = await getProjectCount()
      if (result.success && result.data !== undefined) {
        setProjectCount(result.data)
      }
    } catch (error) {
      console.error('Error fetching project count:', error)
    }
  }

  const handleCreateProject = async (projectData: Omit<Project, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    setIsCreating(true)
    setError(null)
    
    try {
      const createData: CreateProjectData = {
        name: projectData.name,
        description: projectData.description,
        due_date: projectData.due_date
      }
      
      const result = await createProject(createData)
      
      if (result.success && result.data) {
        setSuccessMessage(`Project "${result.data.name}" created successfully!`)
        // Refresh the projects list
        await fetchProjects()
        await fetchProjectCount()
        setIsProjectFormOpen(false)
      } else {
        setError(result.error || 'Failed to create project')
      }
    } catch (error) {
      console.error('Error creating project:', error)
      setError('An unexpected error occurred while creating the project')
    } finally {
      setIsCreating(false)
    }
  }

  const handleEditProject = async (projectData: Omit<Project, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!editingProject) return

    setIsEditing(true)
    setError(null)
    
    try {
      const updateData: UpdateProjectData = {
        id: editingProject.id,
        name: projectData.name,
        description: projectData.description,
        due_date: projectData.due_date
      }
      
      const result = await updateProject(updateData)
      
      if (result.success && result.data) {
        setSuccessMessage(`Project "${result.data.name}" updated successfully!`)
        // Refresh the projects list
        await fetchProjects()
        await fetchProjectCount()
        setIsProjectFormOpen(false)
        setEditingProject(null)
      } else {
        setError(result.error || 'Failed to update project')
      }
    } catch (error) {
      console.error('Error updating project:', error)
      setError('An unexpected error occurred while updating the project')
    } finally {
      setIsEditing(false)
    }
  }

  const handleProjectView = (projectId: string) => {
    router.push(`/projects/${projectId}`)
  }

  const handleProjectEdit = (project: Project) => {
    setEditingProject(project)
    setIsProjectFormOpen(true)
    setError(null) // Clear any existing errors
  }

  const handleProjectDelete = async (projectId: string) => {
    // Find the project to get its name for confirmation
    const project = projects.find(p => p.id === projectId)
    if (!project) return

    // Show confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to delete "${project.name}"?\n\nThis action cannot be undone and will permanently delete the project and all its tasks and notes.`
    )
    
    if (!confirmed) return

    setDeletingProject(project)
    setIsDeleting(true)
    setError(null)
    
    try {
      const result = await deleteProject(projectId)
      
      if (result.success) {
        setSuccessMessage(`Project "${project.name}" deleted successfully!`)
        // Refresh the projects list
        await fetchProjects()
        await fetchProjectCount()
      } else {
        setError(result.error || 'Failed to delete project')
      }
    } catch (error) {
      console.error('Error deleting project:', error)
      setError('An unexpected error occurred while deleting the project')
    } finally {
      setIsDeleting(false)
      setDeletingProject(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AuthHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <div className="h-5 bg-muted rounded w-3/4"></div>
                    <div className="h-4 bg-muted rounded w-full"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-3 bg-muted rounded w-full"></div>
                      <div className="h-3 bg-muted rounded w-2/3"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-background">
      <AuthHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
              <p className="text-muted-foreground">
                Welcome back! You have {projectCount} {projectCount === 1 ? 'project' : 'projects'}.
              </p>
            </div>
            <Button 
              onClick={() => {
                setEditingProject(null)
                setIsProjectFormOpen(true)
                setError(null)
              }}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create New Project
            </Button>
          </div>

          {/* Success/Error Messages */}
          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="flex items-center gap-2 p-4">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <p className="text-sm text-red-600">{error}</p>
              </CardContent>
            </Card>
          )}

          {successMessage && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="flex items-center gap-2 p-4">
                <div className="h-4 w-4 rounded-full bg-green-600 flex items-center justify-center">
                  <div className="h-2 w-2 rounded-full bg-white"></div>
                </div>
                <p className="text-sm text-green-600">{successMessage}</p>
              </CardContent>
            </Card>
          )}

          {/* Projects Grid */}
          {isLoadingProjects ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-5 bg-muted rounded w-3/4"></div>
                    <div className="h-4 bg-muted rounded w-full"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-3 bg-muted rounded w-full"></div>
                      <div className="h-3 bg-muted rounded w-2/3"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : projects.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onView={handleProjectView}
                  onEdit={handleProjectEdit}
                  onDelete={handleProjectDelete}
                  showActions={true}
                  isLoading={deletingProject?.id === project.id && isDeleting}
                />
              ))}
            </div>
          ) : (
            <Card className="border-dashed border-2 bg-muted/20">
              <CardHeader>
                <CardTitle className="text-center text-muted-foreground">
                  No Projects Yet
                </CardTitle>
                <CardDescription className="text-center">
                  Create your first project to get started organizing your tasks.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Projects help you organize tasks and track progress toward your goals.
                </p>
                <Button 
                  onClick={() => {
                    setEditingProject(null)
                    setIsProjectFormOpen(true)
                    setError(null)
                  }}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Create Your First Project
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Project Creation/Edit Form */}
      <ProjectForm
        isOpen={isProjectFormOpen}
        onClose={() => {
          setIsProjectFormOpen(false)
          setEditingProject(null)
          setError(null)
        }}
        onSubmit={editingProject ? handleEditProject : handleCreateProject}
        isLoading={editingProject ? isEditing : isCreating}
        mode={editingProject ? "edit" : "create"}
        initialData={editingProject || undefined}
      />
    </div>
  )
} 