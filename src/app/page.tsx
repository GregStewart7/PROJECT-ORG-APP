'use client'

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { CheckCircle, FileText, FolderOpen, Sparkles, Crown, Zap, Star, ArrowRight, Users, Shield } from "lucide-react";

// Loading component for better performance
function PageSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/40">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
      <span className="sr-only">Loading ProjectHub...</span>
    </div>
  );
}

export default function Home() {
  const { loading } = useAuth();

  if (loading) {
    return <PageSkeleton />;
  }

  // If user is authenticated, middleware will redirect to /projects
  // This page is only for unauthenticated users
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/40">
      {/* Enhanced Header with better mobile responsiveness */}
      <header className="relative border-b border-gray-200/50 bg-white/80 backdrop-blur-xl sticky top-0 z-50 shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50/30 via-white to-indigo-50/20 pointer-events-none" />
        <div className="container mx-auto px-4 py-3 sm:py-4 flex justify-between items-center relative z-10">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="relative">
              <div className="p-1.5 sm:p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
                <FolderOpen className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                <Crown className="h-1.5 w-1.5 sm:h-2 sm:w-2 text-white" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-900 bg-clip-text text-transparent">
                ProjectHub
              </span>
              <span className="text-xs text-blue-600 font-medium opacity-80">
                Professional Edition
              </span>
            </div>
          </div>
          <nav className="flex space-x-2 sm:space-x-3">
            <Button 
              variant="ghost" 
              size="sm"
              className="hover:bg-blue-50/80 transition-all duration-200 text-sm sm:text-base" 
              asChild
            >
              <Link href="/auth/login">Login</Link>
            </Button>
            <Button 
              size="sm"
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 text-sm sm:text-base" 
              asChild
            >
              <Link href="/auth/signup">Get Started</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Enhanced Hero Section with better responsive design */}
      <main className="container mx-auto px-4 py-12 sm:py-16">
        <div className="text-center max-w-5xl mx-auto">
          <div className="relative mb-6 sm:mb-8">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-blue-400/20 to-purple-400/10 rounded-full blur-3xl -z-10" />
            <div className="flex items-center justify-center gap-2 mb-4 sm:mb-6">
              <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 border border-blue-200/50">
                <Star className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">Free & Open Source</span>
              </div>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-900 bg-clip-text text-transparent leading-tight">
              Organize Your Projects<br />
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Like a Pro</span>
            </h1>
          </div>
          <p className="text-lg sm:text-xl text-gray-600 mb-6 sm:mb-8 max-w-3xl mx-auto leading-relaxed px-4">
            Take control of your project management with our intuitive platform. 
            Track multiple projects, manage tasks with priorities, and keep detailed notes - all in one beautifully designed workspace.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-12 sm:mb-16 px-4">
            <Button 
              size="lg" 
              className="h-12 sm:h-14 px-6 sm:px-8 text-base sm:text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-xl hover:shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 hover:scale-105"
              asChild
            >
              <Link href="/auth/signup">
                <Zap className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                Start Managing Projects
                <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 ml-2" />
              </Link>
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="h-12 sm:h-14 px-6 sm:px-8 text-base sm:text-lg font-semibold bg-white/70 hover:bg-gray-50/80 border-gray-200/60 hover:border-gray-300/80 backdrop-blur-sm transition-all duration-200 hover:shadow-lg"
              asChild
            >
              <Link href="/auth/login">Already have an account?</Link>
            </Button>
          </div>
        </div>

        {/* Enhanced Features Section with improved mobile layout */}
        <div className="mt-16 sm:mt-24 grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          <Card className="relative overflow-hidden group transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-2 bg-white/80 backdrop-blur-sm border-gray-200/50">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-white to-purple-50/20 pointer-events-none" />
            <CardHeader className="text-center relative z-10 pb-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-200">
                <FolderOpen className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
              </div>
              <CardTitle className="text-lg sm:text-xl font-bold text-gray-900">Project Organization</CardTitle>
              <CardDescription className="text-gray-600 text-sm sm:text-base">
                Manage multiple projects with clear due dates and progress tracking
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10 pt-0">
              <ul className="text-sm text-gray-600 space-y-2.5 sm:space-y-3">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0"></div>
                  <span>Unlimited projects</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0"></div>
                  <span>Due date management</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0"></div>
                  <span>Easy project switching</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden group transition-all duration-300 hover:shadow-xl hover:shadow-green-500/10 hover:-translate-y-2 bg-white/80 backdrop-blur-sm border-gray-200/50">
            <div className="absolute inset-0 bg-gradient-to-br from-green-50/30 via-white to-emerald-50/20 pointer-events-none" />
            <CardHeader className="text-center relative z-10 pb-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-200">
                <CheckCircle className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
              </div>
              <CardTitle className="text-lg sm:text-xl font-bold text-gray-900">Task Management</CardTitle>
              <CardDescription className="text-gray-600 text-sm sm:text-base">
                Break down projects into manageable tasks with priority levels
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10 pt-0">
              <ul className="text-sm text-gray-600 space-y-2.5 sm:space-y-3">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0"></div>
                  <span>Priority levels (High, Medium, Low)</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0"></div>
                  <span>Task completion tracking</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0"></div>
                  <span>Optional due dates</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden group transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10 hover:-translate-y-2 bg-white/80 backdrop-blur-sm border-gray-200/50">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50/30 via-white to-indigo-50/20 pointer-events-none" />
            <CardHeader className="text-center relative z-10 pb-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-200">
                <FileText className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
              </div>
              <CardTitle className="text-lg sm:text-xl font-bold text-gray-900">Detailed Notes</CardTitle>
              <CardDescription className="text-gray-600 text-sm sm:text-base">
                Keep comprehensive notes for each task to track progress and ideas
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10 pt-0">
              <ul className="text-sm text-gray-600 space-y-2.5 sm:space-y-3">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full flex-shrink-0"></div>
                  <span>Rich text notes</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full flex-shrink-0"></div>
                  <span>Task-specific organization</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full flex-shrink-0"></div>
                  <span>Easy search and access</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced CTA Section with better responsive design */}
        <div className="mt-16 sm:mt-24 text-center px-4">
          <Card className="max-w-4xl mx-auto relative overflow-hidden bg-white/80 backdrop-blur-xl border-gray-200/50 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-white to-indigo-50/30 pointer-events-none" />
            <div className="absolute top-4 right-4 w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-blue-400/10 to-purple-400/5 rounded-full blur-2xl" />
            <CardHeader className="relative z-10 px-4 sm:px-6 pt-6 sm:pt-8 pb-4 sm:pb-6">
              <div className="flex items-center justify-center gap-2 mb-3 sm:mb-4">
                <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                <span className="text-sm font-medium text-blue-700 px-3 py-1 rounded-full bg-blue-100/80">Ready to Get Started?</span>
              </div>
              <CardTitle className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-blue-800 bg-clip-text text-transparent leading-tight pb-2">
                Join thousands of professionals
              </CardTitle>
              <CardDescription className="text-gray-600 text-base sm:text-lg max-w-2xl mx-auto">
                Start organizing your projects today. No credit card required.
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10 px-4 sm:px-6 pb-6 sm:pb-8">
              {/* Enhanced Statistics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
                <div className="text-center p-3 sm:p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200/50">
                  <div className="text-lg sm:text-2xl font-bold text-blue-700">100%</div>
                  <div className="text-xs sm:text-sm text-blue-600 font-medium">Free</div>
                </div>
                <div className="text-center p-3 sm:p-4 rounded-xl bg-gradient-to-br from-green-50 to-green-100/50 border border-green-200/50">
                  <div className="text-lg sm:text-2xl font-bold text-green-700">⚡</div>
                  <div className="text-xs sm:text-sm text-green-600 font-medium">Cloud Sync</div>
                </div>
                <div className="text-center p-3 sm:p-4 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-200/50">
                  <div className="text-lg sm:text-2xl font-bold text-purple-700">∞</div>
                  <div className="text-xs sm:text-sm text-purple-600 font-medium">Unlimited Projects</div>
                </div>
                <div className="text-center p-3 sm:p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100/50 border border-indigo-200/50">
                  <div className="text-lg sm:text-2xl font-bold text-indigo-700">
                    <Shield className="h-5 w-5 sm:h-6 sm:w-6 mx-auto" />
                  </div>
                  <div className="text-xs sm:text-sm text-indigo-600 font-medium">Secure</div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                <Button 
                  size="lg" 
                  className="h-12 sm:h-14 px-6 sm:px-8 text-base sm:text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-xl hover:shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 hover:scale-105"
                  asChild
                >
                  <Link href="/auth/signup">
                    <Users className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                    Create Free Account
                    <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 ml-2" />
                  </Link>
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="h-12 sm:h-14 px-6 sm:px-8 text-base sm:text-lg font-semibold bg-white/70 hover:bg-gray-50/80 border-gray-200/60 hover:border-gray-300/80 backdrop-blur-sm transition-all duration-200 hover:shadow-lg"
                  asChild
                >
                  <Link href="/auth/login">Sign In</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Footer */}
        <footer className="mt-16 sm:mt-24 text-center text-gray-500 text-sm">
          <div className="border-t border-gray-200 pt-6 sm:pt-8">
            <p className="mb-2">
              Built with ❤️ for project management enthusiasts
            </p>
            <p className="text-xs">
              © 2024 ProjectHub Professional Edition. Open source project management platform.
            </p>
          </div>
        </footer>
      </main>
    </div>
  )
}
