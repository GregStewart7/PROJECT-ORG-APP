'use client'

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FolderOpen, Eye, EyeOff, AlertCircle } from "lucide-react"
import { useRedirectIfAuthenticated } from "@/contexts/AuthContext"
import { authValidation, signUp } from "@/lib/auth"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function SignupPage() {
  // Redirect to projects if user is already authenticated
  const { loading } = useRedirectIfAuthenticated()
  const router = useRouter()
  
  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [signupSuccess, setSignupSuccess] = useState(false)
  
  // Error state
  const [errors, setErrors] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    general: ''
  })
  const [touched, setTouched] = useState({
    email: false,
    password: false,
    confirmPassword: false
  })

  // Validation function
  const validateField = (name: string, value: string) => {
    switch (name) {
      case 'email':
        return authValidation.email(value)
      case 'password':
        return authValidation.password(value)
      case 'confirmPassword':
        return authValidation.confirmPassword(formData.password, value)
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
      confirmPassword: '',
      general: ''
    })

    // Mark all fields as touched
    setTouched({
      email: true,
      password: true,
      confirmPassword: true
    })

    // Validate all fields
    const emailError = authValidation.email(formData.email)
    const passwordError = authValidation.password(formData.password)
    const confirmPasswordError = authValidation.confirmPassword(formData.password, formData.confirmPassword)

    // Set field errors
    const newErrors = {
      email: emailError || '',
      password: passwordError || '',
      confirmPassword: confirmPasswordError || '',
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
      // Call Supabase signup
      const result = await signUp({
        email: formData.email,
        password: formData.password
      })

      if (result.success && result.data) {
        // Check if email confirmation is needed
        if (result.data.needsConfirmation) {
          setSignupSuccess(true)
        } else {
          // User is immediately signed in, redirect to projects
          router.push('/projects')
        }
      } else {
        // Handle signup error
        setErrors(prev => ({
          ...prev,
          general: result.error || 'An unexpected error occurred during signup'
        }))
      }
    } catch (error) {
      // Handle unexpected errors
      setErrors(prev => ({
        ...prev,
        general: 'An unexpected error occurred. Please try again.'
      }))
      console.error('Signup error:', error)
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

  // Show success screen if signup was successful but needs email confirmation
  if (signupSuccess) {
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

          {/* Success Card */}
          <Card>
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <CardTitle className="text-2xl">Check Your Email</CardTitle>
              <CardDescription>
                We've sent a confirmation link to <strong>{formData.email}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">
                Please click the link in your email to verify your account and complete the signup process.
              </p>
              <p className="text-sm text-muted-foreground">
                Can't find the email? Check your spam folder or{" "}
                <button 
                  onClick={() => setSignupSuccess(false)}
                  className="text-primary hover:underline font-medium"
                >
                  try again
                </button>
              </p>
            </CardContent>
          </Card>

          {/* Footer Links */}
          <div className="text-center mt-6">
            <p className="text-sm text-muted-foreground">
              Already confirmed your email?{" "}
              <Link 
                href="/auth/login" 
                className="text-primary hover:underline font-medium"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </div>
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

        {/* Signup Card */}
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Create Your Account</CardTitle>
            <CardDescription>
              Start organizing your projects and tasks today
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
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
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

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                    disabled={isSubmitting}
                    className={`pr-10 ${errors.confirmPassword ? "border-destructive focus-visible:ring-destructive" : ""}`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isSubmitting}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.confirmPassword}
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
                    Creating Account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>

              {/* Terms Notice */}
              <p className="text-xs text-muted-foreground text-center">
                By creating an account, you agree to our Terms of Service and Privacy Policy
              </p>
            </form>
          </CardContent>
        </Card>

        {/* Footer Links */}
        <div className="text-center mt-6">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link 
              href="/auth/login" 
              className="text-primary hover:underline font-medium"
            >
              Sign in here
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