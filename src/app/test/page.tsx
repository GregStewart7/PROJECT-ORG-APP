'use client'

import { useState } from 'react'
import { ProjectCard } from '@/components/project/ProjectCard'
import { Project } from '@/types'

// Sample project data for testing various states
const sampleProjects: Project[] = [
  {
    id: '1',
    user_id: 'user1',
    name: 'Website Redesign',
    description: 'Complete overhaul of company website with modern design',
    due_date: '2024-12-31',
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-20T14:45:00Z'
  },
  {
    id: '2', 
    user_id: 'user1',
    name: 'Mobile App Development',
    description: 'Native iOS and Android app development',
    due_date: '2024-12-25',
    created_at: '2024-01-10T09:00:00Z',
    updated_at: '2024-01-10T09:00:00Z'
  },
  {
    id: '3',
    user_id: 'user1', 
    name: 'Database Migration Project',
    description: 'Migrate legacy database to new cloud infrastructure',
    due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // Due in 2 days
    created_at: '2024-01-18T16:20:00Z',
    updated_at: '2024-01-22T11:30:00Z'
  },
  {
    id: '4',
    user_id: 'user1',
    name: 'Legacy System Overhaul',
    description: 'Modernize and replace legacy systems with new architecture',
    due_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // Overdue by 3 days
    created_at: '2024-01-05T08:15:00Z',
    updated_at: '2024-01-15T12:00:00Z'
  },
  {
    id: '5',
    user_id: 'user1',
    name: 'API Documentation',
    description: 'Create comprehensive API documentation for developers',
    due_date: new Date().toISOString(), // Due today
    created_at: '2024-01-25T13:45:00Z',
    updated_at: '2024-01-25T13:45:00Z'
  },
  {
    id: '6',
    user_id: 'user1',
    name: 'Security Audit Review',
    description: null,
    due_date: null, // No due date
    created_at: '2024-01-20T08:30:00Z',
    updated_at: '2024-01-20T08:30:00Z'
  }
]

export default function TestPage() {
  const [deletedProjects, setDeletedProjects] = useState<string[]>([])
  const [editingProject, setEditingProject] = useState<string | null>(null)

  const handleEdit = (project: Project) => {
    console.log('Edit project:', project.name)
    setEditingProject(project.id)
    
    // Simulate edit operation
    setTimeout(() => {
      setEditingProject(null)
      alert(`✏️ Edit dialog would open for: "${project.name}"`)
    }, 1000)
  }

  const handleDelete = async (projectId: string) => {
    console.log('Delete project:', projectId)
    const project = sampleProjects.find(p => p.id === projectId)
    
    const confirmDelete = confirm(`🗑️ Are you sure you want to delete "${project?.name}"?\n\nThis action cannot be undone.`)
    
    if (confirmDelete) {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500))
      setDeletedProjects(prev => [...prev, projectId])
      alert(`✅ Project "${project?.name}" deleted successfully!`)
    }
  }

  const handleView = (projectId: string) => {
    console.log('View project:', projectId)
    const project = sampleProjects.find(p => p.id === projectId)
    alert(`👁️ View project: "${project?.name}"\n\nThis would navigate to /projects/${projectId}`)
  }

  const handleRestore = () => {
    setDeletedProjects([])
    alert('🔄 All projects restored!')
  }

  const activeProjects = sampleProjects.filter(p => !deletedProjects.includes(p.id))

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                🧪 ProjectCard Component Test
              </h1>
              <p className="mt-2 text-gray-600">
                Interactive testing environment for the ProjectCard component
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleRestore}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                disabled={deletedProjects.length === 0}
              >
                🔄 Restore Deleted ({deletedProjects.length})
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-2xl font-bold text-blue-600">{activeProjects.length}</div>
            <div className="text-sm text-gray-600">Active Projects</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-2xl font-bold text-red-600">
              {activeProjects.filter(p => p.due_date && new Date(p.due_date) < new Date()).length}
            </div>
            <div className="text-sm text-gray-600">Overdue</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-2xl font-bold text-orange-600">
              {activeProjects.filter(p => p.due_date && new Date(p.due_date).toDateString() === new Date().toDateString()).length}
            </div>
            <div className="text-sm text-gray-600">Due Today</div>
          </div>
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-2xl font-bold text-gray-400">{deletedProjects.length}</div>
            <div className="text-sm text-gray-600">Deleted</div>
          </div>
        </div>

        {/* ProjectCard Grid */}
        {activeProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {activeProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onView={handleView}
                isLoading={editingProject === project.id}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-4">
              🗑️ All projects have been deleted
            </div>
            <button
              onClick={handleRestore}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              🔄 Restore All Projects
            </button>
          </div>
        )}

        {/* Feature Documentation */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">🎯 Testing Features</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-3 text-blue-600">Visual States to Test:</h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>🔴 <strong>Overdue projects</strong> - Red badge with days overdue</li>
                <li>🟠 <strong>Due today</strong> - Orange badge</li>
                <li>🟡 <strong>Due soon</strong> - Yellow badge (≤7 days)</li>
                <li>🟢 <strong>Future dates</strong> - Green badge</li>
                <li>⚪ <strong>No due date</strong> - No badge shown</li>
                <li>🎨 <strong>Hover effects</strong> - Card shadows and button colors</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-3 text-green-600">Interactive Features:</h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>✏️ <strong>Edit button</strong> - Shows loading state</li>
                <li>🗑️ <strong>Delete button</strong> - Confirmation dialog + spinner</li>
                <li>👁️ <strong>View button</strong> - Primary action</li>
                <li>🔗 <strong>Clickable title</strong> - Alternative view action</li>
                <li>📱 <strong>Responsive design</strong> - Resize window to test</li>
                <li>⏳ <strong>Loading states</strong> - Disabled interactions</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Usage Example */}
        <div className="bg-blue-50 rounded-lg p-6">
          <h3 className="font-medium text-blue-900 mb-3">💻 Component Usage:</h3>
          <pre className="text-sm text-blue-800 overflow-x-auto bg-blue-100 p-3 rounded">
{`<ProjectCard
  project={project}
  onEdit={(project) => openEditDialog(project)}
  onDelete={(id) => deleteProjectWithConfirmation(id)}
  onView={(id) => router.push(\`/projects/\${id}\`)}
  isLoading={isOperationInProgress}
  showActions={true}
/>`}
          </pre>
        </div>

        {/* Navigation */}
        <div className="mt-8 text-center">
          <a 
            href="/projects" 
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-800 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            ← Back to Projects
          </a>
        </div>
      </div>
    </div>
  )
} 