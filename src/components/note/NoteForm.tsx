'use client'

import { useState, useEffect } from 'react'
import { 
  Type, 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Quote, 
  Minus,
  X,
  Sparkles,
  StickyNote,
  FileText,
  Check
} from 'lucide-react'

import { Note } from '@/types'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'

interface NoteFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (noteData: Omit<Note, 'id' | 'created_at' | 'updated_at'>) => Promise<void>
  note?: Note | null
  taskId: string
  isLoading?: boolean
}

interface FormErrors {
  content?: string
}

export function NoteForm({ 
  isOpen, 
  onClose, 
  onSubmit, 
  note,
  taskId,
  isLoading = false
}: NoteFormProps) {
  const [content, setContent] = useState(note?.content || '')
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Update form data when note changes (for edit mode)
  useEffect(() => {
    if (note) {
      setContent(note.content || '')
    } else {
      // Reset form for create mode
      setContent('')
    }
    // Clear any existing errors when switching modes/data
    setErrors({})
  }, [note])

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Content validation
    if (!content.trim()) {
      newErrors.content = 'Note content is required'
    } else if (content.trim().length < 3) {
      newErrors.content = 'Note content must be at least 3 characters'
    } else if (content.trim().length > 2000) {
      newErrors.content = 'Note content must be less than 2000 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const noteData = {
        task_id: taskId,
        content: content.trim()
      }

      await onSubmit(noteData)
      handleClose()
    } catch (error) {
      console.error('Error submitting note:', error)
      // Error handling will be managed by the parent component
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting && !isLoading) {
      setContent('')
      setErrors({})
      onClose()
    }
  }

  const handleContentChange = (value: string) => {
    setContent(value)
    
    // Clear error when user starts typing
    if (errors.content) {
      setErrors(prev => ({ ...prev, content: undefined }))
    }
  }

  // Formatting helper functions
  const insertText = (before: string, after: string = '') => {
    const textarea = document.getElementById('note-content') as HTMLTextAreaElement
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = content.substring(start, end)
    
    const newText = content.substring(0, start) + before + selectedText + after + content.substring(end)
    setContent(newText)
    
    // Set cursor position after insertion
    setTimeout(() => {
      const newCursorPos = start + before.length + selectedText.length + after.length
      textarea.setSelectionRange(newCursorPos, newCursorPos)
      textarea.focus()
    }, 0)
  }

  const formatBold = () => insertText('**', '**')
  const formatItalic = () => insertText('*', '*')
  const formatBulletList = () => insertText('\n- ', '')
  const formatNumberedList = () => insertText('\n1. ', '')
  const formatQuote = () => insertText('\n> ', '')
  const formatDivider = () => insertText('\n---\n', '')

  const getCharacterCountInfo = () => {
    const length = content.length
    const maxLength = 2000
    const percentage = (length / maxLength) * 100
    
    let color = 'text-green-600'
    let bgColor = 'bg-green-500'
    
    if (percentage > 90) {
      color = 'text-red-600'
      bgColor = 'bg-red-500'
    } else if (percentage > 75) {
      color = 'text-yellow-600'
      bgColor = 'bg-yellow-500'
    } else if (percentage > 50) {
      color = 'text-blue-600'
      bgColor = 'bg-blue-500'
    }
    
    return {
      length,
      maxLength,
      percentage,
      color,
      bgColor,
      remaining: maxLength - length
    }
  }

  const charInfo = getCharacterCountInfo()
  const isFormDisabled = isSubmitting || isLoading

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] bg-gradient-to-br from-white to-yellow-50/30 border-yellow-200/30 shadow-2xl backdrop-blur-sm max-h-[80vh] overflow-hidden flex flex-col">
        {/* Background gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-50/20 to-orange-50/10 rounded-lg pointer-events-none" />
        
        {/* Decorative elements */}
        <div className="absolute top-4 right-4 w-20 h-20 bg-gradient-to-br from-yellow-400/10 to-orange-400/5 rounded-full blur-2xl" />
        
        <div className="relative z-10 flex flex-col h-full">
          <DialogHeader className="pb-6 shrink-0">
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-yellow-700 to-orange-700 bg-clip-text text-transparent flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-lg">
                <StickyNote className="size-6 text-white" />
              </div>
              {note ? 'Edit Note' : 'Add New Note'}
            </DialogTitle>
            <DialogDescription className="text-gray-600 text-base">
              {note 
                ? 'Update your note content and formatting.'
                : 'Add detailed notes to keep track of important information for this task.'
              }
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
            <div className="flex-1 space-y-4 min-h-0">
              {/* Formatting Toolbar */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Type className="size-4" />
                  Formatting Tools
                </Label>
                <div className="flex flex-wrap gap-1 p-3 bg-white/70 backdrop-blur-sm rounded-xl border border-gray-200">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={formatBold}
                    disabled={isFormDisabled}
                    className="transition-all duration-200 hover:scale-105 hover:bg-gray-100"
                    title="Bold (**text**)"
                  >
                    <Bold className="size-4" />
                  </Button>
                  
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={formatItalic}
                    disabled={isFormDisabled}
                    className="transition-all duration-200 hover:scale-105 hover:bg-gray-100"
                    title="Italic (*text*)"
                  >
                    <Italic className="size-4" />
                  </Button>
                  
                  <div className="w-px h-6 bg-gray-300 mx-1" />
                  
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={formatBulletList}
                    disabled={isFormDisabled}
                    className="transition-all duration-200 hover:scale-105 hover:bg-gray-100"
                    title="Bullet List (- item)"
                  >
                    <List className="size-4" />
                  </Button>
                  
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={formatNumberedList}
                    disabled={isFormDisabled}
                    className="transition-all duration-200 hover:scale-105 hover:bg-gray-100"
                    title="Numbered List (1. item)"
                  >
                    <ListOrdered className="size-4" />
                  </Button>
                  
                  <div className="w-px h-6 bg-gray-300 mx-1" />
                  
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={formatQuote}
                    disabled={isFormDisabled}
                    className="transition-all duration-200 hover:scale-105 hover:bg-gray-100"
                    title="Quote (> text)"
                  >
                    <Quote className="size-4" />
                  </Button>
                  
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={formatDivider}
                    disabled={isFormDisabled}
                    className="transition-all duration-200 hover:scale-105 hover:bg-gray-100"
                    title="Horizontal Divider (---)"
                  >
                    <Minus className="size-4" />
                  </Button>
                </div>
              </div>

              {/* Note Content */}
              <div className="space-y-2 flex-1 min-h-0 flex flex-col">
                <Label htmlFor="note-content" className="text-sm font-semibold text-gray-700">
                  Note Content <span className="text-red-500">*</span>
                </Label>
                <div className="relative flex-1 min-h-0">
                  <Textarea
                    id="note-content"
                    placeholder="Enter your note content here...

You can use formatting:
- **Bold text**
- *Italic text*
- Bullet lists with -
- Numbered lists with 1.
- > Quotes
- --- Dividers"
                    value={content}
                    onChange={(e) => handleContentChange(e.target.value)}
                    disabled={isFormDisabled}
                    className={`h-full min-h-[200px] resize-none bg-white/70 backdrop-blur-sm border-gray-200 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition-all duration-200 ${
                      errors.content ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''
                    }`}
                    maxLength={2000}
                  />
                  
                  {/* Character count indicator overlay */}
                  <div className="absolute bottom-3 right-3 flex items-center gap-2">
                    <div className={`text-xs font-medium ${charInfo.color} transition-colors duration-200`}>
                      {charInfo.length}/{charInfo.maxLength}
                    </div>
                    <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${charInfo.bgColor}`}
                        style={{ width: `${Math.min(charInfo.percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
                
                {errors.content && (
                  <p className="text-sm text-red-600 flex items-center gap-1 animate-in slide-in-from-top-1 duration-200">
                    <X className="size-3" />
                    {errors.content}
                  </p>
                )}

                {/* Character count details */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-4 text-gray-500">
                    <div className="flex items-center gap-1">
                      <FileText className="size-3" />
                      <span>Characters: {charInfo.length}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Check className="size-3" />
                      <span>Remaining: {charInfo.remaining}</span>
                    </div>
                  </div>
                  
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    charInfo.percentage > 90 
                      ? 'bg-red-100 text-red-700'
                      : charInfo.percentage > 75
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {Math.round(charInfo.percentage)}% used
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-3 pt-6 shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isFormDisabled}
                className="bg-white/70 backdrop-blur-sm hover:bg-gray-50 border-gray-200"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isFormDisabled}
                className="bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    {note ? 'Updating...' : 'Saving...'}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Sparkles className="size-4" />
                    {note ? 'Update Note' : 'Save Note'}
                  </div>
                )}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default NoteForm 