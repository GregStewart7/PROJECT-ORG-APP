'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { ArrowLeft, Calendar, Clock, Edit, Trash2, FolderOpen, Plus, CheckCircle, AlertCircle, ArrowUpDown, Filter } from 'lucide-react'

import { AuthHeader } from "@/components/common/AuthHeader"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TaskCard } from "@/components/task/TaskCard"
import { TaskForm } from "@/components/task/TaskForm"
import { TaskDetailModal } from "@/components/task/TaskDetailModal"
import { ProjectForm } from "@/components/project/ProjectForm"
import { useRequireAuth } from "@/contexts/AuthContext"
import { 
  getProject, 
  updateProject,
  deleteProject, 
  getTasksByProject,
  createTask,
  updateTask,
  deleteTask,
  toggleTaskCompletion
} from "@/lib/database"
import { Project, Task, CreateTaskData, UpdateTaskData, ApiResponse } from "@/types"

export default function ProjectDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const { user, loading } = useRequireAuth()
  
  const [project, setProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  
  // Task form state
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [isTaskLoading, setIsTaskLoading] = useState(false)
  
  // Task detail modal state
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false)
  
  // Task sorting state
  const [taskSortBy, setTaskSortBy] = useState<'default' | 'priority' | 'dueDate' | 'created' | 'alphabetical'>('default')
  const [taskFilterBy, setTaskFilterBy] = useState<'all' | 'active' | 'completed'>('all')
  
  // Project form state
  const [isProjectFormOpen, setIsProjectFormOpen] = useState(false)
  const [isProjectLoading, setIsProjectLoading] = useState(false)

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
      // Fetch both project and tasks in parallel
      const [projectResult, tasksResult] = await Promise.all([
        getProject(id),
        getTasksByProject(id)
      ])
      
      if (projectResult.success && projectResult.data) {
        setProject(projectResult.data)
      } else {
        setError(projectResult.error || 'Project not found')
        return
      }

      if (tasksResult.success && tasksResult.data) {
        setTasks(tasksResult.data)
      } else {
        console.warn('Failed to load tasks:', tasksResult.error)
        setTasks([]) // Set empty array if tasks fail to load
      }
    } catch (error) {
      console.error('Error fetching project:', error)
      setError('An unexpected error occurred while loading the project')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = () => {
    setIsProjectFormOpen(true)
  }

  const handleCloseProjectForm = () => {
    setIsProjectFormOpen(false)
  }

  const handleProjectSubmit = async (projectData: Omit<Project, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!project) return

    setIsProjectLoading(true)
    setError(null)

    try {
      const result = await updateProject({
        id: project.id,
        ...projectData
      })

      if (result.success && result.data) {
        setProject(result.data)
        setSuccessMessage('Project updated successfully!')
        setIsProjectFormOpen(false)
      } else {
        setError(result.error || 'Failed to update project')
      }
    } catch (error) {
      console.error('Error updating project:', error)
      setError('An unexpected error occurred while updating the project')
    } finally {
      setIsProjectLoading(false)
    }
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

  // Auto-dismiss success messages after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [successMessage])

  const handleAddTask = () => {
    setEditingTask(null)
    setIsTaskFormOpen(true)
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
    setIsTaskFormOpen(true)
  }

  const handleCloseTaskForm = () => {
    setIsTaskFormOpen(false)
    setEditingTask(null)
  }

  const handleViewTask = (task: Task) => {
    setSelectedTask(task)
    setIsTaskDetailOpen(true)
  }

  const handleCloseTaskDetail = () => {
    setIsTaskDetailOpen(false)
    setSelectedTask(null)
  }

  const handleTaskUpdate = (updatedTask: Task) => {
    setTasks(prev => prev.map(task => 
      task.id === updatedTask.id ? updatedTask : task
    ))
  }

  const handleTaskSubmit = async (taskData: CreateTaskData | UpdateTaskData) => {
    if (!project) return

    setIsTaskLoading(true)
    setError(null)

    try {
      let result: ApiResponse<Task>

      if ('id' in taskData) {
        // Update existing task
        result = await updateTask(taskData as UpdateTaskData)
        if (result.success && result.data) {
          setTasks(prev => prev.map(task => 
            task.id === result.data!.id ? result.data! : task
          ))
          setSuccessMessage('Task updated successfully!')
        }
      } else {
        // Create new task
        result = await createTask(taskData as CreateTaskData)
        if (result.success && result.data) {
          setTasks(prev => [...prev, result.data!])
          setSuccessMessage('Task created successfully!')
        }
      }

      if (!result.success) {
        setError(result.error || 'Failed to save task')
      }
    } catch (error) {
      console.error('Error saving task:', error)
      setError('An unexpected error occurred while saving the task')
    } finally {
      setIsTaskLoading(false)
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    const taskToDelete = tasks.find(t => t.id === taskId)
    if (!taskToDelete) return

    const confirmed = window.confirm(
      `Are you sure you want to delete "${taskToDelete.name}"?\n\nThis action cannot be undone and will permanently delete the task and all its notes.`
    )
    
    if (!confirmed) return

    setError(null)

    try {
      const result = await deleteTask(taskId)
      
      if (result.success) {
        setTasks(prev => prev.filter(task => task.id !== taskId))
        setSuccessMessage('Task deleted successfully!')
      } else {
        setError(result.error || 'Failed to delete task')
      }
    } catch (error) {
      console.error('Error deleting task:', error)
      setError('An unexpected error occurred while deleting the task')
    }
  }

  const handleToggleTaskCompletion = async (taskId: string) => {
    setError(null)

    try {
      const result = await toggleTaskCompletion(taskId)
      
      if (result.success && result.data) {
        setTasks(prev => prev.map(task => 
          task.id === taskId ? result.data! : task
        ))
        setSuccessMessage(
          result.data.completed 
            ? 'Task marked as completed!' 
            : 'Task marked as incomplete!'
        )
      } else {
        setError(result.error || 'Failed to update task completion status')
      }
    } catch (error) {
      console.error('Error toggling task completion:', error)
      setError('An unexpected error occurred while updating the task')
    }
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

  const sortAndFilterTasks = (tasks: Task[], sortBy: string, filterBy: string) => {
    // First apply filters
    let filteredTasks = tasks
    switch (filterBy) {
      case 'active':
        filteredTasks = tasks.filter(task => !task.completed)
        break
      case 'completed':
        filteredTasks = tasks.filter(task => task.completed)
        break
      default:
        filteredTasks = tasks
    }

    // Then apply sorting
    const tasksCopy = [...filteredTasks]
    switch (sortBy) {
      case 'priority':
        const priorityOrder = { High: 3, Medium: 2, Low: 1 }
        return tasksCopy.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority])
      case 'dueDate':
        return tasksCopy.sort((a, b) => {
          if (!a.due_date && !b.due_date) return 0
          if (!a.due_date) return 1
          if (!b.due_date) return -1
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
        })
      case 'created':
        return tasksCopy.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      case 'alphabetical':
        return tasksCopy.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()))
      default:
        // Default sorting: incomplete first, then by priority, then by due date
        return tasksCopy.sort((a, b) => {
          if (a.completed !== b.completed) {
            return a.completed ? 1 : -1
          }
          
          const priorityOrder = { High: 3, Medium: 2, Low: 1 }
          const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority]
          if (priorityDiff !== 0) return priorityDiff
          
          if (a.due_date && b.due_date) {
            return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
          }
          if (a.due_date) return -1
          if (b.due_date) return 1
          
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        })
    }
  }

  const sortedAndFilteredTasks = sortAndFilterTasks(tasks, taskSortBy, taskFilterBy)

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

          {/* Success message */}
          {successMessage && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="flex items-center gap-2 p-4">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <div className="text-green-600 text-sm">{successMessage}</div>
              </CardContent>
            </Card>
          )}

          {/* Error message */}
          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="flex items-center gap-2 p-4">
                <AlertCircle className="h-4 w-4 text-red-600" />
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

              {/* Due Date (only show if exists) */}
              {project.due_date && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Due Date</h3>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4" />
                    {format(new Date(project.due_date), 'MMMM d, yyyy')}
                  </div>
                </div>
              )}


            </CardContent>
          </Card>

          {/* Tasks Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Tasks</CardTitle>
                  <CardDescription>
                    {tasks.length === 0 
                      ? 'No tasks yet. Create your first task to get started.'
                      : `${sortedAndFilteredTasks.length} of ${tasks.length} task${tasks.length === 1 ? '' : 's'} • ${tasks.filter(t => t.completed).length} completed`
                    }
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {tasks.length > 1 && (
                    <>
                      <div className="flex items-center gap-2">
                        <Filter className="size-4 text-muted-foreground" />
                        <Select value={taskFilterBy} onValueChange={(value: any) => setTaskFilterBy(value)}>
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All tasks</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center gap-2">
                        <ArrowUpDown className="size-4 text-muted-foreground" />
                        <Select value={taskSortBy} onValueChange={(value: any) => setTaskSortBy(value)}>
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="default">Smart sort</SelectItem>
                            <SelectItem value="priority">By priority</SelectItem>
                            <SelectItem value="dueDate">By due date</SelectItem>
                            <SelectItem value="created">By created date</SelectItem>
                            <SelectItem value="alphabetical">Alphabetical</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}
                  <Button 
                    onClick={handleAddTask}
                    className="flex items-center gap-2"
                    disabled={isLoading}
                  >
                    <Plus className="h-4 w-4" />
                    Add Task
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {tasks.length === 0 ? (
                // Empty state
                <div className="text-center py-8 text-muted-foreground">
                  <div className="mb-4">
                    <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                      <Plus className="h-6 w-6" />
                    </div>
                  </div>
                  <h3 className="text-lg font-medium mb-2">No tasks yet</h3>
                  <p className="text-sm mb-4">
                    Tasks help you break down your project into manageable pieces.
                  </p>
                  <Button 
                    variant="outline"
                    onClick={handleAddTask}
                    className="flex items-center gap-2"
                    disabled={isLoading}
                  >
                    <Plus className="h-4 w-4" />
                    Create Your First Task
                  </Button>
                </div>
              ) : (
                // Tasks grid
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {sortedAndFilteredTasks.length === 0 ? (
                    <div className="col-span-full text-center py-8 text-muted-foreground">
                      <div className="mb-4">
                        <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                          <Filter className="h-6 w-6" />
                        </div>
                      </div>
                      <h3 className="text-lg font-medium mb-2">No tasks match your filters</h3>
                      <p className="text-sm mb-4">
                        Try adjusting your filter or sort settings.
                      </p>
                    </div>
                  ) : (
                    sortedAndFilteredTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onEdit={handleEditTask}
                        onDelete={handleDeleteTask}
                        onToggleComplete={handleToggleTaskCompletion}
                        onView={handleViewTask}
                        isLoading={isLoading}
                        showActions={true}
                      />
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Task Form Dialog */}
          <TaskForm
            isOpen={isTaskFormOpen}
            onClose={handleCloseTaskForm}
            onSubmit={handleTaskSubmit}
            task={editingTask}
            projectId={project?.id || ''}
            isLoading={isTaskLoading}
          />

          {/* Task Detail Modal */}
          <TaskDetailModal
            task={selectedTask}
            isOpen={isTaskDetailOpen}
            onClose={handleCloseTaskDetail}
            onTaskUpdate={handleTaskUpdate}
          />

          {/* Project Edit Form */}
          <ProjectForm
            isOpen={isProjectFormOpen}
            onClose={handleCloseProjectForm}
            onSubmit={handleProjectSubmit}
            isLoading={isProjectLoading}
            mode="edit"
            initialData={project}
          />
        </div>
      </main>
    </div>
  )
} 