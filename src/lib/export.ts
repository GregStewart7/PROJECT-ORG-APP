import { Project, Task, Note, ApiResponse } from '@/types'
import { getProject, getTasksByProject, getNotesByTask } from './database'
import jsPDF from 'jspdf'

// Export-specific data structures that extend the base types
// These provide a clean, hierarchical representation for export

export interface ExportNote {
  id: string
  content: string
  created_at: string
  updated_at: string
  // Human-readable formatting
  formatted_content: string
  timestamp: string
}

export interface ExportTask {
  id: string
  name: string
  priority: 'High' | 'Medium' | 'Low'
  completed: boolean
  due_date?: string
  created_at: string
  updated_at: string
  // Associated notes in hierarchical structure
  notes: ExportNote[]
  // Computed fields for export
  status: string
  formatted_due_date?: string
  notes_count: number
}

export interface ExportProject {
  id: string
  name: string
  description?: string
  due_date?: string
  created_at: string
  updated_at: string
  // Associated tasks in hierarchical structure
  tasks: ExportTask[]
  // Computed fields for export
  formatted_due_date?: string
  tasks_count: number
  completed_tasks_count: number
  total_notes_count: number
  completion_percentage: number
  export_timestamp: string
}

// Export metadata and summary information
export interface ExportMetadata {
  export_date: string
  export_timestamp: string
  format: 'pdf' | 'json'
  version: string
  project_count: 1 // For single project exports
  total_tasks: number
  total_notes: number
  app_name: string
}

// Complete export data structure
export interface ExportData {
  metadata: ExportMetadata
  project: ExportProject
}

// Utility function to transform database entities into export structure
export function createExportData(
  project: Project,
  tasks: Task[],
  taskNotes: Record<string, Note[]>
): ExportData {
  const exportTimestamp = new Date().toISOString()
  const exportDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  // Transform notes for each task
  const exportTasks: ExportTask[] = tasks.map(task => {
    const taskNotesArray = taskNotes[task.id] || []
    
    const exportNotes: ExportNote[] = taskNotesArray.map(note => ({
      id: note.id,
      content: note.content,
      created_at: note.created_at,
      updated_at: note.updated_at,
      formatted_content: formatNoteContent(note.content),
      timestamp: formatTimestamp(note.created_at)
    }))

    return {
      id: task.id,
      name: task.name,
      priority: task.priority,
      completed: task.completed,
      due_date: task.due_date || undefined,
      created_at: task.created_at,
      updated_at: task.updated_at,
      notes: exportNotes,
      status: task.completed ? 'Completed' : 'In Progress',
      formatted_due_date: task.due_date ? formatDate(task.due_date) : undefined,
      notes_count: exportNotes.length
    }
  })

  // Calculate project-level statistics
  const completedTasks = exportTasks.filter(task => task.completed).length
  const totalNotes = exportTasks.reduce((sum, task) => sum + task.notes_count, 0)
  const completionPercentage = exportTasks.length > 0 
    ? Math.round((completedTasks / exportTasks.length) * 100) 
    : 0

  const exportProject: ExportProject = {
    id: project.id,
    name: project.name,
    description: project.description || undefined,
    due_date: project.due_date || undefined,
    created_at: project.created_at,
    updated_at: project.updated_at,
    tasks: exportTasks,
    formatted_due_date: project.due_date ? formatDate(project.due_date) : undefined,
    tasks_count: exportTasks.length,
    completed_tasks_count: completedTasks,
    total_notes_count: totalNotes,
    completion_percentage: completionPercentage,
    export_timestamp: exportTimestamp
  }

  const metadata: ExportMetadata = {
    export_date: exportDate,
    export_timestamp: exportTimestamp,
    format: 'json', // Will be overridden by specific export functions
    version: '1.0.0',
    project_count: 1,
    total_tasks: exportTasks.length,
    total_notes: totalNotes,
    app_name: 'Personal Project Management'
  }

  return {
    metadata,
    project: exportProject
  }
}

// Helper functions for formatting
function formatDate(dateString: string): string {
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  } catch {
    return dateString
  }
}

function formatTimestamp(dateString: string): string {
  try {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return dateString
  }
}

function formatNoteContent(content: string): string {
  // Clean up the content for export
  // Handle bullet points and formatting
  return content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => {
      // Convert bullet points to consistent format
      if (line.startsWith('•') || line.startsWith('-') || line.startsWith('*')) {
        return `• ${line.substring(1).trim()}`
      }
      return line
    })
    .join('\n')
}

// Data validation helpers
export function validateExportData(data: ExportData): boolean {
  if (!data.metadata || !data.project) {
    return false
  }

  if (!data.project.id || !data.project.name) {
    return false
  }

  if (!Array.isArray(data.project.tasks)) {
    return false
  }

  // Validate each task has required fields
  for (const task of data.project.tasks) {
    if (!task.id || !task.name) {
      return false
    }
    
    if (!Array.isArray(task.notes)) {
      return false
    }
  }

  return true
}

// ============================================================================
// DATA AGGREGATION FOR EXPORT
// ============================================================================

/**
 * Aggregate all project data (project + tasks + notes) for export
 */
export async function aggregateProjectDataForExport(projectId: string): Promise<ApiResponse<ExportData>> {
  try {
    // Fetch project data
    const projectResult = await getProject(projectId)
    if (!projectResult.success || !projectResult.data) {
      return {
        success: false,
        error: projectResult.error || 'Failed to fetch project data'
      }
    }

    // Fetch tasks for the project
    const tasksResult = await getTasksByProject(projectId)
    if (!tasksResult.success || !tasksResult.data) {
      return {
        success: false,
        error: tasksResult.error || 'Failed to fetch project tasks'
      }
    }

    // Fetch notes for each task
    const taskNotes: Record<string, Note[]> = {}
    
    for (const task of tasksResult.data) {
      const notesResult = await getNotesByTask(task.id)
      if (notesResult.success && notesResult.data) {
        taskNotes[task.id] = notesResult.data
      } else {
        // If notes fail to load for a task, continue with empty notes
        taskNotes[task.id] = []
      }
    }

    // Create export data structure
    const exportData = createExportData(projectResult.data, tasksResult.data, taskNotes)
    
    // Validate the export data
    if (!validateExportData(exportData)) {
      return {
        success: false,
        error: 'Generated export data is invalid'
      }
    }

    return {
      success: true,
      data: exportData
    }

  } catch (error) {
    console.error('Error aggregating project data for export:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred during data aggregation'
    }
  }
}

/**
 * Get export statistics for a project without generating full export data
 */
export async function getProjectExportStats(projectId: string): Promise<ApiResponse<{
  projectName: string
  taskCount: number
  completedTaskCount: number
  totalNoteCount: number
  completionPercentage: number
}>> {
  try {
    const exportResult = await aggregateProjectDataForExport(projectId)
    
    if (!exportResult.success || !exportResult.data) {
      return {
        success: false,
        error: exportResult.error || 'Failed to get export statistics'
      }
    }

    const { project } = exportResult.data

    return {
      success: true,
      data: {
        projectName: project.name,
        taskCount: project.tasks_count,
        completedTaskCount: project.completed_tasks_count,
        totalNoteCount: project.total_notes_count,
        completionPercentage: project.completion_percentage
      }
    }

  } catch (error) {
    console.error('Error getting export stats:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }
  }
}

/**
 * Check if a project has exportable data
 */
export async function hasExportableData(projectId: string): Promise<ApiResponse<boolean>> {
  try {
    const projectResult = await getProject(projectId)
    if (!projectResult.success || !projectResult.data) {
      return {
        success: false,
        error: 'Project not found'
      }
    }

    const tasksResult = await getTasksByProject(projectId)
    const hasData = projectResult.data && (
      projectResult.data.description ||
      (tasksResult.success && tasksResult.data && tasksResult.data.length > 0)
    )

    return {
      success: true,
      data: !!hasData
    }

  } catch (error) {
    console.error('Error checking exportable data:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }
  }
}

/**
 * Generate export data with specific format
 */
export async function generateExportForFormat(
  projectId: string, 
  format: 'pdf' | 'json'
): Promise<ApiResponse<{ content: string; filename: string }>> {
  try {
    // Get the export data
    const exportResult = await aggregateProjectDataForExport(projectId)
    
    if (!exportResult.success || !exportResult.data) {
      return {
        success: false,
        error: exportResult.error || 'Failed to aggregate export data'
      }
    }

    const exportData = exportResult.data
    exportData.metadata.format = format

    let content: string
    let filename: string

    switch (format) {
      case 'json':
        content = generateJson(exportData)
        filename = generateJsonFilename(exportData.project)
        break
      
      case 'pdf':
        content = await generatePDF(exportData)
        filename = generatePDFFilename(exportData.project)
        break
      
      default:
        return {
          success: false,
          error: `Unsupported export format: ${format}`
        }
    }

    return {
      success: true,
      data: { content, filename }
    }

  } catch (error) {
    console.error(`Error generating ${format} export:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : `An unexpected error occurred during ${format} export generation`
    }
  }
}

// Generate JSON export
export function generateJson(data: ExportData): string {
  return JSON.stringify(data, null, 2)
}

function generateJsonFilename(project: ExportProject): string {
  const timestamp = new Date().toISOString().split('T')[0]
  const sanitizedName = project.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()
  return `${sanitizedName}_export_${timestamp}.json`
}

// Generate PDF export
export async function generatePDF(data: ExportData): Promise<string> {
  const doc = new jsPDF()
  const { project, metadata } = data
  
  let yPosition = 0
  const pageWidth = doc.internal.pageSize.width
  const pageHeight = doc.internal.pageSize.height
  const margin = 25
  const contentWidth = pageWidth - (margin * 2)
  
  // Color scheme (matching website theme)
  const colors = {
    primary: '#1f2937',      // Dark gray for headers
    secondary: '#6b7280',    // Medium gray for subheaders
    text: '#374151',         // Darker gray for body text
    muted: '#9ca3af',        // Light gray for metadata
    accent: '#3b82f6',       // Blue for highlights
    success: '#10b981',      // Green for completed items
    warning: '#f59e0b',      // Orange for medium priority
    danger: '#ef4444'        // Red for high priority
  }

  // Helper function to set text color
  const setTextColor = (color: string) => {
    const hex = color.replace('#', '')
    const r = parseInt(hex.substr(0, 2), 16)
    const g = parseInt(hex.substr(2, 2), 16)
    const b = parseInt(hex.substr(4, 2), 16)
    doc.setTextColor(r, g, b)
  }

  // Helper function to add text with word wrapping and color
  const addText = (text: string, x: number, y: number, options: { 
    fontSize?: number, 
    fontStyle?: string, 
    maxWidth?: number,
    color?: string,
    align?: 'left' | 'center' | 'right'
  } = {}): number => {
    const { fontSize = 10, fontStyle = 'normal', maxWidth = contentWidth, color = colors.text, align = 'left' } = options
    
    doc.setFontSize(fontSize)
    doc.setFont('helvetica', fontStyle as any)
    setTextColor(color)
    
    const lines = doc.splitTextToSize(text, maxWidth)
    
    if (align === 'center') {
      lines.forEach((line: string, i: number) => {
        const textWidth = doc.getTextWidth(line)
        const xPos = (pageWidth - textWidth) / 2
        doc.text(line, xPos, y + (i * fontSize * 0.4))
      })
    } else {
      doc.text(lines, x, y, { align: align as any })
    }
    
    return y + (lines.length * fontSize * 0.4) + 2
  }

  // Helper function to add divider line
  const addDivider = (y: number, color: string = colors.muted): number => {
    const hex = color.replace('#', '')
    const r = parseInt(hex.substr(0, 2), 16)
    const g = parseInt(hex.substr(2, 2), 16)
    const b = parseInt(hex.substr(4, 2), 16)
    doc.setDrawColor(r, g, b)
    doc.setLineWidth(0.5)
    doc.line(margin, y, pageWidth - margin, y)
    return y + 8
  }

  // Helper function to add colored rectangle background
  const addBackground = (x: number, y: number, width: number, height: number, color: string, opacity: number = 0.1) => {
    const hex = color.replace('#', '')
    const r = parseInt(hex.substr(0, 2), 16)
    const g = parseInt(hex.substr(2, 2), 16)
    const b = parseInt(hex.substr(4, 2), 16)
    doc.setFillColor(r, g, b)
    doc.setGState(doc.GState({ opacity: opacity }))
    doc.rect(x, y, width, height, 'F')
    doc.setGState(doc.GState({ opacity: 1 })) // Reset opacity
  }

  // Helper function to check if we need a new page
  const checkPageBreak = (neededSpace: number): number => {
    if (yPosition + neededSpace > pageHeight - 30) {
      doc.addPage()
      return 25
    }
    return yPosition
  }

  // HEADER - ProjectHub Branding
  yPosition = 25
  
  // Add blue background bar for header
  addBackground(0, 0, pageWidth, 45, colors.accent, 0.05)
  
  // ProjectHub logo/title
  yPosition = addText('ProjectHub', margin, yPosition + 5, { 
    fontSize: 24, 
    fontStyle: 'bold', 
    color: colors.accent 
  })
  
  yPosition = addText('Professional Project Management', margin, yPosition, { 
    fontSize: 11, 
    color: colors.secondary 
  })
  
  // Export date - right aligned
  doc.setFontSize(9)
  setTextColor(colors.muted)
  const exportText = `Exported on ${metadata.export_date}`
  const textWidth = doc.getTextWidth(exportText)
  doc.text(exportText, pageWidth - margin - textWidth, 20)
  
  yPosition += 15

  // PROJECT TITLE SECTION
  yPosition = checkPageBreak(40)
  yPosition = addText(project.name, margin, yPosition, { 
    fontSize: 20, 
    fontStyle: 'bold', 
    color: colors.primary 
  })
  
  yPosition = addDivider(yPosition + 2, colors.accent)

  // PROJECT OVERVIEW SECTION
  yPosition = checkPageBreak(60)
  
  // Description
  if (project.description) {
    yPosition = addText('Project Overview', margin, yPosition, { 
      fontSize: 14, 
      fontStyle: 'bold', 
      color: colors.primary 
    })
    yPosition += 2
    yPosition = addText(project.description, margin, yPosition, { 
      fontSize: 11, 
      color: colors.text 
    })
    yPosition += 8
  }

  // PROJECT STATISTICS CARD
  yPosition = checkPageBreak(55)
  
  // Add light background for stats section
  const statsHeight = 45
  addBackground(margin - 5, yPosition - 5, contentWidth + 10, statsHeight, colors.accent, 0.03)
  
  yPosition = addText('Project Statistics', margin, yPosition, { 
    fontSize: 14, 
    fontStyle: 'bold', 
    color: colors.primary 
  })
  yPosition += 5
  
  // Stats in two columns
  const leftColumn = margin + 5
  const rightColumn = margin + (contentWidth / 2) + 5
  
  const leftStats = [
    `📊 Total Tasks: ${project.tasks_count}`,
    `📝 Total Notes: ${project.total_notes_count}`
  ]
  
  const rightStats = [
    `✅ Completed: ${project.completed_tasks_count}`,
    `📈 Progress: ${project.completion_percentage}%`
  ]
  
  let statsY = yPosition
  leftStats.forEach(stat => {
    statsY = addText(stat, leftColumn, statsY, { fontSize: 10, color: colors.text })
    statsY += 2
  })
  
  statsY = yPosition
  rightStats.forEach(stat => {
    statsY = addText(stat, rightColumn, statsY, { fontSize: 10, color: colors.text })
    statsY += 2
  })
  
  yPosition = Math.max(yPosition + 25, statsY + 10)

  // Due date if exists
  if (project.formatted_due_date) {
    yPosition = addText(`🗓️ Due Date: ${project.formatted_due_date}`, margin, yPosition, { 
      fontSize: 12, 
      fontStyle: 'bold', 
      color: colors.warning 
    })
    yPosition += 10
  }

  // TASKS SECTION
  if (project.tasks.length > 0) {
    yPosition = checkPageBreak(30)
    yPosition = addDivider(yPosition, colors.accent)
    
    yPosition = addText('Tasks Overview', margin, yPosition, { 
      fontSize: 16, 
      fontStyle: 'bold', 
      color: colors.primary 
    })
    yPosition += 8

    // Group tasks by completion status
    const activeTasks = project.tasks.filter(task => !task.completed)
    const completedTasks = project.tasks.filter(task => task.completed)

    // Active tasks
    if (activeTasks.length > 0) {
      yPosition = checkPageBreak(20)
      yPosition = addText(`🔄 Active Tasks (${activeTasks.length})`, margin, yPosition, { 
        fontSize: 13, 
        fontStyle: 'bold', 
        color: colors.accent 
      })
      yPosition += 5

      for (const task of activeTasks) {
        yPosition = checkPageBreak(40)
        
        // Task background
        const taskHeight = 15 + (task.notes.length * 8)
        addBackground(margin - 2, yPosition - 2, contentWidth + 4, taskHeight, colors.accent, 0.02)
        
        // Priority indicator and task name
        const priorityIcon = task.priority === 'High' ? '🔴' : task.priority === 'Medium' ? '🟡' : '🟢'
        const priorityColor = task.priority === 'High' ? colors.danger : task.priority === 'Medium' ? colors.warning : colors.success
        
        yPosition = addText(`${priorityIcon} ${task.name}`, margin + 2, yPosition, { 
          fontSize: 11, 
          fontStyle: 'bold', 
          color: colors.text 
        })
        yPosition += 1
        
        // Priority and due date info
        let taskInfo = `Priority: ${task.priority}`
        if (task.formatted_due_date) {
          taskInfo += ` • Due: ${task.formatted_due_date}`
        }
        yPosition = addText(taskInfo, margin + 15, yPosition, { 
          fontSize: 9, 
          color: priorityColor 
        })
        yPosition += 1
        
        // Notes
        if (task.notes.length > 0) {
          yPosition = addText(`📝 Notes (${task.notes.length}):`, margin + 15, yPosition, { 
            fontSize: 9, 
            fontStyle: 'bold', 
            color: colors.secondary 
          })
          yPosition += 1
          
          for (const note of task.notes) {
            yPosition = checkPageBreak(15)
            yPosition = addText(`• ${note.formatted_content}`, margin + 20, yPosition, { 
              fontSize: 9, 
              color: colors.text,
              maxWidth: contentWidth - 25
            })
            yPosition += 1
          }
        }
        yPosition += 8
      }
    }

    // Completed tasks
    if (completedTasks.length > 0) {
      yPosition = checkPageBreak(20)
      yPosition = addText(`✅ Completed Tasks (${completedTasks.length})`, margin, yPosition, { 
        fontSize: 13, 
        fontStyle: 'bold', 
        color: colors.success 
      })
      yPosition += 5

      for (const task of completedTasks) {
        yPosition = checkPageBreak(25)
        
        // Completed task background (lighter)
        const taskHeight = 12 + (task.notes.length * 6)
        addBackground(margin - 2, yPosition - 2, contentWidth + 4, taskHeight, colors.success, 0.02)
        
        yPosition = addText(`✅ ${task.name}`, margin + 2, yPosition, { 
          fontSize: 10, 
          color: colors.success 
        })
        yPosition += 1
        
        if (task.notes.length > 0) {
          yPosition = addText(`📝 ${task.notes.length} note(s)`, margin + 15, yPosition, { 
            fontSize: 8, 
            color: colors.muted 
          })
          yPosition += 1
          
          for (const note of task.notes) {
            yPosition = checkPageBreak(10)
            yPosition = addText(`• ${note.formatted_content}`, margin + 20, yPosition, { 
              fontSize: 8, 
              color: colors.muted,
              maxWidth: contentWidth - 25
            })
            yPosition += 1
          }
        }
        yPosition += 6
      }
    }
  }

  // FOOTER
  yPosition = checkPageBreak(25)
  yPosition = addDivider(yPosition + 5, colors.muted)
  
  // Footer text
  const footerY = pageHeight - 20
  yPosition = addText(`Generated by ProjectHub • ${metadata.export_timestamp}`, margin, footerY, { 
    fontSize: 8, 
    color: colors.muted 
  })
  
  // Page number
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    setTextColor(colors.muted)
    const pageText = `Page ${i} of ${pageCount}`
    const pageTextWidth = doc.getTextWidth(pageText)
    doc.text(pageText, pageWidth - margin - pageTextWidth, pageHeight - 10)
  }

  return doc.output('datauristring')
}

function generatePDFFilename(project: ExportProject): string {
  const timestamp = new Date().toISOString().split('T')[0]
  const sanitizedName = project.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()
  return `${sanitizedName}_export_${timestamp}.pdf`
} 