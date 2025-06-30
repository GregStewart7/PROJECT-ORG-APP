// TypeScript type definitions for the Project Management App
// This file contains interfaces for User, Project, Task, and Note entities

export interface User {
  id: string
  email: string
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  user_id: string
  name: string
  description: string | null
  due_date: string | null
  created_at: string
  updated_at: string
}

export interface Task {
  id: string
  project_id: string
  name: string
  due_date: string | null
  priority: 'High' | 'Medium' | 'Low'
  completed: boolean
  created_at: string
  updated_at: string
}

export interface Note {
  id: string
  task_id: string
  title: string
  content: string
  created_at: string
  updated_at: string
}

// Form interfaces for creating/editing entities
export interface CreateProjectData {
  name: string
  description?: string | null
  due_date?: string | null
}

export interface UpdateProjectData extends Partial<CreateProjectData> {
  id: string
}

export interface CreateTaskData {
  project_id: string
  name: string
  due_date?: string | null
  priority?: 'High' | 'Medium' | 'Low'
}

export interface UpdateTaskData extends Partial<CreateTaskData> {
  id: string
  completed?: boolean
}

export interface CreateNoteData {
  task_id: string
  title: string
  content: string
}

export interface UpdateNoteData extends Partial<CreateNoteData> {
  id: string
}

// UI State interfaces
export interface ProjectWithTasks extends Project {
  tasks: Task[]
}

export interface TaskWithNotes extends Task {
  notes: Note[]
}

export interface ProjectWithTasksAndNotes extends Project {
  tasks: TaskWithNotes[]
}

// API Response interfaces
export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  success: boolean
}

// Database query filters
export interface ProjectFilters {
  user_id?: string
  due_date_before?: string
  due_date_after?: string
}

export interface TaskFilters {
  project_id?: string
  priority?: 'High' | 'Medium' | 'Low'
  completed?: boolean
  due_date_before?: string
  due_date_after?: string
}

export interface NoteFilters {
  task_id?: string
  content_contains?: string
  created_before?: string
  created_after?: string
}

// Export utility types
export interface ExportData {
  projects: ProjectWithTasksAndNotes[]
  exported_at: string
  user_email: string
}

export {}; // Make this an ES module 