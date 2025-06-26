'use client'

import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/AuthContext"
import { FolderOpen, LogOut, User } from "lucide-react"
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
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="animate-pulse flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-muted rounded"></div>
              <div className="w-24 h-6 bg-muted rounded"></div>
            </div>
            <div className="w-20 h-9 bg-muted rounded"></div>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-40">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        {/* Logo */}
        <Link href="/projects" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
          <FolderOpen className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold">ProjectHub</span>
        </Link>

        {/* User Section */}
        <div className="flex items-center space-x-4">
          {user && (
            <>
              {/* User Info */}
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline-block">{user.email}</span>
              </div>

              {/* Logout Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex items-center space-x-2"
              >
                {isLoggingOut ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                    <span className="hidden sm:inline-block">Signing out...</span>
                  </>
                ) : (
                  <>
                    <LogOut className="h-4 w-4" />
                    <span className="hidden sm:inline-block">Sign Out</span>
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