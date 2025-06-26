'use client'

import { AuthHeader } from "@/components/common/AuthHeader"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRequireAuth } from "@/contexts/AuthContext"

export default function ProjectsPage() {
  const { user, loading } = useRequireAuth()

  // No need for manual redirect logic anymore - useRequireAuth handles it

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AuthHeader />
        <main className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardHeader>
                    <div className="h-5 bg-muted rounded w-3/4"></div>
                    <div className="h-4 bg-muted rounded w-full"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-3 bg-muted rounded w-full"></div>
                      <div className="h-3 bg-muted rounded w-2/3"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-background">
      <AuthHeader />
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Page Header */}
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
            <p className="text-muted-foreground">
              Welcome back! Here are your active projects.
            </p>
          </div>

          {/* Projects Grid - Placeholder */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="border-dashed border-2 bg-muted/20">
              <CardHeader>
                <CardTitle className="text-center text-muted-foreground">
                  No Projects Yet
                </CardTitle>
                <CardDescription className="text-center">
                  Your projects will appear here once you create them.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-muted-foreground">
                  Click "Create Project" to get started with your first project.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common tasks to help you get started.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p>• Create your first project</p>
                <p>• Add tasks to track your progress</p>
                <p>• Organize with notes and categories</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
} 