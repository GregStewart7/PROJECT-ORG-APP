'use client'

import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/AuthContext"
import { FolderOpen, LogOut, User, Sparkles, Crown } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export function AuthHeader() {
  const { user, signOut, loading } = useAuth()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await signOut()
      // signOut in AuthContext already handles redirect
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  if (loading) {
    return (
      <header className="border-b border-gray-200/50 bg-white/80 backdrop-blur-xl sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="animate-pulse flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-200 to-blue-100 rounded-xl"></div>
              <div className="w-32 h-7 bg-gradient-to-r from-gray-200 to-gray-100 rounded-lg"></div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-24 h-5 bg-gray-150 rounded"></div>
              <div className="w-20 h-9 bg-gradient-to-r from-gray-200 to-gray-100 rounded-lg"></div>
            </div>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="relative border-b border-gray-200/50 bg-white/80 backdrop-blur-xl sticky top-0 z-50 shadow-sm">
      {/* Gradient background decoration */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-50/30 via-white to-indigo-50/20 pointer-events-none" />
      
      <div className="container mx-auto px-4 py-4 flex justify-between items-center relative z-10">
        {/* Enhanced Logo */}
        <Link 
          href="/projects" 
          className="group flex items-center space-x-3 hover:opacity-90 transition-all duration-200 hover:scale-105"
        >
          <div className="relative">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg group-hover:shadow-xl transition-all duration-200 group-hover:scale-110">
              <FolderOpen className="h-6 w-6 text-white" />
            </div>
            {/* Premium badge */}
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
              <Crown className="h-2 w-2 text-white" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-900 bg-clip-text text-transparent group-hover:from-blue-700 group-hover:to-indigo-800 transition-all duration-200">
              ProjectHub
            </span>
            <span className="text-xs text-blue-600 font-medium opacity-80">
              Professional Edition
            </span>
          </div>
        </Link>

        {/* Enhanced User Section with better mobile responsiveness */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {user && (
            <>
              {/* Enhanced User Info - Responsive design */}
              <div className="hidden md:flex items-center space-x-3 px-3 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-gray-50/80 to-blue-50/60 border border-gray-200/50 backdrop-blur-sm">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md">
                  <User className="h-4 w-4 text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900 max-w-[120px] truncate">{user.email}</span>
                  <div className="flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-blue-500" />
                    <span className="text-xs text-blue-600 font-medium">Pro User</span>
                  </div>
                </div>
              </div>

              {/* Mobile User Indicator */}
              <div className="md:hidden flex items-center space-x-2 px-3 py-2 rounded-xl bg-gradient-to-r from-gray-50/80 to-blue-50/60 border border-gray-200/50 backdrop-blur-sm">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md">
                  <User className="h-4 w-4 text-white" />
                </div>
                <div className="flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-blue-500" />
                </div>
              </div>

              {/* Enhanced Logout Button - Responsive */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex items-center space-x-1 sm:space-x-2 h-9 sm:h-10 px-3 sm:px-4 bg-white/70 hover:bg-gray-50/80 border-gray-200/60 hover:border-gray-300/80 transition-all duration-200 hover:shadow-md backdrop-blur-sm text-xs sm:text-sm"
              >
                {isLoggingOut ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-2 border-blue-600 border-t-transparent"></div>
                    <span className="hidden sm:inline-block font-medium">Signing out...</span>
                    <span className="sm:hidden font-medium">Out...</span>
                  </>
                ) : (
                  <>
                    <LogOut className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600" />
                    <span className="hidden sm:inline-block font-medium text-gray-700">Sign Out</span>
                    <span className="sm:hidden font-medium text-gray-700">Out</span>
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
} 