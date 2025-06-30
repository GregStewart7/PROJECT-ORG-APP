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
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col bg-white/95 backdrop-blur-xl border border-gray-200/50 shadow-2xl" showCloseButton={false}>
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleToggleCompletion}
                  disabled={isTogglingCompletion}
                  className="hover:scale-110 transition-all duration-200 relative"
                  title={task.completed ? 'Mark as incomplete' : 'Mark as complete'}
                >
                  {isTogglingCompletion ? (
                    <div className="size-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                  ) : task.completed ? (
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
            {/* Enhanced Messages */}
            {error && (
              <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200/50 rounded-xl text-red-700 shadow-sm animate-in slide-in-from-top-2 duration-300">
                <div className="p-1 rounded-full bg-gradient-to-br from-red-500 to-red-600">
                  <AlertCircle className="size-4 text-white flex-shrink-0" />
                </div>
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}

            {successMessage && (
              <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200/50 rounded-xl text-green-700 shadow-sm animate-in slide-in-from-top-2 duration-300">
                <div className="p-1 rounded-full bg-gradient-to-br from-green-500 to-emerald-600">
                  <CheckCircle className="size-4 text-white flex-shrink-0" />
                </div>
                <span className="text-sm font-medium">{successMessage}</span>
              </div>
            )}

            {/* Enhanced Task Details */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm border border-gray-200/50 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-white to-indigo-50/20 pointer-events-none" />
              <div className="absolute top-4 right-4 w-16 h-16 bg-gradient-to-br from-blue-400/10 to-purple-400/5 rounded-full blur-2xl" />
              
              <CardHeader className="relative z-10">
                <CardTitle className="text-xl font-bold bg-gradient-to-r from-gray-900 to-blue-800 bg-clip-text text-transparent">Task Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 relative z-10">
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

            {/* Enhanced Notes Section */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm border border-gray-200/50 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-green-50/20 via-white to-blue-50/20 pointer-events-none" />
              <div className="absolute top-4 right-4 w-16 h-16 bg-gradient-to-br from-green-400/10 to-blue-400/5 rounded-full blur-2xl" />
              
              <CardHeader className="pb-4 relative z-10">
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
                                                  <Select value={noteSortBy} onValueChange={(value: 'newest' | 'oldest' | 'updated' | 'alphabetical') => setNoteSortBy(value)}>
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
              <CardContent className="relative z-10">
                {isLoadingNotes ? (
                  <div className="space-y-4">
                    {/* Enhanced Notes Loading Skeleton */}
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse bg-gradient-to-r from-gray-50 to-white p-4 rounded-xl border border-gray-200/50 shadow-sm" style={{ animationDelay: `${i * 150}ms` }}>
                        <div className="flex items-start justify-between mb-3">
                          <div className="space-y-2 flex-1">
                            <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-100 rounded w-3/4"></div>
                            <div className="h-3 bg-gradient-to-r from-gray-150 to-gray-100 rounded w-1/2"></div>
                          </div>
                          <div className="flex gap-1">
                            <div className="h-8 w-8 bg-gradient-to-r from-gray-200 to-gray-100 rounded-lg"></div>
                            <div className="h-8 w-8 bg-gradient-to-r from-red-200 to-red-100 rounded-lg"></div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="h-3 bg-gradient-to-r from-gray-150 to-gray-100 rounded w-full"></div>
                          <div className="h-3 bg-gradient-to-r from-gray-150 to-gray-100 rounded w-4/5"></div>
                          <div className="h-3 bg-gradient-to-r from-gray-150 to-gray-100 rounded w-2/3"></div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-gray-200/50">
                          <div className="h-3 bg-gradient-to-r from-blue-200 to-blue-100 rounded w-32"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : notes.length === 0 ? (
                  <div className="text-center py-12 relative">
                    {/* Background decoration */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-white to-indigo-50/20 rounded-xl -z-10"></div>
                    <div className="absolute top-4 right-4 w-16 h-16 bg-gradient-to-br from-blue-400/10 to-purple-400/5 rounded-full blur-2xl -z-10"></div>
                    
                    <div className="mb-6">
                      <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-500/20 to-indigo-600/10 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                          <FileText className="size-6 text-white" />
                        </div>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold mb-3 bg-gradient-to-r from-gray-900 to-blue-800 bg-clip-text text-transparent">No notes yet</h3>
                    <p className="text-gray-600 mb-8 max-w-sm mx-auto leading-relaxed">
                      Start adding notes to capture important details, progress updates, or ideas for this task.
                    </p>
                    <Button 
                      onClick={handleAddNote} 
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl hover:shadow-blue-500/25 transition-all duration-300 hover:scale-105"
                    >
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