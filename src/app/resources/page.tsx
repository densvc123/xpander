"use client"

import { useMemo, useState, useCallback } from "react"
import { format, subWeeks, startOfWeek, endOfWeek, eachWeekOfInterval, eachMonthOfInterval, subMonths, startOfMonth, endOfMonth } from "date-fns"
import Link from "next/link"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sparkles,
  Users,
  AlertTriangle,
  CheckCircle2,
  ArrowUpRight,
  FolderKanban,
  TrendingUp,
  TrendingDown,
  Clock,
  BarChart3,
  ArrowRight,
  Briefcase,
  Calendar,
  Target,
  LineChart as LineChartIcon
} from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart,
  ReferenceLine
} from "recharts"

type ResourceAssignment = { project: string; hours: number; focus: string; projectId: string }

type Resource = {
  id: string
  name: string
  role: string
  capacity: number
  assigned: number
  status: "balanced" | "available" | "overloaded"
  avatar?: string
  assignments: ResourceAssignment[]
}

const mockResources: Resource[] = [
  {
    id: "1",
    name: "Ava Chen",
    role: "Engineering Lead",
    capacity: 40,
    assigned: 38,
    status: "balanced",
    assignments: [
      { project: "XPANDER MVP", hours: 20, focus: "Auth & Dashboards", projectId: "1" },
      { project: "Mobile App Redesign", hours: 12, focus: "API contracts", projectId: "2" },
      { project: "API Integration", hours: 6, focus: "Payments", projectId: "3" }
    ]
  },
  {
    id: "2",
    name: "Leo Park",
    role: "Frontend Developer",
    capacity: 40,
    assigned: 26,
    status: "available",
    assignments: [
      { project: "XPANDER MVP", hours: 14, focus: "UI polish", projectId: "1" },
      { project: "Documentation Portal", hours: 12, focus: "Docs UI", projectId: "4" }
    ]
  },
  {
    id: "3",
    name: "Maya Singh",
    role: "Backend Developer",
    capacity: 40,
    assigned: 45,
    status: "overloaded",
    assignments: [
      { project: "XPANDER MVP", hours: 24, focus: "Reporting API", projectId: "1" },
      { project: "API Integration", hours: 21, focus: "Analytics", projectId: "3" }
    ]
  },
  {
    id: "4",
    name: "Noah Wright",
    role: "Product Manager",
    capacity: 32,
    assigned: 22,
    status: "balanced",
    assignments: [
      { project: "XPANDER MVP", hours: 12, focus: "Requirements", projectId: "1" },
      { project: "Mobile App Redesign", hours: 10, focus: "UX review", projectId: "2" }
    ]
  },
  {
    id: "5",
    name: "Emma Davis",
    role: "QA Engineer",
    capacity: 40,
    assigned: 32,
    status: "balanced",
    assignments: [
      { project: "XPANDER MVP", hours: 16, focus: "Test automation", projectId: "1" },
      { project: "API Integration", hours: 16, focus: "Integration testing", projectId: "3" }
    ]
  }
]

const mockProjects = [
  { id: "1", name: "XPANDER MVP", status: "active", totalHours: 86, teamSize: 5 },
  { id: "2", name: "Mobile App Redesign", status: "active", totalHours: 22, teamSize: 2 },
  { id: "3", name: "API Integration", status: "active", totalHours: 43, teamSize: 3 },
  { id: "4", name: "Documentation Portal", status: "planned", totalHours: 12, teamSize: 1 }
]

const CHART_COLORS = {
  "Ava Chen": { main: "#10b981", light: "#34d399", dark: "#059669" },
  "Leo Park": { main: "#3b82f6", light: "#60a5fa", dark: "#2563eb" },
  "Maya Singh": { main: "#ef4444", light: "#f87171", dark: "#dc2626" },
  "Noah Wright": { main: "#f59e0b", light: "#fbbf24", dark: "#d97706" },
  "Emma Davis": { main: "#8b5cf6", light: "#a78bfa", dark: "#7c3aed" },
  "XPANDER MVP": { main: "#10b981", light: "#34d399", dark: "#059669" },
  "Mobile App": { main: "#3b82f6", light: "#60a5fa", dark: "#2563eb" },
  "API Integration": { main: "#f59e0b", light: "#fbbf24", dark: "#d97706" },
  "Docs Portal": { main: "#8b5cf6", light: "#a78bfa", dark: "#7c3aed" },
}

const TEAM_MEMBERS = ["Ava Chen", "Leo Park", "Maya Singh", "Noah Wright", "Emma Davis"] as const
const PROJECT_KEYS = ["XPANDER MVP", "Mobile App", "API Integration", "Docs Portal"] as const
type TeamMember = typeof TEAM_MEMBERS[number]
type ProjectKey = typeof PROJECT_KEYS[number]

// Custom tooltip component for better styling
const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl shadow-xl p-3 min-w-[160px]">
        <p className="text-sm font-semibold text-gray-800 mb-2 pb-2 border-b border-gray-100">{label}</p>
        <div className="space-y-1.5">
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full shadow-sm"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-xs text-gray-600">{entry.name}</span>
              </div>
              <span className="text-xs font-semibold text-gray-800">{entry.value}h</span>
            </div>
          ))}
        </div>
      </div>
    )
  }
  return null
}

const CustomUtilizationTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
  if (active && payload && payload.length) {
    const value = payload[0]?.value || 0
    const status = value > 100 ? "Over capacity" : value >= 80 ? "High load" : "Healthy"
    const statusColor = value > 100 ? "text-red-600" : value >= 80 ? "text-amber-600" : "text-emerald-600"
    return (
      <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl shadow-xl p-3 min-w-[140px]">
        <p className="text-sm font-semibold text-gray-800 mb-1">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}%</p>
        <p className={`text-xs font-medium ${statusColor}`}>{status}</p>
      </div>
    )
  }
  return null
}

const aiSuggestions = {
  summary: "AI detected workload imbalance. Maya is 12% over capacity while Leo has 35% available.",
  recommendation: "Redistribute 2 tasks to balance the team and reduce burnout risk.",
  moves: [
    { task: "Reporting API integration", from: "Maya Singh", fromUtil: "112%", to: "Leo Park", toUtil: "65%", hours: 8, impact: "Reduces Maya's load to 92%" },
    { task: "Analytics dashboard component", from: "Maya Singh", fromUtil: "112%", to: "Leo Park", toUtil: "65%", hours: 5, impact: "Brings Leo to healthy 78%" }
  ],
  projected: { before: { avg: 86, max: 112 }, after: { avg: 82, max: 95 }, overloadReducedHours: 13 },
  risks: [
    { type: "burnout", member: "Maya Singh", severity: "high" },
    { type: "underutilized", member: "Leo Park", severity: "low" }
  ]
}

// Helper to generate workload data for a date range
const generateWorkloadData = (startDate: Date, endDate: Date, period: "weekly" | "monthly") => {
  const teamMembers = ["Ava Chen", "Leo Park", "Maya Singh", "Noah Wright", "Emma Davis"]
  const projects = ["XPANDER MVP", "Mobile App", "API Integration", "Docs Portal"]

  const intervals = period === "weekly"
    ? eachWeekOfInterval({ start: startDate, end: endDate })
    : eachMonthOfInterval({ start: startDate, end: endDate })

  const teamData = intervals.map((date, idx) => {
    const periodLabel = period === "weekly"
      ? format(date, "MMM d")
      : format(date, "MMM yyyy")

    // Generate mock data with some variation
    const baseHours = [36, 26, 42, 22, 30]
    return {
      period: periodLabel,
      "Ava Chen": Math.round(baseHours[0] + Math.sin(idx) * 4),
      "Leo Park": Math.round(baseHours[1] + Math.cos(idx) * 4),
      "Maya Singh": Math.round(baseHours[2] + Math.sin(idx + 1) * 5),
      "Noah Wright": Math.round(baseHours[3] + Math.cos(idx + 1) * 3),
      "Emma Davis": Math.round(baseHours[4] + Math.sin(idx + 2) * 4),
      capacity: period === "weekly" ? 192 : 768,
    }
  })

  const projectData = intervals.map((date, idx) => {
    const periodLabel = period === "weekly"
      ? format(date, "MMM d")
      : format(date, "MMM yyyy")

    return {
      period: periodLabel,
      "XPANDER MVP": Math.round(80 + Math.sin(idx) * 8),
      "Mobile App": Math.round(20 + Math.cos(idx) * 4),
      "API Integration": Math.round(40 + Math.sin(idx + 1) * 6),
      "Docs Portal": Math.round(12 + Math.cos(idx + 1) * 3),
    }
  })

  const utilizationData = intervals.map((date, idx) => {
    const periodLabel = period === "weekly"
      ? format(date, "MMM d")
      : format(date, "MMM yyyy")

    return {
      period: periodLabel,
      utilization: Math.round(80 + Math.sin(idx) * 8),
      target: 80,
    }
  })

  return { teamData, projectData, utilizationData }
}

export default function ResourcesPage() {
  const [activeTab, setActiveTab] = useState("team")
  const [showAIPanel, setShowAIPanel] = useState(true)
  const [chartPeriod, setChartPeriod] = useState<"weekly" | "monthly">("weekly")
  const [chartView, setChartView] = useState<"team" | "project" | "utilization">("team")

  // Date range state - default to last 6 weeks
  const [dateFrom, setDateFrom] = useState<string>(() => {
    const date = subWeeks(new Date(), 6)
    return format(startOfWeek(date), "yyyy-MM-dd")
  })
  const [dateTo, setDateTo] = useState<string>(() => {
    return format(endOfWeek(new Date()), "yyyy-MM-dd")
  })

  // Generate chart data based on date range
  const chartData = useMemo(() => {
    const start = new Date(dateFrom)
    const end = new Date(dateTo)
    return generateWorkloadData(start, end, chartPeriod)
  }, [dateFrom, dateTo, chartPeriod])

  const summary = useMemo(() => {
    const totalCapacity = mockResources.reduce((sum, r) => sum + r.capacity, 0)
    const totalAssigned = mockResources.reduce((sum, r) => sum + r.assigned, 0)
    const utilization = totalCapacity > 0 ? Math.round((totalAssigned / totalCapacity) * 100) : 0
    const overloaded = mockResources.filter((r) => r.assigned > r.capacity).length
    const available = mockResources.filter((r) => r.assigned / r.capacity < 0.8).length
    const balanced = mockResources.length - overloaded - available
    const avgUtilization = mockResources.reduce((sum, r) => sum + (r.capacity > 0 ? (r.assigned / r.capacity) * 100 : 0), 0) / mockResources.length
    return { totalCapacity, totalAssigned, utilization, overloaded, available, balanced, avgUtilization: Math.round(avgUtilization) }
  }, [])

  const projectAllocations = useMemo(() => {
    return mockProjects.map(project => {
      const resources = mockResources.filter(r =>
        r.assignments.some(a => a.projectId === project.id)
      ).map(r => {
        const assignment = r.assignments.find(a => a.projectId === project.id)
        return { ...r, projectHours: assignment?.hours || 0, focus: assignment?.focus || "" }
      })
      return { ...project, resources }
    })
  }, [])

  const getUtilizationColor = (utilization: number) => {
    if (utilization > 100) return "text-red-600"
    if (utilization >= 80) return "text-amber-600"
    if (utilization >= 60) return "text-emerald-600"
    return "text-gray-500"
  }

  const getProgressColor = (utilization: number) => {
    if (utilization > 100) return "bg-red-500"
    if (utilization >= 80) return "bg-amber-500"
    if (utilization >= 60) return "bg-emerald-500"
    return "bg-gray-300"
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "overloaded":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case "available":
        return <Clock className="h-4 w-4 text-blue-500" />
      default:
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />
    }
  }

  return (
    <MainLayout title="Resources">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Resource Management</h2>
            <p className="text-gray-500">Cross-project capacity planning and workload optimization</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={showAIPanel ? "default" : "outline"}
              onClick={() => setShowAIPanel(!showAIPanel)}
              className="gap-2"
            >
              <Sparkles className="h-4 w-4" />
              {showAIPanel ? "Hide AI Insights" : "Show AI Insights"}
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Team Size</p>
                  <p className="text-2xl font-bold">{mockResources.length}</p>
                  <p className="text-xs text-gray-400">members</p>
                </div>
                <Users className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Capacity</p>
                  <p className="text-2xl font-bold">{summary.totalCapacity}h</p>
                  <p className="text-xs text-gray-400">per week</p>
                </div>
                <Target className="h-8 w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Allocated</p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold">{summary.totalAssigned}h</p>
                    <Badge variant={summary.utilization > 100 ? "destructive" : summary.utilization > 90 ? "warning" : "secondary"}>
                      {summary.utilization}%
                    </Badge>
                  </div>
                </div>
                <BarChart3 className="h-8 w-8 text-emerald-200" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="space-y-2">
                <p className="text-sm text-gray-500">Team Health</p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <div className="h-3 w-3 rounded-full bg-red-500" />
                    <span className="text-sm font-medium">{summary.overloaded}</span>
                    <span className="text-xs text-gray-400">over</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-3 w-3 rounded-full bg-emerald-500" />
                    <span className="text-sm font-medium">{summary.balanced}</span>
                    <span className="text-xs text-gray-400">ok</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-3 w-3 rounded-full bg-blue-500" />
                    <span className="text-sm font-medium">{summary.available}</span>
                    <span className="text-xs text-gray-400">free</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Active Projects</p>
                  <p className="text-2xl font-bold">{mockProjects.filter(p => p.status === "active").length}</p>
                  <p className="text-xs text-gray-400">{mockProjects.length} total</p>
                </div>
                <FolderKanban className="h-8 w-8 text-amber-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Insights Panel */}
        {showAIPanel && (
          <Card className="border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-emerald-800">
                  <Sparkles className="h-5 w-5" />
                  AI Workload Optimization
                </CardTitle>
                <Badge variant="outline" className="border-emerald-300 text-emerald-700">
                  {aiSuggestions.moves.length} suggestions
                </Badge>
              </div>
              <CardDescription className="text-emerald-700">{aiSuggestions.summary}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Projected Impact */}
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border border-emerald-200 bg-white p-4">
                  <p className="text-sm text-gray-500">Max Utilization</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-red-600">{aiSuggestions.projected.before.max}%</span>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                    <span className="text-xl font-bold text-emerald-600">{aiSuggestions.projected.after.max}%</span>
                  </div>
                  <p className="text-xs text-emerald-600">-{aiSuggestions.projected.before.max - aiSuggestions.projected.after.max}% reduction</p>
                </div>
                <div className="rounded-lg border border-emerald-200 bg-white p-4">
                  <p className="text-sm text-gray-500">Avg Utilization</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold">{aiSuggestions.projected.before.avg}%</span>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                    <span className="text-xl font-bold text-emerald-600">{aiSuggestions.projected.after.avg}%</span>
                  </div>
                  <p className="text-xs text-gray-500">More balanced distribution</p>
                </div>
                <div className="rounded-lg border border-emerald-200 bg-white p-4">
                  <p className="text-sm text-gray-500">Hours Rebalanced</p>
                  <p className="text-xl font-bold text-emerald-600">{aiSuggestions.projected.overloadReducedHours}h</p>
                  <p className="text-xs text-gray-500">Moved from overloaded members</p>
                </div>
              </div>

              {/* Suggested Moves */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Suggested Reassignments</p>
                <div className="grid gap-2 md:grid-cols-2">
                  {aiSuggestions.moves.map((move, idx) => (
                    <div key={idx} className="rounded-lg border border-emerald-200 bg-white p-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <p className="font-medium text-gray-900">{move.task}</p>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-red-600">{move.from}</span>
                            <ArrowRight className="h-3 w-3 text-gray-400" />
                            <span className="text-emerald-600">{move.to}</span>
                          </div>
                          <p className="text-xs text-gray-500">{move.impact}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">{move.hours}h</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Risk Alerts */}
              {aiSuggestions.risks.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {aiSuggestions.risks.map((risk, idx) => (
                    <Badge
                      key={idx}
                      variant={risk.severity === "high" ? "destructive" : "secondary"}
                      className="gap-1"
                    >
                      {risk.severity === "high" ? <AlertTriangle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                      {risk.type === "burnout" ? "Burnout risk" : "Underutilized"}: {risk.member}
                    </Badge>
                  ))}
                </div>
              )}

              <Button className="bg-emerald-600 hover:bg-emerald-700">
                <Sparkles className="h-4 w-4 mr-2" />
                Apply AI Recommendations
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 md:w-auto md:inline-grid">
            <TabsTrigger value="team" className="gap-2">
              <Users className="h-4 w-4" />
              Team View
            </TabsTrigger>
            <TabsTrigger value="projects" className="gap-2">
              <FolderKanban className="h-4 w-4" />
              By Project
            </TabsTrigger>
            <TabsTrigger value="workload" className="gap-2">
              <LineChartIcon className="h-4 w-4" />
              Workload Chart
            </TabsTrigger>
            <TabsTrigger value="capacity" className="gap-2">
              <Calendar className="h-4 w-4" />
              Capacity
            </TabsTrigger>
          </TabsList>

          {/* Team View Tab */}
          <TabsContent value="team" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {mockResources.map((resource) => {
                const utilization = resource.capacity > 0 ? Math.round((resource.assigned / resource.capacity) * 100) : 0
                return (
                  <Card key={resource.id} className={`transition-all hover:shadow-md ${resource.status === "overloaded" ? "border-red-200" : ""}`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-10 w-10 items-center justify-center rounded-full text-white font-medium ${
                            resource.status === "overloaded" ? "bg-red-500" :
                            resource.status === "available" ? "bg-blue-500" : "bg-emerald-500"
                          }`}>
                            {resource.name.split(" ").map(n => n[0]).join("")}
                          </div>
                          <div>
                            <CardTitle className="text-base">{resource.name}</CardTitle>
                            <CardDescription>{resource.role}</CardDescription>
                          </div>
                        </div>
                        {getStatusIcon(resource.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* Utilization Bar */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">{resource.assigned}h / {resource.capacity}h</span>
                          <span className={`font-medium ${getUtilizationColor(utilization)}`}>{utilization}%</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${getProgressColor(utilization)}`}
                            style={{ width: `${Math.min(utilization, 100)}%` }}
                          />
                        </div>
                        {utilization > 100 && (
                          <p className="text-xs text-red-500 flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            {utilization - 100}% over capacity
                          </p>
                        )}
                        {utilization < 70 && (
                          <p className="text-xs text-blue-500 flex items-center gap-1">
                            <TrendingDown className="h-3 w-3" />
                            {resource.capacity - resource.assigned}h available
                          </p>
                        )}
                      </div>

                      {/* Project Assignments */}
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-gray-500">Assignments ({resource.assignments.length})</p>
                        <div className="space-y-1">
                          {resource.assignments.map((assignment, idx) => (
                            <Link
                              key={idx}
                              href={`/projects/${assignment.projectId}`}
                              className="flex items-center justify-between p-2 rounded-md bg-gray-50 hover:bg-gray-100 transition-colors group"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <Briefcase className="h-3 w-3 text-gray-400 flex-shrink-0" />
                                <span className="text-sm truncate">{assignment.project}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">{assignment.hours}h</Badge>
                                <ArrowUpRight className="h-3 w-3 text-gray-400 group-hover:text-emerald-600 transition-colors" />
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>

          {/* Projects View Tab */}
          <TabsContent value="projects" className="space-y-4">
            <div className="space-y-4">
              {projectAllocations.map((project) => (
                <Card key={project.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${project.status === "active" ? "bg-emerald-100" : "bg-gray-100"}`}>
                          <FolderKanban className={`h-5 w-5 ${project.status === "active" ? "text-emerald-600" : "text-gray-500"}`} />
                        </div>
                        <div>
                          <CardTitle className="text-base flex items-center gap-2">
                            {project.name}
                            <Badge variant={project.status === "active" ? "default" : "secondary"}>
                              {project.status}
                            </Badge>
                          </CardTitle>
                          <CardDescription>{project.resources.length} team members • {project.totalHours}h total</CardDescription>
                        </div>
                      </div>
                      <Link href={`/projects/${project.id}`}>
                        <Button variant="outline" size="sm" className="gap-1">
                          View Project
                          <ArrowUpRight className="h-3 w-3" />
                        </Button>
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                      {project.resources.map((resource) => (
                        <div
                          key={resource.id}
                          className="flex items-center gap-3 p-3 rounded-lg border bg-gray-50"
                        >
                          <div className={`flex h-8 w-8 items-center justify-center rounded-full text-white text-sm font-medium ${
                            resource.status === "overloaded" ? "bg-red-500" :
                            resource.status === "available" ? "bg-blue-500" : "bg-emerald-500"
                          }`}>
                            {resource.name.split(" ").map(n => n[0]).join("")}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{resource.name}</p>
                            <p className="text-xs text-gray-500">{resource.focus}</p>
                          </div>
                          <Badge variant="outline">{resource.projectHours}h</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Workload Chart Tab */}
          <TabsContent value="workload" className="space-y-4">
            {/* Chart Controls */}
            <Card>
              <CardContent className="pt-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  {/* Date Range & Period Selection */}
                  <div className="flex flex-wrap items-end gap-4">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700">From</label>
                      <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="h-9 rounded-md border border-gray-200 px-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700">To</label>
                      <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="h-9 rounded-md border border-gray-200 px-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700">Group by</label>
                      <Select value={chartPeriod} onValueChange={(v) => setChartPeriod(v as "weekly" | "monthly")}>
                        <SelectTrigger className="w-[120px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700">View</label>
                      <Select value={chartView} onValueChange={(v) => setChartView(v as "team" | "project" | "utilization")}>
                        <SelectTrigger className="w-[160px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="team">By Team Member</SelectItem>
                          <SelectItem value="project">By Project</SelectItem>
                          <SelectItem value="utilization">Utilization Trend</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Quick Date Presets */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-gray-500">Quick:</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const end = new Date()
                        const start = subWeeks(end, 4)
                        setDateFrom(format(startOfWeek(start), "yyyy-MM-dd"))
                        setDateTo(format(endOfWeek(end), "yyyy-MM-dd"))
                        setChartPeriod("weekly")
                      }}
                    >
                      Last 4 weeks
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const end = new Date()
                        const start = subWeeks(end, 8)
                        setDateFrom(format(startOfWeek(start), "yyyy-MM-dd"))
                        setDateTo(format(endOfWeek(end), "yyyy-MM-dd"))
                        setChartPeriod("weekly")
                      }}
                    >
                      Last 8 weeks
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const end = new Date()
                        const start = subMonths(end, 3)
                        setDateFrom(format(startOfMonth(start), "yyyy-MM-dd"))
                        setDateTo(format(endOfMonth(end), "yyyy-MM-dd"))
                        setChartPeriod("monthly")
                      }}
                    >
                      Last 3 months
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const end = new Date()
                        const start = subMonths(end, 6)
                        setDateFrom(format(startOfMonth(start), "yyyy-MM-dd"))
                        setDateTo(format(endOfMonth(end), "yyyy-MM-dd"))
                        setChartPeriod("monthly")
                      }}
                    >
                      Last 6 months
                    </Button>
                  </div>
                </div>

                {/* Legend */}
                <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t">
                  <span className="text-sm text-gray-500">Legend:</span>
                  <Badge variant="outline" className="gap-1">
                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                    Healthy (60-80%)
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    <div className="h-2 w-2 rounded-full bg-amber-500" />
                    High (80-100%)
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    <div className="h-2 w-2 rounded-full bg-red-500" />
                    Over ({">"}100%)
                  </Badge>
                  <span className="text-xs text-gray-400 ml-2">
                    Showing: {format(new Date(dateFrom), "MMM d, yyyy")} - {format(new Date(dateTo), "MMM d, yyyy")}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Team Workload Chart */}
            {chartView === "team" && (
              <Card className="shadow-sm border bg-white">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg font-semibold">Team Workload by Period</CardTitle>
                      <CardDescription>
                        {chartPeriod === "weekly" ? "Weekly" : "Monthly"} hours per team member (stacked)
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-600">Total hours / period</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={chartData.teamData}
                        margin={{ top: 20, right: 20, left: 10, bottom: 20 }}
                        barCategoryGap="24%"
                        barGap={4}
                      >
                        <CartesianGrid strokeDasharray="4 4" stroke="#f3f4f6" vertical={false} />
                        <XAxis
                          dataKey="period"
                          tick={{ fontSize: 12, fill: '#64748b' }}
                          axisLine={{ stroke: '#e2e8f0' }}
                          tickLine={false}
                          dy={10}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: '#64748b' }}
                          axisLine={false}
                          tickLine={false}
                          width={45}
                          tickFormatter={(value) => `${value}h`}
                        />
                        <Tooltip
                          content={<CustomTooltip />}
                          cursor={{ fill: 'rgba(16, 185, 129, 0.06)' }}
                        />
                        <Legend
                          wrapperStyle={{ paddingTop: 12 }}
                          iconType="circle"
                          iconSize={10}
                          formatter={(value) => <span style={{ color: '#475569', fontSize: 12, marginLeft: 4 }}>{value}</span>}
                        />
                        {TEAM_MEMBERS.map((name, idx) => (
                          <Bar
                            key={name}
                            dataKey={name}
                            stackId="team"
                            fill={CHART_COLORS[name].main}
                            fillOpacity={0.7}
                            radius={idx === TEAM_MEMBERS.length - 1 ? [6, 6, 0, 0] : [0, 0, 0, 0]}
                          />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-5 gap-3 mt-4 pt-4 border-t">
                    {TEAM_MEMBERS.map((name) => (
                      <div key={name} className="text-center">
                        <div className="flex items-center justify-center gap-1.5 mb-1">
                          <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: CHART_COLORS[name].main }} />
                          <span className="text-xs text-gray-500 truncate">{name.split(' ')[0]}</span>
                        </div>
                        <p className="text-lg font-semibold text-gray-800">
                          {chartData.teamData[chartData.teamData.length - 1]?.[name] || 0}h
                        </p>
                        <p className="text-xs text-gray-400">latest period</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Project Workload Chart */}
            {chartView === "project" && (
              <Card className="shadow-sm border bg-white">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-semibold">Project Workload Distribution</CardTitle>
                  <CardDescription>Hours allocated to each project over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={chartData.projectData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                      >
                        <defs>
                          <linearGradient id="gradXpander" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#22c55e" stopOpacity={0.6} />
                            <stop offset="100%" stopColor="#22c55e" stopOpacity={0.1} />
                          </linearGradient>
                          <linearGradient id="gradMobile" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.6} />
                            <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.1} />
                          </linearGradient>
                          <linearGradient id="gradAPI" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.6} />
                            <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.1} />
                          </linearGradient>
                          <linearGradient id="gradDocs" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.6} />
                            <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.1} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                        <XAxis
                          dataKey="period"
                          tick={{ fontSize: 12, fill: '#64748b' }}
                          axisLine={{ stroke: '#e2e8f0' }}
                          tickLine={false}
                          dy={10}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: '#64748b' }}
                          axisLine={false}
                          tickLine={false}
                          width={45}
                          tickFormatter={(value) => `${value}h`}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#ffffff',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                            padding: '12px'
                          }}
                          formatter={(value: number, name: string) => [`${value}h`, name]}
                          labelStyle={{ fontWeight: 600, marginBottom: 4 }}
                        />
                        <Legend
                          wrapperStyle={{ paddingTop: 16 }}
                          iconType="square"
                          iconSize={10}
                          formatter={(value) => <span style={{ color: '#475569', fontSize: 12, marginLeft: 4 }}>{value}</span>}
                        />
                        <Area type="monotone" dataKey="XPANDER MVP" stackId="1" stroke={CHART_COLORS["XPANDER MVP"].main} strokeWidth={2.5} fill={CHART_COLORS["XPANDER MVP"].light} fillOpacity={0.25} />
                        <Area type="monotone" dataKey="Mobile App" stackId="1" stroke={CHART_COLORS["Mobile App"].main} strokeWidth={2.5} fill={CHART_COLORS["Mobile App"].light} fillOpacity={0.25} />
                        <Area type="monotone" dataKey="API Integration" stackId="1" stroke={CHART_COLORS["API Integration"].main} strokeWidth={2.5} fill={CHART_COLORS["API Integration"].light} fillOpacity={0.25} />
                        <Area type="monotone" dataKey="Docs Portal" stackId="1" stroke={CHART_COLORS["Docs Portal"].main} strokeWidth={2.5} fill={CHART_COLORS["Docs Portal"].light} fillOpacity={0.25} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Project Summary */}
                  <div className="grid grid-cols-4 gap-3 mt-4 pt-4 border-t">
                    {[
                      { name: "XPANDER MVP", color: "#22c55e", hours: 86 },
                      { name: "Mobile App", color: "#3b82f6", hours: 22 },
                      { name: "API Integration", color: "#f59e0b", hours: 43 },
                      { name: "Docs Portal", color: "#8b5cf6", hours: 12 },
                    ].map((project) => (
                      <div key={project.name} className="text-center">
                        <div className="flex items-center justify-center gap-1.5 mb-1">
                          <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: project.color }} />
                          <span className="text-xs text-gray-500 truncate">{project.name}</span>
                        </div>
                        <p className="text-lg font-semibold text-gray-800">{project.hours}h</p>
                        <p className="text-xs text-gray-400">total</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Utilization Trend Chart */}
            {chartView === "utilization" && (
              <Card className="shadow-lg border bg-white">
                <CardHeader>
                  <CardTitle className="text-lg">Team Utilization Trend</CardTitle>
                  <CardDescription>Overall team utilization percentage over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[420px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData.utilizationData}>
                        <defs>
                          <filter id="glow">
                            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                            <feMerge>
                              <feMergeNode in="coloredBlur"/>
                              <feMergeNode in="SourceGraphic"/>
                            </feMerge>
                          </filter>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                        <XAxis
                          dataKey="period"
                          tick={{ fontSize: 11, fill: '#6b7280' }}
                          axisLine={{ stroke: '#e5e7eb' }}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: '#6b7280' }}
                          domain={[0, 120]}
                          axisLine={false}
                          tickLine={false}
                          label={{ value: 'Utilization %', angle: -90, position: 'insideLeft', fontSize: 11, fill: '#9ca3af' }}
                        />
                        <Tooltip content={<CustomUtilizationTooltip />} />
                        <ReferenceLine
                          y={100}
                          stroke="#ef4444"
                          strokeWidth={2}
                          strokeDasharray="8 4"
                          label={{ value: 'Over capacity', position: 'insideTopRight', fontSize: 10, fill: '#ef4444', fontWeight: 500 }}
                        />
                        <ReferenceLine
                          y={80}
                          stroke="#10b981"
                          strokeWidth={2}
                          strokeDasharray="4 4"
                          label={{ value: 'Target (80%)', position: 'insideTopRight', fontSize: 10, fill: '#10b981', fontWeight: 500 }}
                        />
                        <Area
                          type="monotone"
                          dataKey="utilization"
                          stroke="#3b82f6"
                          strokeWidth={3}
                          fill="#3b82f6"
                          fillOpacity={0.12}
                          dot={{ fill: '#fff', stroke: '#3b82f6', strokeWidth: 2, r: 5 }}
                          activeDot={{ r: 7, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2, filter: 'url(#glow)' }}
                          name="Utilization"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Individual Member Breakdown */}
            <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50/50">
              <CardHeader>
                <CardTitle className="text-lg">Individual Workload Breakdown</CardTitle>
                <CardDescription>Detailed view of each team member&apos;s workload trend</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[380px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData.teamData}>
                      <defs>
                        <filter id="lineShadow" x="-20%" y="-20%" width="140%" height="140%">
                          <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.2"/>
                        </filter>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                      <XAxis
                        dataKey="period"
                        tick={{ fontSize: 11, fill: '#6b7280' }}
                        axisLine={{ stroke: '#e5e7eb' }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: '#6b7280' }}
                        axisLine={false}
                        tickLine={false}
                        label={{ value: 'Hours', angle: -90, position: 'insideLeft', fontSize: 11, fill: '#9ca3af' }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend
                        wrapperStyle={{ paddingTop: 20 }}
                        iconType="circle"
                        iconSize={8}
                        formatter={(value) => <span className="text-xs text-gray-600 ml-1">{value}</span>}
                      />
                      <Line
                        type="monotone"
                        dataKey="Ava Chen"
                        stroke={CHART_COLORS["Ava Chen"].main}
                        strokeWidth={2.5}
                        dot={{ fill: '#fff', stroke: CHART_COLORS["Ava Chen"].main, strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, fill: CHART_COLORS["Ava Chen"].main, stroke: '#fff', strokeWidth: 2 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="Leo Park"
                        stroke={CHART_COLORS["Leo Park"].main}
                        strokeWidth={2.5}
                        dot={{ fill: '#fff', stroke: CHART_COLORS["Leo Park"].main, strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, fill: CHART_COLORS["Leo Park"].main, stroke: '#fff', strokeWidth: 2 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="Maya Singh"
                        stroke={CHART_COLORS["Maya Singh"].main}
                        strokeWidth={2.5}
                        dot={{ fill: '#fff', stroke: CHART_COLORS["Maya Singh"].main, strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, fill: CHART_COLORS["Maya Singh"].main, stroke: '#fff', strokeWidth: 2 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="Noah Wright"
                        stroke={CHART_COLORS["Noah Wright"].main}
                        strokeWidth={2.5}
                        dot={{ fill: '#fff', stroke: CHART_COLORS["Noah Wright"].main, strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, fill: CHART_COLORS["Noah Wright"].main, stroke: '#fff', strokeWidth: 2 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="Emma Davis"
                        stroke={CHART_COLORS["Emma Davis"].main}
                        strokeWidth={2.5}
                        dot={{ fill: '#fff', stroke: CHART_COLORS["Emma Davis"].main, strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, fill: CHART_COLORS["Emma Davis"].main, stroke: '#fff', strokeWidth: 2 }}
                      />
                      <ReferenceLine
                        y={40}
                        stroke="#ef4444"
                        strokeWidth={2}
                        strokeDasharray="8 4"
                        label={{ value: 'Individual cap (40h)', position: 'insideTopRight', fontSize: 10, fill: '#ef4444', fontWeight: 500 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Capacity Planning Tab */}
          <TabsContent value="capacity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Capacity Overview</CardTitle>
                <CardDescription>Team capacity and allocation breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Overall Progress */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">Total Team Utilization</span>
                      <span className={`font-bold ${getUtilizationColor(summary.utilization)}`}>
                        {summary.utilization}%
                      </span>
                    </div>
                    <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${getProgressColor(summary.utilization)}`}
                        style={{ width: `${Math.min(summary.utilization, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{summary.totalAssigned}h allocated</span>
                      <span>{summary.totalCapacity}h capacity</span>
                    </div>
                  </div>

                  {/* Individual Bars */}
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-gray-700">Individual Utilization</p>
                    <ScrollArea className="h-[300px] pr-4">
                      <div className="space-y-3">
                        {[...mockResources]
                          .sort((a, b) => (b.assigned / b.capacity) - (a.assigned / a.capacity))
                          .map((resource) => {
                            const utilization = resource.capacity > 0 ? Math.round((resource.assigned / resource.capacity) * 100) : 0
                            return (
                              <div key={resource.id} className="space-y-1">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div className={`h-2 w-2 rounded-full ${
                                      resource.status === "overloaded" ? "bg-red-500" :
                                      resource.status === "available" ? "bg-blue-500" : "bg-emerald-500"
                                    }`} />
                                    <span className="text-sm font-medium">{resource.name}</span>
                                    <span className="text-xs text-gray-400">{resource.role}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-500">{resource.assigned}h / {resource.capacity}h</span>
                                    <span className={`text-sm font-medium w-12 text-right ${getUtilizationColor(utilization)}`}>
                                      {utilization}%
                                    </span>
                                  </div>
                                </div>
                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all ${getProgressColor(utilization)}`}
                                    style={{ width: `${Math.min(utilization, 100)}%` }}
                                  />
                                </div>
                              </div>
                            )
                          })}
                      </div>
                    </ScrollArea>
                  </div>

                  {/* Summary Stats */}
                  <div className="grid gap-4 md:grid-cols-4 pt-4 border-t">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">{summary.totalCapacity}h</p>
                      <p className="text-xs text-gray-500">Total Capacity</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-emerald-600">{summary.totalAssigned}h</p>
                      <p className="text-xs text-gray-500">Allocated</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{summary.totalCapacity - summary.totalAssigned}h</p>
                      <p className="text-xs text-gray-500">Available</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">{summary.avgUtilization}%</p>
                      <p className="text-xs text-gray-500">Avg Utilization</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  )
}
