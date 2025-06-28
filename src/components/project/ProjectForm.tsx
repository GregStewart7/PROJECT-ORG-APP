'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Calendar, FolderPlus, X } from 'lucide-react'

import { Project } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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

interface ProjectFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (projectData: Omit<Project, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>
  isLoading?: boolean
  mode?: 'create' | 'edit'
  initialData?: Project
}

interface FormData {
  name: string
  description: string
  due_date: string
}

interface FormErrors {
  name?: string
  description?: string
  due_date?: string
}

export function ProjectForm({ 
  isOpen, 
  onClose, 
  onSubmit, 
  isLoading = false,
  mode = 'create',
  initialData 
}: ProjectFormProps) {
  const [formData, setFormData] = useState<FormData>({
    name: initialData?.name || '',
    description: initialData?.description || '',
    due_date: initialData?.due_date ? format(new Date(initialData.due_date), 'yyyy-MM-dd') : ''
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Update form data when initialData changes (for edit mode)
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        description: initialData.description || '',
        due_date: initialData.due_date ? format(new Date(initialData.due_date), 'yyyy-MM-dd') : ''
      })
    } else {
      // Reset form for create mode
      setFormData({
        name: '',
        description: '',
        due_date: ''
      })
    }
    // Clear any existing errors when switching modes/data
    setErrors({})
  }, [initialData])

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Project name is required'
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Project name must be at least 2 characters'
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'Project name must be less than 100 characters'
    }

    // Description validation (optional but with limits)
    if (formData.description.trim().length > 500) {
      newErrors.description = 'Description must be less than 500 characters'
    }

    // Due date validation (optional but must be valid if provided)
    if (formData.due_date) {
      const selectedDate = new Date(formData.due_date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      if (selectedDate < today) {
        newErrors.due_date = 'Due date cannot be in the past'
      }
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
      const projectData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        due_date: formData.due_date || null
      }

      await onSubmit(projectData)
      handleClose()
    } catch (error) {
      console.error('Error submitting project:', error)
      // Error handling will be managed by the parent component
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting && !isLoading) {
      setFormData({
        name: '',
        description: '',
        due_date: ''
      })
      setErrors({})
      onClose()
    }
  }

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const isFormDisabled = isSubmitting || isLoading

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderPlus className="size-5 text-blue-600" />
            {mode === 'create' ? 'Create New Project' : 'Edit Project'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Add a new project to organize your tasks and track progress.'
              : 'Update your project information and settings.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Project Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Project Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="Enter project name..."
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              disabled={isFormDisabled}
              className={errors.name ? 'border-red-500 focus:border-red-500' : ''}
              maxLength={100}
            />
            {errors.name && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <X className="size-3" />
                {errors.name}
              </p>
            )}
          </div>

          {/* Project Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Description <span className="text-gray-400">(optional)</span>
            </Label>
            <Textarea
              id="description"
              placeholder="Add project description..."
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              disabled={isFormDisabled}
              className={errors.description ? 'border-red-500 focus:border-red-500' : ''}
              rows={3}
              maxLength={500}
            />
            <div className="flex justify-between items-center">
              {errors.description && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <X className="size-3" />
                  {errors.description}
                </p>
              )}
              <p className="text-xs text-gray-500 ml-auto">
                {formData.description.length}/500 characters
              </p>
            </div>
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label htmlFor="due_date" className="text-sm font-medium">
              Due Date <span className="text-gray-400">(optional)</span>
            </Label>
            <div className="relative">
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => handleInputChange('due_date', e.target.value)}
                disabled={isFormDisabled}
                className={errors.due_date ? 'border-red-500 focus:border-red-500' : ''}
                min={format(new Date(), 'yyyy-MM-dd')}
              />
              <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 size-4 text-gray-400 pointer-events-none" />
            </div>
            {errors.due_date && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <X className="size-3" />
                {errors.due_date}
              </p>
            )}
          </div>

          <DialogFooter className="gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={isFormDisabled}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isFormDisabled}
              className="min-w-[100px]"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  {mode === 'create' ? 'Creating...' : 'Saving...'}
                </div>
              ) : (
                <>
                  <FolderPlus className="size-4" />
                  {mode === 'create' ? 'Create Project' : 'Save Changes'}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 