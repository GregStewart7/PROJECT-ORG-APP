'use client'

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FolderOpen, Eye, EyeOff, AlertCircle } from "lucide-react"
import { useRedirectIfAuthenticated } from "@/contexts/AuthContext"
import { authValidation, signIn } from "@/lib/auth"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  // Redirect to projects if user is already authenticated
  const { loading } = useRedirectIfAuthenticated()
  const router = useRouter()
  
  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Error state
  const [errors, setErrors] = useState({
    email: '',
    password: '',
    general: ''
  })
  const [touched, setTouched] = useState({
    email: false,
    password: false
  })

  // Validation function
  const validateField = (name: string, value: string) => {
    switch (name) {
      case 'email':
        return authValidation.email(value)
      case 'password':
        return authValidation.password(value)
      default:
        return null
    }
  }

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    // Clear general error when user starts typing
    if (errors.general) {
      setErrors(prev => ({ ...prev, general: '' }))
    }

    // Validate field if it has been touched
    if (touched[name as keyof typeof touched]) {
      const error = validateField(name, value)
      setErrors(prev => ({
        ...prev,
        [name]: error || ''
      }))
    }
  }

  // Handle field blur (when user leaves the field)
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setTouched(prev => ({ ...prev, [name]: true }))
    
    const error = validateField(name, value)
    setErrors(prev => ({
      ...prev,
      [name]: error || ''
    }))
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Clear previous errors
    setErrors({
      email: '',
      password: '',
      general: ''
    })

    // Mark all fields as touched
    setTouched({
      email: true,
      password: true
    })

    // Validate all fields
    const emailError = authValidation.email(formData.email)
    const passwordError = authValidation.password(formData.password)

    // Set field errors
    const newErrors = {
      email: emailError || '',
      password: passwordError || '',
      general: ''
    }

    // Check if there are any validation errors
    const hasErrors = Object.values(newErrors).some(error => error !== '')
    
    if (hasErrors) {
      setErrors(newErrors)
      setIsSubmitting(false)
      return
    }

    try {
      // Call Supabase signin
      const result = await signIn({
        email: formData.email,
        password: formData.password
      })

      if (result.success && result.data) {
        // Successful login - use enhanced redirect logic
        const searchParams = new URLSearchParams(window.location.search)
        const redirectedFrom = searchParams.get('redirectedFrom')
        const originalParams = searchParams.get('originalParams')
        
        let targetUrl = '/projects' // Default redirect
        
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
      } else {
        // Handle login error
        setErrors(prev => ({
          ...prev,
          general: result.error || 'An unexpected error occurred during login'
        }))
      }
    } catch (error) {
      // Handle unexpected errors
      setErrors(prev => ({
        ...prev,
        general: 'An unexpected error occurred. Please try again.'
      }))
      console.error('Login error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2 mb-6">
            <FolderOpen className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">ProjectHub</span>
          </Link>
        </div>

        {/* Login Card */}
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Welcome Back</CardTitle>
            <CardDescription>
              Sign in to your account to continue managing your projects
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* General Error Message */}
              {errors.general && (
                <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
                  <AlertCircle className="h-4 w-4" />
                  <span>{errors.general}</span>
                </div>
              )}

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  disabled={isSubmitting}
                  className={errors.email ? "border-destructive focus-visible:ring-destructive" : ""}
                />
                {errors.email && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link 
                    href="/auth/forgot-password" 
                    className="text-sm text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                    disabled={isSubmitting}
                    className={`pr-10 ${errors.password ? "border-destructive focus-visible:ring-destructive" : ""}`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isSubmitting}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Signing In...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer Links */}
        <div className="text-center mt-6">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link 
              href="/auth/signup" 
              className="text-primary hover:underline font-medium"
            >
              Sign up here
            </Link>
          </p>
          <p className="text-xs text-muted-foreground mt-4">
            <Link href="/" className="hover:underline">
              ← Back to home
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
} 