'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Calendar, Edit, Trash2, FolderOpen, Clock, AlertTriangle } from 'lucide-react'

import { Project } from '@/types'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface ProjectCardProps {
  project: Project
  onEdit?: (project: Project) => void
  onDelete?: (projectId: string) => void
  onView?: (projectId: string) => void
  isLoading?: boolean
  showActions?: boolean
  animationDelay?: number
}

export function ProjectCard({ 
  project, 
  onEdit, 
  onDelete, 
  onView,
  isLoading = false,
  showActions = true,
  animationDelay = 0
}: ProjectCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const handleEdit = () => {
    if (onEdit && !isLoading) {
      onEdit(project)
    }
  }

  const handleDeleteClick = () => {
    setShowDeleteDialog(true)
  }

  const handleDeleteConfirm = async () => {
    if (onDelete && !isLoading && !isDeleting) {
      setIsDeleting(true)
      try {
        await onDelete(project.id)
        setShowDeleteDialog(false)
      } finally {
        setIsDeleting(false)
      }
    }
  }

  const handleDeleteCancel = () => {
    setShowDeleteDialog(false)
  }

  const handleView = () => {
    if (onView && !isLoading) {
      onView(project.id)
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

  const dueDateInfo = formatDueDate(project.due_date)

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

  return (
    <>
      <Card 
        className={`
          h-full flex flex-col 
          transition-all duration-300 ease-out
          hover:shadow-lg hover:-translate-y-1
          animate-in fade-in slide-in-from-bottom-4
          ${isLoading ? 'opacity-50 pointer-events-none' : ''}
        `}
        style={{ 
          animationDelay: `${animationDelay}ms`,
          animationDuration: '600ms'
        }}
      >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <FolderOpen className="size-5 text-blue-600 shrink-0" />
            <CardTitle 
              className="text-lg font-semibold truncate cursor-pointer hover:text-blue-600 transition-colors duration-200"
              onClick={handleView}
              title={project.name}
            >
              {project.name}
            </CardTitle>
          </div>
          
          {showActions && (
            <CardAction>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleEdit}
                  disabled={isLoading}
                  className="size-8 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200"
                  title="Edit project"
                >
                  <Edit className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDeleteClick}
                  disabled={isLoading || isDeleting}
                  className="size-8 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
                  title="Delete project"
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
        <div className="space-y-3 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Calendar className="size-4" />
            <span>Created {format(new Date(project.created_at), 'MMM d, yyyy')}</span>
          </div>
          
          {project.updated_at !== project.created_at && (
            <div className="flex items-center gap-2">
              <Edit className="size-4" />
              <span>Updated {format(new Date(project.updated_at), 'MMM d, yyyy')}</span>
            </div>
          )}

          {/* Due date badge */}
          <div className="flex items-center">
            {dueDateInfo ? (
              <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border ${getDueDateColor(dueDateInfo.variant)}`}>
                <Clock className="size-3" />
                <span>{dueDateInfo.text}</span>
              </div>
            ) : (
              <div className="text-xs text-gray-400">No due date set</div>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-4 mt-auto">
        <div className="flex gap-2 w-full">
          <Button
            onClick={handleView}
            disabled={isLoading}
            className="flex-1 transition-all duration-300 hover:scale-105"
            size="sm"
          >
            <FolderOpen className="size-4 mr-2" />
            View Project
          </Button>
        </div>
      </CardFooter>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={(open) => !open && handleDeleteCancel()}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-red-600" />
              Delete Project
            </DialogTitle>
            <DialogDescription className="text-left">
              Are you sure you want to delete <span className="font-semibold">"{project.name}"</span>? 
              This action cannot be undone and will permanently remove the project and all its tasks.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={handleDeleteCancel}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <div className="flex items-center gap-2">
                  <div className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Deleting...
                </div>
              ) : (
                <>
                  <Trash2 className="size-4 mr-2" />
                  Delete Project
                </>
              )}
            </Button>
                    </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default ProjectCard 