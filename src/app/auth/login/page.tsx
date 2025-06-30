'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Mail, Lock, Crown, ArrowRight, Shield, Zap } from 'lucide-react'

import { signIn } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Focus management
  const emailInputRef = useRef<HTMLInputElement>(null)
  const errorRef = useRef<HTMLDivElement>(null)

  // Focus email input on mount
  useEffect(() => {
    emailInputRef.current?.focus()
  }, [])

  // Focus error message when it appears
  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.focus()
    }
  }, [error])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const result = await signIn({ email, password })

    if (result.success) {
      // Announce success to screen readers
      const announcement = document.createElement('div')
      announcement.setAttribute('aria-live', 'polite')
      announcement.setAttribute('aria-atomic', 'true')
      announcement.className = 'sr-only'
      announcement.textContent = 'Sign in successful. Redirecting to projects page.'
      document.body.appendChild(announcement)
      
      setTimeout(() => document.body.removeChild(announcement), 1000)
      router.push('/projects')
    } else {
      setError(result.error || 'Failed to sign in')
    }

    setLoading(false)
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Allow ESC to clear error
    if (e.key === 'Escape' && error) {
      setError(null)
    }
  }

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4 relative overflow-hidden"
      onKeyDown={handleKeyDown}
    >
      {/* Background decorative elements - hidden from screen readers */}
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-300/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-700">
        <Card className="backdrop-blur-xl bg-white/80 border-white/20 shadow-2xl">
          <CardHeader className="text-center pb-8">
            {/* ProjectHub Branding - enhanced for accessibility */}
            <div className="flex items-center justify-center gap-3 mb-4" role="banner">
              <div className="relative" aria-label="ProjectHub logo">
                <div className="p-3 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl shadow-lg">
                  <Crown className="size-8 text-white" aria-hidden="true" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center" aria-label="Premium badge">
                  <div className="w-2 h-2 bg-white rounded-full" aria-hidden="true"></div>
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-700 to-purple-700 bg-clip-text text-transparent">
                  ProjectHub
                </h1>
                <p className="text-xs text-gray-600 font-medium" aria-label="Professional Edition">Professional Edition</p>
              </div>
            </div>

            <CardTitle className="text-3xl font-bold text-gray-900 mb-2" id="login-title">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-gray-600 text-lg" aria-describedby="login-title">
              Sign in to your professional workspace
            </CardDescription>
          </CardHeader>

          <CardContent>
            {error && (
              <div 
                ref={errorRef}
                className="mb-6 p-4 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl animate-in slide-in-from-top-2 duration-300"
                role="alert"
                aria-live="assertive"
                aria-atomic="true"
                tabIndex={-1}
              >
                <p className="text-red-800 font-medium text-center">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6" noValidate aria-labelledby="login-title">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                  Email Address *
                </Label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none" aria-hidden="true">
                    <Mail className="size-5 text-gray-400 group-focus-within:text-blue-600 transition-colors duration-200" />
                  </div>
                  <Input
                    ref={emailInputRef}
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    required
                    aria-required="true"
                    aria-invalid={error ? 'true' : 'false'}
                    aria-describedby={error ? 'email-error' : 'email-validation'}
                    className="pl-10 pr-4 h-12 bg-white/70 backdrop-blur-sm border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                    autoComplete="email"
                  />
                  <div 
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    aria-hidden="true"
                  >
                    <div 
                      className={`w-2 h-2 rounded-full transition-all duration-200 ${email && email.includes('@') ? 'bg-green-500' : 'bg-gray-300'}`}
                      aria-label={email && email.includes('@') ? 'Valid email format' : 'Invalid email format'}
                    ></div>
                  </div>
                </div>
                <div id="email-validation" className="sr-only" aria-live="polite">
                  {email && email.includes('@') ? 'Valid email format' : ''}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                  Password *
                </Label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none" aria-hidden="true">
                    <Lock className="size-5 text-gray-400 group-focus-within:text-blue-600 transition-colors duration-200" />
                  </div>
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    required
                    aria-required="true"
                    aria-invalid={error ? 'true' : 'false'}
                    aria-describedby="password-validation password-toggle"
                    className="pl-10 pr-12 h-12 bg-white/70 backdrop-blur-sm border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-blue-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 rounded"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-describedby="password-toggle"
                  >
                    {showPassword ? (
                      <EyeOff className="size-5 text-gray-400" aria-hidden="true" />
                    ) : (
                      <Eye className="size-5 text-gray-400" aria-hidden="true" />
                    )}
                  </button>
                  <div 
                    className="absolute inset-y-0 right-10 pr-3 flex items-center"
                    aria-hidden="true"
                  >
                    <div 
                      className={`w-2 h-2 rounded-full transition-all duration-200 ${password.length >= 6 ? 'bg-green-500' : 'bg-gray-300'}`}
                      aria-label={password.length >= 6 ? 'Strong password' : 'Password too short'}
                    ></div>
                  </div>
                </div>
                <div id="password-validation" className="sr-only" aria-live="polite">
                  {password.length >= 6 ? 'Password meets minimum requirements' : password.length > 0 ? 'Password must be at least 6 characters' : ''}
                </div>
                <div id="password-toggle" className="sr-only">
                  Password visibility can be toggled with the button next to the input field
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading || !email || !password}
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold text-lg transition-all duration-300 hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2"
                aria-describedby="submit-status"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"
                      aria-hidden="true"
                    ></div>
                    <span>Signing In...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Shield className="size-5" aria-hidden="true" />
                    <span>Sign In</span>
                    <ArrowRight className="size-5" aria-hidden="true" />
                  </div>
                )}
              </Button>
              <div id="submit-status" className="sr-only" aria-live="polite">
                {loading ? 'Signing in, please wait' : ''}
              </div>
            </form>
          </CardContent>

          <CardFooter className="pt-6">
            <div className="w-full space-y-4">
              <div className="relative" role="separator" aria-label="Sign up section">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white/80 text-gray-600 font-medium">New to ProjectHub?</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4" role="list" aria-label="Features">
                <Card 
                  className="p-4 bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200/50 hover:shadow-md transition-all duration-300 hover:scale-105 backdrop-blur-sm focus-within:ring-2 focus-within:ring-blue-500/20"
                  role="listitem"
                >
                  <div className="flex items-center gap-2">
                    <Zap className="size-4 text-blue-600" aria-hidden="true" />
                    <span className="text-sm font-medium text-blue-900">Pro Features</span>
                  </div>
                </Card>
                
                <Card 
                  className="p-4 bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200/50 hover:shadow-md transition-all duration-300 hover:scale-105 backdrop-blur-sm focus-within:ring-2 focus-within:ring-purple-500/20"
                  role="listitem"
                >
                  <div className="flex items-center gap-2">
                    <Shield className="size-4 text-purple-600" aria-hidden="true" />
                    <span className="text-sm font-medium text-purple-900">Secure</span>
                  </div>
                </Card>
              </div>

              <Link
                href="/auth/signup"
                className="block w-full text-center py-3 px-4 bg-white/70 backdrop-blur-sm hover:bg-white/90 border border-gray-200 rounded-xl font-medium text-gray-700 hover:text-blue-600 transition-all duration-300 hover:scale-105 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2"
                aria-label="Create a new ProjectHub account"
              >
                Create Your Account
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
} 