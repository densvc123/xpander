"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import { MainLayout } from "@/components/layout/main-layout"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
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
  ArrowUpRight,
  ArrowDownRight,
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
import { ResourceWorkload } from "@/components/resources/resource-workload"
import type {
  ChangeRequest,
  ChangeRequestAnalysis,
  ChangeHistory,
  ChangeType,
  ChangePriority,
  ChangeArea,
  BaselineComparison
} from "@/types/database"

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

// Mock tasks
const mockTasks = [
  { id: "1", title: "Set up Next.js project", type: "frontend", status: "completed", estimatedHours: 2 },
  { id: "2", title: "Configure Supabase database", type: "database", status: "completed", estimatedHours: 3 },
  { id: "3", title: "Build authentication system", type: "backend", status: "in_progress", estimatedHours: 5 },
  { id: "4", title: "Create dashboard UI", type: "frontend", status: "in_progress", estimatedHours: 8 },
  { id: "5", title: "Implement AI analysis endpoint", type: "backend", status: "pending", estimatedHours: 6 },
  { id: "6", title: "Build task breakdown feature", type: "backend", status: "pending", estimatedHours: 4 },
]

// Mock sprints
const mockSprints = [
  { id: "1", name: "Sprint 1", status: "completed", startDate: "2024-01-01", endDate: "2024-01-14", tasksCount: 10 },
  { id: "2", name: "Sprint 2", status: "active", startDate: "2024-01-15", endDate: "2024-01-28", tasksCount: 12 },
  { id: "3", name: "Sprint 3", status: "planned", startDate: "2024-01-29", endDate: "2024-02-11", tasksCount: 8 },
]

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

export default function ProjectDetailPage() {
  const params = useParams()
  const projectId = params.id as string

  const [activeTab, setActiveTab] = useState("overview")
  const [requirements, setRequirements] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [advisorInput, setAdvisorInput] = useState("")
  const [messages, setMessages] = useState<Message[]>(mockMessages)

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
    setIsAnalyzing(false)
    setActiveTab("tasks")
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
            <TabsList className="inline-flex w-max md:w-auto md:grid md:grid-cols-9">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="requirements">Requirements</TabsTrigger>
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
              <TabsTrigger value="sprints">Sprints</TabsTrigger>
              <TabsTrigger value="resources">Resources</TabsTrigger>
              <TabsTrigger value="gantt">Gantt</TabsTrigger>
              <TabsTrigger value="changes">Changes</TabsTrigger>
              <TabsTrigger value="advisor">AI Advisor</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
            </TabsList>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Tasks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">18/40</div>
                  <p className="text-sm text-gray-500">completed</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Sprints</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">1/3</div>
                  <p className="text-sm text-gray-500">completed</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Time Remaining</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">24</div>
                  <p className="text-sm text-gray-500">days</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => setActiveTab("requirements")}>
                    <FileText className="h-4 w-4 mr-2" />
                    Add Requirements
                  </Button>
                  <Button variant="outline" onClick={() => setActiveTab("tasks")}>
                    <ListTodo className="h-4 w-4 mr-2" />
                    View Tasks
                  </Button>
                  <Button variant="outline" onClick={() => setActiveTab("resources")}>
                    <Users className="h-4 w-4 mr-2" />
                    Team Resources
                  </Button>
                  <Button variant="outline" onClick={() => setActiveTab("changes")}>
                    <GitPullRequest className="h-4 w-4 mr-2" />
                    Change Requests
                  </Button>
                  <Button variant="outline" onClick={() => setActiveTab("advisor")}>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Ask AI Advisor
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Requirements Tab */}
          <TabsContent value="requirements" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Project Requirements
                </CardTitle>
                <CardDescription>
                  Paste your PRD, user stories, or project requirements. AI will analyze and break them down into tasks.
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
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Tasks</h3>
                <p className="text-sm text-gray-500">{mockTasks.length} tasks total</p>
              </div>
              <Button>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Tasks
              </Button>
            </div>
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {mockTasks.map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
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
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sprints Tab */}
          <TabsContent value="sprints" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Sprints</h3>
                <p className="text-sm text-gray-500">{mockSprints.length} sprints planned</p>
              </div>
              <Button>
                <Sparkles className="h-4 w-4 mr-2" />
                Plan Sprints
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {mockSprints.map((sprint) => (
                <Card key={sprint.id} className={sprint.status === "active" ? "ring-2 ring-emerald-500" : ""}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{sprint.name}</CardTitle>
                      <Badge variant={
                        sprint.status === "completed" ? "success" :
                        sprint.status === "active" ? "default" : "secondary"
                      }>
                        {sprint.status}
                      </Badge>
                    </div>
                    <CardDescription>
                      {formatDate(sprint.startDate)} - {formatDate(sprint.endDate)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-500">{sprint.tasksCount} tasks</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Gantt Tab */}
          <TabsContent value="gantt" className="space-y-6">
            <GanttChart
              sprints={mockGanttSprints}
              projectStartDate={projectStartDate}
              projectEndDate={projectEndDate}
            />
          </TabsContent>

          {/* Resources Tab */}
          <TabsContent value="resources" className="space-y-6">
            <ResourceWorkload projectId={projectId} />
          </TabsContent>

          {/* Changes Tab - NEW */}
          <TabsContent value="changes" className="space-y-6">
            {/* Baseline Comparison Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Baseline Comparison
                    </CardTitle>
                    <CardDescription>Compare current state with project baseline</CardDescription>
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
                <h3 className="text-lg font-semibold">Change Requests</h3>
                <p className="text-sm text-gray-500">{changeRequests.length} requests</p>
              </div>
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    New Change Request
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
                <CardDescription>Ask questions about your project, get suggestions, and insights</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
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
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Reports</h3>
                <p className="text-sm text-gray-500">Generate and view project reports</p>
              </div>
              <Button>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Report
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-base">Project Status Report</CardTitle>
                  <CardDescription>Overview of current project state</CardDescription>
                </CardHeader>
              </Card>
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-base">Sprint Review</CardTitle>
                  <CardDescription>Summary of completed sprints</CardDescription>
                </CardHeader>
              </Card>
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-base">Resource Usage</CardTitle>
                  <CardDescription>Time and capacity analysis</CardDescription>
                </CardHeader>
              </Card>
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-base">Custom Report</CardTitle>
                  <CardDescription>Generate a custom AI report</CardDescription>
                </CardHeader>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  )
}
