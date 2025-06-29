'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Calendar, Target, X, Check, AlertCircle, Clock, CheckCircle2, Sparkles } from 'lucide-react'

import { Task } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
  onSubmit: (taskData: Omit<Task, 'id' | 'created_at' | 'updated_at'>) => Promise<void>
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

  // Update form data when task changes (for edit mode)
  useEffect(() => {
    if (task) {
      setFormData({
        name: task.name || '',
        due_date: task.due_date ? format(new Date(task.due_date), 'yyyy-MM-dd') : '',
        priority: task.priority || 'Medium',
        completed: task.completed || false
      })
    } else {
      // Reset form for create mode
      setFormData({
        name: '',
        due_date: '',
        priority: 'Medium',
        completed: false
      })
    }
    // Clear any existing errors when switching modes/data
    setErrors({})
  }, [task])

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Task name is required'
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Task name must be at least 2 characters'
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'Task name must be less than 100 characters'
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
      const taskData = {
        project_id: projectId,
        name: formData.name.trim(),
        due_date: formData.due_date || null,
        priority: formData.priority,
        completed: formData.completed
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
      onClose()
    }
  }

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (field in errors) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
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

  const isFormDisabled = isSubmitting || isLoading

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] bg-gradient-to-br from-white to-blue-50/30 border-blue-200/30 shadow-2xl backdrop-blur-sm">
        {/* Background gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/20 to-purple-50/10 rounded-lg pointer-events-none" />
        
        {/* Decorative elements */}
        <div className="absolute top-4 right-4 w-20 h-20 bg-gradient-to-br from-blue-400/10 to-purple-400/5 rounded-full blur-2xl" />
        
        <div className="relative z-10">
          <DialogHeader className="pb-6">
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-purple-700 bg-clip-text text-transparent flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                <Target className="size-6 text-white" />
              </div>
              {task ? 'Edit Task' : 'Create New Task'}
            </DialogTitle>
            <DialogDescription className="text-gray-600 text-base">
              {task 
                ? 'Update your task information and settings.'
                : 'Add a new task to organize your project work.'
              }
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Task Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-semibold text-gray-700">
                Task Name <span className="text-red-500">*</span>
              </Label>
              <div className="relative group">
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter task name..."
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  disabled={isFormDisabled}
                  className={`h-12 bg-white/70 backdrop-blur-sm border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 ${
                    errors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''
                  }`}
                  maxLength={100}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <div className={`w-2 h-2 rounded-full transition-all duration-200 ${formData.name.trim().length >= 2 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                </div>
              </div>
              {errors.name && (
                <p className="text-sm text-red-600 flex items-center gap-1 animate-in slide-in-from-top-1 duration-200">
                  <X className="size-3" />
                  {errors.name}
                </p>
              )}
            </div>

            {/* Priority Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">
                Priority Level
              </Label>
              <div className="grid grid-cols-3 gap-3">
                {['High', 'Medium', 'Low'].map((priority) => {
                  const config = getPriorityConfig(priority)
                  const Icon = config.icon
                  const isSelected = formData.priority === priority
                  
                  return (
                    <button
                      key={priority}
                      type="button"
                      onClick={() => handleInputChange('priority', priority as 'High' | 'Medium' | 'Low')}
                      disabled={isFormDisabled}
                      className={`
                        p-4 rounded-xl border-2 transition-all duration-300 hover:scale-105 relative overflow-hidden group
                        ${isSelected 
                          ? `${config.bgColor} border-current ${config.textColor} shadow-lg` 
                          : 'bg-white/70 border-gray-200 text-gray-600 hover:bg-gray-50'
                        }
                      `}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <div className={`p-2 rounded-lg transition-all duration-300 ${
                          isSelected 
                            ? `bg-gradient-to-r ${config.color} text-white shadow-md` 
                            : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'
                        }`}>
                          <Icon className="size-4" />
                        </div>
                        <span className="text-sm font-medium">{priority}</span>
                      </div>
                      {isSelected && (
                        <div className="absolute top-2 right-2">
                          <div className="p-1 bg-white/20 rounded-full">
                            <Check className="size-3 text-current" />
                          </div>
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Due Date */}
            <div className="space-y-2">
              <Label htmlFor="due_date" className="text-sm font-semibold text-gray-700">
                Due Date
              </Label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Calendar className="size-5 text-gray-400 group-focus-within:text-blue-600 transition-colors duration-200" />
                </div>
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => handleInputChange('due_date', e.target.value)}
                  disabled={isFormDisabled}
                  className={`h-12 pl-10 bg-white/70 backdrop-blur-sm border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 ${
                    errors.due_date ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''
                  }`}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <div className={`w-2 h-2 rounded-full transition-all duration-200 ${formData.due_date ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                </div>
              </div>
              {errors.due_date && (
                <p className="text-sm text-red-600 flex items-center gap-1 animate-in slide-in-from-top-1 duration-200">
                  <X className="size-3" />
                  {errors.due_date}
                </p>
              )}
            </div>

            {/* Completion Status (for edit mode) */}
            {task && (
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">
                  Task Status
                </Label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => handleInputChange('completed', false)}
                    disabled={isFormDisabled}
                    className={`
                      flex-1 p-4 rounded-xl border-2 transition-all duration-300 hover:scale-105 relative
                      ${!formData.completed 
                        ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-lg' 
                        : 'bg-white/70 border-gray-200 text-gray-600 hover:bg-gray-50'
                      }
                    `}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Clock className="size-5" />
                      <span className="font-medium">In Progress</span>
                    </div>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => handleInputChange('completed', true)}
                    disabled={isFormDisabled}
                    className={`
                      flex-1 p-4 rounded-xl border-2 transition-all duration-300 hover:scale-105 relative
                      ${formData.completed 
                        ? 'bg-green-50 border-green-200 text-green-700 shadow-lg' 
                        : 'bg-white/70 border-gray-200 text-gray-600 hover:bg-gray-50'
                      }
                    `}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <CheckCircle2 className="size-5" />
                      <span className="font-medium">Completed</span>
                    </div>
                  </button>
                </div>
              </div>
            )}

            <DialogFooter className="gap-3 pt-6">
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
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    {task ? 'Updating...' : 'Creating...'}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Sparkles className="size-4" />
                    {task ? 'Update Task' : 'Create Task'}
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

export default TaskForm 