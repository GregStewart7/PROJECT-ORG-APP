'use client'

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { CheckCircle, Clock, FileText, FolderOpen } from "lucide-react";

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If user is authenticated, middleware will redirect to /projects
  // This page is only for unauthenticated users
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <FolderOpen className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">ProjectHub</h1>
          </div>
          <nav className="flex space-x-4">
            <Button variant="ghost" asChild>
              <Link href="/auth/login">Login</Link>
            </Button>
            <Button asChild>
              <Link href="/auth/signup">Get Started</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Organize Your Projects Like a Pro
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Take control of your project management with our intuitive platform. 
            Track multiple projects, manage tasks with priorities, and keep detailed notes - all in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link href="/auth/signup">Start Managing Projects</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/auth/login">Already have an account?</Link>
            </Button>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="text-center">
            <CardHeader>
              <FolderOpen className="h-12 w-12 text-primary mx-auto mb-4" />
              <CardTitle>Project Organization</CardTitle>
              <CardDescription>
                Manage multiple projects with clear due dates and progress tracking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>✓ Unlimited projects</li>
                <li>✓ Due date management</li>
                <li>✓ Easy project switching</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <CheckCircle className="h-12 w-12 text-primary mx-auto mb-4" />
              <CardTitle>Task Management</CardTitle>
              <CardDescription>
                Break down projects into manageable tasks with priority levels
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>✓ Priority levels (High, Medium, Low)</li>
                <li>✓ Task completion tracking</li>
                <li>✓ Optional due dates</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <FileText className="h-12 w-12 text-primary mx-auto mb-4" />
              <CardTitle>Detailed Notes</CardTitle>
              <CardDescription>
                Keep comprehensive notes for each task to track progress and ideas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>✓ Rich text notes</li>
                <li>✓ Task-specific organization</li>
                <li>✓ Easy search and access</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="mt-24 text-center">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-3xl">Ready to Get Organized?</CardTitle>
              <CardDescription className="text-lg">
                Join thousands of professionals who trust ProjectHub to manage their work efficiently.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button size="lg" className="w-full sm:w-auto" asChild>
                <Link href="/auth/signup">Create Your Free Account</Link>
              </Button>
              <p className="text-sm text-muted-foreground mt-4">
                No credit card required. Start organizing in seconds.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-background/80 backdrop-blur-sm mt-24">
        <div className="container mx-auto px-4 py-8 text-center text-muted-foreground">
          <p>&copy; 2024 ProjectHub. Built for productivity enthusiasts.</p>
        </div>
      </footer>
    </div>
  );
}
