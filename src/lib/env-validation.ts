// Environment Variable Validation Utility
// This module validates that all required environment variables are present and properly formatted

interface EnvConfig {
  // Supabase Configuration (Required)
  NEXT_PUBLIC_SUPABASE_URL: string
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string
  
  // Optional Configuration
  CUSTOM_KEY?: string
}

interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Validates that a URL is properly formatted
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Validates that a string looks like a Supabase anon key
 */
function isValidSupabaseKey(key: string): boolean {
  // Supabase anon keys are typically JWT tokens starting with 'eyJ'
  return key.length > 50 && key.startsWith('eyJ')
}

/**
 * Validates all required environment variables
 */
export function validateEnvironment(): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Required Environment Variables
  const requiredVars = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  }

  // Check for missing required variables
  for (const [key, value] of Object.entries(requiredVars)) {
    if (!value) {
      errors.push(`Missing required environment variable: ${key}`)
      continue
    }

    // Validate specific formats
    switch (key) {
      case 'NEXT_PUBLIC_SUPABASE_URL':
        if (!isValidUrl(value)) {
          errors.push(`Invalid URL format for ${key}: ${value}`)
        } else if (!value.includes('supabase')) {
          warnings.push(`${key} doesn't appear to be a Supabase URL`)
        }
        break

      case 'NEXT_PUBLIC_SUPABASE_ANON_KEY':
        if (!isValidSupabaseKey(value)) {
          errors.push(`Invalid Supabase key format for ${key}`)
        }
        break
    }
  }

  // Check optional variables
  const customKey = process.env.CUSTOM_KEY
  if (customKey && customKey.length < 10) {
    warnings.push('CUSTOM_KEY is very short, ensure this is intentional')
  }

  // Check for common development issues
  if (process.env.NODE_ENV === 'production') {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('localhost')) {
      warnings.push('Production mode detected but using localhost Supabase URL - this will not work in production')
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Validates environment and throws an error with helpful messages if validation fails
 */
export function validateEnvironmentOrThrow(): void {
  const result = validateEnvironment()

  if (!result.isValid) {
    const errorMessage = [
      '❌ Environment Validation Failed!',
      '',
      '🚨 Missing or Invalid Environment Variables:',
      ...result.errors.map(error => `  • ${error}`),
      '',
      '📋 Required Environment Variables:',
      '  • NEXT_PUBLIC_SUPABASE_URL     - Your Supabase project URL',
      '  • NEXT_PUBLIC_SUPABASE_ANON_KEY - Your Supabase anonymous key',
      '',
      '💡 How to Fix:',
      '  1. Create a .env.local file in your project root',
      '  2. Add the missing variables with correct values',
      '  3. Restart your development server',
      '',
      '📖 Example .env.local:',
      '  NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co',
      '  NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      '',
      '🔗 Get these values from: https://app.supabase.com/project/your-project/settings/api'
    ].join('\n')

    throw new Error(errorMessage)
  }

  // Log warnings if any
  if (result.warnings.length > 0) {
    console.warn('⚠️  Environment Warnings:')
    result.warnings.forEach(warning => console.warn(`  • ${warning}`))
    console.warn('')
  }

  // Success message
  console.log('✅ Environment validation passed')
}

/**
 * Get validated environment configuration
 */
export function getEnvConfig(): EnvConfig {
  validateEnvironmentOrThrow()
  
  return {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  }
}

/**
 * Development helper to show current environment status
 */
export function logEnvironmentStatus(): void {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔧 Environment Status:')
    console.log(`  • Node Environment: ${process.env.NODE_ENV}`)
    console.log(`  • Supabase URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}`)
    console.log(`  • Supabase Key: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}`)
    console.log(`  • Custom Key: ${process.env.CUSTOM_KEY ? '✅ Set' : 'ℹ️  Optional'}`)
    console.log('')
  }
} 