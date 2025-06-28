'use client'

import { useState } from 'react'
import { format, formatDistanceToNow } from 'date-fns'
import { Calendar, Edit, Trash2, FileText, Clock, MoreVertical } from 'lucide-react'

import { Note } from '@/types'
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

interface NoteCardProps {
  note: Note
  onEdit?: (note: Note) => void
  onDelete?: (noteId: string) => void
  isLoading?: boolean
  showActions?: boolean
  compact?: boolean
}

export function NoteCard({ 
  note, 
  onEdit, 
  onDelete,
  isLoading = false,
  showActions = true,
  compact = false 
}: NoteCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  const handleEdit = () => {
    if (onEdit && !isLoading) {
      onEdit(note)
    }
  }

  const handleDelete = async () => {
    if (onDelete && !isLoading && !isDeleting) {
      setIsDeleting(true)
      try {
        await onDelete(note.id)
      } finally {
        setIsDeleting(false)
      }
    }
  }

  const formatTimestamp = (dateString: string) => {
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
      
      if (diffInHours < 24) {
        return formatDistanceToNow(date, { addSuffix: true })
      } else {
        return format(date, 'MMM d, yyyy \'at\' h:mm a')
      }
    } catch {
      return 'Unknown time'
    }
  }

  const processNoteContent = (content: string) => {
    // Handle bullet points and basic formatting
    const lines = content.split('\n')
    
    return lines.map((line, index) => {
      const trimmedLine = line.trim()
      
      // Handle bullet points (-, *, +)
      if (trimmedLine.match(/^[-*+]\s+/)) {
        const bulletContent = trimmedLine.replace(/^[-*+]\s+/, '')
        return (
          <div key={index} className="flex items-start gap-2 mb-1">
            <span className="text-blue-600 mt-1 text-xs">•</span>
            <span className="flex-1">{bulletContent}</span>
          </div>
        )
      }
      
      // Handle numbered lists
      if (trimmedLine.match(/^\d+\.\s+/)) {
        const match = trimmedLine.match(/^(\d+)\.\s+(.*)/)
        if (match) {
          return (
            <div key={index} className="flex items-start gap-2 mb-1">
              <span className="text-blue-600 text-xs font-medium mt-1">{match[1]}.</span>
              <span className="flex-1">{match[2]}</span>
            </div>
          )
        }
      }
      
      // Handle empty lines
      if (trimmedLine === '') {
        return <div key={index} className="h-2" />
      }
      
      // Regular text
      return (
        <div key={index} className="mb-1">
          {line}
        </div>
      )
    })
  }

  const shouldTruncate = !isExpanded && note.content.length > 200
  const displayContent = shouldTruncate 
    ? note.content.substring(0, 200) + '...'
    : note.content

  const wasUpdated = note.updated_at !== note.created_at

  return (
    <Card className={`transition-all duration-200 hover:shadow-md ${isLoading ? 'opacity-50 pointer-events-none' : ''} ${compact ? 'text-sm' : ''}`}>
      <CardHeader className={compact ? 'pb-2' : 'pb-3'}>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="shrink-0 mt-1">
              <FileText className={`${compact ? 'size-4' : 'size-5'} text-blue-600`} />
            </div>
            
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <CardDescription className="text-xs text-muted-foreground">
                  {wasUpdated ? (
                    <>
                      <Edit className="size-3 inline mr-1" />
                      Updated {formatTimestamp(note.updated_at)}
                    </>
                  ) : (
                    <>
                      <Clock className="size-3 inline mr-1" />
                      Created {formatTimestamp(note.created_at)}
                    </>
                  )}
                </CardDescription>
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
                  className={`${compact ? 'size-6' : 'size-8'} hover:bg-blue-50 hover:text-blue-600`}
                  title="Edit note"
                >
                  <Edit className={compact ? 'size-3' : 'size-4'} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDelete}
                  disabled={isLoading || isDeleting}
                  className={`${compact ? 'size-6' : 'size-8'} hover:bg-red-50 hover:text-red-600`}
                  title="Delete note"
                >
                  {isDeleting ? (
                    <div className={`${compact ? 'size-3' : 'size-4'} animate-spin rounded-full border-2 border-red-600 border-t-transparent`} />
                  ) : (
                    <Trash2 className={compact ? 'size-3' : 'size-4'} />
                  )}
                </Button>
              </div>
            </CardAction>
          )}
        </div>
      </CardHeader>

      <CardContent className={`${compact ? 'py-1' : 'py-0'} flex-1`}>
        <div className={`text-sm leading-relaxed ${compact ? 'text-xs' : ''}`}>
          {displayContent ? (
            <div className="whitespace-pre-wrap">
              {processNoteContent(displayContent)}
            </div>
          ) : (
            <div className="text-muted-foreground italic">
              No content
            </div>
          )}
          
          {shouldTruncate && (
            <button
              onClick={() => setIsExpanded(true)}
              className="text-blue-600 hover:text-blue-800 text-xs font-medium mt-2 inline-flex items-center gap-1"
            >
              <MoreVertical className="size-3" />
              Show more
            </button>
          )}
          
          {isExpanded && note.content.length > 200 && (
            <button
              onClick={() => setIsExpanded(false)}
              className="text-blue-600 hover:text-blue-800 text-xs font-medium mt-2 block"
            >
              Show less
            </button>
          )}
        </div>
      </CardContent>

      {!compact && (
        <CardFooter className="pt-3 mt-auto">
          <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Calendar className="size-3" />
                <span>Created {format(new Date(note.created_at), 'MMM d, yyyy')}</span>
              </div>
              
              {wasUpdated && (
                <div className="flex items-center gap-1">
                  <Edit className="size-3" />
                  <span>Updated {format(new Date(note.updated_at), 'MMM d, yyyy')}</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-1">
              <FileText className="size-3" />
              <span>{note.content.length} characters</span>
            </div>
          </div>
        </CardFooter>
      )}
    </Card>
  )
} 