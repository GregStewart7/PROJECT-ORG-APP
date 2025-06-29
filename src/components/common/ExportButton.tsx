'use client'

import { useState } from 'react'
import { Download, FileText, File, ChevronDown, AlertCircle, CheckCircle } from 'lucide-react'

import { Project } from '@/types'
import { generateExportForFormat } from '@/lib/export'
import { Button } from '@/components/ui/button'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'

interface ExportButtonProps {
  project: Project
  onExportComplete?: (filename: string, format: ExportFormat) => void
  onExportError?: (error: string) => void
  isLoading?: boolean
  className?: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'sm' | 'default' | 'lg'
}

export type ExportFormat = 'pdf' | 'json'

export function ExportButton({ 
  project, 
  onExportComplete,
  onExportError,
  isLoading = false,
  className = '',
  variant = 'outline',
  size = 'sm'
}: ExportButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('pdf')
  const [isExporting, setIsExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)
  const [exportSuccess, setExportSuccess] = useState<string | null>(null)

  const handleExport = async () => {
    if (isExporting) return

    setIsExporting(true)
    setExportError(null)
    setExportSuccess(null)
    
    try {
      // Generate export using our export utilities
      const result = await generateExportForFormat(project.id, selectedFormat)
      
      if (!result.success || !result.data) {
        const errorMessage = result.error || 'Failed to generate export'
        setExportError(errorMessage)
        onExportError?.(errorMessage)
        return
      }

      // Trigger file download
      downloadFile(result.data.content, result.data.filename)
      
      // Show success message
      setExportSuccess(`Successfully exported as ${result.data.filename}`)
      onExportComplete?.(result.data.filename, selectedFormat)
      
      // Close dialog after a short delay to show success message
      setTimeout(() => {
        setIsDialogOpen(false)
        setExportSuccess(null)
      }, 1500)

    } catch (error) {
      console.error('Export failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred during export'
      setExportError(errorMessage)
      onExportError?.(errorMessage)
    } finally {
      setIsExporting(false)
    }
  }

  // File download utility function
  const downloadFile = (content: string, filename: string) => {
    let url: string
    
    if (selectedFormat === 'pdf') {
      // PDF content is already a data URI from jsPDF
      url = content
    } else {
      // JSON content needs to be converted to blob
      const blob = new Blob([content], { 
        type: selectedFormat === 'json' ? 'application/json' : 'text/plain' 
      })
      url = URL.createObjectURL(blob)
    }
    
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // Only revoke object URLs (not data URIs)
    if (selectedFormat !== 'pdf') {
      URL.revokeObjectURL(url)
    }
  }

  const handleOpenDialog = () => {
    if (!isLoading) {
      setIsDialogOpen(true)
    }
  }

  const handleCloseDialog = () => {
    if (!isExporting) {
      setIsDialogOpen(false)
      setSelectedFormat('pdf') // Reset to default
      setExportError(null)
      setExportSuccess(null)
    }
  }

  const getFormatIcon = (format: ExportFormat) => {
    switch (format) {
      case 'pdf':
        return <FileText className="size-4" />
      case 'json':
        return <File className="size-4" />
      default:
        return <FileText className="size-4" />
    }
  }

  const getFormatDescription = (format: ExportFormat) => {
    switch (format) {
      case 'pdf':
        return 'Export as PDF (.pdf) - Professional document format for sharing and printing'
      case 'json':
        return 'Export as JSON (.json) - Structured data format for importing elsewhere'
      default:
        return 'Export project data'
    }
  }

  return (
    <>
      <Button
        onClick={handleOpenDialog}
        disabled={isLoading}
        variant={variant}
        size={size}
        className={`flex items-center gap-2 ${className}`}
      >
        <Download className="size-4" />
        Export
        <ChevronDown className="size-3 opacity-60" />
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="size-5 text-blue-600" />
              Export Project: {project.name}
            </DialogTitle>
            <DialogDescription>
              Choose the format for exporting your project data, including all tasks and notes.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="format-select" className="text-sm font-medium">
                Export Format
              </label>
              <Select value={selectedFormat} onValueChange={(value: ExportFormat) => setSelectedFormat(value)}>
                <SelectTrigger id="format-select">
                  <SelectValue>
                    <div className="flex items-center gap-2">
                      {getFormatIcon(selectedFormat)}
                      <span className="capitalize">{selectedFormat}</span>
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">
                    <div className="flex items-center gap-2">
                      <FileText className="size-4" />
                      <span>PDF (.pdf)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="json">
                    <div className="flex items-center gap-2">
                      <File className="size-4" />
                      <span>JSON (.json)</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                {getFormatDescription(selectedFormat)}
              </p>
            </div>

            <div className="text-xs text-muted-foreground">
              <p>Export will include:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Project information and details</li>
                <li>All tasks with priorities and due dates</li>
                <li>All notes associated with tasks</li>
                <li>Creation and update timestamps</li>
              </ul>
            </div>

            {/* Error Message */}
            {exportError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="size-4 text-red-600 shrink-0" />
                <p className="text-sm text-red-700">{exportError}</p>
              </div>
            )}

            {/* Success Message */}
            {exportSuccess && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="size-4 text-green-600 shrink-0" />
                <p className="text-sm text-green-700">{exportSuccess}</p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleCloseDialog}
              disabled={isExporting}
            >
              {exportSuccess ? 'Close' : 'Cancel'}
            </Button>
            <Button 
              type="button"
              onClick={handleExport}
              disabled={isExporting || !!exportSuccess}
              className="min-w-[120px]"
            >
              {isExporting ? (
                <div className="flex items-center gap-2">
                  <div className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Exporting...
                </div>
              ) : exportSuccess ? (
                <div className="flex items-center gap-2">
                  <CheckCircle className="size-4" />
                  Exported
                </div>
              ) : (
                <>
                  <Download className="size-4 mr-2" />
                  Export {selectedFormat.toUpperCase()}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
} 