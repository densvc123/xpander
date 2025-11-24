"use client"

import { useState } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import {
  Plus,
  Search,
  MoreVertical,
  Calendar,
  CheckCircle2,
  LayoutGrid,
  List
} from "lucide-react"
import Link from "next/link"
import { formatDate, getStatusColor, getProjectHealthColor } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// Mock data
const mockProjects = [
  {
    id: "1",
    name: "XPANDER MVP",
    description: "AI-First Project Operating System for modern teams",
    status: "in_progress" as const,
    health: "healthy" as const,
    progress: 45,
    tasksCompleted: 18,
    totalTasks: 40,
    deadline: "2024-02-15",
    created_at: "2024-01-01"
  },
  {
    id: "2",
    name: "Mobile App Redesign",
    description: "Complete UI/UX overhaul of the mobile application",
    status: "planning" as const,
    health: "at_risk" as const,
    progress: 15,
    tasksCompleted: 3,
    totalTasks: 25,
    deadline: "2024-03-01",
    created_at: "2024-01-10"
  },
  {
    id: "3",
    name: "API Integration",
    description: "Third-party API integrations for payment and analytics",
    status: "in_progress" as const,
    health: "healthy" as const,
    progress: 72,
    tasksCompleted: 28,
    totalTasks: 35,
    deadline: "2024-01-30",
    created_at: "2023-12-15"
  },
  {
    id: "4",
    name: "Documentation Portal",
    description: "Interactive documentation site for developers",
    status: "completed" as const,
    health: "healthy" as const,
    progress: 100,
    tasksCompleted: 20,
    totalTasks: 20,
    deadline: "2024-01-15",
    created_at: "2023-11-20"
  },
]

export default function ProjectsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"cards" | "list">("cards")
  const [statusFilter, setStatusFilter] = useState<"all" | "planning" | "in_progress" | "completed" | "on_hold">("all")

  const filteredProjects = mockProjects.filter(project =>
    (project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase())) &&
    (statusFilter === "all" ? true : project.status === statusFilter)
  )

  return (
    <MainLayout title="Projects">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">All Projects</h2>
            <p className="text-gray-500">{mockProjects.length} projects total</p>
          </div>
          <Link href="/projects/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </Link>
        </div>

        {/* Filters & View options */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search projects..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={statusFilter}
              onValueChange={(value) =>
                setStatusFilter(value as typeof statusFilter)
              }
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="planning">Planning</SelectItem>
                <SelectItem value="in_progress">In progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="on_hold">On hold</SelectItem>
              </SelectContent>
            </Select>
            <div className="inline-flex rounded-md border bg-white">
              <Button
                type="button"
                size="icon"
                variant={viewMode === "cards" ? "default" : "ghost"}
                className="h-9 w-9 rounded-none"
                onClick={() => setViewMode("cards")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant={viewMode === "list" ? "default" : "ghost"}
                className="h-9 w-9 rounded-none border-l"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Projects */}
        {filteredProjects.length > 0 && viewMode === "cards" && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project) => (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{project.name}</CardTitle>
                        <CardDescription className="line-clamp-2">
                          {project.description}
                        </CardDescription>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(project.status)}>
                          {project.status.replace("_", " ")}
                        </Badge>
                        <span className={`text-sm ${getProjectHealthColor(project.health)}`}>
                          {project.health === "healthy" ? "Healthy" :
                           project.health === "at_risk" ? "At Risk" : "Critical"}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Progress</span>
                          <span className="font-medium">{project.progress}%</span>
                        </div>
                        <Progress value={project.progress} className="h-2" />
                      </div>

                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <CheckCircle2 className="h-4 w-4" />
                          <span>{project.tasksCompleted}/{project.totalTasks} tasks</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(project.deadline)}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {filteredProjects.length > 0 && viewMode === "list" && (
          <Card>
            <CardContent className="p-0">
              <div className="hidden border-b bg-gray-50 px-4 py-2 text-xs font-medium text-gray-500 md:grid md:grid-cols-6">
                <span>Project</span>
                <span>Status</span>
                <span>Health</span>
                <span>Progress</span>
                <span>Tasks</span>
                <span>Deadline</span>
              </div>
              <div className="divide-y">
                {filteredProjects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="block hover:bg-gray-50"
                  >
                    <div className="flex flex-col gap-2 px-4 py-3 text-sm text-gray-700 md:grid md:grid-cols-6 md:items-center">
                      <div className="font-medium text-gray-900">
                        {project.name}
                        <p className="text-xs text-gray-500 line-clamp-1">
                          {project.description}
                        </p>
                      </div>
                      <div className="flex items-center">
                        <Badge className={getStatusColor(project.status)}>
                          {project.status.replace("_", " ")}
                        </Badge>
                      </div>
                      <div className="text-xs md:text-sm">
                        <span className={getProjectHealthColor(project.health)}>
                          {project.health === "healthy" ? "Healthy" :
                           project.health === "at_risk" ? "At Risk" : "Critical"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>{project.progress}%</span>
                        <Progress value={project.progress} className="h-1.5 w-24" />
                      </div>
                      <div className="text-xs md:text-sm">
                        {project.tasksCompleted}/{project.totalTasks} tasks
                      </div>
                      <div className="flex items-center gap-1 text-xs md:text-sm">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(project.deadline)}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {filteredProjects.length === 0 && (
          <Card className="py-12">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900">No projects found</h3>
              <p className="text-gray-500 mt-1">
                {searchQuery
                  ? "Try adjusting your search query"
                  : "Get started by creating your first project"}
              </p>
              {!searchQuery && (
                <Link href="/projects/new">
                  <Button className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Project
                  </Button>
                </Link>
              )}
            </div>
          </Card>
        )}
      </div>
    </MainLayout>
  )
}
