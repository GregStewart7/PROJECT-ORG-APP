'use client'

import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, AlertCircle, Crown, ArrowRight, CheckCircle2, Mail, Lock, Shield, Zap, User } from "lucide-react"
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/40">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
      </div>
    )
  }

  // Show success screen if signup was successful but needs email confirmation
  if (signupSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-100 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-300/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>

        <div className="relative z-10 w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-700">
          <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-2xl">
            <CardHeader className="text-center pb-8">
              {/* Success Icon */}
              <div className="flex items-center justify-center mb-6">
                <div className="relative">
                  <div className="p-4 bg-gradient-to-br from-green-600 to-emerald-600 rounded-full shadow-lg">
                    <CheckCircle2 className="size-12 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center">
                    <div className="w-3 h-3 bg-white rounded-full"></div>
                  </div>
                </div>
              </div>

              <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
                Check Your Email!
              </CardTitle>
              <CardDescription className="text-gray-600 text-lg">
                                 We&apos;ve sent a confirmation link to your email address
              </CardDescription>
            </CardHeader>

            <CardContent className="text-center space-y-6">
              <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
                <p className="text-gray-700 font-medium mb-2">
                  Almost there! Please check your email
                </p>
                <p className="text-sm text-gray-600">
                  Click the confirmation link in the email we sent to <span className="font-semibold text-green-700">{formData.email}</span> to activate your account.
                </p>
              </div>

              <div className="space-y-4">
                <Button
                  onClick={() => window.location.href = 'mailto:'}
                  className="w-full h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold transition-all duration-300 hover:scale-105"
                >
                  <Mail className="size-5 mr-2" />
                  Open Email App
                </Button>

                <Link
                  href="/auth/login"
                  className="block w-full text-center py-3 px-4 bg-white/70 backdrop-blur-sm hover:bg-white/90 border border-gray-200 rounded-xl font-medium text-gray-700 hover:text-green-600 transition-all duration-300 hover:scale-105 hover:shadow-md"
                >
                  Back to Sign In
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-300/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-700">
        <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-2xl">
          <CardHeader className="text-center pb-8">
            {/* ProjectHub Branding */}
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="relative">
                <div className="p-3 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl shadow-lg">
                  <Crown className="size-8 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-purple-700 bg-clip-text text-transparent">
                  ProjectHub
                </h1>
                <p className="text-xs text-gray-600 font-medium">Professional Edition</p>
              </div>
            </div>

            <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
              Create Account
            </CardTitle>
            <CardDescription className="text-gray-600 text-lg">
              Join thousands of professionals managing projects efficiently
            </CardDescription>
          </CardHeader>

          <CardContent>
            {errors.general && (
              <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl animate-in slide-in-from-top-2 duration-300">
                <p className="text-red-800 font-medium text-center">{errors.general}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                  Email Address
                </Label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="size-5 text-gray-400 group-focus-within:text-blue-600 transition-colors duration-200" />
                  </div>
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
                    className="pl-10 pr-4 h-12 bg-white/70 backdrop-blur-sm border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <div className={`w-2 h-2 rounded-full transition-all duration-200 ${formData.email && formData.email.includes('@') ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  </div>
                </div>
                {errors.email && (
                  <p className="text-xs text-red-600 flex items-center gap-2 animate-in slide-in-from-top-1 duration-200">
                    <AlertCircle className="h-3 w-3 flex-shrink-0" />
                    <span className="font-medium">{errors.email}</span>
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                  Password
                </Label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="size-5 text-gray-400 group-focus-within:text-blue-600 transition-colors duration-200" />
                  </div>
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                    disabled={isSubmitting}
                    className="pl-10 pr-12 h-12 bg-white/70 backdrop-blur-sm border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-blue-600 transition-colors duration-200"
                  >
                    {showPassword ? (
                      <EyeOff className="size-5 text-gray-400" />
                    ) : (
                      <Eye className="size-5 text-gray-400" />
                    )}
                  </button>
                  <div className="absolute inset-y-0 right-10 pr-3 flex items-center">
                    <div className={`w-2 h-2 rounded-full transition-all duration-200 ${formData.password.length >= 6 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  </div>
                </div>
                <p className="text-xs text-gray-500">Must be at least 6 characters long</p>
                {errors.password && (
                  <p className="text-xs text-red-600 flex items-center gap-2 animate-in slide-in-from-top-1 duration-200">
                    <AlertCircle className="h-3 w-3 flex-shrink-0" />
                    <span className="font-medium">{errors.password}</span>
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-700">
                  Confirm Password
                </Label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Shield className="size-5 text-gray-400 group-focus-within:text-blue-600 transition-colors duration-200" />
                  </div>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                    disabled={isSubmitting}
                    className="pl-10 pr-12 h-12 bg-white/70 backdrop-blur-sm border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-blue-600 transition-colors duration-200"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="size-5 text-gray-400" />
                    ) : (
                      <Eye className="size-5 text-gray-400" />
                    )}
                  </button>
                  <div className="absolute inset-y-0 right-10 pr-3 flex items-center">
                    <div className={`w-2 h-2 rounded-full transition-all duration-200 ${formData.confirmPassword && formData.password && formData.confirmPassword === formData.password ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  </div>
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-red-600 flex items-center gap-2 animate-in slide-in-from-top-1 duration-200">
                    <AlertCircle className="h-3 w-3 flex-shrink-0" />
                    <span className="font-medium">{errors.confirmPassword}</span>
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold text-lg transition-all duration-300 hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Creating Account...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <User className="size-5" />
                    Create Account
                    <ArrowRight className="size-5" />
                  </div>
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="pt-6">
            <div className="w-full space-y-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white/80 text-gray-600 font-medium">Why choose ProjectHub?</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200/50 hover:shadow-md transition-all duration-300 hover:scale-105 backdrop-blur-sm">
                  <div className="flex items-center gap-2">
                    <Zap className="size-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">Fast Setup</span>
                  </div>
                </Card>
                
                <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200/50 hover:shadow-md transition-all duration-300 hover:scale-105 backdrop-blur-sm">
                  <div className="flex items-center gap-2">
                    <Shield className="size-4 text-purple-600" />
                    <span className="text-sm font-medium text-purple-900">Enterprise Security</span>
                  </div>
                </Card>
              </div>

              <Link
                href="/auth/login"
                className="block w-full text-center py-3 px-4 bg-white/70 backdrop-blur-sm hover:bg-white/90 border border-gray-200 rounded-xl font-medium text-gray-700 hover:text-blue-600 transition-all duration-300 hover:scale-105 hover:shadow-md"
              >
                Already have an account? Sign In
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
} 