import { createClientComponentClient } from './supabase'
import { 
  Project, 
  CreateProjectData, 
  UpdateProjectData, 
  ProjectFilters,
  Task,
  CreateTaskData,
  UpdateTaskData,
  TaskFilters,
  Note,
  CreateNoteData,
  UpdateNoteData,
  NoteFilters,
  ApiResponse 
} from '@/types'

/**
 * Create a new project for the authenticated user
 */
export async function createProject(projectData: CreateProjectData): Promise<ApiResponse<Project>> {
  try {
    const supabase = createClientComponentClient()
    
    // Get current user to associate project
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return {
        success: false,
        error: 'User not authenticated'
      }
    }

    // Validate required fields
    if (!projectData.name || projectData.name.trim() === '') {
      return {
        success: false,
        error: 'Project name is required'
      }
    }

    // Prepare project data
    const newProject = {
      user_id: user.id,
      name: projectData.name.trim(),
      description: projectData.description?.trim() || null,
      due_date: projectData.due_date || null,
    }

    // Insert project into database
    const { data, error } = await supabase
      .from('projects')
      .insert([newProject])
      .select()
      .single()

    if (error) {
      console.error('Database error creating project:', error)
      return {
        success: false,
        error: error.message
      }
    }

    return {
      success: true,
      data: data as Project
    }
  } catch (error) {
    console.error('Unexpected error creating project:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }
  }
}

/**
 * Get a single project by ID (with user ownership validation)
 */
export async function getProject(projectId: string): Promise<ApiResponse<Project>> {
  try {
    const supabase = createClientComponentClient()
    
    // Get current user for ownership validation
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return {
        success: false,
        error: 'User not authenticated'
      }
    }

    if (!projectId) {
      return {
        success: false,
        error: 'Project ID is required'
      }
    }

    // Fetch project with ownership validation via RLS
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', user.id) // Explicit ownership check
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return {
          success: false,
          error: 'Project not found'
        }
      }
      console.error('Database error fetching project:', error)
      return {
        success: false,
        error: error.message
      }
    }

    return {
      success: true,
      data: data as Project
    }
  } catch (error) {
    console.error('Unexpected error fetching project:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }
  }
}

/**
 * Get all projects for the authenticated user with optional filtering
 */
export async function getProjects(filters?: ProjectFilters): Promise<ApiResponse<Project[]>> {
  try {
    const supabase = createClientComponentClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return {
        success: false,
        error: 'User not authenticated'
      }
    }

    // Build query with user filter
    let query = supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }) // Most recent first

    // Apply optional filters
    if (filters) {
      if (filters.due_date_before) {
        query = query.lte('due_date', filters.due_date_before)
      }
      if (filters.due_date_after) {
        query = query.gte('due_date', filters.due_date_after)
      }
    }

    const { data, error } = await query

    if (error) {
      console.error('Database error fetching projects:', error)
      return {
        success: false,
        error: error.message
      }
    }

    return {
      success: true,
      data: (data || []) as Project[]
    }
  } catch (error) {
    console.error('Unexpected error fetching projects:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }
  }
}

/**
 * Update an existing project
 */
export async function updateProject(updateData: UpdateProjectData): Promise<ApiResponse<Project>> {
  try {
    const supabase = createClientComponentClient()
    
    // Get current user for ownership validation
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return {
        success: false,
        error: 'User not authenticated'
      }
    }

    if (!updateData.id) {
      return {
        success: false,
        error: 'Project ID is required'
      }
    }

    // Validate name if provided
    if (updateData.name !== undefined && updateData.name.trim() === '') {
      return {
        success: false,
        error: 'Project name cannot be empty'
      }
    }

    // Prepare update data (exclude id)
    const { id, ...projectUpdates } = updateData
    
    // Clean up the update data
    const cleanUpdates: Partial<{
      name: string
      description: string | null
      due_date: string | null
      updated_at: string
    }> = {}
    
    if (projectUpdates.name !== undefined) {
      cleanUpdates.name = projectUpdates.name.trim()
    }
    if (projectUpdates.description !== undefined) {
      cleanUpdates.description = projectUpdates.description?.trim() || null
    }
    if (projectUpdates.due_date !== undefined) {
      cleanUpdates.due_date = projectUpdates.due_date
    }

    // Add updated_at timestamp
    cleanUpdates.updated_at = new Date().toISOString()

    // Update project with ownership validation
    const { data, error } = await supabase
      .from('projects')
      .update(cleanUpdates)
      .eq('id', id)
      .eq('user_id', user.id) // Ensure user owns the project
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return {
          success: false,
          error: 'Project not found or access denied'
        }
      }
      console.error('Database error updating project:', error)
      return {
        success: false,
        error: error.message
      }
    }

    return {
      success: true,
      data: data as Project
    }
  } catch (error) {
    console.error('Unexpected error updating project:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }
  }
}

/**
 * Delete a project (and all associated tasks and notes via cascade)
 */
export async function deleteProject(projectId: string): Promise<ApiResponse<null>> {
  try {
    const supabase = createClientComponentClient()
    
    // Get current user for ownership validation
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return {
        success: false,
        error: 'User not authenticated'
      }
    }

    if (!projectId) {
      return {
        success: false,
        error: 'Project ID is required'
      }
    }

    // Delete project with ownership validation
    // Note: Related tasks and notes will be deleted automatically due to foreign key constraints
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)
      .eq('user_id', user.id) // Ensure user owns the project

    if (error) {
      console.error('Database error deleting project:', error)
      return {
        success: false,
        error: error.message
      }
    }

    return {
      success: true,
      data: null
    }
  } catch (error) {
    console.error('Unexpected error deleting project:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }
  }
}

/**
 * Get project count for the authenticated user
 */
export async function getProjectCount(): Promise<ApiResponse<number>> {
  try {
    const supabase = createClientComponentClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return {
        success: false,
        error: 'User not authenticated'
      }
    }

    // Get count of user's projects
    const { count, error } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if (error) {
      console.error('Database error counting projects:', error)
      return {
        success: false,
        error: error.message
      }
    }

    return {
      success: true,
      data: count || 0
    }
  } catch (error) {
    console.error('Unexpected error counting projects:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }
  }
}

/**
 * Check if a project exists and user has access to it
 */
export async function projectExists(projectId: string): Promise<ApiResponse<boolean>> {
  try {
    const supabase = createClientComponentClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return {
        success: false,
        error: 'User not authenticated'
      }
    }

    if (!projectId) {
      return {
        success: false,
        error: 'Project ID is required'
      }
    }

    // Check if project exists for this user
    const { data, error } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // Project not found
        return {
          success: true,
          data: false
        }
      }
      console.error('Database error checking project existence:', error)
      return {
        success: false,
        error: error.message
      }
    }

    return {
      success: true,
      data: !!data
    }
  } catch (error) {
    console.error('Unexpected error checking project existence:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }
  }
}

/**
 * Get projects with upcoming due dates (within specified days)
 */
export async function getUpcomingProjects(daysAhead: number = 7): Promise<ApiResponse<Project[]>> {
  try {
    const supabase = createClientComponentClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return {
        success: false,
        error: 'User not authenticated'
      }
    }

    // Calculate date range
    const today = new Date()
    const futureDate = new Date()
    futureDate.setDate(today.getDate() + daysAhead)

    const todayStr = today.toISOString().split('T')[0]
    const futureDateStr = futureDate.toISOString().split('T')[0]

    // Get projects with due dates in the range
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .gte('due_date', todayStr)
      .lte('due_date', futureDateStr)
      .order('due_date', { ascending: true })

    if (error) {
      console.error('Database error fetching upcoming projects:', error)
      return {
        success: false,
        error: error.message
      }
    }

    return {
      success: true,
      data: (data || []) as Project[]
    }
  } catch (error) {
    console.error('Unexpected error fetching upcoming projects:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }
  }
}

// ============================================================================
// TASK DATABASE FUNCTIONS
// ============================================================================

/**
 * Create a new task for a project
 */
export async function createTask(taskData: CreateTaskData): Promise<ApiResponse<Task>> {
  try {
    const supabase = createClientComponentClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return {
        success: false,
        error: 'User not authenticated'
      }
    }

    // Validate required fields
    if (!taskData.name || taskData.name.trim() === '') {
      return {
        success: false,
        error: 'Task name is required'
      }
    }

    if (!taskData.project_id) {
      return {
        success: false,
        error: 'Project ID is required'
      }
    }

    // Verify project exists and user owns it
    const projectCheck = await projectExists(taskData.project_id)
    if (!projectCheck.success || !projectCheck.data) {
      return {
        success: false,
        error: 'Project not found or access denied'
      }
    }

    // Prepare task data
    const newTask = {
      project_id: taskData.project_id,
      name: taskData.name.trim(),
      due_date: taskData.due_date || null,
      priority: taskData.priority || 'Medium',
      completed: false, // New tasks start as incomplete
    }

    // Insert task into database
    const { data, error } = await supabase
      .from('tasks')
      .insert([newTask])
      .select()
      .single()

    if (error) {
      console.error('Database error creating task:', error)
      return {
        success: false,
        error: error.message
      }
    }

    return {
      success: true,
      data: data as Task
    }
  } catch (error) {
    console.error('Unexpected error creating task:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }
  }
}

/**
 * Get a single task by ID (with user ownership validation)
 */
export async function getTask(taskId: string): Promise<ApiResponse<Task>> {
  try {
    const supabase = createClientComponentClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return {
        success: false,
        error: 'User not authenticated'
      }
    }

    if (!taskId) {
      return {
        success: false,
        error: 'Task ID is required'
      }
    }

    // Fetch task with ownership validation through projects table
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        projects!inner(user_id)
      `)
      .eq('id', taskId)
      .eq('projects.user_id', user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return {
          success: false,
          error: 'Task not found'
        }
      }
      console.error('Database error fetching task:', error)
      return {
        success: false,
        error: error.message
      }
    }

    // Remove the projects relation data from response
    const { projects: _, ...taskData } = data as Record<string, any>
    
    return {
      success: true,
      data: taskData as Task
    }
  } catch (error) {
    console.error('Unexpected error fetching task:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }
  }
}

/**
 * Get all tasks for the authenticated user with optional filtering
 */
export async function getTasks(filters?: TaskFilters): Promise<ApiResponse<Task[]>> {
  try {
    const supabase = createClientComponentClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return {
        success: false,
        error: 'User not authenticated'
      }
    }

    // Build query with user ownership validation through projects
    let query = supabase
      .from('tasks')
      .select(`
        *,
        projects!inner(user_id)
      `)
      .eq('projects.user_id', user.id)
      .order('created_at', { ascending: false })

    // Apply optional filters
    if (filters) {
      if (filters.project_id) {
        query = query.eq('project_id', filters.project_id)
      }
      if (filters.priority) {
        query = query.eq('priority', filters.priority)
      }
      if (filters.completed !== undefined) {
        query = query.eq('completed', filters.completed)
      }
      if (filters.due_date_before) {
        query = query.lte('due_date', filters.due_date_before)
      }
      if (filters.due_date_after) {
        query = query.gte('due_date', filters.due_date_after)
      }
    }

    const { data, error } = await query

    if (error) {
      console.error('Database error fetching tasks:', error)
      return {
        success: false,
        error: error.message
      }
    }

    // Remove the projects relation data from response
    const tasks = (data || []).map((item: Record<string, any>) => {
      const { projects: _, ...taskData } = item
      return taskData as Task
    })

    return {
      success: true,
      data: tasks
    }
  } catch (error) {
    console.error('Unexpected error fetching tasks:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }
  }
}

/**
 * Get all tasks for a specific project
 */
export async function getTasksByProject(projectId: string): Promise<ApiResponse<Task[]>> {
  try {
    const supabase = createClientComponentClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return {
        success: false,
        error: 'User not authenticated'
      }
    }

    if (!projectId) {
      return {
        success: false,
        error: 'Project ID is required'
      }
    }

    // Verify project ownership first
    const projectCheck = await projectExists(projectId)
    if (!projectCheck.success || !projectCheck.data) {
      return {
        success: false,
        error: 'Project not found or access denied'
      }
    }

    // Get tasks for the project
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error fetching project tasks:', error)
      return {
        success: false,
        error: error.message
      }
    }

    return {
      success: true,
      data: (data || []) as Task[]
    }
  } catch (error) {
    console.error('Unexpected error fetching project tasks:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }
  }
}

/**
 * Update an existing task
 */
export async function updateTask(updateData: UpdateTaskData): Promise<ApiResponse<Task>> {
  try {
    const supabase = createClientComponentClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return {
        success: false,
        error: 'User not authenticated'
      }
    }

    if (!updateData.id) {
      return {
        success: false,
        error: 'Task ID is required'
      }
    }

    // Validate name if provided
    if (updateData.name !== undefined && updateData.name.trim() === '') {
      return {
        success: false,
        error: 'Task name cannot be empty'
      }
    }

    // First verify the task exists and user has access to it
    const taskCheck = await taskExists(updateData.id)
    if (!taskCheck.success || !taskCheck.data) {
      return {
        success: false,
        error: 'Task not found or access denied'
      }
    }

    // Prepare update data (exclude id)
    const { id, ...taskUpdates } = updateData
    
    // Clean up the update data
    const cleanUpdates: Partial<{
      name: string
      due_date: string | null
      priority: 'High' | 'Medium' | 'Low'
      completed: boolean
      project_id: string
      updated_at: string
    }> = {}
    
    if (taskUpdates.name !== undefined) {
      cleanUpdates.name = taskUpdates.name.trim()
    }
    if (taskUpdates.due_date !== undefined) {
      cleanUpdates.due_date = taskUpdates.due_date
    }
    if (taskUpdates.priority !== undefined) {
      cleanUpdates.priority = taskUpdates.priority
    }
    if (taskUpdates.completed !== undefined) {
      cleanUpdates.completed = taskUpdates.completed
    }
    if (taskUpdates.project_id !== undefined) {
      // If project_id is being changed, verify the new project exists and user owns it
      const projectCheck = await projectExists(taskUpdates.project_id)
      if (!projectCheck.success || !projectCheck.data) {
        return {
          success: false,
          error: 'Target project not found or access denied'
        }
      }
      cleanUpdates.project_id = taskUpdates.project_id
    }

    // Add updated_at timestamp
    cleanUpdates.updated_at = new Date().toISOString()

    // Update task
    const { data, error } = await supabase
      .from('tasks')
      .update(cleanUpdates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Database error updating task:', error)
      return {
        success: false,
        error: error.message
      }
    }

    return {
      success: true,
      data: data as Task
    }
  } catch (error) {
    console.error('Unexpected error updating task:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }
  }
}

/**
 * Delete a task (and all associated notes via cascade)
 */
export async function deleteTask(taskId: string): Promise<ApiResponse<null>> {
  try {
    const supabase = createClientComponentClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return {
        success: false,
        error: 'User not authenticated'
      }
    }

    if (!taskId) {
      return {
        success: false,
        error: 'Task ID is required'
      }
    }

    // Verify task exists and user has access to it
    const taskCheck = await taskExists(taskId)
    if (!taskCheck.success || !taskCheck.data) {
      return {
        success: false,
        error: 'Task not found or access denied'
      }
    }

    // Delete task
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)

    if (error) {
      console.error('Database error deleting task:', error)
      return {
        success: false,
        error: error.message
      }
    }

    return {
      success: true,
      data: null
    }
  } catch (error) {
    console.error('Unexpected error deleting task:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }
  }
}

/**
 * Get task count for the authenticated user (optionally by project)
 */
export async function getTaskCount(projectId?: string): Promise<ApiResponse<number>> {
  try {
    const supabase = createClientComponentClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return {
        success: false,
        error: 'User not authenticated'
      }
    }

    // Build query with user ownership validation through projects
    let query = supabase
      .from('tasks')
      .select(`
        *,
        projects!inner(user_id)
      `, { count: 'exact', head: true })
      .eq('projects.user_id', user.id)

    // Add project filter if specified
    if (projectId) {
      query = query.eq('project_id', projectId)
    }

    const { count, error } = await query

    if (error) {
      console.error('Database error counting tasks:', error)
      return {
        success: false,
        error: error.message
      }
    }

    return {
      success: true,
      data: count || 0
    }
  } catch (error) {
    console.error('Unexpected error counting tasks:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }
  }
}

/**
 * Check if a task exists and user has access to it
 */
export async function taskExists(taskId: string): Promise<ApiResponse<boolean>> {
  try {
    const supabase = createClientComponentClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return {
        success: false,
        error: 'User not authenticated'
      }
    }

    if (!taskId) {
      return {
        success: false,
        error: 'Task ID is required'
      }
    }

    // Check if task exists for this user through project ownership
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        id,
        projects!inner(user_id)
      `)
      .eq('id', taskId)
      .eq('projects.user_id', user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return {
          success: true,
          data: false
        }
      }
      console.error('Database error checking task existence:', error)
      return {
        success: false,
        error: error.message
      }
    }

    return {
      success: true,
      data: !!data
    }
  } catch (error) {
    console.error('Unexpected error checking task existence:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }
  }
}

/**
 * Get tasks with upcoming due dates (within specified days)
 */
export async function getUpcomingTasks(daysAhead: number = 7): Promise<ApiResponse<Task[]>> {
  try {
    const supabase = createClientComponentClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return {
        success: false,
        error: 'User not authenticated'
      }
    }

    // Calculate date range
    const today = new Date()
    const futureDate = new Date()
    futureDate.setDate(today.getDate() + daysAhead)

    const todayStr = today.toISOString().split('T')[0]
    const futureDateStr = futureDate.toISOString().split('T')[0]

    // Get tasks with due dates in the range
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        projects!inner(user_id)
      `)
      .eq('projects.user_id', user.id)
      .gte('due_date', todayStr)
      .lte('due_date', futureDateStr)
      .eq('completed', false) // Only show incomplete tasks
      .order('due_date', { ascending: true })

    if (error) {
      console.error('Database error fetching upcoming tasks:', error)
      return {
        success: false,
        error: error.message
      }
    }

    // Remove the projects relation data from response
    const tasks = (data || []).map((item: Record<string, any>) => {
      const { projects: _, ...taskData } = item
      return taskData as Task
    })

    return {
      success: true,
      data: tasks
    }
  } catch (error) {
    console.error('Unexpected error fetching upcoming tasks:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }
  }
}

/**
 * Get tasks filtered by priority
 */
export async function getTasksByPriority(priority: 'High' | 'Medium' | 'Low'): Promise<ApiResponse<Task[]>> {
  return getTasks({ priority })
}

/**
 * Toggle task completion status
 */
export async function toggleTaskCompletion(taskId: string): Promise<ApiResponse<Task>> {
  try {
    // First get the current task to find its completion status
    const taskResult = await getTask(taskId)
    if (!taskResult.success || !taskResult.data) {
      return {
        success: false,
        error: taskResult.error || 'Task not found'
      }
    }

    // Toggle the completion status
    const newCompletedStatus = !taskResult.data.completed
    
    return updateTask({
      id: taskId,
      completed: newCompletedStatus
    })
  } catch (error) {
    console.error('Unexpected error toggling task completion:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }
  }
}

/**
 * Get completed tasks for the authenticated user
 */
export async function getCompletedTasks(): Promise<ApiResponse<Task[]>> {
  return getTasks({ completed: true })
}

/**
 * Get incomplete tasks for the authenticated user
 */
export async function getIncompleteTasks(): Promise<ApiResponse<Task[]>> {
  return getTasks({ completed: false })
}

// ============================================================================
// NOTE DATABASE FUNCTIONS
// ============================================================================

/**
 * Create a new note for a task
 */
export async function createNote(noteData: CreateNoteData): Promise<ApiResponse<Note>> {
  try {
    const supabase = createClientComponentClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return {
        success: false,
        error: 'User not authenticated'
      }
    }

    // Validate required fields
    if (!noteData.content || noteData.content.trim() === '') {
      return {
        success: false,
        error: 'Note content is required'
      }
    }

    if (!noteData.title || noteData.title.trim() === '') {
      return {
        success: false,
        error: 'Note title is required'
      }
    }

    if (!noteData.task_id) {
      return {
        success: false,
        error: 'Task ID is required'
      }
    }

    // Verify task exists and user owns it (through project ownership)
    const taskCheck = await taskExists(noteData.task_id)
    if (!taskCheck.success || !taskCheck.data) {
      return {
        success: false,
        error: 'Task not found or access denied'
      }
    }

    // Prepare note data
    const newNote = {
      task_id: noteData.task_id,
      title: noteData.title.trim(),
      content: noteData.content.trim(),
    }

    // Insert note into database
    const { data, error } = await supabase
      .from('notes')
      .insert([newNote])
      .select()
      .single()

    if (error) {
      console.error('Database error creating note:', error)
      return {
        success: false,
        error: error.message
      }
    }

    return {
      success: true,
      data: data as Note
    }
  } catch (error) {
    console.error('Unexpected error creating note:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }
  }
}

/**
 * Get a single note by ID (with user ownership validation)
 */
export async function getNote(noteId: string): Promise<ApiResponse<Note>> {
  try {
    const supabase = createClientComponentClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return {
        success: false,
        error: 'User not authenticated'
      }
    }

    if (!noteId) {
      return {
        success: false,
        error: 'Note ID is required'
      }
    }

    // Fetch note with ownership validation through tasks -> projects chain
    const { data, error } = await supabase
      .from('notes')
      .select(`
        *,
        tasks!inner(
          id,
          projects!inner(user_id)
        )
      `)
      .eq('id', noteId)
      .eq('tasks.projects.user_id', user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return {
          success: false,
          error: 'Note not found'
        }
      }
      console.error('Database error fetching note:', error)
      return {
        success: false,
        error: error.message
      }
    }

    // Remove the tasks relation data from response
    const { tasks: _, ...noteData } = data as Record<string, any>
    
    return {
      success: true,
      data: noteData as Note
    }
  } catch (error) {
    console.error('Unexpected error fetching note:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }
  }
}

/**
 * Get all notes for the authenticated user with optional filtering
 */
export async function getNotes(filters?: NoteFilters): Promise<ApiResponse<Note[]>> {
  try {
    const supabase = createClientComponentClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return {
        success: false,
        error: 'User not authenticated'
      }
    }

    // Build query with user ownership validation through tasks -> projects
    let query = supabase
      .from('notes')
      .select(`
        *,
        tasks!inner(
          id,
          projects!inner(user_id)
        )
      `)
      .eq('tasks.projects.user_id', user.id)
      .order('created_at', { ascending: false })

    // Apply optional filters
    if (filters) {
      if (filters.task_id) {
        query = query.eq('task_id', filters.task_id)
      }
      if (filters.content_contains) {
        query = query.ilike('content', `%${filters.content_contains}%`)
      }
      if (filters.created_before) {
        query = query.lte('created_at', filters.created_before)
      }
      if (filters.created_after) {
        query = query.gte('created_at', filters.created_after)
      }
    }

    const { data, error } = await query

    if (error) {
      console.error('Database error fetching notes:', error)
      return {
        success: false,
        error: error.message
      }
    }

    // Remove the tasks relation data from response
    const notes = (data || []).map((item: Record<string, any>) => {
      const { tasks: _, ...noteData } = item
      return noteData as Note
    })

    return {
      success: true,
      data: notes
    }
  } catch (error) {
    console.error('Unexpected error fetching notes:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }
  }
}

/**
 * Get all notes for a specific task
 */
export async function getNotesByTask(taskId: string): Promise<ApiResponse<Note[]>> {
  try {
    const supabase = createClientComponentClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return {
        success: false,
        error: 'User not authenticated'
      }
    }

    if (!taskId) {
      return {
        success: false,
        error: 'Task ID is required'
      }
    }

    // Verify task ownership first
    const taskCheck = await taskExists(taskId)
    if (!taskCheck.success || !taskCheck.data) {
      return {
        success: false,
        error: 'Task not found or access denied'
      }
    }

    // Get notes for the task
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error fetching task notes:', error)
      return {
        success: false,
        error: error.message
      }
    }

    return {
      success: true,
      data: (data || []) as Note[]
    }
  } catch (error) {
    console.error('Unexpected error fetching task notes:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }
  }
}

/**
 * Update an existing note
 */
export async function updateNote(updateData: UpdateNoteData): Promise<ApiResponse<Note>> {
  try {
    const supabase = createClientComponentClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return {
        success: false,
        error: 'User not authenticated'
      }
    }

    if (!updateData.id) {
      return {
        success: false,
        error: 'Note ID is required'
      }
    }

    // Validate title if provided
    if (updateData.title !== undefined && updateData.title.trim() === '') {
      return {
        success: false,
        error: 'Note title cannot be empty'
      }
    }

    // Validate content if provided
    if (updateData.content !== undefined && updateData.content.trim() === '') {
      return {
        success: false,
        error: 'Note content cannot be empty'
      }
    }

    // First verify the note exists and user has access to it
    const noteCheck = await noteExists(updateData.id)
    if (!noteCheck.success || !noteCheck.data) {
      return {
        success: false,
        error: 'Note not found or access denied'
      }
    }

    // Prepare update data (exclude id)
    const { id, ...noteUpdates } = updateData
    
    // Clean up the update data
    const cleanUpdates: Partial<{
      title: string
      content: string
      task_id: string
      updated_at: string
    }> = {}
    
    if (noteUpdates.title !== undefined) {
      cleanUpdates.title = noteUpdates.title.trim()
    }
    if (noteUpdates.content !== undefined) {
      cleanUpdates.content = noteUpdates.content.trim()
    }
    if (noteUpdates.task_id !== undefined) {
      // If task_id is being changed, verify the new task exists and user owns it
      const taskCheck = await taskExists(noteUpdates.task_id)
      if (!taskCheck.success || !taskCheck.data) {
        return {
          success: false,
          error: 'Target task not found or access denied'
        }
      }
      cleanUpdates.task_id = noteUpdates.task_id
    }

    // Add updated_at timestamp
    cleanUpdates.updated_at = new Date().toISOString()

    // Update note
    const { data, error } = await supabase
      .from('notes')
      .update(cleanUpdates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Database error updating note:', error)
      return {
        success: false,
        error: error.message
      }
    }

    return {
      success: true,
      data: data as Note
    }
  } catch (error) {
    console.error('Unexpected error updating note:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }
  }
}

/**
 * Delete a note
 */
export async function deleteNote(noteId: string): Promise<ApiResponse<null>> {
  try {
    const supabase = createClientComponentClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return {
        success: false,
        error: 'User not authenticated'
      }
    }

    if (!noteId) {
      return {
        success: false,
        error: 'Note ID is required'
      }
    }

    // Verify note exists and user has access to it
    const noteCheck = await noteExists(noteId)
    if (!noteCheck.success || !noteCheck.data) {
      return {
        success: false,
        error: 'Note not found or access denied'
      }
    }

    // Delete note
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', noteId)

    if (error) {
      console.error('Database error deleting note:', error)
      return {
        success: false,
        error: error.message
      }
    }

    return {
      success: true,
      data: null
    }
  } catch (error) {
    console.error('Unexpected error deleting note:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }
  }
}

/**
 * Get note count for the authenticated user (optionally by task)
 */
export async function getNoteCount(taskId?: string): Promise<ApiResponse<number>> {
  try {
    const supabase = createClientComponentClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return {
        success: false,
        error: 'User not authenticated'
      }
    }

    // Build query with user ownership validation through tasks -> projects
    let query = supabase
      .from('notes')
      .select(`
        *,
        tasks!inner(
          id,
          projects!inner(user_id)
        )
      `, { count: 'exact', head: true })
      .eq('tasks.projects.user_id', user.id)

    // Add task filter if specified
    if (taskId) {
      query = query.eq('task_id', taskId)
    }

    const { count, error } = await query

    if (error) {
      console.error('Database error counting notes:', error)
      return {
        success: false,
        error: error.message
      }
    }

    return {
      success: true,
      data: count || 0
    }
  } catch (error) {
    console.error('Unexpected error counting notes:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }
  }
}

/**
 * Check if a note exists and user has access to it
 */
export async function noteExists(noteId: string): Promise<ApiResponse<boolean>> {
  try {
    const supabase = createClientComponentClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return {
        success: false,
        error: 'User not authenticated'
      }
    }

    if (!noteId) {
      return {
        success: false,
        error: 'Note ID is required'
      }
    }

    // Check if note exists for this user through task -> project ownership
    const { data, error } = await supabase
      .from('notes')
      .select(`
        id,
        tasks!inner(
          id,
          projects!inner(user_id)
        )
      `)
      .eq('id', noteId)
      .eq('tasks.projects.user_id', user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return {
          success: true,
          data: false
        }
      }
      console.error('Database error checking note existence:', error)
      return {
        success: false,
        error: error.message
      }
    }

    return {
      success: true,
      data: !!data
    }
  } catch (error) {
    console.error('Unexpected error checking note existence:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }
  }
}

/**
 * Get recently created notes (within specified days)
 */
export async function getRecentNotes(daysBack: number = 7): Promise<ApiResponse<Note[]>> {
  try {
    const supabase = createClientComponentClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return {
        success: false,
        error: 'User not authenticated'
      }
    }

    // Calculate date range
    const today = new Date()
    const pastDate = new Date()
    pastDate.setDate(today.getDate() - daysBack)

    const pastDateStr = pastDate.toISOString()

    // Get notes created within the range
    const { data, error } = await supabase
      .from('notes')
      .select(`
        *,
        tasks!inner(
          id,
          projects!inner(user_id)
        )
      `)
      .eq('tasks.projects.user_id', user.id)
      .gte('created_at', pastDateStr)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error fetching recent notes:', error)
      return {
        success: false,
        error: error.message
      }
    }

    // Remove the tasks relation data from response
    const notes = (data || []).map((item: Record<string, any>) => {
      const { tasks: _, ...noteData } = item
      return noteData as Note
    })

    return {
      success: true,
      data: notes
    }
  } catch (error) {
    console.error('Unexpected error fetching recent notes:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }
  }
}

/**
 * Search notes by content
 */
export async function searchNotes(searchTerm: string): Promise<ApiResponse<Note[]>> {
  return getNotes({ content_contains: searchTerm })
} 