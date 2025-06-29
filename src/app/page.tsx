'use client'

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { CheckCircle, Clock, FileText, FolderOpen, Sparkles, Target, TrendingUp, Crown, Zap, Star } from "lucide-react";

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/40">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  // If user is authenticated, middleware will redirect to /projects
  // This page is only for unauthenticated users
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/40">
      {/* Enhanced Header */}
      <header className="relative border-b border-gray-200/50 bg-white/80 backdrop-blur-xl sticky top-0 z-50 shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50/30 via-white to-indigo-50/20 pointer-events-none" />
        <div className="container mx-auto px-4 py-4 flex justify-between items-center relative z-10">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
                <FolderOpen className="h-6 w-6 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                <Crown className="h-2 w-2 text-white" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-900 bg-clip-text text-transparent">
                ProjectHub
              </span>
              <span className="text-xs text-blue-600 font-medium opacity-80">
                Professional Edition
              </span>
            </div>
          </div>
          <nav className="flex space-x-3">
            <Button variant="ghost" className="hover:bg-blue-50/80 transition-all duration-200" asChild>
              <Link href="/auth/login">Login</Link>
            </Button>
            <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105" asChild>
              <Link href="/auth/signup">Get Started</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Enhanced Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center max-w-5xl mx-auto">
          <div className="relative mb-8">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-purple-400/10 rounded-full blur-3xl -z-10" />
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 border border-blue-200/50">
                <Star className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">Free & Open Source</span>
              </div>
            </div>
            <h2 className="text-6xl font-bold mb-6 bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-900 bg-clip-text text-transparent leading-tight">
              Organize Your Projects<br />
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Like a Pro</span>
            </h2>
          </div>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            Take control of your project management with our intuitive platform. 
            Track multiple projects, manage tasks with priorities, and keep detailed notes - all in one beautifully designed workspace.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button 
              size="lg" 
              className="h-14 px-8 text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-xl hover:shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 hover:scale-105"
              asChild
            >
              <Link href="/auth/signup">
                <Zap className="h-5 w-5 mr-2" />
                Start Managing Projects
              </Link>
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="h-14 px-8 text-lg font-semibold bg-white/70 hover:bg-gray-50/80 border-gray-200/60 hover:border-gray-300/80 backdrop-blur-sm transition-all duration-200 hover:shadow-lg"
              asChild
            >
              <Link href="/auth/login">Already have an account?</Link>
            </Button>
          </div>
        </div>

        {/* Enhanced Features Section */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="relative overflow-hidden group transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-2 bg-white/80 backdrop-blur-sm border-gray-200/50">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-white to-purple-50/20 pointer-events-none" />
            <CardHeader className="text-center relative z-10">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-200">
                <FolderOpen className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-xl font-bold text-gray-900">Project Organization</CardTitle>
              <CardDescription className="text-gray-600">
                Manage multiple projects with clear due dates and progress tracking
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              <ul className="text-sm text-gray-600 space-y-3">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                  Unlimited projects
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                  Due date management
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                  Easy project switching
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden group transition-all duration-300 hover:shadow-xl hover:shadow-green-500/10 hover:-translate-y-2 bg-white/80 backdrop-blur-sm border-gray-200/50">
            <div className="absolute inset-0 bg-gradient-to-br from-green-50/30 via-white to-emerald-50/20 pointer-events-none" />
            <CardHeader className="text-center relative z-10">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-200">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-xl font-bold text-gray-900">Task Management</CardTitle>
              <CardDescription className="text-gray-600">
                Break down projects into manageable tasks with priority levels
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              <ul className="text-sm text-gray-600 space-y-3">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                  Priority levels (High, Medium, Low)
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                  Task completion tracking
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                  Optional due dates
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden group transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10 hover:-translate-y-2 bg-white/80 backdrop-blur-sm border-gray-200/50">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50/30 via-white to-indigo-50/20 pointer-events-none" />
            <CardHeader className="text-center relative z-10">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform duration-200">
                <FileText className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-xl font-bold text-gray-900">Detailed Notes</CardTitle>
              <CardDescription className="text-gray-600">
                Keep comprehensive notes for each task to track progress and ideas
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              <ul className="text-sm text-gray-600 space-y-3">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                  Rich text notes
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                  Task-specific organization
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                  Easy search and access
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced CTA Section */}
        <div className="mt-24 text-center">
          <Card className="max-w-3xl mx-auto relative overflow-hidden bg-white/80 backdrop-blur-xl border-gray-200/50 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-white to-indigo-50/30 pointer-events-none" />
            <div className="absolute top-4 right-4 w-24 h-24 bg-gradient-to-br from-blue-400/10 to-purple-400/5 rounded-full blur-2xl" />
            <CardHeader className="relative z-10 px-6 pt-8 pb-6">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Sparkles className="h-6 w-6 text-blue-600" />
                <span className="text-sm font-medium text-blue-700 px-3 py-1 rounded-full bg-blue-100/80">Limited Time Offer</span>
              </div>
              <CardTitle className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 to-blue-800 bg-clip-text text-transparent leading-tight pb-2">
                Ready to Get Organized?
              </CardTitle>
              <CardDescription className="text-xl text-gray-600 leading-relaxed">
                Experience a powerful, intuitive project management solution built with modern technology and designed for productivity.
              </CardDescription>
                          </CardHeader>
            <CardContent className="relative z-10 px-6 pb-8">
              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50/80 to-indigo-50/60 border border-blue-200/30">
                    <div className="text-2xl font-bold text-blue-700">100%</div>
                    <div className="text-sm text-blue-600">Free</div>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-green-50/80 to-emerald-50/60 border border-green-200/30">
                    <div className="text-2xl font-bold text-green-700">⚡</div>
                    <div className="text-sm text-green-600">Cloud Sync</div>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50/80 to-indigo-50/60 border border-purple-200/30">
                    <div className="text-2xl font-bold text-purple-700">∞</div>
                    <div className="text-sm text-purple-600">Unlimited Projects</div>
                  </div>
                </div>
                
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto h-14 px-8 text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-xl hover:shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 hover:scale-105" 
                  asChild
                >
                  <Link href="/auth/signup">
                    <Target className="h-5 w-5 mr-2" />
                    Create Your Free Account
                    <TrendingUp className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
                <p className="text-sm text-gray-500 mt-4">
                  No credit card required. Start organizing in seconds.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Enhanced Footer */}
      <footer className="border-t border-gray-200/50 bg-white/80 backdrop-blur-xl mt-24">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-50/30 via-white to-blue-50/20 pointer-events-none" />
        <div className="container mx-auto px-4 py-8 text-center text-gray-600 relative z-10">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <Crown className="h-3 w-3 text-white" />
            </div>
            <span className="font-semibold">ProjectHub Professional</span>
          </div>
          <p>&copy; 2024 ProjectHub. Built for productivity enthusiasts.</p>
        </div>
      </footer>
    </div>
  );
}
