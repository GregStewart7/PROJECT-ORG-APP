'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Calendar, FolderPlus, AlertCircle, CheckCircle, Info } from 'lucide-react'

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

interface FieldValidation {
  isValid: boolean
  isDirty: boolean
}

interface FormValidation {
  name: FieldValidation
  description: FieldValidation
  due_date: FieldValidation
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
    name: '',
    description: '',
    due_date: ''
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [validation, setValidation] = useState<FormValidation>({
    name: { isValid: false, isDirty: false },
    description: { isValid: true, isDirty: false },
    due_date: { isValid: true, isDirty: false }
  })

  // Update form data when initialData changes (for edit mode)
  useEffect(() => {
    if (initialData) {
      const newFormData = {
        name: initialData.name || '',
        description: initialData.description || '',
        due_date: initialData.due_date ? format(new Date(initialData.due_date), 'yyyy-MM-dd') : ''
      }
      setFormData(newFormData)
      
      // Validate initial data
      validateField('name', newFormData.name, false)
      validateField('description', newFormData.description, false)
      validateField('due_date', newFormData.due_date, false)
    } else {
      // Reset form for create mode
      const emptyFormData = {
        name: '',
        description: '',
        due_date: ''
      }
      setFormData(emptyFormData)
      setValidation({
        name: { isValid: false, isDirty: false },
        description: { isValid: true, isDirty: false },
        due_date: { isValid: true, isDirty: false }
      })
    }
    // Clear any existing errors when switching modes/data
    setErrors({})
  }, [initialData])

  const validateField = (field: keyof FormData, value: string, isDirty: boolean = true) => {
    let isValid = true
    let error: string | undefined

    switch (field) {
      case 'name':
        if (!value.trim()) {
          isValid = false
          error = isDirty ? 'Project name is required' : undefined
        } else if (value.trim().length < 2) {
          isValid = false
          error = 'Project name must be at least 2 characters'
        } else if (value.trim().length > 100) {
          isValid = false
          error = 'Project name must be less than 100 characters'
        } else if (!/^[a-zA-Z0-9\s\-_.,!?()]+$/.test(value.trim())) {
          isValid = false
          error = 'Project name contains invalid characters'
        }
        break

      case 'description':
        if (value.trim().length > 500) {
          isValid = false
          error = 'Description must be less than 500 characters'
        }
        break

      case 'due_date':
        if (value) {
          const selectedDate = new Date(value)
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          
          if (selectedDate < today) {
            isValid = false
            error = 'Due date cannot be in the past'
          }
        }
        break
    }

    // Update validation state
    setValidation(prev => ({
      ...prev,
      [field]: { isValid, isDirty: isDirty || prev[field].isDirty }
    }))

    // Update errors
    setErrors(prev => ({
      ...prev,
      [field]: error
    }))

    return isValid
  }

  const validateForm = (): boolean => {
    const nameValid = validateField('name', formData.name)
    const descriptionValid = validateField('description', formData.description)
    const dueDateValid = validateField('due_date', formData.due_date)

    return nameValid && descriptionValid && dueDateValid
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
    // Always allow closing
    setFormData({
      name: '',
      description: '',
      due_date: ''
    })
    setErrors({})
    setValidation({
      name: { isValid: false, isDirty: false },
      description: { isValid: true, isDirty: false },
      due_date: { isValid: true, isDirty: false }
    })
    onClose()
  }

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Real-time validation
    setTimeout(() => {
      validateField(field, value)
    }, 300) // Debounce validation
  }

  const getFieldClassName = (field: keyof FormData) => {
    const fieldValidation = validation[field]
    const hasError = errors[field]
    
    if (!fieldValidation.isDirty) {
      return 'border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
    }
    
    if (hasError) {
      return 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 bg-red-50/30'
    }
    
    if (fieldValidation.isValid && fieldValidation.isDirty) {
      return 'border-green-500 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 bg-green-50/30'
    }
    
    return 'border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
  }

  const getValidationIcon = (field: keyof FormData) => {
    const fieldValidation = validation[field]
    const hasError = errors[field]
    
    if (!fieldValidation.isDirty) return null
    
    if (hasError) {
      return <AlertCircle className="size-4 text-red-500" />
    }
    
    if (fieldValidation.isValid && fieldValidation.isDirty) {
      return <CheckCircle className="size-4 text-green-500" />
    }
    
    return null
  }

  const isFormValid = validation.name.isValid && validation.description.isValid && validation.due_date.isValid
  const isFormDisabled = isSubmitting || isLoading

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[500px] bg-white/95 backdrop-blur-xl border-gray-200/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
              <FolderPlus className="size-5 text-white" />
            </div>
            <div>
              <span className="bg-gradient-to-r from-gray-900 to-blue-800 bg-clip-text text-transparent font-bold">
                {mode === 'create' ? 'Create New Project' : 'Edit Project'}
              </span>
            </div>
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            {mode === 'create' 
              ? 'Add a new project to organize your tasks and track progress.'
              : 'Update your project information and settings.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Project Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              Project Name 
              <span className="text-red-500">*</span>
              {getValidationIcon('name')}
            </Label>
            <div className="relative">
              <Input
                id="name"
                type="text"
                placeholder="Enter project name..."
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                disabled={isFormDisabled}
                className={`transition-all duration-200 ${getFieldClassName('name')}`}
                maxLength={100}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                {getValidationIcon('name')}
              </div>
            </div>
            {errors.name && (
              <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-md animate-in slide-in-from-top-1 duration-200">
                <AlertCircle className="size-3 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-600">{errors.name}</p>
              </div>
            )}
            {validation.name.isValid && validation.name.isDirty && !errors.name && (
              <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-md animate-in slide-in-from-top-1 duration-200">
                <CheckCircle className="size-3 text-green-500 flex-shrink-0" />
                <p className="text-sm text-green-600">Perfect! Project name looks good.</p>
              </div>
            )}
          </div>

          {/* Project Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              Description 
              <span className="text-gray-400 font-normal">(optional)</span>
              {getValidationIcon('description')}
            </Label>
            <div className="relative">
              <Textarea
                id="description"
                placeholder="Add project description..."
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                disabled={isFormDisabled}
                className={`transition-all duration-200 ${getFieldClassName('description')}`}
                rows={3}
                maxLength={500}
              />
            </div>
            <div className="flex justify-between items-center">
              {errors.description && (
                <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-md animate-in slide-in-from-top-1 duration-200">
                  <AlertCircle className="size-3 text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-600">{errors.description}</p>
                </div>
              )}
              <div className="ml-auto flex items-center gap-2">
                <span className={`text-xs transition-colors duration-200 ${
                  formData.description.length > 450 ? 'text-orange-600' : 
                  formData.description.length > 400 ? 'text-yellow-600' : 'text-gray-500'
                }`}>
                  {formData.description.length}/500 characters
                </span>
                {formData.description.length > 0 && (
                  <div className={`w-16 h-1 rounded-full overflow-hidden bg-gray-200`}>
                    <div 
                      className={`h-full transition-all duration-300 ${
                        formData.description.length > 450 ? 'bg-orange-500' :
                        formData.description.length > 400 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${(formData.description.length / 500) * 100}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label htmlFor="due_date" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              Due Date 
              <span className="text-gray-400 font-normal">(optional)</span>
              {getValidationIcon('due_date')}
            </Label>
            <div className="relative">
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => handleInputChange('due_date', e.target.value)}
                disabled={isFormDisabled}
                className={`transition-all duration-200 pr-10 ${getFieldClassName('due_date')} [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-inner-spin-button]:hidden [&::-webkit-clear-button]:hidden`}
                min={format(new Date(), 'yyyy-MM-dd')}
              />
              <Calendar 
                className="absolute right-3 top-1/2 transform -translate-y-1/2 size-4 text-gray-400 cursor-pointer hover:text-gray-600 transition-colors" 
                onClick={() => (document.getElementById('due_date') as HTMLInputElement)?.showPicker?.()}
              />
            </div>
            {errors.due_date && (
              <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-md animate-in slide-in-from-top-1 duration-200">
                <AlertCircle className="size-3 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-600">{errors.due_date}</p>
              </div>
            )}
            {formData.due_date && validation.due_date.isValid && validation.due_date.isDirty && !errors.due_date && (
              <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-md animate-in slide-in-from-top-1 duration-200">
                <Info className="size-3 text-blue-500 flex-shrink-0" />
                <p className="text-sm text-blue-600">Due date set for {format(new Date(formData.due_date), 'MMMM d, yyyy')}</p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={isFormDisabled}
              className="bg-white/70 backdrop-blur-sm hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isFormDisabled || !isFormValid}
              className={`min-w-[120px] transition-all duration-200 ${
                isFormValid && !isFormDisabled
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl hover:shadow-blue-500/25'
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  {mode === 'create' ? 'Creating...' : 'Saving...'}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <FolderPlus className="size-4" />
                  {mode === 'create' ? 'Create Project' : 'Save Changes'}
                </div>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 