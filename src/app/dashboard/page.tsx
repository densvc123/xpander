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
import { differenceInCalendarDays, format, isValid, parseISO } from "date-fns"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from "recharts"

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
  {
    type: "warning",
    message: "Mobile App Redesign is at risk due to scope creep",
    project: "Mobile App Redesign",
    projectId: "2"
  },
  {
    type: "suggestion",
    message: "Consider breaking down the Authentication module into smaller tasks",
    project: "XPANDER MVP",
    projectId: "1"
  },
  {
    type: "info",
    message: "API Integration is 72% complete, on track for deadline",
    project: "API Integration",
    projectId: "3"
  }
]

type DashboardProject = typeof recentProjects[number]

type FocusItem = {
  id: string
  projectId: string
  projectName: string
  label: string
  tone: "danger" | "warning" | "info"
}

type ProjectPhase = "Plan" | "Development" | "Go-live" | "Warranty" | "Support"

const parseDeadline = (deadline?: string | null): Date | null => {
  if (!deadline) return null
  const parsed = parseISO(deadline)
  return isValid(parsed) ? parsed : null
}

const getDaysToDeadline = (deadline?: string | null): number | null => {
  const date = parseDeadline(deadline)
  if (!date) return null
  return differenceInCalendarDays(date, new Date())
}

const buildFocusItems = (projects: DashboardProject[]): FocusItem[] => {
  const items: FocusItem[] = []

  projects.forEach((project) => {
    const days = getDaysToDeadline(project.deadline)

    if (project.status !== "completed" && days !== null) {
      if (days < 0) {
        items.push({
          id: `${project.id}-overdue`,
          projectId: project.id,
          projectName: project.name,
          label: `Deadline passed ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} ago.`,
          tone: "danger"
        })
      } else if (days <= 7) {
        items.push({
          id: `${project.id}-soon`,
          projectId: project.id,
          projectName: project.name,
          label: `Deadline in ${days} day${days === 1 ? "" : "s"} (${format(parseDeadline(project.deadline)!, "MMM d")}).`,
          tone: "warning"
        })
      }
    }

    if (project.health === "at_risk" || project.health === "critical") {
      items.push({
        id: `${project.id}-risk`,
        projectId: project.id,
        projectName: project.name,
        label: project.health === "critical"
          ? "Marked as critical. Review scope, timeline, and staffing."
          : "Marked as at risk. Check scope changes and key dependencies.",
        tone: "warning"
      })
    }
  })

  return items.slice(0, 5)
}

const getProjectPhase = (project: DashboardProject): ProjectPhase => {
  const days = getDaysToDeadline(project.deadline)

  if (project.status === "planning") {
    return "Plan"
  }

  if (project.status === "in_progress") {
    if (days !== null && days >= 0 && days <= 14) {
      return "Go-live"
    }
    return "Development"
  }

  if (project.status === "completed") {
    if (days !== null && days >= -30) {
      return "Warranty"
    }
    return "Support"
  }

  // on_hold or unknown states are treated as support/long tail
  return "Support"
}

export default function DashboardPage() {
  const activeProjects = recentProjects.filter(
    (p) => p.status === "in_progress" || p.status === "planning"
  ).length
  const atRiskProjects = recentProjects.filter(
    (p) => p.health === "at_risk" || p.health === "critical"
  ).length
  const completedProjects = recentProjects.filter(
    (p) => p.status === "completed"
  ).length
  const openTasks = recentProjects.reduce(
    (total, p) => total + (p.totalTasks - p.tasksCompleted),
    0
  )

  const stats = [
    {
      name: "Active projects",
      value: activeProjects,
      icon: FolderKanban,
      color: "text-blue-600",
      href: "/projects"
    },
    {
      name: "Projects at risk",
      value: atRiskProjects,
      icon: AlertTriangle,
      color: "text-amber-600",
      href: "/projects"
    },
    {
      name: "Open tasks",
      value: openTasks,
      icon: Clock,
      color: "text-purple-600",
      href: "/projects"
    },
    {
      name: "Completed projects",
      value: completedProjects,
      icon: CheckCircle2,
      color: "text-emerald-600",
      href: "/projects"
    },
  ] as const

  const focusItems = buildFocusItems(recentProjects)

  const phaseOrder: ProjectPhase[] = ["Plan", "Development", "Go-live", "Warranty", "Support"]
  const phaseCounts = recentProjects.reduce<Record<ProjectPhase, number>>((acc, project) => {
    const phase = getProjectPhase(project)
    acc[phase] = (acc[phase] || 0) + 1
    return acc
  }, {
    Plan: 0,
    Development: 0,
    "Go-live": 0,
    Warranty: 0,
    Support: 0
  })

  const phaseChartData = phaseOrder.map((phase) => ({
    phase,
    count: phaseCounts[phase]
  }))

  const teamLoad = {
    capacityHours: 160,
    assignedHours: 132,
    utilization: 83,
    overloadedMembers: 1
  }

  return (
    <MainLayout title="Dashboard">
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Welcome back!</h2>
            <p className="text-gray-500">Here&apos;s what&apos;s happening with your projects today.</p>
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
            <Link key={stat.name} href={stat.href} className="block">
              <Card className="hover:bg-gray-50 cursor-pointer transition-colors">
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
            </Link>
          ))}
        </div>

        {/* Today & portfolio snapshot */}
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Today&apos;s focus</CardTitle>
              <CardDescription>
                High-impact items to review across your projects based on status, health and upcoming deadlines.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {focusItems.length === 0 ? (
                <p className="text-sm text-gray-500">
                  Nothing urgent flagged right now. Review project plans or run an AI report if you want a deeper check-in.
                </p>
              ) : (
                <div className="space-y-3">
                  {focusItems.map((item) => (
                    <Link
                      key={item.id}
                      href={`/projects/${item.projectId}`}
                      className="block"
                    >
                      <div className="flex items-start justify-between rounded-lg border border-gray-100 bg-white px-3 py-2 hover:bg-gray-50 transition-colors">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900">{item.projectName}</span>
                          <span className="text-xs text-gray-600">{item.label}</span>
                        </div>
                        <span
                          className={`ml-3 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                            item.tone === "danger"
                              ? "bg-red-50 text-red-700"
                              : item.tone === "warning"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-gray-50 text-gray-600"
                          }`}
                        >
                          {item.tone === "danger" ? "Action now" : item.tone === "warning" ? "Review soon" : "Info"}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-emerald-600" />
                <CardTitle>Team load snapshot</CardTitle>
              </div>
              <CardDescription>
                Based on weekly capacity and assigned hours across active projects.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">{teamLoad.utilization}%</span>
                <span className="text-xs text-gray-500">
                  {teamLoad.assignedHours}h / {teamLoad.capacityHours}h this week
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-100">
                <div
                  className={`h-2 rounded-full ${
                    teamLoad.utilization > 100 ? "bg-amber-500" : "bg-emerald-500"
                  }`}
                  style={{ width: `${Math.min(teamLoad.utilization, 130)}%` }}
                />
              </div>
              <p className="text-xs text-gray-600">
                {teamLoad.overloadedMembers > 0
                  ? `${teamLoad.overloadedMembers} team member over capacity. Consider rebalancing assignments.`
                  : "No one is over capacity right now."}
              </p>
              <Link href="/resources">
                <Button variant="outline" size="sm" className="w-full">
                  View team details
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Project lifecycle chart */}
        <Card>
          <CardHeader>
            <CardTitle>Projects by lifecycle phase</CardTitle>
            <CardDescription>
              Quick view of how many projects sit in planning, development, launch, and post‑launch phases.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={phaseChartData} margin={{ left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="phase"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  formatter={(value) => [`${value} project${value === 1 ? "" : "s"}`, "Count"]}
                  cursor={{ fill: "rgba(16, 185, 129, 0.06)" }}
                  contentStyle={{
                    borderRadius: "0.75rem",
                    borderColor: "#e5e7eb",
                    boxShadow: "0 10px 15px -3px rgba(15, 23, 42, 0.1)"
                  }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

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
                {recentProjects.map((project) => {
                  const days = getDaysToDeadline(project.deadline)
                  let deadlineLabel = "No deadline"
                  if (days !== null) {
                    if (days < 0) {
                      deadlineLabel = `${Math.abs(days)}d overdue`
                    } else if (days === 0) {
                      deadlineLabel = "Due today"
                    } else {
                      deadlineLabel = `${days}d left`
                    }
                  }

                  return (
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
                          <div className="mt-1 text-xs text-gray-500 flex items-center gap-2">
                            <span>{deadlineLabel}</span>
                            {project.deadline && (
                              <span>• {format(parseDeadline(project.deadline)!, "MMM d")}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  )
                })}
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
                  <Link
                    key={index}
                    href={`/projects/${insight.projectId}`}
                    className="block"
                  >
                    <div className="p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
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
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
}
