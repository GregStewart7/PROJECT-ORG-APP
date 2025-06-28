'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { 
  X, 
  Calendar, 
  Clock, 
  Flag, 
  CheckCircle, 
  Circle, 
  FileText, 
  Plus,
  Edit,
  Trash2,
  AlertCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react'

import { Task, Note, CreateNoteData, UpdateNoteData, ApiResponse } from '@/types'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { NoteCard } from '@/components/note/NoteCard'
import { NoteForm } from '@/components/note/NoteForm'
import { 
  getNotesByTask, 
  createNote, 
  updateNote, 
  deleteNote,
  toggleTaskCompletion 
} from '@/lib/database'

interface TaskDetailModalProps {
  task: Task | null
  isOpen: boolean
  onClose: () => void
  onTaskUpdate?: (updatedTask: Task) => void
}

export function TaskDetailModal({ task, isOpen, onClose, onTaskUpdate }: TaskDetailModalProps) {
  const [notes, setNotes] = useState<Note[]>([])
  const [isLoadingNotes, setIsLoadingNotes] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  
  // Note form state
  const [isNoteFormOpen, setIsNoteFormOpen] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [isNoteLoading, setIsNoteLoading] = useState(false)
  
  // Task completion state
  const [isTogglingCompletion, setIsTogglingCompletion] = useState(false)
  
  // Note sorting state
  const [noteSortBy, setNoteSortBy] = useState<'newest' | 'oldest' | 'updated' | 'alphabetical'>('newest')

  // Fetch notes when modal opens and task changes
  useEffect(() => {
    if (isOpen && task) {
      fetchNotes()
    } else if (!isOpen) {
      // Reset state when modal closes
      setNotes([])
      setError(null)
      setSuccessMessage(null)
      setIsNoteFormOpen(false)
      setEditingNote(null)
    }
  }, [isOpen, task])

  // Auto-dismiss messages
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [successMessage])

  const fetchNotes = async () => {
    if (!task) return

    setIsLoadingNotes(true)
    setError(null)

    try {
      const result = await getNotesByTask(task.id)
      if (result.success && result.data) {
        setNotes(result.data)
      } else {
        setError(result.error || 'Failed to load notes')
      }
    } catch (error) {
      console.error('Error fetching notes:', error)
      setError('An unexpected error occurred while loading notes')
    } finally {
      setIsLoadingNotes(false)
    }
  }

  const handleToggleCompletion = async () => {
    if (!task || isTogglingCompletion) return

    setIsTogglingCompletion(true)
    setError(null)

    try {
      const result = await toggleTaskCompletion(task.id)
      if (result.success && result.data) {
        onTaskUpdate?.(result.data)
        setSuccessMessage(`Task marked as ${result.data.completed ? 'completed' : 'incomplete'}!`)
      } else {
        setError(result.error || 'Failed to update task')
      }
    } catch (error) {
      console.error('Error toggling task completion:', error)
      setError('An unexpected error occurred')
    } finally {
      setIsTogglingCompletion(false)
    }
  }

  const handleAddNote = () => {
    setEditingNote(null)
    setIsNoteFormOpen(true)
  }

  const handleEditNote = (note: Note) => {
    setEditingNote(note)
    setIsNoteFormOpen(true)
  }

  const handleCloseNoteForm = () => {
    setIsNoteFormOpen(false)
    setEditingNote(null)
  }

  const handleNoteSubmit = async (noteData: CreateNoteData | UpdateNoteData) => {
    if (!task) return

    setIsNoteLoading(true)
    setError(null)

    try {
      let result: ApiResponse<Note>

      if ('id' in noteData) {
        // Update existing note
        result = await updateNote(noteData as UpdateNoteData)
        if (result.success && result.data) {
          setNotes(prev => prev.map(note => 
            note.id === result.data!.id ? result.data! : note
          ))
          setSuccessMessage('Note updated successfully!')
        }
      } else {
        // Create new note
        result = await createNote(noteData as CreateNoteData)
        if (result.success && result.data) {
          setNotes(prev => [...prev, result.data!])
          setSuccessMessage('Note added successfully!')
        }
      }

      if (!result.success) {
        setError(result.error || 'Failed to save note')
      }
    } catch (error) {
      console.error('Error saving note:', error)
      setError('An unexpected error occurred while saving the note')
    } finally {
      setIsNoteLoading(false)
    }
  }

  const handleDeleteNote = async (noteId: string) => {
    const noteToDelete = notes.find(n => n.id === noteId)
    if (!noteToDelete) return

    const confirmed = window.confirm(
      'Are you sure you want to delete this note?\n\nThis action cannot be undone.'
    )
    
    if (!confirmed) return

    setError(null)

    try {
      const result = await deleteNote(noteId)
      if (result.success) {
        setNotes(prev => prev.filter(note => note.id !== noteId))
        setSuccessMessage('Note deleted successfully!')
      } else {
        setError(result.error || 'Failed to delete note')
      }
    } catch (error) {
      console.error('Error deleting note:', error)
      setError('An unexpected error occurred while deleting the note')
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'text-red-600 bg-red-50'
      case 'medium': return 'text-yellow-600 bg-yellow-50'
      case 'low': return 'text-green-600 bg-green-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No due date'
    try {
      return format(new Date(dateString), 'MMM d, yyyy')
    } catch {
      return 'Invalid date'
    }
  }

  const sortNotes = (notes: Note[], sortBy: string) => {
    const notesCopy = [...notes]
    
    switch (sortBy) {
      case 'newest':
        return notesCopy.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      case 'oldest':
        return notesCopy.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      case 'updated':
        return notesCopy.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      case 'alphabetical':
        return notesCopy.sort((a, b) => a.content.toLowerCase().localeCompare(b.content.toLowerCase()))
      default:
        return notesCopy
    }
  }

  const sortedNotes = sortNotes(notes, noteSortBy)

  if (!task) return null

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col" showCloseButton={false}>
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleToggleCompletion}
                  disabled={isTogglingCompletion}
                  className="hover:scale-110 transition-transform"
                  title={task.completed ? 'Mark as incomplete' : 'Mark as complete'}
                >
                  {task.completed ? (
                    <CheckCircle className="size-6 text-green-600" />
                  ) : (
                    <Circle className="size-6 text-gray-400 hover:text-green-600" />
                  )}
                </button>
                <span className={task.completed ? 'line-through text-muted-foreground' : ''}>
                  {task.name}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8 rounded-sm opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                title="Close"
              >
                <X className="size-4" />
                <span className="sr-only">Close</span>
              </Button>
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-6">
            {/* Messages */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-700">
                <AlertCircle className="size-4 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {successMessage && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md text-green-700">
                <CheckCircle className="size-4 flex-shrink-0" />
                <span className="text-sm">{successMessage}</span>
              </div>
            )}

            {/* Task Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Task Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 min-w-0">
                    <Flag className="size-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm text-muted-foreground flex-shrink-0">Priority:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 min-w-0">
                    <Calendar className="size-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm text-muted-foreground flex-shrink-0">Due:</span>
                    <span className="text-sm truncate" title={formatDate(task.due_date)}>
                      {formatDate(task.due_date)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {task.completed ? (
                        <CheckCircle className="size-4 text-green-600" />
                      ) : (
                        <Circle className="size-4 text-gray-400" />
                      )}
                      <span className="text-sm text-muted-foreground">Status:</span>
                    </div>
                    <span className={`text-sm font-medium flex-shrink-0 ${
                      task.completed ? 'text-green-600' : 'text-yellow-600'
                    }`}>
                      {task.completed ? 'Completed' : 'In Progress'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 min-w-0">
                    <Clock className="size-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-sm text-muted-foreground flex-shrink-0">Created:</span>
                    <span className="text-sm truncate" title={formatDate(task.created_at)}>
                      {formatDate(task.created_at)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes Section */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-3">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="size-5" />
                    Notes
                    <span className="text-sm font-normal text-muted-foreground">
                      ({notes.length})
                    </span>
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {notes.length > 1 && (
                      <div className="flex items-center gap-2">
                        <ArrowUpDown className="size-4 text-muted-foreground" />
                        <Select value={noteSortBy} onValueChange={(value: any) => setNoteSortBy(value)}>
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="newest">
                              <div className="flex items-center gap-2">
                                <ArrowDown className="size-3" />
                                Newest first
                              </div>
                            </SelectItem>
                            <SelectItem value="oldest">
                              <div className="flex items-center gap-2">
                                <ArrowUp className="size-3" />
                                Oldest first
                              </div>
                            </SelectItem>
                            <SelectItem value="updated">
                              <div className="flex items-center gap-2">
                                <Edit className="size-3" />
                                Recently updated
                              </div>
                            </SelectItem>
                            <SelectItem value="alphabetical">
                              <div className="flex items-center gap-2">
                                <FileText className="size-3" />
                                Alphabetical
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <Button onClick={handleAddNote} size="sm">
                      <Plus className="size-4 mr-2" />
                      Add Note
                    </Button>
                  </div>
                </div>
                <CardDescription className="text-sm text-muted-foreground">
                  Add notes to track progress, ideas, or important information
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingNotes ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : notes.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <div className="mb-4">
                      <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                        <FileText className="size-8 opacity-50" />
                      </div>
                    </div>
                    <h3 className="text-lg font-medium mb-2 text-foreground">No notes yet</h3>
                    <p className="text-sm mb-6 max-w-sm mx-auto">
                      Start adding notes to capture important details, progress updates, or ideas for this task.
                    </p>
                    <Button onClick={handleAddNote} size="sm">
                      <Plus className="size-4 mr-2" />
                      Add Your First Note
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sortedNotes.map((note) => (
                      <NoteCard
                        key={note.id}
                        note={note}
                        onEdit={handleEditNote}
                        onDelete={handleDeleteNote}
                        compact={false}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {/* Note Form Modal */}
      <NoteForm
        isOpen={isNoteFormOpen}
        onClose={handleCloseNoteForm}
        onSubmit={handleNoteSubmit}
        note={editingNote}
        taskId={task.id}
        isLoading={isNoteLoading}
      />
    </>
  )
} 