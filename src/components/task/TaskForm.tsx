'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Calendar, X, Plus, Edit, Flag, CheckCircle, AlertCircle, Info } from 'lucide-react'

import { Task, CreateTaskData, UpdateTaskData } from '@/types'
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
  onSubmit: (data: CreateTaskData | UpdateTaskData) => Promise<void>
  task?: Task | null
  projectId: string
  isLoading?: boolean
}

export function TaskForm({ 
  isOpen, 
  onClose, 
  onSubmit, 
  task, 
  projectId,
  isLoading = false 
}: TaskFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    due_date: '',
    priority: 'Medium' as 'High' | 'Medium' | 'Low',
    completed: false
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isEditMode = !!task

  // Reset form when dialog opens/closes or task changes
  useEffect(() => {
    if (isOpen) {
      if (task) {
        // Edit mode - populate with existing task data
        setFormData({
          name: task.name,
          due_date: task.due_date ? format(new Date(task.due_date), 'yyyy-MM-dd') : '',
          priority: task.priority,
          completed: task.completed
        })
      } else {
        // Create mode - reset to defaults
        setFormData({
          name: '',
          due_date: '',
          priority: 'Medium',
          completed: false
        })
      }
      setErrors({})
    }
  }, [isOpen, task])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Task name is required'
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Task name must be at least 2 characters'
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'Task name must be less than 100 characters'
    }

    // Due date validation
    if (formData.due_date) {
      const dueDate = new Date(formData.due_date)
      const today = new Date()
      today.setHours(0, 0, 0, 0) // Reset time for accurate comparison
      
      if (isNaN(dueDate.getTime())) {
        newErrors.due_date = 'Please enter a valid date'
      } else if (dueDate < today) {
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
      const submitData = {
        name: formData.name.trim(),
        due_date: formData.due_date || null,
        priority: formData.priority,
        ...(isEditMode && { completed: formData.completed })
      }

      if (isEditMode && task) {
        await onSubmit({
          ...submitData,
          id: task.id
        } as UpdateTaskData)
      } else {
        await onSubmit({
          ...submitData,
          project_id: projectId
        } as CreateTaskData)
      }

      onClose()
    } catch (error) {
      console.error('Form submission error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }
  }

  const getPriorityColor = (priority: 'High' | 'Medium' | 'Low') => {
    switch (priority) {
      case 'High':
        return 'text-red-600'
      case 'Medium':
        return 'text-yellow-600'
      case 'Low':
        return 'text-green-600'
      default:
        return 'text-gray-600'
    }
  }

  const getPriorityIcon = (priority: 'High' | 'Medium' | 'Low') => {
    switch (priority) {
      case 'High':
        return <Flag className="size-4 fill-current" />
      case 'Medium':
        return <Flag className="size-4" />
      case 'Low':
        return <Flag className="size-4 opacity-60" />
      default:
        return <Flag className="size-4" />
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEditMode ? (
              <>
                <Edit className="size-5" />
                Edit Task
              </>
            ) : (
              <>
                <Plus className="size-5" />
                Create New Task
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isEditMode 
              ? 'Update the task details below. All fields are optional except task name.'
              : 'Fill in the task details below. Only task name is required.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Task Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Task Name *
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="Enter task name..."
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={errors.name ? 'border-red-500 focus:border-red-500' : ''}
              disabled={isLoading || isSubmitting}
              maxLength={100}
            />
            {errors.name && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="size-4" />
                {errors.name}
              </p>
            )}
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label htmlFor="priority" className="text-sm font-medium">
              Priority
            </Label>
            <Select
              value={formData.priority}
              onValueChange={(value: 'High' | 'Medium' | 'Low') => handleInputChange('priority', value)}
              disabled={isLoading || isSubmitting}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select priority level">
                  <div className="flex items-center gap-2">
                    <span className={getPriorityColor(formData.priority)}>
                      {getPriorityIcon(formData.priority)}
                    </span>
                    <span>{formData.priority}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="High">
                  <div className="flex items-center gap-2">
                    <span className="text-red-600">
                      <Flag className="size-4 fill-current" />
                    </span>
                    <span>High Priority</span>
                  </div>
                </SelectItem>
                <SelectItem value="Medium">
                  <div className="flex items-center gap-2">
                    <span className="text-yellow-600">
                      <Flag className="size-4" />
                    </span>
                    <span>Medium Priority</span>
                  </div>
                </SelectItem>
                <SelectItem value="Low">
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">
                      <Flag className="size-4 opacity-60" />
                    </span>
                    <span>Low Priority</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label htmlFor="due_date" className="text-sm font-medium">
              Due Date (Optional)
            </Label>
            <Input
              id="due_date"
              type="date"
              value={formData.due_date}
              onChange={(e) => handleInputChange('due_date', e.target.value)}
              className={errors.due_date ? 'border-red-500 focus:border-red-500' : ''}
              disabled={isLoading || isSubmitting}
              min={format(new Date(), 'yyyy-MM-dd')}
            />
            {errors.due_date && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="size-4" />
                {errors.due_date}
              </p>
            )}
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <Info className="size-3" />
              Leave empty if no due date is needed
            </p>
          </div>

          {/* Completion Status (Edit Mode Only) */}
          {isEditMode && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Completion Status
              </Label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="completed"
                    checked={!formData.completed}
                    onChange={() => handleInputChange('completed', false)}
                    disabled={isLoading || isSubmitting}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm text-gray-600">In Progress</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="completed"
                    checked={formData.completed}
                    onChange={() => handleInputChange('completed', true)}
                    disabled={isLoading || isSubmitting}
                    className="w-4 h-4 text-green-600"
                  />
                  <span className="text-sm text-green-600 flex items-center gap-1">
                    <CheckCircle className="size-4" />
                    Completed
                  </span>
                </label>
              </div>
            </div>
          )}

          <DialogFooter className="flex gap-2 pt-4">
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
              disabled={isLoading || isSubmitting}
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
                      Update Task
                    </>
                  ) : (
                    <>
                      <Plus className="size-4 mr-2" />
                      Create Task
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