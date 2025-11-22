"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  FolderKanban,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Plus,
  ArrowRight,
  Sparkles
} from "lucide-react"
import Link from "next/link"

// Mock data for demonstration
const stats = [
  { name: "Active Projects", value: 3, icon: FolderKanban, color: "text-blue-600" },
  { name: "Tasks This Week", value: 12, icon: Clock, color: "text-purple-600" },
  { name: "At Risk", value: 1, icon: AlertTriangle, color: "text-amber-600" },
  { name: "Completed", value: 5, icon: CheckCircle2, color: "text-emerald-600" },
]

const recentProjects = [
  {
    id: "1",
    name: "XPANDER MVP",
    status: "in_progress",
    progress: 45,
    health: "healthy",
    tasksCompleted: 18,
    totalTasks: 40,
    deadline: "2024-02-15"
  },
  {
    id: "2",
    name: "Mobile App Redesign",
    status: "planning",
    progress: 15,
    health: "at_risk",
    tasksCompleted: 3,
    totalTasks: 25,
    deadline: "2024-03-01"
  },
  {
    id: "3",
    name: "API Integration",
    status: "in_progress",
    progress: 72,
    health: "healthy",
    tasksCompleted: 28,
    totalTasks: 35,
    deadline: "2024-01-30"
  },
]

const recentInsights = [
  { type: "warning", message: "Mobile App Redesign is at risk due to scope creep", project: "Mobile App Redesign" },
  { type: "suggestion", message: "Consider breaking down the Authentication module into smaller tasks", project: "XPANDER MVP" },
  { type: "info", message: "API Integration is 72% complete, on track for deadline", project: "API Integration" },
]

export default function DashboardPage() {
  return (
    <MainLayout title="Dashboard">
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Welcome back!</h2>
            <p className="text-gray-500">Here's what's happening with your projects today.</p>
          </div>
          <Link href="/projects/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.name}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  {stat.name}
                </CardTitle>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Projects */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Projects</CardTitle>
                  <CardDescription>Your most active projects</CardDescription>
                </div>
                <Link href="/projects">
                  <Button variant="ghost" size="sm">
                    View all
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentProjects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="block"
                  >
                    <div className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-gray-900 truncate">
                            {project.name}
                          </h4>
                          <Badge
                            variant={project.health === "healthy" ? "success" : "warning"}
                          >
                            {project.health === "healthy" ? "Healthy" : "At Risk"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-2">
                          <div className="flex-1">
                            <Progress value={project.progress} className="h-2" />
                          </div>
                          <span className="text-sm text-gray-500 whitespace-nowrap">
                            {project.tasksCompleted}/{project.totalTasks} tasks
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* AI Insights */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-emerald-600" />
                <CardTitle>AI Insights</CardTitle>
              </div>
              <CardDescription>Recent observations and suggestions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentInsights.map((insight, index) => (
                  <div
                    key={index}
                    className="p-3 rounded-lg border border-gray-100"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 p-1 rounded ${
                        insight.type === "warning"
                          ? "bg-amber-100"
                          : insight.type === "suggestion"
                          ? "bg-blue-100"
                          : "bg-gray-100"
                      }`}>
                        {insight.type === "warning" ? (
                          <AlertTriangle className="h-4 w-4 text-amber-600" />
                        ) : insight.type === "suggestion" ? (
                          <Sparkles className="h-4 w-4 text-blue-600" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 text-gray-600" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-gray-700">{insight.message}</p>
                        <p className="text-xs text-gray-400 mt-1">{insight.project}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
}
