'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Calendar, Target, AlertCircle, Clock, CheckCircle2, CheckCircle, Info } from 'lucide-react'

import { Task } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'

interface TaskFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (taskData: Omit<Task, 'created_at' | 'updated_at'> | Omit<Task, 'id' | 'created_at' | 'updated_at'>) => Promise<void>
  task?: Task | null
  projectId: string
  isLoading?: boolean
}

interface FormData {
  name: string
  due_date: string
  priority: 'High' | 'Medium' | 'Low'
  completed: boolean
}

interface FormErrors {
  name?: string
  due_date?: string
  priority?: string
}

interface FieldValidation {
  isValid: boolean
  isDirty: boolean
}

interface FormValidation {
  name: FieldValidation
  due_date: FieldValidation
  priority: FieldValidation
}

export function TaskForm({ 
  isOpen, 
  onClose, 
  onSubmit, 
  task,
  projectId,
  isLoading = false
}: TaskFormProps) {
  const [formData, setFormData] = useState<FormData>({
    name: task?.name || '',
    due_date: task?.due_date ? format(new Date(task.due_date), 'yyyy-MM-dd') : '',
    priority: task?.priority || 'Medium',
    completed: task?.completed || false
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [validation, setValidation] = useState<FormValidation>({
    name: { isValid: false, isDirty: false },
    due_date: { isValid: true, isDirty: false },
    priority: { isValid: true, isDirty: false }
  })

  // Update form data when task changes (for edit mode)
  useEffect(() => {
    if (task) {
      const newFormData = {
        name: task.name || '',
        due_date: task.due_date ? format(new Date(task.due_date), 'yyyy-MM-dd') : '',
        priority: task.priority || 'Medium',
        completed: task.completed || false
      }
      setFormData(newFormData)
      
      // Validate initial data (only the fields that need validation)
      validateField('name', newFormData.name, false)
      validateField('due_date', newFormData.due_date, false)
      validateField('priority', newFormData.priority, false)
    } else {
      // Reset form for create mode
      const emptyFormData = {
        name: '',
        due_date: '',
        priority: 'Medium' as const,
        completed: false
      }
      setFormData(emptyFormData)
      setValidation({
        name: { isValid: false, isDirty: false },
        due_date: { isValid: true, isDirty: false },
        priority: { isValid: true, isDirty: false }
      })
    }
    // Clear any existing errors when switching modes/data
    setErrors({})
  }, [task])

  const validateField = (field: 'name' | 'due_date' | 'priority', value: string, isDirty: boolean = true) => {
    let isValid = true
    let error: string | undefined

    switch (field) {
      case 'name':
        if (!value.trim()) {
          isValid = false
          error = isDirty ? 'Task name is required' : undefined
        } else if (value.trim().length < 2) {
          isValid = false
          error = 'Task name must be at least 2 characters'
        } else if (value.trim().length > 100) {
          isValid = false
          error = 'Task name must be less than 100 characters'
        } else if (!/^[a-zA-Z0-9\s\-_.,!?()]+$/.test(value.trim())) {
          isValid = false
          error = 'Task name contains invalid characters'
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

      case 'priority':
        if (!['High', 'Medium', 'Low'].includes(value)) {
          isValid = false
          error = 'Please select a valid priority level'
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
    const dueDateValid = validateField('due_date', formData.due_date)
    const priorityValid = validateField('priority', formData.priority)

    return nameValid && dueDateValid && priorityValid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const taskData = {
        project_id: projectId,
        name: formData.name.trim(),
        due_date: formData.due_date || null,
        priority: formData.priority,
        completed: formData.completed,
        // Include the task ID when editing
        ...(task && { id: task.id })
      }

      await onSubmit(taskData)
      handleClose()
    } catch (error) {
      console.error('Error submitting task:', error)
      // Error handling will be managed by the parent component
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting && !isLoading) {
      setFormData({
        name: '',
        due_date: '',
        priority: 'Medium',
        completed: false
      })
      setErrors({})
      setValidation({
        name: { isValid: false, isDirty: false },
        due_date: { isValid: true, isDirty: false },
        priority: { isValid: true, isDirty: false }
      })
      onClose()
    }
  }

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Real-time validation with debounce (only for fields that need validation)
    if (field !== 'completed') {
      setTimeout(() => {
        validateField(field as 'name' | 'due_date' | 'priority', value as string)
      }, 300)
    }
  }

  const getFieldClassName = (field: 'name' | 'due_date' | 'priority') => {
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

  const getValidationIcon = (field: 'name' | 'due_date' | 'priority') => {
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

  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'High':
        return {
          color: 'from-red-500 to-red-600',
          bgColor: 'bg-red-50 border-red-200',
          textColor: 'text-red-700',
          icon: AlertCircle
        }
      case 'Medium':
        return {
          color: 'from-yellow-500 to-yellow-600',
          bgColor: 'bg-yellow-50 border-yellow-200',
          textColor: 'text-yellow-700',
          icon: Clock
        }
      case 'Low':
        return {
          color: 'from-green-500 to-green-600',
          bgColor: 'bg-green-50 border-green-200',
          textColor: 'text-green-700',
          icon: CheckCircle2
        }
      default:
        return {
          color: 'from-gray-500 to-gray-600',
          bgColor: 'bg-gray-50 border-gray-200',
          textColor: 'text-gray-700',
          icon: Target
        }
    }
  }

  const priorityConfig = getPriorityConfig(formData.priority)
  const PriorityIcon = priorityConfig.icon

  const isFormValid = validation.name.isValid && validation.due_date.isValid && validation.priority.isValid
  const isFormDisabled = isSubmitting || isLoading

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] bg-white/95 backdrop-blur-xl border-gray-200/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
              <Target className="size-5 text-white" />
            </div>
            <div>
              <span className="bg-gradient-to-r from-gray-900 to-blue-800 bg-clip-text text-transparent font-bold">
                {task ? 'Edit Task' : 'Create New Task'}
              </span>
            </div>
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            {task 
              ? 'Update your task information and settings.'
              : 'Add a new task to track your progress and stay organized.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Task Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              Task Name 
              <span className="text-red-500">*</span>
              {getValidationIcon('name')}
            </Label>
            <div className="relative">
              <Input
                id="name"
                type="text"
                placeholder="Enter task name..."
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
                <p className="text-sm text-green-600">Great! Task name looks perfect.</p>
              </div>
            )}
          </div>

          {/* Priority Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              Priority Level
              {getValidationIcon('priority')}
            </Label>
            <Select 
              value={formData.priority} 
              onValueChange={(value) => handleInputChange('priority', value)}
              disabled={isFormDisabled}
            >
              <SelectTrigger className={`transition-all duration-200 ${getFieldClassName('priority')}`}>
                <div className="flex items-center gap-2">
                  <PriorityIcon className="size-4" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="High">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="size-4 text-red-500" />
                    <span className="font-medium">High Priority</span>
                    <span className="text-xs text-gray-500 ml-2">Urgent & Important</span>
                  </div>
                </SelectItem>
                <SelectItem value="Medium">
                  <div className="flex items-center gap-2">
                    <Clock className="size-4 text-yellow-500" />
                    <span className="font-medium">Medium Priority</span>
                    <span className="text-xs text-gray-500 ml-2">Moderate importance</span>
                  </div>
                </SelectItem>
                <SelectItem value="Low">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-green-500" />
                    <span className="font-medium">Low Priority</span>
                    <span className="text-xs text-gray-500 ml-2">Can wait if needed</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            
            {/* Priority Visual Indicator */}
            <div className={`p-3 rounded-lg border-2 transition-all duration-300 ${priorityConfig.bgColor}`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-gradient-to-r ${priorityConfig.color}`}>
                  <PriorityIcon className="size-4 text-white" />
                </div>
                <div>
                  <p className={`text-sm font-semibold ${priorityConfig.textColor}`}>
                    {formData.priority} Priority Task
                  </p>
                  <p className="text-xs text-gray-600">
                    {formData.priority === 'High' && 'This task requires immediate attention'}
                    {formData.priority === 'Medium' && 'This task has moderate importance'}
                    {formData.priority === 'Low' && 'This task can be completed when time allows'}
                  </p>
                </div>
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

          {/* Completion Status (for edit mode) */}
          {task && (
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">
                Task Status
              </Label>
              <div className="flex items-center gap-3 p-3 rounded-lg border-2 border-gray-200 bg-gray-50/50">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleInputChange('completed', !formData.completed)}
                  disabled={isFormDisabled}
                  className="size-8 p-0 hover:bg-white transition-all duration-200"
                >
                  {formData.completed ? (
                    <CheckCircle2 className="size-5 text-green-600" />
                  ) : (
                    <Target className="size-5 text-gray-400" />
                  )}
                </Button>
                <div>
                  <p className={`text-sm font-semibold ${formData.completed ? 'text-green-700' : 'text-gray-700'}`}>
                    {formData.completed ? 'Task Completed' : 'Task In Progress'}
                  </p>
                  <p className="text-xs text-gray-600">
                    {formData.completed ? 'This task has been marked as complete' : 'This task is still in progress'}
                  </p>
                </div>
              </div>
            </div>
          )}

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
                  {task ? 'Saving...' : 'Creating...'}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Target className="size-4" />
                  {task ? 'Save Changes' : 'Create Task'}
                </div>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default TaskForm 