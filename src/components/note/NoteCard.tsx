'use client'

import { useState } from 'react'
import { format, formatDistanceToNow } from 'date-fns'
import { Calendar, Edit, Trash2, ChevronDown, ChevronUp, StickyNote, Clock, User, Sparkles, AlertTriangle } from 'lucide-react'

import { Note } from '@/types'
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

interface NoteCardProps {
  note: Note
  onEdit?: (note: Note) => void
  onDelete?: (noteId: string) => void
  isLoading?: boolean
  showActions?: boolean
  animationDelay?: number
}

export function NoteCard({ 
  note, 
  onEdit, 
  onDelete, 
  isLoading = false, 
  showActions = true,
  animationDelay = 0
}: NoteCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const handleEdit = () => {
    if (onEdit && !isLoading) {
      onEdit(note)
    }
  }

  const handleDeleteClick = () => {
    setShowDeleteDialog(true)
  }

  const handleDeleteConfirm = async () => {
    if (onDelete && !isLoading && !isDeleting) {
      setIsDeleting(true)
      try {
        await onDelete(note.id)
        setShowDeleteDialog(false)
      } finally {
        setIsDeleting(false)
      }
    }
  }

  const handleDeleteCancel = () => {
    setShowDeleteDialog(false)
  }

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded)
  }

  const shouldShowToggle = note.content.length > 200
  const displayContent = isExpanded || !shouldShowToggle 
    ? note.content 
    : note.content.substring(0, 200) + '...'

  const formatTimestamp = (dateString: string) => {
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
      
      if (diffInHours < 24) {
        return {
          relative: formatDistanceToNow(date, { addSuffix: true }),
          absolute: format(date, 'h:mm a'),
          variant: 'recent' as const
        }
      } else if (diffInHours < 168) { // Less than a week
        return {
          relative: formatDistanceToNow(date, { addSuffix: true }),
          absolute: format(date, 'MMM d, h:mm a'),
          variant: 'week' as const
        }
      } else {
        return {
          relative: formatDistanceToNow(date, { addSuffix: true }),
          absolute: format(date, 'MMM d, yyyy h:mm a'),
          variant: 'old' as const
        }
      }
    } catch {
      return {
        relative: 'Unknown time',
        absolute: 'Invalid date',
        variant: 'error' as const
      }
    }
  }

  const getTimestampColor = (variant: string) => {
    switch (variant) {
      case 'recent':
        return 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
      case 'week':
        return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
      case 'old':
        return 'bg-gradient-to-r from-purple-500 to-purple-600 text-white'
      default:
        return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white'
    }
  }

  const timestampInfo = formatTimestamp(note.created_at)

  return (
    <>
      <Card 
        className={`
          h-full flex flex-col 
          transition-all duration-300 ease-out
          hover:shadow-xl hover:-translate-y-2
          animate-in fade-in slide-in-from-bottom-4
          bg-gradient-to-br from-white to-yellow-50/30
          border-yellow-200/40 backdrop-blur-sm
          ${isLoading ? 'opacity-50 pointer-events-none' : ''}
          group cursor-pointer
          relative overflow-hidden
        `}
        style={{ 
          animationDelay: `${animationDelay}ms`,
          animationDuration: '600ms'
        }}
      >
        {/* Animated background gradient on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-50/30 to-orange-50/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Decorative note indicator */}
        <div className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-yellow-400 to-orange-500 transition-all duration-300" />
        
        <CardHeader className="pb-3 relative z-10">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <div className="p-2 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-xl shrink-0 mt-0.5 group-hover:scale-110 transition-transform duration-300">
                <StickyNote className="size-5 text-yellow-700" />
              </div>
              
              <div className="min-w-0 flex-1">
                <CardTitle className="text-lg font-semibold text-gray-900 mb-2">
                  Note
                </CardTitle>
                
                {/* Timestamp badge */}
                <div className="flex items-center gap-2">
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${getTimestampColor(timestampInfo.variant)} shadow-sm`}>
                    <Clock className="size-3" />
                    <span title={timestampInfo.absolute}>{timestampInfo.relative}</span>
                  </div>
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
                    className="size-8 hover:bg-yellow-50 hover:text-yellow-600 transition-all duration-200 hover:scale-110"
                    title="Edit note"
                  >
                    <Edit className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleDeleteClick}
                    disabled={isLoading || isDeleting}
                    className="size-8 hover:bg-red-50 hover:text-red-600 transition-all duration-200 hover:scale-110"
                    title="Delete note"
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

        <CardContent className="py-0 flex-1 relative z-10">
          <div className="space-y-3">
            {/* Note content */}
            <div className="relative">
              <div className="prose prose-sm max-w-none text-gray-700">
                <p className={`leading-relaxed whitespace-pre-wrap transition-all duration-300 ${
                  isExpanded ? 'text-gray-800' : 'text-gray-700'
                }`}>
                  {displayContent}
                </p>
              </div>
              
              {/* Fade overlay for collapsed content */}
              {shouldShowToggle && !isExpanded && (
                <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent pointer-events-none" />
              )}
            </div>

            {/* Metadata */}
            <div className="flex items-center gap-4 text-xs text-gray-500 pt-2 border-t border-gray-100 transition-colors duration-300 group-hover:text-gray-600">
              <div className="flex items-center gap-1.5">
                <Calendar className="size-3" />
                <span>{format(new Date(note.created_at), 'MMM d, yyyy')}</span>
              </div>
              
              {note.updated_at !== note.created_at && (
                <div className="flex items-center gap-1.5">
                  <Edit className="size-3" />
                  <span>Edited {formatDistanceToNow(new Date(note.updated_at), { addSuffix: true })}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>

        {shouldShowToggle && (
          <CardFooter className="pt-3 relative z-10">
            <Button
              onClick={toggleExpanded}
              variant="ghost"
              size="sm"
              className="w-full transition-all duration-300 hover:scale-105 bg-yellow-50/50 hover:bg-yellow-100/50 border border-yellow-200/50 hover:border-yellow-300/60 text-yellow-700 hover:text-yellow-800 group/btn"
            >
              <div className="flex items-center gap-2">
                {isExpanded ? (
                  <>
                    <ChevronUp className="size-4 transition-transform duration-300 group-hover/btn:scale-110" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="size-4 transition-transform duration-300 group-hover/btn:scale-110" />
                    Show More
                  </>
                )}
              </div>
            </Button>
          </CardFooter>
        )}
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md bg-white/95 backdrop-blur-xl border-gray-200/50">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-r from-red-100 to-red-200 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold text-gray-900">
                  Delete Note
                </DialogTitle>
                <DialogDescription className="text-sm text-gray-500 mt-1">
                  This action cannot be undone.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="py-4">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-lg p-4 border border-gray-200/50">
              <p className="text-sm text-gray-700 mb-2">
                Are you sure you want to delete this note?
              </p>
              <div className="bg-yellow-50/80 border border-yellow-200/60 rounded-md p-3 mt-3">
                <p className="text-xs text-yellow-800 line-clamp-3">
                  {note.content.substring(0, 100)}
                  {note.content.length > 100 && '...'}
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="flex gap-3 sm:gap-3">
            <Button
              variant="outline"
              onClick={handleDeleteCancel}
              disabled={isDeleting}
              className="flex-1 bg-white/70 backdrop-blur-sm hover:bg-gray-50 border-gray-200"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="flex-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg transition-all duration-200"
            >
              {isDeleting ? (
                <>
                  <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Note
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default NoteCard 