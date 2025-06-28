'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Calendar, Edit, Trash2, Clock, CheckCircle2, Circle, Flag, FileText } from 'lucide-react'

import { Task } from '@/types'
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter,
  CardAction 
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface TaskCardProps {
  task: Task
  onEdit?: (task: Task) => void
  onDelete?: (taskId: string) => void
  onToggleComplete?: (taskId: string) => void
  onView?: (task: Task) => void
  isLoading?: boolean
  showActions?: boolean
}

export function TaskCard({ 
  task, 
  onEdit, 
  onDelete, 
  onToggleComplete,
  onView,
  isLoading = false,
  showActions = true 
}: TaskCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isToggling, setIsToggling] = useState(false)

  const handleEdit = () => {
    if (onEdit && !isLoading) {
      onEdit(task)
    }
  }

  const handleDelete = async () => {
    if (onDelete && !isLoading && !isDeleting) {
      setIsDeleting(true)
      try {
        await onDelete(task.id)
      } finally {
        setIsDeleting(false)
      }
    }
  }

  const handleToggleComplete = async () => {
    if (onToggleComplete && !isLoading && !isToggling) {
      setIsToggling(true)
      try {
        await onToggleComplete(task.id)
      } finally {
        setIsToggling(false)
      }
    }
  }

  const handleView = () => {
    if (onView && !isLoading) {
      onView(task)
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
          variant: 'overdue' as const
        }
      } else if (diffDays === 0) {
        return {
          text: 'Due today',
          variant: 'today' as const
        }
      } else if (diffDays <= 7) {
        return {
          text: `Due in ${diffDays} days`,
          variant: 'soon' as const
        }
      } else {
        return {
          text: `Due ${format(date, 'MMM d, yyyy')}`,
          variant: 'normal' as const
        }
      }
    } catch {
      return null
    }
  }

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

  const getPriorityColor = (priority: 'High' | 'Medium' | 'Low') => {
    switch (priority) {
      case 'High':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'Medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'Low':
        return 'text-green-600 bg-green-50 border-green-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getPriorityIcon = (priority: 'High' | 'Medium' | 'Low') => {
    switch (priority) {
      case 'High':
        return <Flag className="size-3 fill-current" />
      case 'Medium':
        return <Flag className="size-3" />
      case 'Low':
        return <Flag className="size-3 opacity-60" />
      default:
        return <Flag className="size-3" />
    }
  }

  const dueDateInfo = formatDueDate(task.due_date)

  return (
    <Card className={`h-full flex flex-col transition-all duration-200 hover:shadow-md ${isLoading ? 'opacity-50 pointer-events-none' : ''} ${task.completed ? 'opacity-75' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            {/* Completion Toggle */}
            <button
              onClick={handleToggleComplete}
              disabled={isLoading || isToggling}
              className="mt-1 shrink-0 hover:scale-110 transition-transform"
              title={task.completed ? 'Mark as incomplete' : 'Mark as complete'}
            >
              {isToggling ? (
                <div className="size-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
              ) : task.completed ? (
                <CheckCircle2 className="size-5 text-green-600" />
              ) : (
                <Circle className="size-5 text-gray-400 hover:text-blue-600 transition-colors" />
              )}
            </button>

            <div className="min-w-0 flex-1">
              <CardTitle 
                className={`text-lg font-semibold truncate cursor-pointer hover:text-blue-600 transition-colors ${task.completed ? 'line-through text-muted-foreground' : ''}`}
                title={task.name}
                onClick={handleView}
              >
                {task.name}
              </CardTitle>
              
              <div className="flex items-center gap-2 mt-1">
                {/* Priority Badge */}
                <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                  {getPriorityIcon(task.priority)}
                  {task.priority}
                </div>
                
                {/* Due Date Badge */}
                {dueDateInfo && (
                  <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium border ${getDueDateColor(dueDateInfo.variant)}`}>
                    <Clock className="size-3" />
                    <span>{dueDateInfo.text}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {showActions && (
            <CardAction>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleEdit}
                  disabled={isLoading}
                  className="size-8 hover:bg-blue-50 hover:text-blue-600"
                  title="Edit task"
                >
                  <Edit className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDelete}
                  disabled={isLoading || isDeleting}
                  className="size-8 hover:bg-red-50 hover:text-red-600"
                  title="Delete task"
                >
                  {isDeleting ? (
                    <div className="size-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                  ) : (
                    <Trash2 className="size-4" />
                  )}
                </Button>
              </div>
            </CardAction>
          )}
        </div>
      </CardHeader>

      <CardContent className="py-0 flex-1">
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Calendar className="size-4" />
            <span>Created {format(new Date(task.created_at), 'MMM d, yyyy')}</span>
          </div>
          
          {task.updated_at !== task.created_at && (
            <div className="flex items-center gap-2">
              <Edit className="size-4" />
              <span>Updated {format(new Date(task.updated_at), 'MMM d, yyyy')}</span>
            </div>
          )}

          {/* Completion Status */}
          <div className="flex items-center gap-2">
            {task.completed ? (
              <CheckCircle2 className="size-4 text-green-600" />
            ) : (
              <Circle className="size-4 text-gray-400" />
            )}
            <span className={task.completed ? 'text-green-600 font-medium' : 'text-gray-600'}>
              {task.completed ? 'Completed' : 'In Progress'}
            </span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-4 mt-auto">
        <div className="flex gap-2 w-full">
          <Button
            onClick={handleToggleComplete}
            disabled={isLoading || isToggling}
            variant={task.completed ? "outline" : "default"}
            className="flex-[2]"
            size="sm"
          >
            {isToggling ? (
              <div className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
            ) : task.completed ? (
              <Circle className="size-4 mr-2" />
            ) : (
              <CheckCircle2 className="size-4 mr-2" />
            )}
            {task.completed ? 'Mark Incomplete' : 'Mark Complete'}
          </Button>
          
          {showActions && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleView}
              disabled={isLoading}
              className="hover:bg-green-50 hover:text-green-600 hover:border-green-200"
              title="View notes and details"
            >
              <FileText className="size-4 mr-1" />
              Notes
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  )
} 