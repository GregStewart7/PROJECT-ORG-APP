'use client'

import { useState, useRef } from 'react'
import { format } from 'date-fns'
import { Calendar, CheckCircle2, Circle, Edit, Trash2, Clock, StickyNote, AlertCircle, AlertTriangle } from 'lucide-react'

import { Task } from '@/types'
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent, 
  CardFooter,
  CardAction 
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface TaskCardProps {
  task: Task
  onEdit?: (task: Task) => void
  onDelete?: (taskId: string) => void
  onToggleComplete?: (taskId: string, completed: boolean) => void
  onViewDetails?: (task: Task) => void
  isLoading?: boolean
  showActions?: boolean
  animationDelay?: number
}

export function TaskCard({ 
  task, 
  onEdit, 
  onDelete, 
  onToggleComplete,
  onViewDetails,
  isLoading = false,
  showActions = true,
  animationDelay = 0
}: TaskCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isToggling, setIsToggling] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  
  // Focus management refs
  const cardRef = useRef<HTMLDivElement>(null)
  const deleteButtonRef = useRef<HTMLButtonElement>(null)
  const completionButtonRef = useRef<HTMLButtonElement>(null)

  const handleEdit = () => {
    if (onEdit && !isLoading) {
      onEdit(task)
    }
  }

  const handleDeleteClick = () => {
    setShowDeleteDialog(true)
  }

  const handleDeleteConfirm = async () => {
    if (onDelete && !isLoading && !isDeleting) {
      setIsDeleting(true)
      try {
        await onDelete(task.id)
        setShowDeleteDialog(false)
        
        // Announce deletion to screen readers
        const announcement = document.createElement('div')
        announcement.setAttribute('aria-live', 'polite')
        announcement.setAttribute('aria-atomic', 'true')
        announcement.className = 'sr-only'
        announcement.textContent = `Task "${task.name}" has been deleted successfully.`
        document.body.appendChild(announcement)
        
        setTimeout(() => document.body.removeChild(announcement), 2000)
      } finally {
        setIsDeleting(false)
      }
    }
  }

  const handleDeleteCancel = () => {
    setShowDeleteDialog(false)
    // Return focus to delete button when dialog closes
    setTimeout(() => {
      deleteButtonRef.current?.focus()
    }, 100)
  }

  const handleToggleComplete = async () => {
    if (onToggleComplete && !isLoading && !isToggling) {
      setIsToggling(true)
      try {
        await onToggleComplete(task.id, !task.completed)
        
        // Announce completion status change to screen readers
        const announcement = document.createElement('div')
        announcement.setAttribute('aria-live', 'polite')
        announcement.setAttribute('aria-atomic', 'true')
        announcement.className = 'sr-only'
        announcement.textContent = `Task "${task.name}" marked as ${!task.completed ? 'completed' : 'incomplete'}.`
        document.body.appendChild(announcement)
        
        setTimeout(() => document.body.removeChild(announcement), 2000)
      } finally {
        setIsToggling(false)
      }
    }
  }

  const handleViewDetails = () => {
    if (onViewDetails && !isLoading) {
      onViewDetails(task)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Enter or Space to view task details
    if ((e.key === 'Enter' || e.key === ' ') && e.target === cardRef.current) {
      e.preventDefault()
      handleViewDetails()
    }
    
    // ESC to close delete dialog
    if (e.key === 'Escape' && showDeleteDialog) {
      handleDeleteCancel()
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
        const days = Math.abs(diffDays)
        return {
          text: `${days} days overdue`,
          variant: 'overdue' as const,
          urgency: 'high'
        }
      } else if (diffDays === 0) {
        return {
          text: 'Due today',
          variant: 'today' as const,
          urgency: 'high'
        }
      } else if (diffDays <= 7) {
        return {
          text: `Due in ${diffDays} days`,
          variant: 'soon' as const,
          urgency: 'medium'
        }
      } else {
        return {
          text: `Due ${format(date, 'MMM d, yyyy')}`,
          variant: 'normal' as const,
          urgency: 'low'
        }
      }
    } catch {
      return null
    }
  }

  const dueDateInfo = formatDueDate(task.due_date)

  const getDueDateColor = (variant: string) => {
    switch (variant) {
      case 'overdue':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'today':
        return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'soon':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      default:
        return 'text-green-600 bg-green-50 border-green-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-gradient-to-r from-red-500 to-red-600 text-white'
      case 'Medium':
        return 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white'
      case 'Low':
        return 'bg-gradient-to-r from-green-500 to-green-600 text-white'
      default:
        return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white'
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'High':
        return AlertCircle
      case 'Medium':
        return Clock
      case 'Low':
        return CheckCircle2
      default:
        return Circle
    }
  }

  const getPriorityLabel = (priority: string) => {
    return `${priority.charAt(0).toUpperCase() + priority.slice(1)} priority task`
  }

  const getUrgencyLabel = (urgency?: string) => {
    switch (urgency) {
      case 'high': return 'High urgency: '
      case 'medium': return 'Medium urgency: '
      case 'low': return 'Low urgency: '
      default: return ''
    }
  }

  const PriorityIcon = getPriorityIcon(task.priority)

  return (
    <>
      <Card 
        ref={cardRef}
        className={`
          h-full flex flex-col 
          transition-all duration-300 ease-out
          hover:shadow-xl hover:-translate-y-2
          animate-in fade-in slide-in-from-left-4
          bg-gradient-to-br from-white to-gray-50/30
          border-gray-200/50 backdrop-blur-sm
          focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2
          cursor-pointer
          ${isLoading ? 'opacity-50 pointer-events-none' : ''}
          ${task.completed ? 'bg-gradient-to-br from-green-50/50 to-green-100/30 border-green-200/60' : ''}
          group
          relative overflow-hidden
        `}
        style={{ 
          animationDelay: `${animationDelay}ms`,
          animationDuration: '600ms'
        }}
        tabIndex={0}
        role="article"
        aria-labelledby={`task-title-${task.id}`}
        aria-describedby={`task-details-${task.id}`}
        onKeyDown={handleKeyDown}
        onClick={handleViewDetails}
      >
        {/* Animated background gradient on hover - hidden from screen readers */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/20 to-purple-50/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" aria-hidden="true" />
        
        {/* Priority indicator strip - announced via ARIA label */}
        <div 
          className={`absolute left-0 top-0 w-1 h-full transition-all duration-300 ${getPriorityColor(task.priority)}`} 
          aria-label={getPriorityLabel(task.priority)}
        />
        
        <CardHeader className="pb-3 relative z-10">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <Button
                ref={completionButtonRef}
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation()
                  handleToggleComplete()
                }}
                disabled={isLoading || isToggling}
                className="size-8 p-0 hover:bg-green-50 transition-all duration-200 shrink-0 mt-0.5 group/toggle focus:outline-none focus:ring-2 focus:ring-green-500/50"
                aria-label={task.completed ? `Mark task "${task.name}" as incomplete` : `Mark task "${task.name}" as complete`}
                aria-describedby={`task-completion-status-${task.id}`}
              >
                {isToggling ? (
                  <div 
                    className="size-5 animate-spin rounded-full border-2 border-green-600 border-t-transparent"
                    aria-label="Updating task completion status"
                  />
                ) : task.completed ? (
                  <CheckCircle2 className="size-5 text-green-600 transition-transform duration-200 group-hover/toggle:scale-110" aria-hidden="true" />
                ) : (
                  <Circle className="size-5 text-gray-400 hover:text-green-600 transition-colors duration-200 group-hover/toggle:scale-110" aria-hidden="true" />
                )}
              </Button>
              
              <div className="min-w-0 flex-1">
                <CardTitle 
                  id={`task-title-${task.id}`}
                  className={`text-lg font-semibold transition-colors duration-200 ${
                    task.completed ? 'line-through text-gray-500' : ''
                  }`}
                  title={task.name}
                >
                  {task.name}
                </CardTitle>
                
                {/* Task completion status for screen readers */}
                <div id={`task-completion-status-${task.id}`} className="sr-only">
                  Task is {task.completed ? 'completed' : 'not completed'}
                </div>
                
                {/* Priority badge */}
                <div className="mt-2">
                  <div 
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(task.priority)} shadow-sm`}
                    role="status"
                    aria-label={getPriorityLabel(task.priority)}
                  >
                    <PriorityIcon className="size-3" aria-hidden="true" />
                    <span aria-hidden="true">{task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority</span>
                  </div>
                </div>
              </div>
            </div>
            
            {showActions && (
              <CardAction 
                role="toolbar" 
                aria-label={`Actions for task ${task.name}`}
              >
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleEdit()
                    }}
                    disabled={isLoading}
                    className="size-8 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    aria-label={`Edit task ${task.name}`}
                    title={`Edit task ${task.name}`}
                  >
                    <Edit className="size-4" aria-hidden="true" />
                  </Button>
                  <Button
                    ref={deleteButtonRef}
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteClick()
                    }}
                    disabled={isLoading || isDeleting}
                    className="size-8 hover:bg-red-50 hover:text-red-600 transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                    aria-label={`Delete task ${task.name}`}
                    title={`Delete task ${task.name}`}
                  >
                    {isDeleting ? (
                      <div 
                        className="size-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent"
                        aria-label="Deleting task"
                      />
                    ) : (
                      <Trash2 className="size-4" aria-hidden="true" />
                    )}
                  </Button>
                </div>
              </CardAction>
            )}
          </div>
        </CardHeader>

        <CardContent className="py-0 flex-1 relative z-10">
          <div 
            id={`task-details-${task.id}`}
            className="space-y-3 text-sm text-gray-600"
            role="group"
            aria-label="Task details"
          >
            <div className="flex items-center gap-2 transition-colors duration-300 group-hover:text-gray-700">
              <Calendar className="size-4" aria-hidden="true" />
              <span>
                <span className="sr-only">Created on </span>
                Created {format(new Date(task.created_at), 'MMM d, yyyy')}
              </span>
            </div>
            
            {task.updated_at !== task.created_at && (
              <div className="flex items-center gap-2 transition-colors duration-300 group-hover:text-gray-700">
                <Edit className="size-4" aria-hidden="true" />
                <span>
                  <span className="sr-only">Last updated on </span>
                  Updated {format(new Date(task.updated_at), 'MMM d, yyyy')}
                </span>
              </div>
            )}

            {/* Due Date badge */}
            <div className="flex items-center">
              {dueDateInfo ? (
                <div 
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border-2 transition-all duration-300 hover:shadow-md ${getDueDateColor(dueDateInfo.variant)}`}
                  role="status"
                  aria-label={`${getUrgencyLabel(dueDateInfo.urgency)}${dueDateInfo.text}`}
                >
                  <Clock className="size-3" aria-hidden="true" />
                  <span className="font-semibold" aria-hidden="true">{dueDateInfo.text}</span>
                </div>
              ) : (
                <div 
                  className="text-xs text-gray-400 transition-colors duration-300 group-hover:text-gray-500"
                  role="status"
                  aria-label="No due date set for this task"
                >
                  No due date set
                </div>
              )}
            </div>
          </div>
        </CardContent>

        <CardFooter className="pt-4 mt-auto relative z-10">
          <div className="flex gap-2 w-full">
            <Button
              onClick={(e) => {
                e.stopPropagation()
                handleViewDetails()
              }}
              disabled={isLoading}
              variant="outline"
              className="flex-1 transition-all duration-300 hover:scale-105 bg-white/70 backdrop-blur-sm hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 group/btn focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              size="sm"
              aria-label={`View notes for task ${task.name}`}
            >
              <StickyNote className="size-4 mr-2 transition-transform duration-300 group-hover/btn:scale-110" aria-hidden="true" />
              <span>View Notes</span>
            </Button>
          </div>
        </CardFooter>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={showDeleteDialog} 
        onOpenChange={(open) => !open && handleDeleteCancel()}
      >
        <DialogContent 
          className="sm:max-w-md bg-white/95 backdrop-blur-xl border-gray-200/50"
          aria-describedby="delete-dialog-description"
        >
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-r from-red-100 to-red-200 flex items-center justify-center" aria-hidden="true">
                <AlertTriangle className="w-5 h-5 text-red-600" aria-hidden="true" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold text-gray-900" id="delete-dialog-title">
                  Delete Task
                </DialogTitle>
                <DialogDescription className="text-sm text-gray-500 mt-1">
                  This action cannot be undone.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="py-4">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-lg p-4 border border-gray-200/50">
              <p 
                className="text-sm text-gray-700 mb-2"
                id="delete-dialog-description"
              >
                Are you sure you want to delete <span className="font-semibold text-gray-900">&quot;{task.name}&quot;</span>?
              </p>
              <p className="text-xs text-gray-500">
                All notes and progress associated with this task will be permanently removed.
              </p>
            </div>
          </div>

          <DialogFooter className="flex gap-3 sm:gap-3">
            <Button
              variant="outline"
              onClick={handleDeleteCancel}
              disabled={isDeleting}
              className="flex-1 bg-white/70 backdrop-blur-sm hover:bg-gray-50 border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500/50"
              aria-label="Cancel task deletion"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500/50"
              aria-label={`Confirm deletion of task ${task.name}`}
              aria-describedby="delete-task-status"
            >
              {isDeleting ? (
                <>
                  <div 
                    className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2"
                    aria-hidden="true"
                  />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" aria-hidden="true" />
                  <span>Delete Task</span>
                </>
              )}
            </Button>
          </DialogFooter>
          <div id="delete-task-status" className="sr-only" aria-live="polite">
            {isDeleting ? 'Deleting task, please wait' : ''}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default TaskCard 