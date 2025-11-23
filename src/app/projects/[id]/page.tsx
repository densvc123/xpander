"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import type { DragEvent } from "react"
import { useParams } from "next/navigation"
import { MainLayout } from "@/components/layout/main-layout"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  ArrowLeft,
  Sparkles,
  Play,
  Send,
  FileText,
  ListTodo,
  BarChart3,
  Loader2,
  CheckCircle2,
  Clock,
  Plus,
  GitPullRequest,
  AlertTriangle,
  CalendarRange,
  History,
  Target,
  X,
  Check,
  TrendingUp,
  TrendingDown,
  Users
} from "lucide-react"
import Link from "next/link"
import { formatDate } from "@/lib/utils"
import { GanttChart } from "@/components/gantt/gantt-chart"
import { mockGanttSprints, projectStartDate, projectEndDate } from "@/components/gantt/gantt-data"
import type {
  ChangeRequest,
  ChangeRequestAnalysis,
  ChangeHistory,
  ChangeType,
  ChangePriority,
  ChangeArea
} from "@/types/database"
import type {
  ProjectRisk,
  ProjectDecision,
  ProjectMilestone
} from "@/types/governance"

const RISK_SEVERITY_RANK: Record<string, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1
}

// Mock project data
const mockProject = {
  id: "1",
  name: "XPANDER MVP",
  description: "AI-First Project Operating System for modern teams",
  status: "in_progress",
  health: "healthy",
  progress: 45,
  deadline: "2024-02-15",
  created_at: "2024-01-01"
}

// Mock sprints
const initialSprints = [
  {
    id: "1",
    name: "Sprint 1",
    status: "completed",
    startDate: "2024-01-01",
    endDate: "2024-01-14",
    tasks: [
      { id: "1", title: "Set up Next.js project", type: "frontend", status: "completed", estimatedHours: 2 },
      { id: "2", title: "Configure Supabase database", type: "database", status: "completed", estimatedHours: 3 }
    ]
  },
  {
    id: "2",
    name: "Sprint 2",
    status: "active",
    startDate: "2024-01-15",
    endDate: "2024-01-28",
    tasks: [
      { id: "3", title: "Build authentication system", type: "backend", status: "in_progress", estimatedHours: 5 },
      { id: "4", title: "Create dashboard UI", type: "frontend", status: "in_progress", estimatedHours: 8 }
    ]
  },
  {
    id: "3",
    name: "Sprint 3",
    status: "planned",
    startDate: "2024-01-29",
    endDate: "2024-02-11",
    tasks: [
      { id: "5", title: "Implement AI analysis endpoint", type: "backend", status: "pending", estimatedHours: 6 },
      { id: "6", title: "Build task breakdown feature", type: "backend", status: "pending", estimatedHours: 4 }
    ]
  }
]

// Mock team + capacity
const mockTeamMembers = [
  { id: "1", name: "Ava Chen", role: "Engineering Lead", capacityHours: 30, workloadHours: 28 },
  { id: "2", name: "Leo Park", role: "Frontend", capacityHours: 32, workloadHours: 26 },
  { id: "3", name: "Maya Singh", role: "Backend", capacityHours: 32, workloadHours: 34 },
  { id: "4", name: "Noah Wright", role: "Product", capacityHours: 25, workloadHours: 18 }
]

// Governance data (risks, decisions, milestones) is now fetched from API

// Message type for advisor
type Message = { role: "user" | "assistant"; content: string }

// Mock advisor messages
const mockMessages: Message[] = [
  { role: "assistant", content: "Hello! I'm your AI advisor for this project. How can I help you today?" },
]

// Change request with analysis
interface ChangeRequestWithAnalysis extends ChangeRequest {
  change_request_analysis?: ChangeRequestAnalysis[]
}

type RequirementsAnalysis = {
  summary: string
  highlights: string[]
  backlog: { id: string; title: string; estimate: number; type: string; sprint: string }[]
  risks: string[]
  sprintPlan: { name: string; goal: string; points: number; window: string }[]
}

const getDaysUntil = (dateString: string) => {
  const now = new Date()
  const target = new Date(dateString)
  const diff = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  return Math.max(diff, 0)
}

export default function ProjectDetailPage() {
  const params = useParams()
  const projectId = params.id as string

  const [activeTab, setActiveTab] = useState("overview")
  const [requirements, setRequirements] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [advisorInput, setAdvisorInput] = useState("")
  const [messages, setMessages] = useState<Message[]>(mockMessages)
  const [timelineView, setTimelineView] = useState<"list" | "calendar">("list")
  const [requirementsAnalysis, setRequirementsAnalysis] = useState<RequirementsAnalysis | null>(null)
  const [hasCreatedSprintPlan, setHasCreatedSprintPlan] = useState(false)
  const [sprints, setSprints] = useState(initialSprints)
  const [draggingTask, setDraggingTask] = useState<{ taskId: string; fromSprintId: string } | null>(null)
  const [dragOverSprintId, setDragOverSprintId] = useState<string | null>(null)
  const [addTaskDialog, setAddTaskDialog] = useState<{ open: boolean; sprintId: string | null }>({ open: false, sprintId: null })
  const [newTaskForm, setNewTaskForm] = useState({ title: "", estimate: "", type: "frontend" })

  // Change Management State
  const [changeRequests, setChangeRequests] = useState<ChangeRequestWithAnalysis[]>([])
  const [changeHistory, setChangeHistory] = useState<ChangeHistory[]>([])
  const [selectedChange, setSelectedChange] = useState<ChangeRequestWithAnalysis | null>(null)
  const [isLoadingChanges, setIsLoadingChanges] = useState(false)
  const [isCreatingChange, setIsCreatingChange] = useState(false)
  const [isAnalyzingChange, setIsAnalyzingChange] = useState(false)
  const [isApprovingChange, setIsApprovingChange] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [baselineComparison, setBaselineComparison] = useState<{
    has_baseline: boolean
    baseline: { total_hours: number; task_count: number; sprint_count: number; planned_delivery_date: string | null } | null
    current: { total_hours: number; task_count: number; sprint_count: number; planned_delivery_date: string | null }
    delta: { hours: number; tasks: number; sprints: number; days: number }
    sprint_overload: string[]
  } | null>(null)

  // New change form state
  const [newChangeTitle, setNewChangeTitle] = useState("")
  const [newChangeDescription, setNewChangeDescription] = useState("")
  const [newChangeType, setNewChangeType] = useState<ChangeType>("modification")
  const [newChangePriority, setNewChangePriority] = useState<ChangePriority>("medium")
  const [newChangeArea, setNewChangeArea] = useState<ChangeArea>("other")

  // Governance State (Risks, Decisions, Milestones)
  const [risks, setRisks] = useState<ProjectRisk[]>([])
  const [decisions, setDecisions] = useState<ProjectDecision[]>([])
  const [milestones, setMilestones] = useState<ProjectMilestone[]>([])
  const [, setIsLoadingGovernance] = useState(false)

  const totalTasks = sprints.reduce((sum, sprint) => sum + sprint.tasks.length, 0)
  const completedTasks = sprints.reduce(
    (sum, sprint) => sum + sprint.tasks.filter((task) => task.status === "completed").length,
    0
  )
  const sprintCounts = {
    completed: sprints.filter((sprint) => sprint.status === "completed").length,
    active: sprints.filter((sprint) => sprint.status === "active").length,
    planned: sprints.filter((sprint) => sprint.status === "planned").length
  }
  const totalCapacityHours = mockTeamMembers.reduce((sum, member) => sum + member.capacityHours, 0)
  const totalWorkloadHours = mockTeamMembers.reduce((sum, member) => sum + member.workloadHours, 0)
  const utilization = totalCapacityHours > 0 ? Math.min(100, Math.round((totalWorkloadHours / totalCapacityHours) * 100)) : 0
  const projectUtilization = utilization
  const daysRemaining = getDaysUntil(mockProject.deadline)
  const projectTeam = mockTeamMembers
  const topOverload = projectTeam.filter((m) => m.workloadHours > m.capacityHours)
  const activeSprint = sprints.find((sprint) => sprint.status === "active")
  const activeSprintCompleted = activeSprint?.tasks.filter((task) => task.status === "completed").length || 0
  const activeSprintProgress = activeSprint && activeSprint.tasks.length > 0
    ? Math.round((activeSprintCompleted / activeSprint.tasks.length) * 100)
    : 0
  const activeSprintOpenTasks = activeSprint ? activeSprint.tasks.filter((task) => task.status !== "completed") : []

  const primaryRisk = useMemo(() => {
    if (!risks.length) return null
    return [...risks].sort((a, b) => {
      const aRank = RISK_SEVERITY_RANK[a.severity] || 0
      const bRank = RISK_SEVERITY_RANK[b.severity] || 0
      return bRank - aRank
    })[0]
  }, [risks])

  // Fetch change requests
  const fetchChangeRequests = useCallback(async () => {
    setIsLoadingChanges(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/changes`)
      if (res.ok) {
        const data = await res.json()
        setChangeRequests(data.changeRequests || [])
      }
    } catch (error) {
      console.error("Error fetching change requests:", error)
    } finally {
      setIsLoadingChanges(false)
    }
  }, [projectId])

  // Fetch change history
  const fetchChangeHistory = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/change-history`)
      if (res.ok) {
        const data = await res.json()
        setChangeHistory(data.history || [])
      }
    } catch (error) {
      console.error("Error fetching change history:", error)
    }
  }, [projectId])

  // Fetch baseline comparison
  const fetchBaselineComparison = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/baseline-comparison`)
      if (res.ok) {
        const data = await res.json()
        setBaselineComparison(data.comparison)
      }
    } catch (error) {
      console.error("Error fetching baseline comparison:", error)
    }
  }, [projectId])

  // Fetch governance data (risks, decisions, milestones)
  const fetchGovernanceData = useCallback(async () => {
    setIsLoadingGovernance(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/governance`)
      if (res.ok) {
        const data = await res.json()
        setRisks(data.risks || [])
        setDecisions(data.decisions || [])
        setMilestones(data.milestones || [])
      }
    } catch (error) {
      console.error("Error fetching governance data:", error)
    } finally {
      setIsLoadingGovernance(false)
    }
  }, [projectId])

  // Load governance data on mount
  useEffect(() => {
    if (projectId) {
      fetchGovernanceData()
    }
  }, [projectId, fetchGovernanceData])

  // Load data when changes tab is active
  useEffect(() => {
    if (activeTab === "changes" && projectId) {
      fetchChangeRequests()
      fetchChangeHistory()
      fetchBaselineComparison()
    }
  }, [activeTab, projectId, fetchChangeRequests, fetchChangeHistory, fetchBaselineComparison])

  // Create change request
  const handleCreateChangeRequest = async () => {
    if (!newChangeTitle.trim()) return

    setIsCreatingChange(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/changes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newChangeTitle,
          description: newChangeDescription,
          change_type: newChangeType,
          priority: newChangePriority,
          area: newChangeArea
        })
      })

      if (res.ok) {
        setShowCreateDialog(false)
        setNewChangeTitle("")
        setNewChangeDescription("")
        setNewChangeType("modification")
        setNewChangePriority("medium")
        setNewChangeArea("other")
        fetchChangeRequests()
        fetchChangeHistory()
      }
    } catch (error) {
      console.error("Error creating change request:", error)
    } finally {
      setIsCreatingChange(false)
    }
  }

  // Analyze change request
  const handleAnalyzeChange = async (changeId: string) => {
    setIsAnalyzingChange(true)
    try {
      const res = await fetch("/api/ai/analyze-change", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          changeRequestId: changeId,
          projectId
        })
      })

      if (res.ok) {
        fetchChangeRequests()
        fetchChangeHistory()
        fetchBaselineComparison()
      }
    } catch (error) {
      console.error("Error analyzing change:", error)
    } finally {
      setIsAnalyzingChange(false)
    }
  }

  // Approve change request
  const handleApproveChange = async (changeId: string) => {
    setIsApprovingChange(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/changes/${changeId}/approve`, {
        method: "POST"
      })

      if (res.ok) {
        setSelectedChange(null)
        fetchChangeRequests()
        fetchChangeHistory()
      }
    } catch (error) {
      console.error("Error approving change:", error)
    } finally {
      setIsApprovingChange(false)
    }
  }

  // Reject change request
  const handleRejectChange = async (changeId: string) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/changes/${changeId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Rejected by user" })
      })

      if (res.ok) {
        setSelectedChange(null)
        fetchChangeRequests()
        fetchChangeHistory()
      }
    } catch (error) {
      console.error("Error rejecting change:", error)
    }
  }

  // Create baseline
  const handleCreateBaseline = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/baseline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: `Baseline ${new Date().toLocaleDateString()}` })
      })

      if (res.ok) {
        fetchBaselineComparison()
        fetchChangeHistory()
      }
    } catch (error) {
      console.error("Error creating baseline:", error)
    }
  }

  const handleAnalyze = async () => {
    setIsAnalyzing(true)
    await new Promise(resolve => setTimeout(resolve, 2000))
    setRequirementsAnalysis({
      summary: "AI analyzed your requirements and broke them into 10 backlog items across auth, dashboard, and reporting. Suggested scope fits two sprints within the 24-day window.",
      highlights: [
        "Core flows prioritized: auth, dashboard data, reporting",
        "Dependencies: database first, then API, then UI",
        "Capacity fit: ~46h of work aligned to current team load"
      ],
      backlog: [
        { id: "R-1", title: "Email/password authentication", estimate: 6, type: "backend", sprint: "Sprint 2" },
        { id: "R-2", title: "Role-based access control", estimate: 5, type: "backend", sprint: "Sprint 2" },
        { id: "R-3", title: "Project overview dashboard", estimate: 8, type: "frontend", sprint: "Sprint 2" },
        { id: "R-4", title: "Resource workload view", estimate: 6, type: "frontend", sprint: "Sprint 3" },
        { id: "R-5", title: "Reporting export (PDF/CSV)", estimate: 7, type: "backend", sprint: "Sprint 3" }
      ],
      risks: [
        "Export format scope creep (PDF layout vs CSV)",
        "RBAC testing could add 1-2 days if roles expand",
        "Data quality for dashboard depends on API readiness"
      ],
      sprintPlan: [
        { name: "Sprint 2", goal: "Ship auth + dashboard skeleton", points: 24, window: "Jan 15 - Jan 28" },
        { name: "Sprint 3", goal: "Finalize reporting + workload view", points: 22, window: "Jan 29 - Feb 11" }
      ]
    })
    setHasCreatedSprintPlan(false)
    setIsAnalyzing(false)
    setActiveTab("requirements")
  }

  const handleSendMessage = () => {
    if (!advisorInput.trim()) return
    setMessages([
      ...messages,
      { role: "user" as const, content: advisorInput },
      { role: "assistant" as const, content: "Based on your current progress, you're on track to meet your deadline. The authentication system is 60% complete, and I'd recommend prioritizing the dashboard UI next to maintain momentum." }
    ])
    setAdvisorInput("")
  }

  const handleTaskDragStart = (taskId: string, fromSprintId: string) => {
    setDraggingTask({ taskId, fromSprintId })
  }

  const handleTaskDragOver = (event: DragEvent, sprintId: string) => {
    event.preventDefault()
    setDragOverSprintId(sprintId)
  }

  const handleTaskDragLeave = () => {
    setDragOverSprintId(null)
  }

  const handleTaskDrop = (event: DragEvent, targetSprintId: string) => {
    event.preventDefault()
    setDragOverSprintId(null)
    if (!draggingTask || targetSprintId === draggingTask.fromSprintId) {
      setDraggingTask(null)
      return
    }

    setSprints((prev) => {
      let movedTask: { id: string; title: string; type: string; status: string; estimatedHours: number } | null = null

      const withoutSource = prev.map((sprint) => {
        if (sprint.id === draggingTask.fromSprintId) {
          const task = sprint.tasks.find((t) => t.id === draggingTask.taskId)
          if (!task) return sprint
          movedTask = task
          return { ...sprint, tasks: sprint.tasks.filter((t) => t.id !== draggingTask.taskId) }
        }
        return sprint
      })

      if (!movedTask) return prev

      return withoutSource.map((sprint) => {
        if (sprint.id === targetSprintId) {
          return { ...sprint, tasks: [...sprint.tasks, movedTask!] }
        }
        return sprint
      })
    })

    setDraggingTask(null)
  }

  const openAddTaskDialog = (sprintId: string) => {
    setAddTaskDialog({ open: true, sprintId })
    setNewTaskForm({ title: "", estimate: "", type: "frontend" })
  }

  const handleAddTaskFromDialog = () => {
    if (!addTaskDialog.sprintId || !newTaskForm.title.trim()) return

    const estimateNum = Number(newTaskForm.estimate)
    const normalizedEstimate = Number.isFinite(estimateNum) && estimateNum > 0 ? Math.round(estimateNum) : 1

    const newTask = {
      id: `new-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: newTaskForm.title.trim(),
      type: newTaskForm.type,
      status: "pending",
      estimatedHours: normalizedEstimate
    }

    setSprints((prev) =>
      prev.map((sprint) =>
        sprint.id === addTaskDialog.sprintId ? { ...sprint, tasks: [...sprint.tasks, newTask] } : sprint
      )
    )

    setAddTaskDialog({ open: false, sprintId: null })
  }

  // Helper functions for badges
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "approved": return "success"
      case "rejected": return "destructive"
      case "analyzed": return "default"
      case "implemented": return "success"
      default: return "secondary"
    }
  }

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case "critical": return "destructive"
      case "high": return "warning"
      case "medium": return "default"
      default: return "secondary"
    }
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <Link href="/projects" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-2">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Projects
            </Link>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{mockProject.name}</h1>
              <Badge variant="success">{mockProject.health}</Badge>
            </div>
            <p className="text-gray-500">{mockProject.description}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Deadline</p>
            <p className="font-medium">{formatDate(mockProject.deadline)}</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Overall Progress</span>
            <span className="font-medium">{mockProject.progress}%</span>
          </div>
          <Progress value={mockProject.progress} className="h-2" />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
            <TabsList className="inline-flex w-max md:w-auto md:grid md:grid-cols-7">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="timeline">Plan</TabsTrigger>
              <TabsTrigger value="sprints">Sprints</TabsTrigger>
              <TabsTrigger value="requirements">Requirements</TabsTrigger>
              <TabsTrigger value="changes">Changes</TabsTrigger>
              <TabsTrigger value="advisor">AI Advisor</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
            </TabsList>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Project health & key stats</CardTitle>
                <CardDescription>Everything a PM needs to understand status, timing, and scope.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="success">{mockProject.health}</Badge>
                      <span className="text-sm text-gray-500">Health</span>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm text-gray-500">
                        <span>Overall progress</span>
                        <span className="font-medium text-gray-900">{mockProject.progress}%</span>
                      </div>
                      <Progress value={mockProject.progress} className="h-2" />
                    </div>
                  </div>
                  <div className="w-full rounded-lg border bg-gray-50 p-3 md:w-auto">
                    <p className="text-xs text-gray-500">Delivery target</p>
                    <p className="font-semibold text-gray-900">{formatDate(mockProject.deadline)}</p>
                    <p className="text-sm text-gray-500">{daysRemaining} days left</p>
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-gray-500">Scope</p>
                    <p className="text-lg font-semibold">{completedTasks}/{totalTasks} tasks</p>
                    <p className="text-xs text-gray-500">{totalTasks - completedTasks} remaining</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-gray-500">Sprints</p>
                    <p className="text-lg font-semibold">{sprintCounts.active} active • {sprintCounts.planned} upcoming</p>
                    <p className="text-xs text-gray-500">{sprintCounts.completed} completed</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-gray-500">Time</p>
                    <p className="text-lg font-semibold">{daysRemaining} days left</p>
                    <p className="text-xs text-gray-500">Deadline {formatDate(mockProject.deadline)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Active sprint focus</CardTitle>
                  <CardDescription>Top items to keep delivery on track</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {activeSprint ? (
                    <>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{activeSprint.name}</p>
                          <p className="text-sm text-gray-500">
                            {formatDate(activeSprint.startDate)} - {formatDate(activeSprint.endDate)} • {activeSprint.tasks.length} tasks
                          </p>
                        </div>
                        <Badge variant="default">Active</Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <span>Progress</span>
                          <span>{activeSprintProgress}%</span>
                        </div>
                        <Progress value={activeSprintProgress} className="h-2" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs text-gray-500">Next up</p>
                        <div className="space-y-2">
                          {activeSprintOpenTasks.slice(0, 3).map((task) => (
                            <div key={task.id} className="flex items-center justify-between rounded-md border p-2">
                              <div className="flex items-center gap-2">
                                <div className={`p-1 rounded ${
                                  task.status === "in_progress" ? "bg-blue-100" : "bg-gray-100"
                                }`}>
                                  {task.status === "in_progress" ? (
                                    <Play className="h-4 w-4 text-blue-600" />
                                  ) : (
                                    <Clock className="h-4 w-4 text-gray-400" />
                                  )}
                                </div>
                                <div>
                                  <p className="text-sm font-medium">{task.title}</p>
                                  <p className="text-xs text-gray-500">{task.estimatedHours}h • {task.type}</p>
                                </div>
                              </div>
                              <Badge variant="secondary">{task.status.replace("_", " ")}</Badge>
                            </div>
                          ))}
                          {activeSprintOpenTasks.length === 0 && (
                            <p className="text-sm text-gray-500">All tasks completed for this sprint.</p>
                          )}
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => setActiveTab("sprints")}>
                        Open sprint board
                      </Button>
                    </>
                  ) : (
                    <div className="text-sm text-gray-500">
                      No active sprint. Plan the next sprint to keep momentum.
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Risks & next steps</CardTitle>
                  <CardDescription>What needs your attention this week</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm">
                    <p className="text-xs font-semibold text-amber-700">Top risk</p>
                    {primaryRisk ? (
                      <>
                        <p className="font-medium text-amber-900">{primaryRisk.title}</p>
                        <p className="text-xs text-amber-700">
                          Severity {primaryRisk.severity} {primaryRisk.owner ? `• Owner ${primaryRisk.owner}` : ""}
                        </p>
                        <p className="text-xs text-amber-700">{primaryRisk.impact}</p>
                      </>
                    ) : (
                      <p className="text-xs text-amber-700">No open risks right now.</p>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">Suggested next steps</p>
                  <div className="grid gap-2">
                    <Button variant="outline" className="justify-start" onClick={() => setActiveTab("timeline")}>
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Review plan & timeline
                    </Button>
                    <Button variant="outline" className="justify-start" onClick={() => setActiveTab("sprints")}>
                      <ListTodo className="h-4 w-4 mr-2" />
                      Finalize sprint scope
                    </Button>
                    <Button variant="outline" className="justify-start" onClick={() => setActiveTab("requirements")}>
                      <FileText className="h-4 w-4 mr-2" />
                      Refine requirements with AI
                    </Button>
                    <Link href="/resources">
                      <Button variant="outline" className="justify-start w-full">
                        <Users className="h-4 w-4 mr-2" />
                        Resource planning
                      </Button>
                    </Link>
                    <Button variant="outline" className="justify-start" onClick={() => setActiveTab("changes")}>
                      <GitPullRequest className="h-4 w-4 mr-2" />
                      Review change requests
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Team & workload</CardTitle>
                  <CardDescription>Detailed view of capacity vs. load</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>Utilization</span>
                    <span className="font-medium text-gray-900">{projectUtilization}%</span>
                  </div>
                  <Progress value={projectUtilization} className="h-2" />
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Badge variant="outline">Capacity {totalCapacityHours}h</Badge>
                    <Badge variant={totalWorkloadHours > totalCapacityHours ? "destructive" : "secondary"}>
                      Load {totalWorkloadHours}h
                    </Badge>
                  </div>
                  {topOverload.length > 0 ? (
                    <p className="text-xs text-amber-600">{topOverload.length} teammate(s) over capacity</p>
                  ) : (
                    <p className="text-xs text-gray-500">All team members within capacity</p>
                  )}
                  <div className="divide-y rounded-lg border">
                    {projectTeam.slice(0, 3).map((member) => {
                      const isOver = member.workloadHours > member.capacityHours
                      return (
                        <div key={member.id} className="flex items-center justify-between p-3">
                          <div>
                            <p className="text-sm font-medium">{member.name}</p>
                            <p className="text-xs text-gray-500">{member.role}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold">{member.workloadHours}/{member.capacityHours}h</p>
                            <p className={`text-xs ${isOver ? "text-red-500" : "text-gray-500"}`}>
                              {isOver ? "Over capacity" : `${member.capacityHours - member.workloadHours}h available`}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Card className="md:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle>Risks & Decisions</CardTitle>
                  <CardDescription>Calls that can unblock the plan</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid gap-2 md:grid-cols-2">
                    <div className="space-y-2">
                      <p className="text-xs text-gray-500">Top risks</p>
                      <div className="divide-y rounded-lg border">
                        {risks.length > 0 ? risks.map((risk) => (
                          <div key={risk.id} className="p-3 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">{risk.title}</span>
                              <Badge variant={risk.severity === "high" || risk.severity === "critical" ? "destructive" : "secondary"}>{risk.severity}</Badge>
                            </div>
                            <p className="text-xs text-gray-600">Owner: {risk.owner}</p>
                            <p className="text-xs text-gray-500">{risk.impact}</p>
                          </div>
                        )) : (
                          <div className="p-3 text-sm text-gray-500">No risks tracked yet</div>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs text-gray-500">Decisions</p>
                      <div className="divide-y rounded-lg border">
                        {decisions.length > 0 ? decisions.map((decision) => (
                          <div key={decision.id} className="p-3 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">{decision.title}</span>
                              {decision.due_date && <Badge variant="secondary">Due {formatDate(decision.due_date)}</Badge>}
                            </div>
                            <p className="text-xs text-gray-600">Owner: {decision.owner}</p>
                            <p className="text-xs text-gray-500 capitalize">{decision.status}</p>
                          </div>
                        )) : (
                          <div className="p-3 text-sm text-gray-500">No decisions pending</div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Milestones</CardTitle>
                  <CardDescription>Upcoming delivery checkpoints</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="divide-y rounded-lg border">
                    {milestones.length > 0 ? milestones.map((milestone) => {
                      const statusBadge = milestone.status === "at_risk" || milestone.status === "delayed" ? "destructive" :
                                         milestone.status === "done" ? "success" : "secondary"
                      return (
                        <div key={milestone.id} className="p-3 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{milestone.name}</span>
                            <Badge variant={statusBadge}>{milestone.status.replace("_", " ")}</Badge>
                          </div>
                          <p className="text-xs text-gray-500">Due {formatDate(milestone.due_date)}</p>
                          <Progress value={milestone.progress} className="h-2" />
                          <p className="text-xs text-gray-500">{milestone.progress}% complete</p>
                        </div>
                      )
                    }) : (
                      <div className="p-3 text-sm text-gray-500">No milestones defined yet</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Requirements Tab */}
          <TabsContent value="requirements" className="space-y-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Project brief</CardTitle>
                <CardDescription>High-level context for what this project is trying to achieve.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-gray-700">
                <div>
                  <p className="text-xs text-gray-500">Goal / outcome</p>
                  <p className="font-medium text-gray-900">
                    {mockProject.description || "Goal has not been documented yet."}
                  </p>
                </div>
                <div className="grid gap-3 md:grid-cols-3 text-xs text-gray-500">
                  <div>
                    <p className="font-semibold text-gray-600">Audience</p>
                    <p>Not captured yet</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-600">Success metrics</p>
                    <p>Define how you will measure success (usage, revenue, satisfaction, etc.).</p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-600">Constraints</p>
                    <p>Capture tech, budget, or compliance limits here.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Project Requirements
                </CardTitle>
                <CardDescription>
                  Keep the project brief and PRD here so anyone joining can understand scope, goals, and constraints.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Paste your project requirements here...

Example:
- User authentication with email/password
- Dashboard showing project overview
- AI-powered task breakdown
- Sprint planning with capacity management"
                  rows={12}
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                />
                <div className="flex justify-end">
                  <Button onClick={handleAnalyze} disabled={!requirements.trim() || isAnalyzing}>
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Analyze with AI
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-gray-900">Requirements history</CardTitle>
                <CardDescription>Versioning and last-updated details.</CardDescription>
              </CardHeader>
              <CardContent className="text-xs text-gray-500">
                Last updated information is not tracked yet. Once requirements are stored with versions, they will be summarized here.
              </CardContent>
            </Card>

            {requirementsAnalysis ? (
              <div className="grid gap-4 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                  <CardHeader className="pb-2">
                    <CardTitle>AI requirements breakdown</CardTitle>
                    <CardDescription>{requirementsAnalysis.summary}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-xs text-gray-500">Highlights</p>
                      <div className="grid gap-2 md:grid-cols-3">
                        {requirementsAnalysis.highlights.map((item, idx) => (
                          <div key={idx} className="rounded-md border bg-gray-50 p-3 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 inline mr-2" />
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Backlog items (all scoped work)</span>
                        <span className="text-gray-400">Backlog = full list • Sprint = allocation</span>
                      </div>
                      <div className="divide-y rounded-lg border">
                        {requirementsAnalysis.backlog.map((item) => (
                          <div key={item.id} className="flex items-center justify-between p-3">
                            <div>
                              <p className="font-medium">{item.title}</p>
                              <p className="text-xs text-gray-500">{item.type} • {item.estimate}h • {item.sprint}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">Backlog</Badge>
                              <Badge variant="secondary">{item.sprint}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs text-gray-500">Risks to monitor</p>
                      <div className="grid gap-2 md:grid-cols-3">
                        {requirementsAnalysis.risks.map((risk, idx) => (
                          <div key={idx} className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                            <AlertTriangle className="h-4 w-4 inline mr-2" />
                            {risk}
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle>Sprint plan preview</CardTitle>
                    <CardDescription>How the AI would create sprints</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Sprint plan (allocation of backlog)</span>
                        <span className="text-gray-400">Each sprint = goal + points + window</span>
                      </div>
                      {requirementsAnalysis.sprintPlan.map((sprint) => (
                        <div key={sprint.name} className="rounded-lg border p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="font-medium">{sprint.name}</p>
                            <Badge variant="secondary">{sprint.points} pts</Badge>
                          </div>
                          <p className="text-xs text-gray-500">{sprint.window}</p>
                          <p className="text-sm text-gray-700">{sprint.goal}</p>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-2">
                      <Button
                        className="w-full"
                        onClick={() => {
                          setHasCreatedSprintPlan(true)
                          setActiveTab("sprints")
                        }}
                      >
                        Create sprint plan
                      </Button>
                      {hasCreatedSprintPlan ? (
                        <p className="text-xs text-emerald-600">Sprint plan prepared. Open the Sprints tab to review.</p>
                      ) : (
                        <p className="text-xs text-gray-500 text-center">Previewed only — click to push into sprints</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : null}
          </TabsContent>

          {/* Sprints Tab */}
          <TabsContent value="sprints" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Sprints</h3>
                <p className="text-sm text-gray-500">
                  {sprints.length} sprints • {totalTasks} tasks ({sprintCounts.active} active / {sprintCounts.planned} upcoming)
                </p>
                <p className="text-xs text-gray-500">Drag tasks between sprints to fine-tune scope and load.</p>
              </div>
              <Link href="/resources">
                <Button variant="outline">
                  <Users className="h-4 w-4 mr-2" />
                  Resource Planning
                </Button>
              </Link>
            </div>
            <div className="space-y-4">
              {sprints.map((sprint) => {
                const completedTasks = sprint.tasks.filter((task) => task.status === "completed").length
                const progress = sprint.tasks.length > 0 ? Math.round((completedTasks / sprint.tasks.length) * 100) : 0

                return (
                  <Card
                    key={sprint.id}
                    className={`${sprint.status === "active" ? "ring-2 ring-emerald-500" : ""} ${dragOverSprintId === sprint.id ? "border-2 border-dashed border-emerald-400" : ""}`}
                    onDragOver={(e) => handleTaskDragOver(e, sprint.id)}
                    onDragLeave={handleTaskDragLeave}
                    onDrop={(e) => handleTaskDrop(e, sprint.id)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">{sprint.name}</CardTitle>
                          <CardDescription>
                            {formatDate(sprint.startDate)} - {formatDate(sprint.endDate)}
                          </CardDescription>
                          <div className="mt-3 space-y-1">
                            <div className="flex items-center justify-between text-sm text-gray-500">
                              <span>{progress}% complete</span>
                              <span>{completedTasks}/{sprint.tasks.length} tasks</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            sprint.status === "completed" ? "success" :
                            sprint.status === "active" ? "default" : "secondary"
                          }>
                            {sprint.status}
                          </Badge>
                          <Button variant="outline" size="sm" onClick={() => openAddTaskDialog(sprint.id)}>
                            Add Task
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Drag to reorder or move to another sprint</span>
                          <span>{completedTasks}/{sprint.tasks.length} done</span>
                        </div>
                        <div className="divide-y rounded-lg border">
                          {sprint.tasks.map((task) => (
                            <div
                              key={task.id}
                              className="flex items-center justify-between p-4 cursor-grab"
                              draggable
                              onDragStart={() => handleTaskDragStart(task.id, sprint.id)}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`p-1 rounded ${
                                  task.status === "completed" ? "bg-emerald-100" :
                                  task.status === "in_progress" ? "bg-blue-100" : "bg-gray-100"
                                }`}>
                                  {task.status === "completed" ? (
                                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                  ) : task.status === "in_progress" ? (
                                    <Play className="h-4 w-4 text-blue-600" />
                                  ) : (
                                    <Clock className="h-4 w-4 text-gray-400" />
                                  )}
                                </div>
                                <div>
                                  <p className={`font-medium ${task.status === "completed" ? "text-gray-400 line-through" : ""}`}>
                                    {task.title}
                                  </p>
                                  <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <Badge variant="outline" className="text-[10px] capitalize">{task.type}</Badge>
                                    <span>{task.estimatedHours}h</span>
                                  </div>
                                </div>
                              </div>
                              <Badge variant="secondary">{task.status.replace("_", " ")}</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            <Dialog
              open={addTaskDialog.open}
              onOpenChange={(open) => {
                if (!open) {
                  setAddTaskDialog({ open: false, sprintId: null })
                }
              }}
            >
              <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                  <DialogTitle>Add task to sprint</DialogTitle>
                  <DialogDescription>
                    {addTaskDialog.sprintId
                      ? `Sprint: ${sprints.find((s) => s.id === addTaskDialog.sprintId)?.name || ""}`
                      : "Select a sprint to assign this task."}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="add-task-title">Title</Label>
                    <Input
                      id="add-task-title"
                      placeholder="e.g., Implement login screen"
                      value={newTaskForm.title}
                      onChange={(e) => setNewTaskForm((prev) => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-1">
                      <Label>Type</Label>
                      <Select
                        value={newTaskForm.type}
                        onValueChange={(val) => setNewTaskForm((prev) => ({ ...prev, type: val }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="frontend">Frontend</SelectItem>
                          <SelectItem value="backend">Backend</SelectItem>
                          <SelectItem value="api">API</SelectItem>
                          <SelectItem value="ux">UX</SelectItem>
                          <SelectItem value="qa">QA</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="add-task-estimate">Estimate (hrs)</Label>
                      <Input
                        id="add-task-estimate"
                        type="number"
                        min={1}
                        placeholder="8"
                        value={newTaskForm.estimate}
                        onChange={(e) => setNewTaskForm((prev) => ({ ...prev, estimate: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setAddTaskDialog({ open: false, sprintId: null })}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddTaskFromDialog}
                    disabled={!addTaskDialog.sprintId || !newTaskForm.title.trim()}
                  >
                    Add Task
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Project Timeline Tab */}
          <TabsContent value="timeline" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Plan & timeline</h3>
                <p className="text-sm text-gray-500">See the critical path, key milestones, and how much buffer remains.</p>
                <p className="text-xs text-gray-500">
                  Target delivery around {formatDate(mockProject.deadline)} • {daysRemaining} days to go
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-md border bg-gray-50 p-1">
                <Button
                  size="sm"
                  variant={timelineView === "list" ? "default" : "ghost"}
                  className="gap-1"
                  onClick={() => setTimelineView("list")}
                >
                  <ListTodo className="h-4 w-4" />
                  List
                </Button>
                <Button
                  size="sm"
                  variant={timelineView === "calendar" ? "default" : "ghost"}
                  className="gap-1"
                  onClick={() => setTimelineView("calendar")}
                >
                  <CalendarRange className="h-4 w-4" />
                  Calendar
                </Button>
              </div>
            </div>

            {timelineView === "list" ? (
              <Card>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {sprints.map((sprint) => {
                      const completedTasks = sprint.tasks.filter((task) => task.status === "completed").length
                      const progress = sprint.tasks.length > 0 ? Math.round((completedTasks / sprint.tasks.length) * 100) : 0

                      return (
                        <div key={sprint.id} className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-medium">{sprint.name}</p>
                              <p className="text-sm text-gray-500">
                                {formatDate(sprint.startDate)} - {formatDate(sprint.endDate)} • {sprint.tasks.length} tasks
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={
                                sprint.status === "completed" ? "success" :
                                sprint.status === "active" ? "default" : "secondary"
                              }>
                                {sprint.status}
                              </Badge>
                              <Button variant="outline" size="sm" onClick={() => openAddTaskDialog(sprint.id)}>
                                Add Task
                              </Button>
                            </div>
                          </div>

                          <div className="mt-3 space-y-3">
                            <div className="flex items-center justify-between text-sm text-gray-500">
                              <span>{progress}% complete</span>
                              <span>{completedTasks}/{sprint.tasks.length} tasks</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                            <div className="divide-y rounded-lg border">
                              {sprint.tasks.map((task) => (
                                <div key={task.id} className="flex items-center justify-between p-3">
                                  <div className="flex items-center gap-3">
                                    <div className={`p-1 rounded ${
                                      task.status === "completed" ? "bg-emerald-100" :
                                      task.status === "in_progress" ? "bg-blue-100" : "bg-gray-100"
                                    }`}>
                                      {task.status === "completed" ? (
                                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                      ) : task.status === "in_progress" ? (
                                        <Play className="h-4 w-4 text-blue-600" />
                                      ) : (
                                        <Clock className="h-4 w-4 text-gray-400" />
                                      )}
                                    </div>
                                    <div>
                                      <p className={`font-medium ${task.status === "completed" ? "text-gray-400 line-through" : ""}`}>
                                        {task.title}
                                      </p>
                                      <p className="text-sm text-gray-500">{task.type} • {task.estimatedHours}h</p>
                                    </div>
                                  </div>
                                  <Badge variant="secondary">{task.status.replace("_", " ")}</Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <GanttChart
                sprints={mockGanttSprints}
                projectStartDate={projectStartDate}
                projectEndDate={projectEndDate}
              />
            )}
          </TabsContent>

          {/* Changes Tab */}
          <TabsContent value="changes" className="space-y-6">
            {/* Baseline Comparison Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Baseline vs current plan
                    </CardTitle>
                    <CardDescription>Spot scope and timeline drift at a glance.</CardDescription>
                  </div>
                  <Button variant="outline" onClick={handleCreateBaseline}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Baseline
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {baselineComparison ? (
                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Total Hours</p>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold">{baselineComparison.current.total_hours}</span>
                        {baselineComparison.delta.hours !== 0 && (
                          <span className={`flex items-center text-sm ${baselineComparison.delta.hours > 0 ? "text-red-500" : "text-emerald-500"}`}>
                            {baselineComparison.delta.hours > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                            {baselineComparison.delta.hours > 0 ? "+" : ""}{baselineComparison.delta.hours}h
                          </span>
                        )}
                      </div>
                      {baselineComparison.baseline && (
                        <p className="text-xs text-gray-400">Baseline: {baselineComparison.baseline.total_hours}h</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Task Count</p>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold">{baselineComparison.current.task_count}</span>
                        {baselineComparison.delta.tasks !== 0 && (
                          <span className={`flex items-center text-sm ${baselineComparison.delta.tasks > 0 ? "text-amber-500" : "text-emerald-500"}`}>
                            {baselineComparison.delta.tasks > 0 ? "+" : ""}{baselineComparison.delta.tasks}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Timeline Impact</p>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold">{baselineComparison.delta.days}</span>
                        <span className="text-sm text-gray-500">days</span>
                        {baselineComparison.delta.days > 0 && (
                          <Badge variant="destructive">Delayed</Badge>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500">Sprint Status</p>
                      {baselineComparison.sprint_overload.length > 0 ? (
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-amber-500" />
                          <span className="text-sm text-amber-600">{baselineComparison.sprint_overload.join(", ")} overloaded</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                          <span className="text-sm text-emerald-600">All sprints OK</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Target className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>No baseline created yet</p>
                    <p className="text-sm">Create a baseline to track changes against</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Change Requests Section */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Change requests & approvals</h3>
                <p className="text-sm text-gray-500">{changeRequests.length} open request(s)</p>
              </div>
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Request a change
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Create Change Request</DialogTitle>
                    <DialogDescription>
                      Submit a new change request for AI impact analysis
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        placeholder="e.g., Add export feature"
                        value={newChangeTitle}
                        onChange={(e) => setNewChangeTitle(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Describe the change in detail..."
                        rows={4}
                        value={newChangeDescription}
                        onChange={(e) => setNewChangeDescription(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Type</Label>
                        <Select value={newChangeType} onValueChange={(v) => setNewChangeType(v as ChangeType)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new_feature">New Feature</SelectItem>
                            <SelectItem value="modification">Modification</SelectItem>
                            <SelectItem value="removal">Removal</SelectItem>
                            <SelectItem value="bug">Bug Fix</SelectItem>
                            <SelectItem value="urgent">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Priority</Label>
                        <Select value={newChangePriority} onValueChange={(v) => setNewChangePriority(v as ChangePriority)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="critical">Critical</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Area</Label>
                        <Select value={newChangeArea} onValueChange={(v) => setNewChangeArea(v as ChangeArea)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="frontend">Frontend</SelectItem>
                            <SelectItem value="backend">Backend</SelectItem>
                            <SelectItem value="api">API</SelectItem>
                            <SelectItem value="database">Database</SelectItem>
                            <SelectItem value="integration">Integration</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
                    <Button onClick={handleCreateChangeRequest} disabled={isCreatingChange || !newChangeTitle.trim()}>
                      {isCreatingChange ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                      Create
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Change Request List */}
            {isLoadingChanges ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                </CardContent>
              </Card>
            ) : changeRequests.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <GitPullRequest className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-gray-500">No change requests yet</p>
                  <p className="text-sm text-gray-400">Create a change request to analyze its impact</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {/* Change Request List */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">All Requests</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ScrollArea className="h-[400px]">
                      <div className="divide-y">
                        {changeRequests.map((change) => (
                          <div
                            key={change.id}
                            className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${selectedChange?.id === change.id ? "bg-emerald-50" : ""}`}
                            onClick={() => setSelectedChange(change)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{change.title}</p>
                                <p className="text-sm text-gray-500 truncate">{change.description || "No description"}</p>
                              </div>
                              <Badge variant={getStatusBadgeVariant(change.status)} className="ml-2">
                                {change.status}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline" className="text-xs">{change.change_type.replace("_", " ")}</Badge>
                              <Badge variant={getPriorityBadgeVariant(change.priority)} className="text-xs">{change.priority}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>

                {/* Change Request Detail */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      {selectedChange ? selectedChange.title : "Select a Change Request"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedChange ? (
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm font-medium text-gray-500">Description</p>
                          <p className="text-sm">{selectedChange.description || "No description provided"}</p>
                        </div>

                        <div className="flex gap-2">
                          <Badge variant="outline">{selectedChange.change_type.replace("_", " ")}</Badge>
                          <Badge variant={getPriorityBadgeVariant(selectedChange.priority)}>{selectedChange.priority}</Badge>
                          <Badge variant="outline">{selectedChange.area}</Badge>
                        </div>

                        {/* Analysis Section */}
                        {selectedChange.change_request_analysis && selectedChange.change_request_analysis.length > 0 ? (
                          <div className="space-y-3 pt-4 border-t">
                            <h4 className="font-medium flex items-center gap-2">
                              <Sparkles className="h-4 w-4 text-emerald-600" />
                              AI Impact Analysis
                            </h4>
                            {(() => {
                              const analysis = selectedChange.change_request_analysis[0]
                              return (
                                <>
                                  <p className="text-sm text-gray-600">{analysis.impact_summary}</p>

                                  <div className="grid grid-cols-3 gap-2 text-center">
                                    <div className="bg-blue-50 p-2 rounded">
                                      <p className="text-lg font-bold text-blue-700">{analysis.effort_hours}h</p>
                                      <p className="text-xs text-blue-600">New Effort</p>
                                    </div>
                                    <div className="bg-amber-50 p-2 rounded">
                                      <p className="text-lg font-bold text-amber-700">{analysis.rework_hours}h</p>
                                      <p className="text-xs text-amber-600">Rework</p>
                                    </div>
                                    <div className="bg-red-50 p-2 rounded">
                                      <p className="text-lg font-bold text-red-700">+{analysis.impact_on_deadline_days}d</p>
                                      <p className="text-xs text-red-600">Delay</p>
                                    </div>
                                  </div>

                                  {analysis.new_tasks && Array.isArray(analysis.new_tasks) && analysis.new_tasks.length > 0 && (
                                    <div>
                                      <p className="text-sm font-medium mb-1">New Tasks ({analysis.new_tasks.length})</p>
                                      <ul className="text-sm text-gray-600 space-y-1">
                                        {(analysis.new_tasks as Array<{title: string}>).slice(0, 3).map((task, i) => (
                                          <li key={i} className="flex items-center gap-1">
                                            <Plus className="h-3 w-3 text-emerald-500" />
                                            {task.title}
                                          </li>
                                        ))}
                                        {analysis.new_tasks.length > 3 && (
                                          <li className="text-gray-400">+{analysis.new_tasks.length - 3} more</li>
                                        )}
                                      </ul>
                                    </div>
                                  )}

                                  {analysis.risks && Array.isArray(analysis.risks) && analysis.risks.length > 0 && (
                                    <div>
                                      <p className="text-sm font-medium mb-1">Risks ({analysis.risks.length})</p>
                                      <ul className="text-sm space-y-1">
                                        {(analysis.risks as Array<{title: string; severity: string}>).slice(0, 2).map((risk, i) => (
                                          <li key={i} className="flex items-center gap-1">
                                            <AlertTriangle className={`h-3 w-3 ${risk.severity === "high" || risk.severity === "critical" ? "text-red-500" : "text-amber-500"}`} />
                                            {risk.title}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </>
                              )
                            })()}
                          </div>
                        ) : selectedChange.status === "open" ? (
                          <div className="pt-4 border-t">
                            <Button
                              className="w-full"
                              onClick={() => handleAnalyzeChange(selectedChange.id)}
                              disabled={isAnalyzingChange}
                            >
                              {isAnalyzingChange ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Analyzing...
                                </>
                              ) : (
                                <>
                                  <Sparkles className="h-4 w-4 mr-2" />
                                  Analyze Impact with AI
                                </>
                              )}
                            </Button>
                          </div>
                        ) : null}

                        {/* Actions */}
                        {selectedChange.status === "analyzed" && (
                          <div className="flex gap-2 pt-4 border-t">
                            <Button
                              className="flex-1"
                              onClick={() => handleApproveChange(selectedChange.id)}
                              disabled={isApprovingChange}
                            >
                              {isApprovingChange ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <Check className="h-4 w-4 mr-2" />
                              )}
                              Approve
                            </Button>
                            <Button
                              variant="outline"
                              className="flex-1"
                              onClick={() => handleRejectChange(selectedChange.id)}
                            >
                              <X className="h-4 w-4 mr-2" />
                              Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <GitPullRequest className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                        <p>Select a change request to view details</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Change History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Change History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {changeHistory.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <History className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>No change history yet</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[200px]">
                    <div className="space-y-3">
                      {changeHistory.map((entry) => (
                        <div key={entry.id} className="flex items-start gap-3 pb-3 border-b last:border-0">
                          <div className={`p-1.5 rounded-full ${
                            entry.action === "approved" ? "bg-emerald-100" :
                            entry.action === "rejected" ? "bg-red-100" :
                            entry.action === "analyzed" ? "bg-blue-100" :
                            "bg-gray-100"
                          }`}>
                            {entry.action === "approved" ? <Check className="h-3 w-3 text-emerald-600" /> :
                             entry.action === "rejected" ? <X className="h-3 w-3 text-red-600" /> :
                             entry.action === "analyzed" ? <Sparkles className="h-3 w-3 text-blue-600" /> :
                             entry.action === "baseline_created" ? <Target className="h-3 w-3 text-gray-600" /> :
                             <Plus className="h-3 w-3 text-gray-600" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm">{entry.description}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-gray-400">{formatDate(entry.created_at)}</span>
                              {entry.delta_hours !== null && entry.delta_hours !== 0 && (
                                <span className={`text-xs ${entry.delta_hours > 0 ? "text-red-500" : "text-emerald-500"}`}>
                                  {entry.delta_hours > 0 ? "+" : ""}{entry.delta_hours}h
                                </span>
                              )}
                              {entry.delta_days !== null && entry.delta_days !== 0 && (
                                <span className={`text-xs ${entry.delta_days > 0 ? "text-red-500" : "text-emerald-500"}`}>
                                  {entry.delta_days > 0 ? "+" : ""}{entry.delta_days}d
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Advisor Tab */}
          <TabsContent value="advisor" className="space-y-6">
            <Card className="h-[600px] flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-emerald-600" />
                  AI Advisor
                </CardTitle>
                <CardDescription>Ask for recovery plans, scope trade-offs, or prep for stakeholder reviews.</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="mb-4 flex flex-wrap gap-3 text-xs text-gray-500">
                  <span>Progress {mockProject.progress}%</span>
                  <span>{daysRemaining} days left</span>
                  <span>Top risk: {primaryRisk ? primaryRisk.title : "None flagged"}</span>
                </div>
                <ScrollArea className="flex-1 pr-4">
                  <div className="space-y-4">
                    {messages.map((msg, index) => (
                      <div
                        key={index}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg px-4 py-2 ${
                            msg.role === "user"
                              ? "bg-emerald-600 text-white"
                              : "bg-gray-100 text-gray-900"
                          }`}
                        >
                          {msg.content}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <div className="flex gap-2 pt-4 border-t mt-4">
                  <Input
                    placeholder="Ask about your project..."
                    value={advisorInput}
                    onChange={(e) => setAdvisorInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  />
                  <Button onClick={handleSendMessage}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            {/* Quick Stats Header */}
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-lg border p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Health</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="success">{mockProject.health}</Badge>
                  </div>
                </div>
                <CheckCircle2 className="h-8 w-8 text-emerald-200" />
              </div>
              <div className="rounded-lg border p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Progress</p>
                  <p className="text-2xl font-bold">{mockProject.progress}%</p>
                </div>
                <BarChart3 className="h-8 w-8 text-blue-200" />
              </div>
              <div className="rounded-lg border p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Tasks</p>
                  <p className="text-2xl font-bold">{completedTasks}/{totalTasks}</p>
                </div>
                <ListTodo className="h-8 w-8 text-purple-200" />
              </div>
              <div className="rounded-lg border p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Days Left</p>
                  <p className="text-2xl font-bold">{daysRemaining}</p>
                </div>
                <Clock className="h-8 w-8 text-amber-200" />
              </div>
            </div>

            <p className="text-xs text-gray-500">
              Use these reports to keep stakeholders aligned: generate status updates, sprint reviews, and risk summaries from the latest project data.
            </p>

            {/* Report Generation */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Generate shareable reports
                    </CardTitle>
                    <CardDescription>Produce status, sprint review, or resource updates for stakeholders.</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <Card className="cursor-pointer hover:shadow-md hover:border-emerald-300 transition-all group">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-emerald-100 group-hover:bg-emerald-200 transition-colors">
                          <BarChart3 className="h-4 w-4 text-emerald-600" />
                        </div>
                        Project Status
                      </CardTitle>
                      <CardDescription>Health, progress, timeline overview</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-gray-500">
                        Includes: project health, milestone status, key metrics, blockers summary.
                        Best for: weekly steering or sponsor updates.
                      </p>
                      <p className="mt-1 text-[11px] text-gray-400">Click to generate a project status report.</p>
                    </CardContent>
                  </Card>

                  <Card className="cursor-pointer hover:shadow-md hover:border-blue-300 transition-all group">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-blue-100 group-hover:bg-blue-200 transition-colors">
                          <TrendingUp className="h-4 w-4 text-blue-600" />
                        </div>
                        Sprint Performance
                      </CardTitle>
                      <CardDescription>Velocity and delivery metrics</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-gray-500">
                        Includes: sprint velocity, burndown analysis, completed vs planned, team output.
                        Best for: sprint reviews and retrospectives.
                      </p>
                      <p className="mt-1 text-[11px] text-gray-400">Click to generate a sprint performance report.</p>
                    </CardContent>
                  </Card>

                  <Card className="cursor-pointer hover:shadow-md hover:border-purple-300 transition-all group">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-purple-100 group-hover:bg-purple-200 transition-colors">
                          <GitPullRequest className="h-4 w-4 text-purple-600" />
                        </div>
                        Change Impact
                      </CardTitle>
                      <CardDescription>Scope changes and timeline effects</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-gray-500">
                        Includes: approved changes, hours added/removed, baseline comparison, delay risks.
                        Best for: change advisory board and steering committees.
                      </p>
                      <p className="mt-1 text-[11px] text-gray-400">Click to generate a change impact report.</p>
                    </CardContent>
                  </Card>

                  <Card className="cursor-pointer hover:shadow-md hover:border-amber-300 transition-all group">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-amber-100 group-hover:bg-amber-200 transition-colors">
                          <AlertTriangle className="h-4 w-4 text-amber-600" />
                        </div>
                        Risk & Issues
                      </CardTitle>
                      <CardDescription>Active risks and blockers</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-gray-500">
                        Includes: risk register, active blockers, mitigation status, escalation needs.
                        Best for: risk reviews and operational check-ins.
                      </p>
                      <p className="mt-1 text-[11px] text-gray-400">Click to generate a risk & issues report.</p>
                    </CardContent>
                  </Card>

                  <Card className="cursor-pointer hover:shadow-md hover:border-indigo-300 transition-all group">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-indigo-100 group-hover:bg-indigo-200 transition-colors">
                          <Sparkles className="h-4 w-4 text-indigo-600" />
                        </div>
                        Executive Summary
                      </CardTitle>
                      <CardDescription>AI-generated brief for leadership</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-gray-500">
                        Includes: 1-page summary, key decisions needed, budget/timeline status, recommendations.
                        Best for: executive summaries and board decks.
                      </p>
                      <p className="mt-1 text-[11px] text-gray-400">Click to generate an executive summary.</p>
                    </CardContent>
                  </Card>

                  <Card className="cursor-pointer hover:shadow-md hover:border-gray-300 transition-all group border-dashed">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-gray-100 group-hover:bg-gray-200 transition-colors">
                          <Plus className="h-4 w-4 text-gray-600" />
                        </div>
                        Custom Report
                      </CardTitle>
                      <CardDescription>Generate with AI prompt</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-gray-500">
                        Describe what you need and AI will generate a tailored report.
                        Best for: ad-hoc client reports or internal deep dives.
                      </p>
                      <p className="mt-1 text-[11px] text-gray-400">Click to start a custom report with an AI prompt.</p>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>

            {/* Saved Reports */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Saved reports</CardTitle>
                <CardDescription>History of reports generated for this project.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">
                  No reports generated yet. Once you generate a report, it will appear here with a link to view or copy.
                </p>
              </CardContent>
            </Card>

            {/* Project Summary Section */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Status preview</CardTitle>
                <CardDescription>
                  This is the content that will appear in a Project Status report: current sprint and delivery forecast.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-800 mb-1">Sprint overview</h4>
                    <div className="space-y-3">
                      {activeSprint ? (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{activeSprint.name}</span>
                            <Badge variant="default">Active</Badge>
                          </div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm text-gray-500">
                              <span>Progress</span>
                              <span>{activeSprintProgress}%</span>
                            </div>
                            <Progress value={activeSprintProgress} className="h-2" />
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-center text-sm">
                            <div className="rounded-md bg-gray-50 p-2">
                              <p className="font-semibold">{activeSprint.tasks.length}</p>
                              <p className="text-xs text-gray-500">Total</p>
                            </div>
                            <div className="rounded-md bg-emerald-50 p-2">
                              <p className="font-semibold text-emerald-700">{activeSprintCompleted}</p>
                              <p className="text-xs text-emerald-600">Done</p>
                            </div>
                            <div className="rounded-md bg-blue-50 p-2">
                              <p className="font-semibold text-blue-700">
                                {activeSprint.tasks.filter(t => t.status === "in_progress").length}
                              </p>
                              <p className="text-xs text-blue-600">In Progress</p>
                            </div>
                          </div>
                        </>
                      ) : (
                        <p className="text-sm text-gray-500">No active sprint</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-800 mb-1">Timeline status</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Target Deadline</span>
                        <span className="font-medium">{formatDate(mockProject.deadline)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Days Remaining</span>
                        <Badge variant={daysRemaining < 14 ? "warning" : "secondary"}>{daysRemaining} days</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Sprints Remaining</span>
                        <span className="font-medium">{sprintCounts.planned} planned</span>
                      </div>
                      <div className="rounded-md bg-gray-50 p-3">
                        <div className="flex items-center gap-2">
                          {daysRemaining >= 14 ? (
                            <>
                              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                              <span className="text-sm text-emerald-700">On track for delivery</span>
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="h-4 w-4 text-amber-500" />
                              <span className="text-sm text-amber-700">Timeline pressure - monitor closely</span>
                            </>
                          )}
                        </div>
                      </div>
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
