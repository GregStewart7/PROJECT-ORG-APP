'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { AuthUser, getCurrentUser, onAuthStateChange } from '@/lib/auth'
import { useRouter } from 'next/navigation'

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Function to refresh user data
  const refreshUser = async () => {
    setLoading(true)
    try {
      const { createClientComponentClient } = await import('@/lib/supabase')
      const supabase = createClientComponentClient()
      
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionData.session && !sessionError) {
        const { data: userData, error: userError } = await supabase.auth.getUser()
        
        if (userData.user && !userError) {
          setUser(userData.user as AuthUser)
          localStorage.setItem('auth-initialized', 'true')
        } else {
          setUser(null)
          localStorage.removeItem('auth-initialized')
        }
      } else {
        setUser(null)
        localStorage.removeItem('auth-initialized')
      }
    } catch (error) {
      console.error('Error refreshing user:', error)
      setUser(null)
      localStorage.removeItem('auth-initialized')
    } finally {
      setLoading(false)
    }
  }

  // Function to handle sign out
  const handleSignOut = async () => {
    setLoading(true)
    try {
      const { signOut } = await import('@/lib/auth')
      const response = await signOut()
      
      if (response.success) {
        setUser(null)
        router.push('/') // Redirect to home page after sign out
      } else {
        console.error('Sign out error:', response.error)
      }
    } catch (error) {
      console.error('Error signing out:', error)
    } finally {
      setLoading(false)
    }
  }

  // Initialize auth state and set up auth state listener
  useEffect(() => {
    let mounted = true

    // Initial user load with session persistence
    const initializeAuth = async () => {
      try {
        // Use Supabase client directly for better session handling
        const { createClientComponentClient } = await import('@/lib/supabase')
        const supabase = createClientComponentClient()
        
        // Get current session first
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
        
        if (mounted) {
          if (sessionData.session && !sessionError) {
            // Session exists, get current user
            const { data: userData, error: userError } = await supabase.auth.getUser()
            
            if (userData.user && !userError) {
              setUser(userData.user as AuthUser)
              localStorage.setItem('auth-initialized', 'true')
            } else {
              console.error('User error:', userError)
              setUser(null)
              localStorage.removeItem('auth-initialized')
            }
          } else {
            // No session found
            setUser(null)
            localStorage.removeItem('auth-initialized')
          }
          setLoading(false)
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
        if (mounted) {
          setUser(null)
          localStorage.removeItem('auth-initialized')
          setLoading(false)
        }
      }
    }

    initializeAuth()

    // Set up auth state change listener for real-time updates
    const subscription = onAuthStateChange((newUser) => {
      if (mounted) {
        setUser(newUser)
        
        // Store authentication state in localStorage for persistence
        if (newUser) {
          localStorage.setItem('auth-initialized', 'true')
        } else {
          localStorage.removeItem('auth-initialized')
        }
        
        // Only set loading to false after we've handled the auth change
        if (loading) {
          setLoading(false)
        }
      }
    })

    // Listen for storage events to sync auth state across tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'supabase.auth.token' && mounted) {
        // Token changed in another tab, refresh our state
        refreshUser()
      }
    }

    window.addEventListener('storage', handleStorageChange)

    // Cleanup function
    return () => {
      mounted = false
      subscription.unsubscribe()
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  const value: AuthContextType = {
    user,
    loading,
    signOut: handleSignOut,
    refreshUser,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Hook to require authentication with improved redirect logic
export function useRequireAuth(redirectTo?: string) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      const currentPath = window.location.pathname
      const searchParams = new URLSearchParams(window.location.search)
      
      // Build login URL with redirect information
      const loginUrl = new URL('/auth/login', window.location.origin)
      
      if (redirectTo) {
        loginUrl.searchParams.set('redirectedFrom', redirectTo)
      } else if (currentPath !== '/auth/login') {
        loginUrl.searchParams.set('redirectedFrom', currentPath)
        
        // Preserve existing search params
        if (searchParams.toString()) {
          loginUrl.searchParams.set('originalParams', searchParams.toString())
        }
      }
      
      router.push(loginUrl.pathname + loginUrl.search)
    }
  }, [user, loading, router, redirectTo])

  return { user, loading }
}

// Hook to redirect authenticated users with enhanced logic
export function useRedirectIfAuthenticated(defaultRedirect: string = '/projects') {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      const searchParams = new URLSearchParams(window.location.search)
      const redirectedFrom = searchParams.get('redirectedFrom')
      const originalParams = searchParams.get('originalParams')
      
      let targetUrl = defaultRedirect
      
      // If there's a valid redirect destination, use it
      if (redirectedFrom) {
        const protectedRoutes = ['/projects', '/dashboard', '/profile', '/settings']
        
        if (protectedRoutes.some(route => redirectedFrom.startsWith(route))) {
          const redirectUrl = new URL(redirectedFrom, window.location.origin)
          
          // Restore original search params
          if (originalParams) {
            const params = new URLSearchParams(originalParams)
            params.forEach((value, key) => {
              redirectUrl.searchParams.set(key, value)
            })
          }
          
          targetUrl = redirectUrl.pathname + redirectUrl.search
        }
      }
      
      router.push(targetUrl)
    }
  }, [user, loading, router, defaultRedirect])

  return { user, loading }
}

// Hook for session persistence check
export function useSessionPersistence() {
  const { user, loading, refreshUser } = useAuth()
  
  useEffect(() => {
    // Check if we should attempt session recovery on page load
    const authInitialized = localStorage.getItem('auth-initialized')
    
    if (!loading && !user && authInitialized) {
      // Attempt to refresh user data if localStorage indicates we should be authenticated
      refreshUser()
    }
  }, [loading, user, refreshUser])
  
  return { user, loading }
} 