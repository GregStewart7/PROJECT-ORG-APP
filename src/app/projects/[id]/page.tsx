'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Plus, FolderOpen, Calendar, Clock, FileText, Target, Zap, CheckCircle2, AlertCircle, ArrowUpDown, Flag } from 'lucide-react'

import { useAuth } from '@/contexts/AuthContext'
import { getProject, getTasksByProject, createTask, updateTask, deleteTask } from '@/lib/database'
import { Project, Task, CreateTaskData, UpdateTaskData } from '@/types'
import { TaskCard } from '@/components/task/TaskCard'
import { TaskForm } from '@/components/task/TaskForm'
import { TaskDetailModal } from '@/components/task/TaskDetailModal'
import { ExportButton } from '@/components/common/ExportButton'
import { AuthHeader } from '@/components/common/AuthHeader'
import { 
  Card, 
  CardContent 
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function ProjectDetailPage() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string

  const [project, setProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Task form states
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [taskFormLoading, setTaskFormLoading] = useState(false)
  
  // Task detail modal states
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [showTaskDetail, setShowTaskDetail] = useState(false)

  // Animation states
  const [isVisible, setIsVisible] = useState(false)
  const [showTasks, setShowTasks] = useState(false)

  // Task sorting state
  const [taskSortBy, setTaskSortBy] = useState<string>('created-desc')

  useEffect(() => {
    if (user && projectId) {
      loadData()
    }
  }, [user, projectId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // Trigger entrance animations
    const timer1 = setTimeout(() => setIsVisible(true), 100)
    const timer2 = setTimeout(() => setShowTasks(true), 600)
    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
    }
  }, [])

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const [projectResult, tasksResult] = await Promise.all([
        getProject(projectId),
        getTasksByProject(projectId)
      ])
      
      if (projectResult.success && projectResult.data) {
        setProject(projectResult.data)
      } else {
        setError(projectResult.error || 'Failed to load project')
        return
      }
      
      if (tasksResult.success && tasksResult.data) {
        setTasks(tasksResult.data)
      } else {
        setError(tasksResult.error || 'Failed to load tasks')
        setTasks([]) // Ensure tasks is always an array
      }
    } catch (err) {
      setError('Failed to load project data')
      console.error('Error loading project data:', err)
      setTasks([]) // Ensure tasks is always an array
    } finally {
      setLoading(false)
    }
  }, [projectId])

  const handleTaskSubmit = async (data: CreateTaskData | UpdateTaskData) => {
    try {
      setTaskFormLoading(true)
      
      if ('id' in data) {
        // Update existing task
        const result = await updateTask(data)
        
        if (result.success && result.data) {
          setTasks(prev => prev.map(t => t.id === data.id ? result.data! : t))
          setEditingTask(null)
          setShowTaskForm(false)
          setSuccess('Task updated successfully!')
          setTimeout(() => setSuccess(null), 3000)
        } else {
          setError(result.error || 'Failed to update task')
          setTimeout(() => setError(null), 3000)
        }
      } else {
        // Create new task
        const result = await createTask(data)
        
        if (result.success && result.data) {
          setTasks(prev => [result.data!, ...prev])
          setShowTaskForm(false)
          setSuccess('Task created successfully!')
          setTimeout(() => setSuccess(null), 3000)
        } else {
          setError(result.error || 'Failed to create task')
          setTimeout(() => setError(null), 3000)
        }
      }
    } catch (err) {
      setError(editingTask ? 'Failed to update task' : 'Failed to create task')
      console.error('Error with task:', err)
      setTimeout(() => setError(null), 3000)
    } finally {
      setTaskFormLoading(false)
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTask(taskId)
      setTasks(prev => prev.filter(t => t.id !== taskId))
      setSuccess('Task deleted successfully!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError('Failed to delete task')
      console.error('Error deleting task:', err)
      setTimeout(() => setError(null), 3000)
    }
  }

  const handleToggleComplete = async (taskId: string, completed: boolean) => {
    try {
      const result = await updateTask({
        id: taskId,
        completed
      })
      
      if (result.success && result.data) {
        setTasks(prev => prev.map(t => t.id === taskId ? result.data! : t))
      } else {
        setError(result.error || 'Failed to toggle task completion')
        setTimeout(() => setError(null), 3000)
      }
    } catch (err) {
      setError('Failed to toggle task completion')
      console.error('Error toggling task completion:', err)
      setTimeout(() => setError(null), 3000)
    }
  }

  const handleViewTask = (task: Task) => {
    setSelectedTask(task)
    setShowTaskDetail(true)
  }

  const openCreateTaskForm = () => {
    setEditingTask(null)
    setShowTaskForm(true)
  }

  const openEditTaskForm = (task: Task) => {
    setEditingTask(task)
    setShowTaskForm(true)
  }

  const closeTaskForm = () => {
    setShowTaskForm(false)
    setEditingTask(null)
  }

  const closeTaskDetail = () => {
    setShowTaskDetail(false)
    setSelectedTask(null)
  }

  const handleTaskUpdate = (updatedTask: Task) => {
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t))
    setSelectedTask(updatedTask) // Update the selected task for the modal
  }

  // Task sorting function
  const sortTasks = (tasks: Task[], sortBy: string): Task[] => {
    const tasksCopy = [...tasks]
    
    switch (sortBy) {
      case 'created-desc':
        return tasksCopy.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      
      case 'created-asc':
        return tasksCopy.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      
      case 'priority-high':
        return tasksCopy.sort((a, b) => {
          const priorityOrder = { High: 3, Medium: 2, Low: 1 }
          const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority]
          if (priorityDiff !== 0) return priorityDiff
          // Secondary sort by creation date (newest first) for same priority
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        })
      
      case 'priority-low':
        return tasksCopy.sort((a, b) => {
          const priorityOrder = { High: 3, Medium: 2, Low: 1 }
          const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
          if (priorityDiff !== 0) return priorityDiff
          // Secondary sort by creation date (newest first) for same priority
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        })
      
      case 'due-earliest':
        return tasksCopy.sort((a, b) => {
          // Handle null due dates - put them at the end
          if (!a.due_date && !b.due_date) {
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          }
          if (!a.due_date) return 1
          if (!b.due_date) return -1
          
          const dateDiff = new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
          if (dateDiff !== 0) return dateDiff
          // Secondary sort by creation date for same due date
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        })
      
      case 'due-latest':
        return tasksCopy.sort((a, b) => {
          // Handle null due dates - put them at the end
          if (!a.due_date && !b.due_date) {
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          }
          if (!a.due_date) return 1
          if (!b.due_date) return -1
          
          const dateDiff = new Date(b.due_date).getTime() - new Date(a.due_date).getTime()
          if (dateDiff !== 0) return dateDiff
          // Secondary sort by creation date for same due date
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        })
      
      default:
        return tasksCopy
    }
  }

  // Get sorted tasks
  const sortedTasks = sortTasks(tasks, taskSortBy)

  // Calculate task statistics
  const completedTasks = tasks.filter(t => t.completed).length
  const totalTasks = tasks.length
  const highPriorityTasks = tasks.filter(t => t.priority === 'High').length
  const overdueTasks = tasks.filter(t => {
    if (!t.due_date) return false
    return new Date(t.due_date) < new Date() && !t.completed
  }).length

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
        <AuthHeader />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header skeleton */}
          <div className="mb-8 animate-pulse">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
              <div className="h-8 bg-gray-200 rounded w-48"></div>
            </div>
            <Card className="bg-gradient-to-br from-gray-100 to-gray-50 border-gray-200">
              <CardContent className="p-8">
                <div className="space-y-4">
                  <div className="h-10 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Tasks skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-48 bg-gray-200 rounded-lg animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error && !project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
        <AuthHeader />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-6">
              <AlertCircle className="size-12 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Project Not Found</h2>
            <p className="text-gray-600 mb-8">The project you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.</p>
            <Button
              onClick={() => router.push('/projects')}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <ArrowLeft className="size-4 mr-2" />
              Back to Projects
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
      <AuthHeader />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Navigation */}
        <div className={`mb-8 transform transition-all duration-500 ease-out ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'}`}>
          <Button
            variant="ghost"
            onClick={() => router.push('/projects')}
            className="group hover:bg-blue-50 hover:text-blue-700 transition-all duration-300 hover:scale-105"
          >
            <ArrowLeft className="size-4 mr-2 transition-transform duration-300 group-hover:-translate-x-1" />
            Back to Projects
          </Button>
        </div>

        {/* Compact Project Header */}
        <div className={`mb-6 transform transition-all duration-500 ease-out ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`} style={{ animationDelay: '200ms' }}>
          <Card className="bg-gradient-to-r from-blue-50 via-white to-purple-50/30 border-blue-200/30 shadow-lg">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                {/* Project Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl shadow-md">
                      <FolderOpen className="size-7 text-blue-700" />
                    </div>
                    <div className="min-w-0 flex-1">
                      {/* Text Content */}
                      <div className="mb-3">
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 truncate mb-1">
                          {project?.name}
                        </h1>
                        {project?.description && (
                          <p className="text-gray-600 text-base leading-relaxed mb-2">
                            {project.description}
                          </p>
                        )}
                        {project?.due_date && (
                          <div className="flex items-center gap-2">
                            <Calendar className="size-4 text-gray-500" />
                            <span className="text-sm text-gray-600">
                              Due: {new Date(project.due_date).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Compact Statistics - Below and aligned with text */}
                      <div className="flex flex-wrap gap-2">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg border border-blue-200/50">
                          <Target className="size-4 text-blue-600" />
                          <span className="text-sm font-semibold text-blue-700">{totalTasks} Tasks</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-lg border border-green-200/50">
                          <CheckCircle2 className="size-4 text-green-600" />
                          <span className="text-sm font-semibold text-green-700">{completedTasks} Done</span>
                        </div>
                        {highPriorityTasks > 0 && (
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 rounded-lg border border-orange-200/50">
                            <Zap className="size-4 text-orange-600" />
                            <span className="text-sm font-semibold text-orange-700">{highPriorityTasks} High</span>
                          </div>
                        )}
                        {overdueTasks > 0 && (
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 rounded-lg border border-red-200/50">
                            <AlertCircle className="size-4 text-red-600" />
                            <span className="text-sm font-semibold text-red-700">{overdueTasks} Overdue</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                  <ExportButton 
                    project={project!} 
                    className="h-10"
                    size="sm"
                  />
                  <Button
                    onClick={openCreateTaskForm}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-4 py-2 h-10 transition-all duration-300 hover:scale-105 hover:shadow-lg"
                  >
                    <Plus className="size-4 mr-2" />
                    Add Task
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-2">
              <div className="p-1 bg-green-200 rounded-full">
                <CheckCircle2 className="size-4 text-green-700" />
              </div>
              <p className="text-green-800 font-medium">{success}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-lg animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-2">
              <div className="p-1 bg-red-200 rounded-full">
                <AlertCircle className="size-4 text-red-700" />
              </div>
              <p className="text-red-800 font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Main Content - Tasks and Notes */}
        <div className={`transform transition-all duration-700 ease-out ${showTasks ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>


          {/* Tasks Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg shadow-sm">
                  <FileText className="size-6 text-blue-700" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Tasks</h3>
                  <p className="text-gray-600 text-sm">Track your project work and progress</p>
                </div>
              </div>
              
              {/* Sort Dropdown */}
              {tasks.length > 0 && (
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="size-4 text-gray-500" />
                  <Select value={taskSortBy} onValueChange={setTaskSortBy}>
                    <SelectTrigger className="w-48 bg-white/70 backdrop-blur-sm border-gray-200 hover:bg-white transition-all duration-200">
                      <SelectValue placeholder="Sort tasks..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="created-desc">
                        <div className="flex items-center gap-2">
                          <Clock className="size-4 text-gray-500" />
                          <span>Newest First</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="created-asc">
                        <div className="flex items-center gap-2">
                          <Clock className="size-4 text-gray-500" />
                          <span>Oldest First</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="priority-high">
                        <div className="flex items-center gap-2">
                          <Flag className="size-4 text-red-500" />
                          <span>High Priority First</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="priority-low">
                        <div className="flex items-center gap-2">
                          <Flag className="size-4 text-green-500" />
                          <span>Low Priority First</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="due-earliest">
                        <div className="flex items-center gap-2">
                          <Calendar className="size-4 text-orange-500" />
                          <span>Due Date (Earliest)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="due-latest">
                        <div className="flex items-center gap-2">
                          <Calendar className="size-4 text-blue-500" />
                          <span>Due Date (Latest)</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {tasks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedTasks.map((task, index) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onEdit={openEditTaskForm}
                    onDelete={handleDeleteTask}
                    onViewDetails={handleViewTask}
                    onToggleComplete={handleToggleComplete}
                    animationDelay={index * 100}
                  />
                ))}
              </div>
            ) : (
              <Card className="border-2 border-dashed border-blue-200 bg-blue-50/30">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mb-4">
                    <FileText className="size-8 text-blue-600" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">No tasks yet</h4>
                  <p className="text-gray-600 mb-4">Create your first task to get started</p>
                  <Button
                    onClick={openCreateTaskForm}
                    variant="outline"
                    className="border-blue-300 text-blue-700 hover:bg-blue-50"
                  >
                    <Plus className="size-4 mr-2" />
                    Create Task
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          
        </div>
      </div>

      {/* Enhanced Task Form Dialog */}
      <Dialog open={showTaskForm} onOpenChange={closeTaskForm}>
        <DialogContent className="sm:max-w-md bg-gradient-to-br from-white to-blue-50/30 border-blue-200/30 shadow-2xl backdrop-blur-sm">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/20 to-purple-50/10 rounded-lg" />
          <div className="relative z-10">
            <DialogHeader className="pb-6">
              <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-purple-700 bg-clip-text text-transparent flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                  <FileText className="size-6 text-white" />
                </div>
                {editingTask ? 'Edit Task' : 'Create New Task'}
              </DialogTitle>
            </DialogHeader>
            
            <TaskForm
              isOpen={showTaskForm}
              onClose={closeTaskForm}
              onSubmit={handleTaskSubmit}
              task={editingTask}
              projectId={projectId}
              isLoading={taskFormLoading}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Enhanced Task Detail Modal */}
      <TaskDetailModal
        task={selectedTask}
        isOpen={showTaskDetail}
        onClose={closeTaskDetail}
        onTaskUpdate={handleTaskUpdate}
      />
    </div>
  )
} 