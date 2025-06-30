import { createClientComponentClient } from './supabase'
import type { User } from '@supabase/supabase-js'
import { ApiResponse } from '@/types'

// Types for authentication functions
export interface SignUpData {
  email: string
  password: string
}

export interface SignInData {
  email: string
  password: string
}

export interface AuthUser extends User {
  // Add any additional user properties if needed
  email_confirmed?: boolean
}

/**
 * Sign up a new user with email and password
 */
export async function signUp({ email, password }: SignUpData): Promise<ApiResponse<{ user: AuthUser | null; needsConfirmation: boolean }>> {
  try {
    const supabase = createClientComponentClient()
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    })

    if (error) {
      return {
        success: false,
        error: error.message
      }
    }

    return {
      success: true,
      data: {
        user: data.user as AuthUser,
        needsConfirmation: !data.session // If no session, email confirmation is needed
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }
  }
}

/**
 * Sign in an existing user with email and password
 */
export async function signIn({ email, password }: SignInData): Promise<ApiResponse<{ user: AuthUser }>> {
  try {
    const supabase = createClientComponentClient()
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      return {
        success: false,
        error: error.message
      }
    }

    if (!data.user) {
      return {
        success: false,
        error: 'No user returned from sign in'
      }
    }

    return {
      success: true,
      data: {
        user: data.user as AuthUser
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }
  }
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<ApiResponse<null>> {
  try {
    const supabase = createClientComponentClient()
    
    const { error } = await supabase.auth.signOut()

    if (error) {
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
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }
  }
}

/**
 * Get the current authenticated user
 */
export async function getCurrentUser(): Promise<ApiResponse<{ user: AuthUser | null }>> {
  try {
    const supabase = createClientComponentClient()
    
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error) {
      return {
        success: false,
        error: error.message
      }
    }

    return {
      success: true,
      data: {
        user: user as AuthUser
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }
  }
}

/**
 * Get the current session
 */
export async function getSession() {
  try {
    const supabase = createClientComponentClient()
    
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error) {
      return {
        success: false,
        error: error.message
      }
    }

    return {
      success: true,
      data: { session }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }
  }
}

/**
 * Send password reset email
 */
export async function resetPassword(email: string): Promise<ApiResponse<null>> {
  try {
    const supabase = createClientComponentClient()
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    })

    if (error) {
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
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }
  }
}

/**
 * Update user password (requires current session)
 */
export async function updatePassword(newPassword: string): Promise<ApiResponse<null>> {
  try {
    const supabase = createClientComponentClient()
    
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (error) {
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
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }
  }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(user: AuthUser | null): boolean {
  return user !== null
}

/**
 * Client-side hook for getting current user (for React components)
 */
export function useSupabaseClient() {
  return createClientComponentClient()
}

/**
 * Subscribe to authentication state changes
 */
export function onAuthStateChange(callback: (user: AuthUser | null) => void) {
  const supabase = createClientComponentClient()

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(async (event, session) => {
    const currentUser = session?.user ?? null
    callback(currentUser as AuthUser | null)
  })

  return subscription
}

/**
 * Validation helpers
 */
export const authValidation = {
  email: (email: string): string | null => {
    if (!email) return 'Email is required'
    if (!email.includes('@')) return 'Please enter a valid email address'
    if (email.length < 5) return 'Email must be at least 5 characters'
    return null
  },
  
  password: (password: string): string | null => {
    if (!password) return 'Password is required'
    if (password.length < 6) return 'Password must be at least 6 characters'
    return null
  },
  
  confirmPassword: (password: string, confirmPassword: string): string | null => {
    if (!confirmPassword) return 'Please confirm your password'
    if (password !== confirmPassword) return 'Passwords do not match'
    return null
  }
} 