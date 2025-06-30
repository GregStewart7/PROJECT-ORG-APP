'use client'

import { useEffect, useState } from 'react'
import { validateEnvironment } from '@/lib/env-validation'
import { AlertTriangle, X, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EnvironmentValidatorProps {
  /** Whether to show warnings or only errors */
  showWarnings?: boolean
  /** Whether to show the validator in development only */
  developmentOnly?: boolean
}

export function EnvironmentValidator({ 
  showWarnings = true, 
  developmentOnly = true 
}: EnvironmentValidatorProps) {
  const [validation, setValidation] = useState<{
    isValid: boolean
    errors: string[]
    warnings: string[]
  } | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Only run in development if developmentOnly is true
    if (developmentOnly && process.env.NODE_ENV !== 'development') {
      return
    }

    const result = validateEnvironment()
    setValidation(result)

    // Log validation results to console
    if (!result.isValid) {
      console.error('❌ Client-side environment validation failed:', result.errors)
    }
    
    if (result.warnings.length > 0) {
      console.warn('⚠️ Client-side environment warnings:', result.warnings)
    }
  }, [developmentOnly])

  // Don't show anything if validation passed or component was dismissed
  if (!validation || dismissed || (validation.isValid && (!showWarnings || validation.warnings.length === 0))) {
    return null
  }

  const hasErrors = validation.errors.length > 0
  const hasWarnings = validation.warnings.length > 0

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md animate-in slide-in-from-top-4 duration-500">
      <div className={`rounded-xl border shadow-lg backdrop-blur-sm ${
        hasErrors 
          ? 'bg-red-50/95 border-red-200 text-red-900'
          : 'bg-yellow-50/95 border-yellow-200 text-yellow-900'
      }`}>
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${
              hasErrors ? 'bg-red-200' : 'bg-yellow-200'
            }`}>
              <AlertTriangle className={`size-4 ${
                hasErrors ? 'text-red-700' : 'text-yellow-700'
              }`} />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold mb-2">
                {hasErrors ? 'Environment Configuration Error' : 'Environment Configuration Warning'}
              </h3>
              
              {hasErrors && (
                <div className="mb-3">
                  <p className="text-sm font-medium mb-1">Errors:</p>
                  <ul className="text-xs space-y-1">
                    {validation.errors.map((error, index) => (
                      <li key={index} className="flex items-center gap-1">
                        <span className="w-1 h-1 bg-current rounded-full flex-shrink-0" />
                        {error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {showWarnings && hasWarnings && (
                <div className="mb-3">
                  <p className="text-sm font-medium mb-1">Warnings:</p>
                  <ul className="text-xs space-y-1">
                    {validation.warnings.map((warning, index) => (
                      <li key={index} className="flex items-center gap-1">
                        <span className="w-1 h-1 bg-current rounded-full flex-shrink-0" />
                        {warning}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="flex items-center gap-2 mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.reload()}
                  className={`text-xs h-7 ${
                    hasErrors
                      ? 'border-red-300 text-red-700 hover:bg-red-100'
                      : 'border-yellow-300 text-yellow-700 hover:bg-yellow-100'
                  }`}
                >
                  <RefreshCw className="size-3 mr-1" />
                  Retry
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDismissed(true)}
                  className={`text-xs h-7 ${
                    hasErrors
                      ? 'text-red-700 hover:bg-red-100'
                      : 'text-yellow-700 hover:bg-yellow-100'
                  }`}
                >
                  Dismiss
                </Button>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDismissed(true)}
              className={`h-6 w-6 ${
                hasErrors
                  ? 'text-red-700 hover:bg-red-100'
                  : 'text-yellow-700 hover:bg-yellow-100'
              }`}
            >
              <X className="size-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Development-only environment validator
 * This will only show in development mode
 */
export function DevelopmentEnvironmentValidator() {
  return <EnvironmentValidator developmentOnly={true} showWarnings={true} />
}

/**
 * Production environment validator
 * This will show critical errors in all environments
 */
export function ProductionEnvironmentValidator() {
  return <EnvironmentValidator developmentOnly={false} showWarnings={false} />
} 