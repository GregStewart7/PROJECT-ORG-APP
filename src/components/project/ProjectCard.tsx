'use client'

import { useState, useRef, useEffect } from 'react'
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
  
  // Focus management refs
  const cardRef = useRef<HTMLDivElement>(null)
  const deleteButtonRef = useRef<HTMLButtonElement>(null)

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
        
        // Announce deletion to screen readers
        const announcement = document.createElement('div')
        announcement.setAttribute('aria-live', 'polite')
        announcement.setAttribute('aria-atomic', 'true')
        announcement.className = 'sr-only'
        announcement.textContent = `Project "${project.name}" has been deleted successfully.`
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

  const handleView = () => {
    if (onView && !isLoading) {
      onView(project.id)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Enter or Space to view project
    if ((e.key === 'Enter' || e.key === ' ') && e.target === cardRef.current) {
      e.preventDefault()
      handleView()
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

  const getUrgencyLabel = (urgency?: string) => {
    switch (urgency) {
      case 'high': return 'High priority: '
      case 'medium': return 'Medium priority: '
      case 'low': return 'Low priority: '
      default: return ''
    }
  }

  return (
    <>
      <Card 
        ref={cardRef}
        className={`
          h-full flex flex-col 
          transition-all duration-300 ease-out
          hover:shadow-lg hover:-translate-y-1
          animate-in fade-in slide-in-from-bottom-4
          focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2
          cursor-pointer
          ${isLoading ? 'opacity-50 pointer-events-none' : ''}
        `}
        style={{ 
          animationDelay: `${animationDelay}ms`,
          animationDuration: '600ms'
        }}
        tabIndex={0}
        role="article"
        aria-labelledby={`project-title-${project.id}`}
        aria-describedby={`project-details-${project.id}`}
        onKeyDown={handleKeyDown}
        onClick={handleView}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <FolderOpen 
                className="size-5 text-blue-600 shrink-0" 
                aria-hidden="true"
              />
              <CardTitle 
                id={`project-title-${project.id}`}
                className="text-lg font-semibold truncate transition-colors duration-200"
                title={project.name}
              >
                {project.name}
              </CardTitle>
            </div>
            
            {showActions && (
              <CardAction 
                role="toolbar" 
                aria-label={`Actions for project ${project.name}`}
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
                    className="size-8 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    aria-label={`Edit project ${project.name}`}
                    title={`Edit project ${project.name}`}
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
                    className="size-8 hover:bg-red-50 hover:text-red-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500/50"
                    aria-label={`Delete project ${project.name}`}
                    title={`Delete project ${project.name}`}
                  >
                    {isDeleting ? (
                      <div 
                        className="size-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent"
                        aria-label="Deleting project"
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

        <CardContent className="py-0 flex-1">
          <div 
            id={`project-details-${project.id}`}
            className="space-y-3 text-sm text-gray-600"
            role="group"
            aria-label="Project details"
          >
            <div className="flex items-center gap-2">
              <Calendar className="size-4" aria-hidden="true" />
              <span>
                <span className="sr-only">Created on </span>
                Created {format(new Date(project.created_at), 'MMM d, yyyy')}
              </span>
            </div>
            
            {project.updated_at !== project.created_at && (
              <div className="flex items-center gap-2">
                <Edit className="size-4" aria-hidden="true" />
                <span>
                  <span className="sr-only">Last updated on </span>
                  Updated {format(new Date(project.updated_at), 'MMM d, yyyy')}
                </span>
              </div>
            )}

            {/* Due date badge */}
            <div className="flex items-center">
              {dueDateInfo ? (
                <div 
                  className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border ${getDueDateColor(dueDateInfo.variant)}`}
                  role="status"
                  aria-label={`${getUrgencyLabel(dueDateInfo.urgency)}${dueDateInfo.text}`}
                >
                  <Clock className="size-3" aria-hidden="true" />
                  <span aria-hidden="true">{dueDateInfo.text}</span>
                </div>
              ) : (
                <div 
                  className="text-xs text-gray-400"
                  role="status"
                  aria-label="No due date set for this project"
                >
                  No due date set
                </div>
              )}
            </div>
          </div>
        </CardContent>

        <CardFooter className="pt-4 mt-auto">
          <div className="flex gap-2 w-full">
            <Button
              onClick={(e) => {
                e.stopPropagation()
                handleView()
              }}
              disabled={isLoading}
              className="flex-1 transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              size="sm"
              aria-label={`View details for project ${project.name}`}
            >
              <FolderOpen className="size-4 mr-2" aria-hidden="true" />
              <span>View Project</span>
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
          className="sm:max-w-[425px]"
          aria-describedby="delete-dialog-description"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" id="delete-dialog-title">
              <AlertTriangle className="size-5 text-red-600" aria-hidden="true" />
              Delete Project
            </DialogTitle>
            <DialogDescription 
              className="text-left"
              id="delete-dialog-description"
            >
              Are you sure you want to delete <span className="font-semibold">"{project.name}"</span>? 
              This action cannot be undone and will permanently remove the project and all its tasks.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button 
              variant="outline"
              onClick={handleDeleteCancel}
              disabled={isDeleting}
              className="focus:outline-none focus:ring-2 focus:ring-gray-500/50"
              aria-label="Cancel deletion"
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="focus:outline-none focus:ring-2 focus:ring-red-500/50"
              aria-label={`Confirm deletion of project ${project.name}`}
              aria-describedby="delete-status"
            >
              {isDeleting ? (
                <div className="flex items-center gap-2">
                  <div 
                    className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent"
                    aria-hidden="true"
                  />
                  <span>Deleting...</span>
                </div>
              ) : (
                <>
                  <Trash2 className="size-4 mr-2" aria-hidden="true" />
                  <span>Delete Project</span>
                </>
              )}
            </Button>
          </DialogFooter>
          <div id="delete-status" className="sr-only" aria-live="polite">
            {isDeleting ? 'Deleting project, please wait' : ''}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default ProjectCard 