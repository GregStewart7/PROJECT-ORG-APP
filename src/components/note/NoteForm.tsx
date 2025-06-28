'use client'

import { useState, useEffect, useRef } from 'react'
import { FileText, X, Plus, Edit, List, ListOrdered, Type, Bold, Italic, Quote } from 'lucide-react'

import { Note, CreateNoteData, UpdateNoteData } from '@/types'
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
  onSubmit: (data: CreateNoteData | UpdateNoteData) => Promise<void>
  note?: Note | null
  taskId: string
  isLoading?: boolean
}

export function NoteForm({ 
  isOpen, 
  onClose, 
  onSubmit, 
  note, 
  taskId,
  isLoading = false 
}: NoteFormProps) {
  const [content, setContent] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const isEditMode = !!note

  // Reset form when dialog opens/closes or note changes
  useEffect(() => {
    if (isOpen) {
      if (note) {
        // Edit mode - populate with existing note data
        setContent(note.content)
      } else {
        // Create mode - reset to defaults
        setContent('')
      }
      setErrors({})
      
      // Focus textarea after a brief delay to ensure dialog is fully rendered
      setTimeout(() => {
        textareaRef.current?.focus()
      }, 100)
    }
  }, [isOpen, note])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Content validation
    if (!content.trim()) {
      newErrors.content = 'Note content is required'
    } else if (content.trim().length < 3) {
      newErrors.content = 'Note content must be at least 3 characters'
    } else if (content.length > 10000) {
      newErrors.content = 'Note content must be less than 10,000 characters'
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
      const submitData = {
        content: content.trim()
      }

      if (isEditMode && note) {
        await onSubmit({
          ...submitData,
          id: note.id
        } as UpdateNoteData)
      } else {
        await onSubmit({
          ...submitData,
          task_id: taskId
        } as CreateNoteData)
      }

      onClose()
    } catch (error) {
      console.error('Form submission error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleContentChange = (value: string) => {
    setContent(value)
    
    // Clear error when user starts typing
    if (errors.content) {
      setErrors(prev => ({
        ...prev,
        content: ''
      }))
    }
  }

  // Text formatting helpers
  const insertTextAtCursor = (textToInsert: string, selectInserted = false) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const currentContent = content
    
    const newContent = 
      currentContent.substring(0, start) + 
      textToInsert + 
      currentContent.substring(end)
    
    setContent(newContent)
    
    // Set cursor position after insertion
    setTimeout(() => {
      if (selectInserted) {
        textarea.setSelectionRange(start, start + textToInsert.length)
      } else {
        textarea.setSelectionRange(start + textToInsert.length, start + textToInsert.length)
      }
      textarea.focus()
    }, 0)
  }

  const formatSelectedText = (prefix: string, suffix = '') => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = content.substring(start, end)
    
    if (selectedText) {
      const formattedText = prefix + selectedText + suffix
      const newContent = 
        content.substring(0, start) + 
        formattedText + 
        content.substring(end)
      
      setContent(newContent)
      
      setTimeout(() => {
        textarea.setSelectionRange(
          start + prefix.length, 
          start + prefix.length + selectedText.length
        )
        textarea.focus()
      }, 0)
    }
  }

  const addBulletPoint = () => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const beforeCursor = content.substring(0, start)
    const needsNewline = beforeCursor.length > 0 && !beforeCursor.endsWith('\n')
    
    insertTextAtCursor((needsNewline ? '\n' : '') + '• ')
  }

  const addNumberedItem = () => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const beforeCursor = content.substring(0, start)
    const lines = beforeCursor.split('\n')
    const currentLine = lines[lines.length - 1]
    
    // Find the next number in sequence
    let nextNumber = 1
    const numberedItemRegex = /^(\d+)\.\s/
    
    for (let i = lines.length - 1; i >= 0; i--) {
      const match = lines[i].match(numberedItemRegex)
      if (match) {
        nextNumber = parseInt(match[1]) + 1
        break
      }
    }
    
    const needsNewline = beforeCursor.length > 0 && !beforeCursor.endsWith('\n')
    insertTextAtCursor((needsNewline ? '\n' : '') + `${nextNumber}. `)
  }

  const getCharacterCount = () => {
    return {
      current: content.length,
      remaining: 10000 - content.length,
      percentage: (content.length / 10000) * 100
    }
  }

  const charCount = getCharacterCount()

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEditMode ? (
              <>
                <Edit className="size-5" />
                Edit Note
              </>
            ) : (
              <>
                <Plus className="size-5" />
                Create New Note
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isEditMode 
              ? 'Update your note content below. Use the formatting tools to structure your text.'
              : 'Add a note to capture important information, thoughts, or progress updates.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1">
          <div className="space-y-4 flex-1">
            {/* Content */}
            <div className="space-y-2 flex-1 flex flex-col">
              <div className="flex items-center justify-between">
                <Label htmlFor="content" className="text-sm font-medium">
                  Note Content *
                </Label>
                <div className="text-xs text-muted-foreground">
                  {charCount.current.toLocaleString()} / 10,000 characters
                </div>
              </div>

              {/* Formatting Toolbar */}
              <div className="flex items-center gap-1 p-2 bg-muted/30 rounded-md border">
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={addBulletPoint}
                    disabled={isLoading || isSubmitting}
                    className="h-7 px-2"
                    title="Add bullet point"
                  >
                    <List className="size-3" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={addNumberedItem}
                    disabled={isLoading || isSubmitting}
                    className="h-7 px-2"
                    title="Add numbered item"
                  >
                    <ListOrdered className="size-3" />
                  </Button>
                  
                  <div className="w-px h-4 bg-border mx-1" />
                  
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => formatSelectedText('**', '**')}
                    disabled={isLoading || isSubmitting}
                    className="h-7 px-2"
                    title="Bold text (surround with **)"
                  >
                    <Bold className="size-3" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => formatSelectedText('*', '*')}
                    disabled={isLoading || isSubmitting}
                    className="h-7 px-2"
                    title="Italic text (surround with *)"
                  >
                    <Italic className="size-3" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => insertTextAtCursor('> ')}
                    disabled={isLoading || isSubmitting}
                    className="h-7 px-2"
                    title="Add quote"
                  >
                    <Quote className="size-3" />
                  </Button>
                </div>
                
                <div className="text-xs text-muted-foreground ml-auto">
                  Formatting helpers
                </div>
              </div>

              <Textarea
                ref={textareaRef}
                id="content"
                placeholder="Enter your note content here...

Use the toolbar above or type:
• Bullet points with '•', '-', or '*'
• Numbered lists with '1.', '2.', etc.
• **Bold text** and *italic text*
• > Quotes"
                value={content}
                onChange={(e) => handleContentChange(e.target.value)}
                className={`min-h-[200px] flex-1 resize-none ${errors.content ? 'border-red-500 focus:border-red-500' : ''}`}
                disabled={isLoading || isSubmitting}
                maxLength={10000}
              />
              
              {errors.content && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <FileText className="size-4" />
                  {errors.content}
                </p>
              )}

              {/* Character count progress */}
              {charCount.percentage > 80 && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className={charCount.remaining < 0 ? 'text-red-600' : 'text-muted-foreground'}>
                      {charCount.remaining < 0 
                        ? `${Math.abs(charCount.remaining)} characters over limit`
                        : `${charCount.remaining} characters remaining`
                      }
                    </span>
                    <span className="text-muted-foreground">
                      {charCount.percentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1">
                    <div 
                      className={`h-1 rounded-full transition-all ${
                        charCount.percentage > 100 
                          ? 'bg-red-500' 
                          : charCount.percentage > 90 
                            ? 'bg-yellow-500' 
                            : 'bg-blue-500'
                      }`}
                      style={{ width: `${Math.min(charCount.percentage, 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="flex gap-2 pt-4 mt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading || isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || isSubmitting || charCount.remaining < 0}
              className="min-w-[100px]"
            >
              {isSubmitting ? (
                <>
                  <div className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                  {isEditMode ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  {isEditMode ? (
                    <>
                      <Edit className="size-4 mr-2" />
                      Update Note
                    </>
                  ) : (
                    <>
                      <Plus className="size-4 mr-2" />
                      Create Note
                    </>
                  )}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 