"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn, formatDate } from "@/lib/utils"
import {
  ArrowLeft,
  ArrowRight,
  CalendarRange,
  Check,
  ClipboardList,
  Loader2,
  ShieldAlert,
  Sparkles,
  Target,
  Users2,
  Wand2
} from "lucide-react"
import type {
  InputType,
  ProjectHealth,
  ProjectStatus,
  SprintStatus,
  TaskStatus,
  TaskType
} from "@/types/database"

type StepId = "requirements" | "analysis" | "backlog" | "plan"

type Audience = "internal_team" | "customers" | "both" | "other"
type InitiativeSize = "small" | "medium" | "large"
type TaskScope = "must_have" | "nice_to_have" | "later"
type TeamPreset = "solo" | "small" | "large"

type RequirementInput = { id: string; input_type: InputType; content: string }
type AnalysisRisk = { title: string; description: string; severity: string; mitigation: string }
type AnalysisDependency = { name: string; type: string; description: string }
type AnalysisPhase = { name: string; description: string; estimated_hours: number }
type AnalysisPayload = {
  summary: string
  technical_overview: string
  risks: AnalysisRisk[]
  dependencies: AnalysisDependency[]
  complexity_score: number
  effort_estimate_hours: number
  key_features: string[]
  suggested_phases: AnalysisPhase[]
}

type TaskItem = {
  id: string
  title: string
  description: string
  task_type: TaskType
  estimated_hours: number
  priority: number
  sprint_id?: string
  status: TaskStatus
  scope: TaskScope
}

type SprintItem = {
  id: string
  name: string
  goal: string
  start_date: string
  end_date: string
  status: SprintStatus
  order_index: number
}

type ResourceItem = {
  id: string
  name: string
  role: string
  weekly_capacity_hours: number
}

type AssignmentItem = {
  id: string
  task_id: string
  resource_id: string
  assigned_hours: number
}

const steps: { id: StepId; title: string; description: string }[] = [
  { id: "requirements", title: "Requirements", description: "Capture scope and constraints" },
  { id: "analysis", title: "AI Analysis", description: "Get AI summary, risks, and effort" },
  { id: "backlog", title: "Sprints & Tasks", description: "Align tasks to sprints" },
  { id: "plan", title: "Plan & Resources", description: "Timeline and resource allocation" }
]

const defaultResources: ResourceItem[] = [
  { id: "res-1", name: "You", role: "Product / PM", weekly_capacity_hours: 20 },
  { id: "res-2", name: "Fullstack Dev", role: "Fullstack", weekly_capacity_hours: 40 },
  { id: "res-3", name: "Designer", role: "Design", weekly_capacity_hours: 16 }
]

const fallbackAnalysis: AnalysisPayload = {
  summary: "Plan and deliver an AI-assisted project planning wizard that converts requirements into sprints, tasks, and resource allocations.",
  technical_overview: "Use Next.js UI backed by Supabase to capture requirements, let AI propose analysis, generate sprints and tasks, then auto-allocate resources based on capacity.",
  risks: [
    { title: "Ambiguous requirements", description: "Sparse requirements can produce weak AI plans.", severity: "medium", mitigation: "Require acceptance criteria and guard with review before save." },
    { title: "Capacity mismatch", description: "Sprint load can exceed resource capacity.", severity: "high", mitigation: "Auto-allocate with utilization check and allow manual edits." },
    { title: "Third-party limits", description: "AI or Supabase quotas could block creation.", severity: "low", mitigation: "Provide offline fallback and retries." }
  ],
  dependencies: [
    { name: "Supabase", type: "third-party", description: "Persist projects, inputs, analysis, sprints, tasks, and assignments." },
    { name: "OpenAI", type: "third-party", description: "Provide analysis, breakdown, and sprint planning." },
    { name: "Authentication", type: "internal", description: "Use auth session for per-user RLS in Supabase." }
  ],
  complexity_score: 6,
  effort_estimate_hours: 52,
  key_features: [
    "Guided requirements capture",
    "AI-generated project brief (summary, risks, effort)",
    "Automatic sprint and task planning",
    "Resource workload and utilization overview"
  ],
  suggested_phases: [
    { name: "Foundation", description: "Capture project basics, goals, and requirements.", estimated_hours: 14 },
    { name: "Planning", description: "Use AI to analyze the work and break it into tasks.", estimated_hours: 20 },
    { name: "Execution Setup", description: "Shape sprints, timeline, and team allocation.", estimated_hours: 18 }
  ]
}

const fallbackTasks: TaskItem[] = [
  {
    id: "task-setup-schema",
    title: "Set up core project data",
    description: "Make sure your project, sprint, and task structure matches how you plan and track work.",
    task_type: "database",
    estimated_hours: 4,
    priority: 1,
    status: "pending",
    scope: "must_have"
  },
  {
    id: "task-requirements-ui",
    title: "Build requirements capture UI",
    description: "Inputs for project name, description, key dates, and problem statement.",
    task_type: "frontend",
    estimated_hours: 6,
    priority: 1,
    status: "pending",
    scope: "must_have"
  },
  {
    id: "task-ai-analysis",
    title: "AI analysis call + parsing",
    description: "Call the AI analysis endpoint and turn the response into a clear project brief.",
    task_type: "backend",
    estimated_hours: 6,
    priority: 2,
    status: "pending",
    scope: "must_have"
  },
  {
    id: "task-backlog-breakdown",
    title: "Generate backlog tasks",
    description: "Break requirements into tasks with task_type, estimates, and priorities.",
    task_type: "backend",
    estimated_hours: 8,
    priority: 2,
    status: "pending",
    scope: "nice_to_have"
  },
  {
    id: "task-sprint-plan",
    title: "Sprint plan and sequencing",
    description: "Create sprints with start/end dates and ordering.",
    task_type: "backend",
    estimated_hours: 6,
    priority: 2,
    status: "pending",
    scope: "nice_to_have"
  },
  {
    id: "task-resource-alloc",
    title: "Resource allocation and utilization",
    description: "Assign tasks to resources with assigned_hours.",
    task_type: "devops",
    estimated_hours: 5,
    priority: 3,
    status: "pending",
    scope: "later"
  }
]

const generateId = () => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2))

const toISODate = (date: Date) => date.toISOString().split("T")[0]

const addDays = (start: string | Date, days: number) => {
  const base = typeof start === "string" ? new Date(start) : new Date(start)
  const copy = new Date(base)
  copy.setDate(copy.getDate() + days)
  return toISODate(copy)
}

const formatStatus = (status: ProjectStatus | TaskStatus | SprintStatus) => status.replace(/_/g, " ")

const getSeverityColor = (severity: string) => {
  if (severity === "high" || severity === "critical") return "text-red-600 bg-red-50"
  if (severity === "medium") return "text-amber-600 bg-amber-50"
  return "text-emerald-600 bg-emerald-50"
}

const getScopeLabel = (scope: TaskScope) => {
  switch (scope) {
    case "must_have":
      return "Must-have"
    case "nice_to_have":
      return "Nice-to-have"
    case "later":
      return "Later"
    default:
      return "Unspecified"
  }
}

const getScopeBadgeClass = (scope: TaskScope) => {
  switch (scope) {
    case "must_have":
      return "bg-emerald-50 text-emerald-700 border-emerald-200"
    case "nice_to_have":
      return "bg-blue-50 text-blue-700 border-blue-200"
    case "later":
      return "bg-gray-50 text-gray-700 border-gray-200"
    default:
      return ""
  }
}

const nextScope = (scope: TaskScope): TaskScope => {
  if (scope === "must_have") return "nice_to_have"
  if (scope === "nice_to_have") return "later"
  return "must_have"
}

export default function NewProjectWizard() {
  const router = useRouter()
  const [activeStep, setActiveStep] = useState<StepId>("requirements")
  const [project, setProject] = useState<{
    name: string
    description: string
    start_date: string
    deadline: string
    status: ProjectStatus
    health: ProjectHealth
  }>({
    name: "",
    description: "",
    start_date: "",
    deadline: "",
    status: "planning",
    health: "healthy"
  })
  const [projectMeta, setProjectMeta] = useState<{
    goal: string
    audience: Audience
    successLaunchByDate: boolean
    successUsage: boolean
    successRevenue: boolean
    successSatisfaction: boolean
    customSuccess: string
    constraints: string
    initiativeSize: InitiativeSize
  }>({
    goal: "",
    audience: "internal_team",
    successLaunchByDate: true,
    successUsage: false,
    successRevenue: false,
    successSatisfaction: false,
    customSuccess: "",
    constraints: "",
    initiativeSize: "medium"
  })
  const [requirementsInput, setRequirementsInput] = useState<RequirementInput>({
    id: generateId(),
    input_type: "prd_text",
    content: ""
  })
  const [analysis, setAnalysis] = useState<AnalysisPayload | null>(null)
  const [analysisRefinement, setAnalysisRefinement] = useState("")
  const [analysisIsBaseline, setAnalysisIsBaseline] = useState(false)
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [sprints, setSprints] = useState<SprintItem[]>([])
  const [resources, setResources] = useState<ResourceItem[]>(defaultResources)
  const [assignments, setAssignments] = useState<AssignmentItem[]>([])
  const [timelineSummary, setTimelineSummary] = useState<string>("Run sprint planning to see the timeline.")
  const [bufferPercentage, setBufferPercentage] = useState<number>(15)
  const [isLoading, setIsLoading] = useState<{ analysis: boolean; backlog: boolean; plan: boolean; saving: boolean }>({
    analysis: false,
    backlog: false,
    plan: false,
    saving: false
  })
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [sprintLengthWeeks, setSprintLengthWeeks] = useState(2)
  const [pace, setPace] = useState<"conservative" | "normal" | "aggressive">("normal")
  const [teamPreset, setTeamPreset] = useState<TeamPreset>("small")
  const [autoAISuggestions, setAutoAISuggestions] = useState(true)

  const currentStepIndex = steps.findIndex((s) => s.id === activeStep)
  const totalHours = useMemo(() => tasks.reduce((sum, task) => sum + (task.estimated_hours || 0), 0), [tasks])

  const resourceLoad = useMemo(() => {
    return resources.map((resource) => {
      const hours = assignments
        .filter((a) => a.resource_id === resource.id)
        .reduce((sum, a) => sum + (a.assigned_hours || 0), 0)
      const utilization = resource.weekly_capacity_hours > 0
        ? Math.min(150, Math.round((hours / resource.weekly_capacity_hours) * 100))
        : 0
      return { ...resource, assigned_hours: hours, utilization }
    })
  }, [resources, assignments])

  const sprintLoads = useMemo(() => {
    return sprints.map((sprint) => {
      const sprintTasks = tasks.filter((t) => t.sprint_id === sprint.id)
      const hours = sprintTasks.reduce((sum, t) => sum + (t.estimated_hours || 0), 0)
      return { ...sprint, hours, taskCount: sprintTasks.length }
    })
  }, [sprints, tasks])

  const topEffortArea = useMemo(() => {
    if (!tasks.length) return ""
    const totals: Record<TaskType, number> = {
      backend: 0,
      frontend: 0,
      api: 0,
      database: 0,
      qa: 0,
      design: 0,
      devops: 0,
      other: 0
    }
    tasks.forEach((task) => {
      totals[task.task_type] += task.estimated_hours || 0
    })
    const [topType] = Object.entries(totals).sort((a, b) => b[1] - a[1])[0] || []
    return topType || ""
  }, [tasks])

  const overallUtilization = useMemo(() => {
    if (!resourceLoad.length) return 0
    const sum = resourceLoad.reduce((acc, r) => acc + r.utilization, 0)
    return Math.round(sum / resourceLoad.length)
  }, [resourceLoad])

  const timelineRisk = overallUtilization > 100 ? "High" : overallUtilization >= 80 ? "Medium" : overallUtilization > 0 ? "Low" : "Unknown"

  const estimatedFinishDate = useMemo(() => {
    if (sprints.length) {
      const sorted = [...sprints].sort(
        (a, b) => new Date(a.end_date).getTime() - new Date(b.end_date).getTime()
      )
      return sorted[sorted.length - 1]?.end_date || ""
    }
    return project.deadline || ""
  }, [sprints, project.deadline])

  const canProceed = (step: StepId) => {
    if (step === "requirements") return Boolean(project.name && requirementsInput.content && projectMeta.goal)
    if (step === "analysis") return Boolean(analysis)
    if (step === "backlog") return tasks.length > 0 && sprints.length > 0
    return true
  }

  const nextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      const nextId = steps[currentStepIndex + 1].id
      setActiveStep(nextId)
      if (nextId === "analysis" && autoAISuggestions && !analysis && !isLoading.analysis) {
        void runAnalysis()
      }
    }
  }

  const prevStep = () => {
    if (currentStepIndex > 0) {
      setActiveStep(steps[currentStepIndex - 1].id)
    }
  }

  const runAnalysis = async (refinementNote?: string) => {
    setIsLoading((prev) => ({ ...prev, analysis: true }))
    setStatusMessage(null)
    try {
      const response = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requirements: requirementsInput.content + (refinementNote ? `\n\nRefinement note from user:\n${refinementNote}` : ""),
          projectName: project.name,
          deadline: project.deadline
        })
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => "")
        setAnalysis(fallbackAnalysis)
        setStatusMessage(`AI analysis unavailable${errorText ? `: ${errorText}` : ""}. Showing fallback.`)
        return
      }

      const { analysis: aiAnalysis } = await response.json()
      const parsed = typeof aiAnalysis === "string" ? JSON.parse(aiAnalysis) : aiAnalysis

      const normalized: AnalysisPayload = {
        summary: parsed?.summary || fallbackAnalysis.summary,
        technical_overview: parsed?.technical_overview || fallbackAnalysis.technical_overview,
        risks: parsed?.risks || fallbackAnalysis.risks,
        dependencies: parsed?.dependencies || fallbackAnalysis.dependencies,
        complexity_score: parsed?.complexity_score || fallbackAnalysis.complexity_score,
        effort_estimate_hours: parsed?.effort_estimate_hours || fallbackAnalysis.effort_estimate_hours,
        key_features: parsed?.key_features || fallbackAnalysis.key_features,
        suggested_phases: parsed?.suggested_phases || fallbackAnalysis.suggested_phases
      }

      setAnalysis(normalized)
      setStatusMessage("AI analysis ready: summary, risks, dependencies, effort.")
    } catch (error) {
      console.error("Analysis error, using fallback:", error)
      setAnalysis(fallbackAnalysis)
      setStatusMessage("AI endpoint unreachable; fallback analysis loaded.")
    } finally {
      setIsLoading((prev) => ({ ...prev, analysis: false }))
    }
  }

  const runBacklogBreakdown = async () => {
    setIsLoading((prev) => ({ ...prev, backlog: true }))
    setStatusMessage(null)
    try {
      const response = await fetch("/api/ai/breakdown", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requirements: requirementsInput.content,
          analysis,
          projectName: project.name
        })
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => "")
        setTasks(fallbackTasks)
        setStatusMessage(`AI breakdown unavailable${errorText ? `: ${errorText}` : ""}. Showing fallback tasks.`)
        return
      }

      const { breakdown } = await response.json()
      const parsed = typeof breakdown === "string" ? JSON.parse(breakdown) : breakdown
      const parsedTasks: TaskItem[] = (parsed?.tasks || []).map((task: TaskItem) => ({
        ...task,
        id: task.id || generateId(),
        status: "pending"
      }))

      setTasks(parsedTasks.length ? parsedTasks : fallbackTasks)
      setStatusMessage("Backlog ready with structured tasks.")
    } catch (error) {
      console.error("Backlog error, using fallback:", error)
      setTasks(fallbackTasks)
      setStatusMessage("AI endpoint unreachable; fallback tasks loaded.")
    } finally {
      setIsLoading((prev) => ({ ...prev, backlog: false }))
    }
  }

  const sprintLengthDays = sprintLengthWeeks * 7

  const buildFallbackSprints = (start: string) => {
    const sprintLength = sprintLengthDays || 14
    return [
      {
        id: "sprint-1",
        name: "Sprint 1",
        goal: "Foundation + requirements",
        start_date: start,
        end_date: addDays(start, sprintLength - 1),
        status: "planned" as SprintStatus,
        order_index: 0
      },
      {
        id: "sprint-2",
        name: "Sprint 2",
        goal: "AI + planning wizard",
        start_date: addDays(start, sprintLength),
        end_date: addDays(start, sprintLength * 2 - 1),
        status: "planned" as SprintStatus,
        order_index: 1
      }
    ]
  }

  const runSprintPlan = async () => {
    setIsLoading((prev) => ({ ...prev, plan: true }))
    setStatusMessage(null)
    const start = project.start_date || toISODate(new Date())
    const sprintLength = sprintLengthDays || 14
    const rawWeeklyCapacity = resources.reduce((sum, r) => sum + r.weekly_capacity_hours, 0)
    const paceMultiplier = pace === "conservative" ? 0.8 : pace === "aggressive" ? 1.2 : 1
    const effectiveWeeklyCapacity = Math.round(rawWeeklyCapacity * paceMultiplier)
    try {
      const response = await fetch("/api/ai/sprint-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tasks,
          startDate: start,
          deadline: project.deadline,
          sprintLength,
          weeklyCapacity: effectiveWeeklyCapacity
        })
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => "")
        const fallbackSprints = buildFallbackSprints(start)
        const withSprintIds = tasks.map((task, idx) => ({
          ...task,
          sprint_id: fallbackSprints[idx % fallbackSprints.length]?.id
        }))
        setSprints(fallbackSprints)
        setTasks(withSprintIds)
        setTimelineSummary("Fallback sprint plan created from baseline dates.")
        setStatusMessage(`AI sprint plan unavailable${errorText ? `: ${errorText}` : ""}. Using fallback sprints.`)
        return
      }

      const { sprintPlan } = await response.json()
      const parsed = typeof sprintPlan === "string" ? JSON.parse(sprintPlan) : sprintPlan
      const sprintRecords: SprintItem[] = (parsed?.sprints || []).map((sprint: SprintItem, idx: number) => ({
        id: sprint.id || generateId(),
        name: sprint.name || `Sprint ${idx + 1}`,
        goal: sprint.goal || "Sprint goal",
        start_date: sprint.start_date || addDays(start, idx * sprintLength),
        end_date: sprint.end_date || addDays(start, (idx + 1) * sprintLength - 1),
        status: sprint.status || "planned",
        order_index: idx
      }))

      const plannedTasks = tasks.map((task) => {
        const targetSprint = parsed?.sprints?.find((s: { tasks?: string[] }) => s.tasks?.includes(task.title))
        return targetSprint
          ? { ...task, sprint_id: sprintRecords[parsed?.sprints?.indexOf(targetSprint)]?.id }
          : task
      })

      setSprints(sprintRecords.length ? sprintRecords : buildFallbackSprints(start))
      setTasks(plannedTasks)
      setTimelineSummary(parsed?.timeline_summary || "Sprint plan generated.")
      setBufferPercentage(parsed?.buffer_percentage ?? 15)
      setStatusMessage("Sprint plan created with tasks linked to sprints.")
    } catch (error) {
      console.error("Sprint plan error, using fallback:", error)
      const fallbackSprints = buildFallbackSprints(start)
      const withSprintIds = tasks.map((task, idx) => ({
        ...task,
        sprint_id: fallbackSprints[idx % fallbackSprints.length]?.id
      }))
      setSprints(fallbackSprints)
      setTasks(withSprintIds)
      setTimelineSummary("Fallback sprint plan created from baseline dates.")
      setStatusMessage("AI endpoint unreachable; fallback sprints loaded.")
    } finally {
      setIsLoading((prev) => ({ ...prev, plan: false }))
    }
  }

  const autoAllocateResources = () => {
    if (!tasks.length) return
    const sorted = [...tasks].sort((a, b) => (b.estimated_hours || 0) - (a.estimated_hours || 0))
    const assignmentMap = new Map<string, number>()
    const newAssignments: AssignmentItem[] = []

    sorted.forEach((task) => {
      const target = resources
        .map((resource) => ({
          resource,
          load: assignmentMap.get(resource.id) || 0,
          utilization: resource.weekly_capacity_hours
            ? (assignmentMap.get(resource.id) || 0) / resource.weekly_capacity_hours
            : 0
        }))
        .sort((a, b) => a.utilization - b.utilization)[0]

      const hours = task.estimated_hours || 1
      assignmentMap.set(target.resource.id, (assignmentMap.get(target.resource.id) || 0) + hours)
      newAssignments.push({
        id: generateId(),
        task_id: task.id,
        resource_id: target.resource.id,
        assigned_hours: hours
      })
    })

    setAssignments(newAssignments)
    setStatusMessage("Resources auto-allocated; you can review or adjust before saving.")
  }

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await fetch("/api/settings")
        if (!res.ok) return
        const data = await res.json()
        const s = data.settings

        if (typeof s?.ai_use_wizard_suggestions === "boolean") {
          setAutoAISuggestions(s.ai_use_wizard_suggestions)
        }

        const defaultSprintLengthDays = s?.default_sprint_length_days ?? 14
        const weeks = Math.max(1, Math.min(3, Math.round(defaultSprintLengthDays / 7)))
        setSprintLengthWeeks(weeks)

        if (typeof s?.weekly_capacity_hours === "number") {
          setResources((prev) =>
            prev.map((r) =>
              r.id === "res-1"
                ? { ...r, weekly_capacity_hours: s.weekly_capacity_hours }
                : r
            )
          )
        }
      } catch (error) {
        console.warn("Unable to load wizard defaults:", error)
      }
    }
    void loadSettings()
  }, [])

  const saveProject = async () => {
    setIsLoading((prev) => ({ ...prev, saving: true }))
    setStatusMessage(null)
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: project.name,
          description: project.description,
          deadline: project.deadline,
          startDate: project.start_date
        })
      })

      if (!response.ok) {
        throw new Error("Failed to create project")
      }

      setStatusMessage("Project created. You can continue planning or return to Projects.")
      router.push("/projects")
    } catch (error) {
      console.error("Save error:", error)
      setStatusMessage("Project save failed. Your plan is still on this page; please try again.")
    } finally {
      setIsLoading((prev) => ({ ...prev, saving: false }))
    }
  }

  const requirementReady = canProceed("requirements")
  const analysisReady = canProceed("analysis")
  const backlogReady = canProceed("backlog")

  return (
    <MainLayout title="New Project Wizard">
      <div className="max-w-6xl mx-auto space-y-6">
        <Link href="/projects" className="inline-flex items-center text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Projects
        </Link>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Wizard Progress</CardTitle>
            <CardDescription>Requirements → AI Analysis → Sprints & Tasks → Plan & Resources</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-4">
              {steps.map((step, idx) => {
                const state = idx < currentStepIndex ? "done" : idx === currentStepIndex ? "current" : "upcoming"
                return (
                  <div
                    key={step.id}
                    className={cn(
                      "rounded-xl border p-3 flex items-start gap-3",
                      state === "current" && "border-blue-200 bg-blue-50",
                      state === "done" && "border-emerald-200 bg-emerald-50"
                    )}
                  >
                    <div
                      className={cn(
                        "h-8 w-8 flex items-center justify-center rounded-full text-sm font-semibold",
                        state === "done" && "bg-emerald-500 text-white",
                        state === "current" && "bg-blue-600 text-white",
                        state === "upcoming" && "bg-gray-100 text-gray-500"
                      )}
                    >
                      {state === "done" ? <Check className="h-4 w-4" /> : idx + 1}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{step.title}</div>
                      <div className="text-sm text-gray-500">{step.description}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {activeStep === "requirements" && (
          <Card>
            <CardHeader>
              <CardTitle>Requirements & Project Basics</CardTitle>
              <CardDescription>Share the essentials so AI can plan sprints, tasks, and resources.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <Label htmlFor="project-name">Project Name</Label>
                  <Input
                    id="project-name"
                    placeholder="AI Planning Wizard"
                    value={project.name}
                    onChange={(e) => setProject({ ...project, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="start-date">Start Date</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={project.start_date}
                    onChange={(e) => setProject({ ...project, start_date: e.target.value })}
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="deadline">Target Deadline</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={project.deadline}
                    onChange={(e) => setProject({ ...project, deadline: e.target.value })}
                  />
                </div>
                <div className="space-y-3">
                  <Label>Status</Label>
                  <div className="flex gap-2 flex-wrap">
                    {(["planning", "in_progress", "on_hold"] as ProjectStatus[]).map((status) => (
                      <Button
                        key={status}
                        type="button"
                        variant={project.status === status ? "default" : "outline"}
                        size="sm"
                        onClick={() => setProject({ ...project, status })}
                      >
                        {formatStatus(status)}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <Label htmlFor="goal">Goal (3–6 month outcome)</Label>
                  <Textarea
                    id="goal"
                    rows={3}
                    placeholder="e.g. Launch an AI project planning wizard that helps PMs go from idea to plan in under 10 minutes."
                    value={projectMeta.goal}
                    onChange={(e) => setProjectMeta({ ...projectMeta, goal: e.target.value })}
                  />
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Who is this for?</Label>
                    <Select
                      value={projectMeta.audience}
                      onValueChange={(value) => setProjectMeta({ ...projectMeta, audience: value as Audience })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select primary audience" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="internal_team">Internal team</SelectItem>
                        <SelectItem value="customers">Customers</SelectItem>
                        <SelectItem value="both">Both internal & customers</SelectItem>
                        <SelectItem value="other">Other / not sure yet</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>How big is this initiative?</Label>
                    <div className="flex flex-wrap gap-2">
                      {(["small", "medium", "large"] as InitiativeSize[]).map((size) => (
                        <Button
                          key={size}
                          type="button"
                          size="sm"
                          variant={projectMeta.initiativeSize === size ? "default" : "outline"}
                          onClick={() => setProjectMeta({ ...projectMeta, initiativeSize: size })}
                        >
                          {size === "small" && "Small (1–2 weeks)"}
                          {size === "medium" && "Medium (3–6 weeks)"}
                          {size === "large" && "Large (6+ weeks)"}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <Label>How will you measure success?</Label>
                  <div className="space-y-2 text-sm text-gray-700">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="h-3.5 w-3.5 rounded border-gray-300"
                        checked={projectMeta.successLaunchByDate}
                        onChange={(e) => setProjectMeta({ ...projectMeta, successLaunchByDate: e.target.checked })}
                      />
                      <span>Launch by a specific date</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="h-3.5 w-3.5 rounded border-gray-300"
                        checked={projectMeta.successUsage}
                        onChange={(e) => setProjectMeta({ ...projectMeta, successUsage: e.target.checked })}
                      />
                      <span>Usage / adoption (e.g. weekly active users)</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="h-3.5 w-3.5 rounded border-gray-300"
                        checked={projectMeta.successRevenue}
                        onChange={(e) => setProjectMeta({ ...projectMeta, successRevenue: e.target.checked })}
                      />
                      <span>Revenue or cost savings</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="h-3.5 w-3.5 rounded border-gray-300"
                        checked={projectMeta.successSatisfaction}
                        onChange={(e) => setProjectMeta({ ...projectMeta, successSatisfaction: e.target.checked })}
                      />
                      <span>Customer or stakeholder satisfaction</span>
                    </label>
                    <Textarea
                      rows={2}
                      placeholder="Any other signals of success? (optional)"
                      value={projectMeta.customSuccess}
                      onChange={(e) => setProjectMeta({ ...projectMeta, customSuccess: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <Label>Constraints & non‑negotiables</Label>
                  <Textarea
                    rows={6}
                    placeholder="List any hard constraints (tech stack, budget, compliance, dependencies, etc.)."
                    value={projectMeta.constraints}
                    onChange={(e) => setProjectMeta({ ...projectMeta, constraints: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="description">Problem Statement</Label>
                <Textarea
                  id="description"
                  rows={3}
                  placeholder="What outcome do you want? Any constraints, scope boundaries, success metrics."
                  value={project.description}
                  onChange={(e) => setProject({ ...project, description: e.target.value })}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="requirements">Requirements / PRD</Label>
                  <Badge variant="outline">Tip: include goals and acceptance criteria</Badge>
                </div>
                <Textarea
                  id="requirements"
                  rows={8}
                  placeholder="Paste requirements, acceptance criteria, constraints, stakeholders..."
                  value={requirementsInput.content}
                  onChange={(e) => setRequirementsInput({ ...requirementsInput, content: e.target.value })}
                />
              </div>

              <div className="flex justify-between pt-2">
                <div className="text-sm text-gray-500">Next: run AI analysis to summarize and size the work.</div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => router.push("/projects")}>Cancel</Button>
                  <Button onClick={nextStep} disabled={!requirementReady}>
                    Continue to Analysis
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {activeStep === "analysis" && (
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle>AI Analysis</CardTitle>
                  <CardDescription>AI summarizes the project, flags risks and dependencies, and estimates effort.</CardDescription>
                </div>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Sparkles className="h-4 w-4" /> AI
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => runAnalysis()} disabled={isLoading.analysis}>
                  {isLoading.analysis ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Wand2 className="h-4 w-4 mr-2" />}
                  Analyze requirements
                </Button>
                <Button variant="outline" onClick={prevStep}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to requirements
                </Button>
                <Button variant="outline" onClick={nextStep} disabled={!analysisReady}>
                  Continue to Sprints
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>

              {analysis && (
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card className="border-blue-100 bg-blue-50/60">
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Sparkles className="h-4 w-4 text-blue-600" />
                          Summary
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm text-gray-700">
                        <p>{analysis.summary}</p>
                        <p className="text-gray-600">{analysis.technical_overview}</p>
                        <div className="flex gap-3 text-xs pt-2">
                          <Badge variant="outline">Complexity {analysis.complexity_score}/10</Badge>
                          <Badge variant="outline">{analysis.effort_estimate_hours}h est.</Badge>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <ShieldAlert className="h-4 w-4 text-amber-600" />
                          Risks
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {analysis.risks.map((risk) => (
                          <div key={risk.title} className="rounded-lg border p-3">
                            <div className="flex items-center justify-between">
                              <div className="font-medium text-gray-900">{risk.title}</div>
                              <Badge className={getSeverityColor(risk.severity)}>{risk.severity}</Badge>
                            </div>
                            <p className="text-sm text-gray-600">{risk.description}</p>
                            <p className="text-xs text-gray-500">Mitigation: {risk.mitigation}</p>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <ClipboardList className="h-4 w-4 text-emerald-600" />
                        Key Features & Phases
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {analysis.key_features.map((feature) => (
                          <Badge key={feature} variant="secondary">{feature}</Badge>
                        ))}
                      </div>
                      <div className="grid md:grid-cols-3 gap-3">
                        {analysis.suggested_phases.map((phase) => (
                          <div key={phase.name} className="rounded-lg border p-3">
                            <div className="font-medium text-gray-900">{phase.name}</div>
                            <p className="text-sm text-gray-600">{phase.description}</p>
                            <div className="text-xs text-gray-500 mt-1">{phase.estimated_hours}h</div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Target className="h-4 w-4 text-indigo-600" />
                        Dependencies
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-3 gap-3">
                      {analysis.dependencies.map((dep) => (
                        <div key={dep.name} className="rounded-lg border p-3">
                          <div className="flex items-center justify-between">
                            <div className="font-medium text-gray-900">{dep.name}</div>
                            <Badge variant="outline">{dep.type}</Badge>
                          </div>
                          <p className="text-sm text-gray-600">{dep.description}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-semibold text-gray-900">Review checklist</CardTitle>
                      <CardDescription>Use this as a quick sanity check before planning.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-gray-700">
                      <ul className="list-disc list-inside space-y-1">
                        <li>Does the summary match what you actually want to ship?</li>
                        <li>Are there any missing key risks or dependencies?</li>
                        <li>Are must‑have features clearly represented?</li>
                      </ul>
                    </CardContent>
                  </Card>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold text-gray-900">Refine analysis</CardTitle>
                        <CardDescription>Tell AI what to adjust, then re‑run analysis.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <Textarea
                          rows={3}
                          placeholder="e.g. Emphasize mobile experience, keep MVP to 2 sprints, call out data privacy risks."
                          value={analysisRefinement}
                          onChange={(e) => setAnalysisRefinement(e.target.value)}
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => analysisRefinement.trim() && runAnalysis(analysisRefinement.trim())}
                          disabled={isLoading.analysis || !analysisRefinement.trim()}
                        >
                          {isLoading.analysis ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Sparkles className="h-4 w-4 mr-2" />
                          )}
                          Refine with this note
                        </Button>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold text-gray-900">Baseline this plan</CardTitle>
                        <CardDescription>Mark this analysis as your reference point for changes later.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3 text-sm text-gray-700">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="h-3.5 w-3.5 rounded border-gray-300"
                            checked={analysisIsBaseline}
                            onChange={(e) => setAnalysisIsBaseline(e.target.checked)}
                          />
                          <span>Mark this as my current baseline</span>
                        </label>
                        <p className="text-xs text-gray-500">
                          This doesn&apos;t change any data yet, but it helps you mentally anchor future changes against this plan.
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeStep === "backlog" && (
          <Card>
            <CardHeader>
              <CardTitle>Sprints & Tasks</CardTitle>
              <CardDescription>Review AI-generated tasks and how they roll up into sprints.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-wrap gap-3">
                <Button onClick={runBacklogBreakdown} disabled={isLoading.backlog}>
                  {isLoading.backlog ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                  AI task breakdown
                </Button>
                <Button onClick={runSprintPlan} disabled={!tasks.length || isLoading.plan}>
                  {isLoading.plan ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CalendarRange className="h-4 w-4 mr-2" />}
                  Plan sprints & dates
                </Button>
                <Button variant="outline" onClick={prevStep}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to analysis
                </Button>
                <Button variant="outline" onClick={nextStep} disabled={!backlogReady}>
                  Continue to plan
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-gray-600">Sprint length</Label>
                  <div className="flex flex-wrap gap-2">
                    {[1, 2, 3].map((weeks) => (
                      <Button
                        key={weeks}
                        type="button"
                        size="sm"
                        variant={sprintLengthWeeks === weeks ? "default" : "outline"}
                        onClick={() => setSprintLengthWeeks(weeks)}
                      >
                        {weeks} week{weeks > 1 ? "s" : ""}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-gray-600">Pace</Label>
                  <div className="flex flex-wrap gap-2">
                    {(["conservative", "normal", "aggressive"] as const).map((level) => (
                      <Button
                        key={level}
                        type="button"
                        size="sm"
                        variant={pace === level ? "default" : "outline"}
                        onClick={() => setPace(level)}
                      >
                        {level === "conservative" && "Conservative"}
                        {level === "normal" && "Normal"}
                        {level === "aggressive" && "Aggressive"}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Total hours</CardTitle>
                    <CardDescription>tasks.estimated_hours</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-semibold">{totalHours}h</div>
                    {analysis && (
                      <div className="text-xs text-gray-500">
                        Est. vs AI: {Math.round((totalHours / analysis.effort_estimate_hours) * 100) || 0}% of {analysis.effort_estimate_hours}h
                      </div>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Sprints</CardTitle>
                    <CardDescription>sprints records</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-semibold">{sprints.length || 0}</div>
                    <div className="text-xs text-gray-500">order_index + dates</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Tasks</CardTitle>
                    <CardDescription>task_type / priority / sprint links</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-semibold">{tasks.length || 0}</div>
                    <div className="text-xs text-gray-500">
                      Status set to pending{topEffortArea ? ` · Most effort: ${topEffortArea}` : ""}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <ClipboardList className="h-4 w-4 text-slate-600" />
                    Task Backlog
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-7 text-xs font-medium text-gray-500">
                    <div className="col-span-2">Title</div>
                    <div>Type</div>
                    <div>Estimate</div>
                    <div>Priority</div>
                    <div>Scope</div>
                    <div>Sprint</div>
                  </div>
                  <div className="divide-y">
                    {tasks.map((task) => (
                      <div key={task.id} className="grid grid-cols-7 py-3 items-start">
                        <div className="col-span-2">
                          <div className="font-medium text-gray-900">{task.title}</div>
                          <p className="text-sm text-gray-600">{task.description}</p>
                        </div>
                        <div className="text-sm">
                          <Badge variant="outline">{task.task_type}</Badge>
                        </div>
                        <div className="text-sm">{task.estimated_hours}h</div>
                        <div className="text-sm">P{task.priority}</div>
                        <div className="text-sm">
                          <button
                            type="button"
                            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${getScopeBadgeClass(task.scope)}`}
                            onClick={() =>
                              setTasks((prev) =>
                                prev.map((t) =>
                                  t.id === task.id ? { ...t, scope: nextScope(t.scope || "must_have") } : t
                                )
                              )
                            }
                          >
                            {getScopeLabel(task.scope || "must_have")}
                          </button>
                        </div>
                        <div className="text-sm">
                          {task.sprint_id ? (
                            <Badge variant="secondary">{sprints.find((s) => s.id === task.sprint_id)?.name || "Sprint"}</Badge>
                          ) : (
                            <Badge variant="outline">Unplanned</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                    {!tasks.length && <div className="py-6 text-sm text-gray-500">Run AI task breakdown to populate tasks.</div>}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <CalendarRange className="h-4 w-4 text-indigo-600" />
                    Sprints
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-3">
                  {sprintLoads.map((sprint) => (
                    <div key={sprint.id} className="rounded-lg border p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="font-semibold text-gray-900">{sprint.name}</div>
                        <Badge variant="outline">{formatStatus(sprint.status)}</Badge>
                      </div>
                      <div className="text-sm text-gray-600">{sprint.goal}</div>
                      <div className="text-xs text-gray-500">
                        {formatDate(sprint.start_date)} - {formatDate(sprint.end_date)}
                      </div>
                      <div className="flex items-center justify-between text-sm pt-1">
                        <span>{sprint.taskCount} tasks</span>
                        <span>{sprint.hours}h</span>
                      </div>
                      <Progress value={Math.min(100, (sprint.hours / (totalHours || 1)) * 100)} />
                    </div>
                  ))}
                  {!sprints.length && <div className="text-sm text-gray-500">Run sprint planning to generate sprint records.</div>}
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        )}

        {activeStep === "plan" && (
          <Card>
            <CardHeader>
              <CardTitle>Project Plan & Resource Allocation</CardTitle>
              <CardDescription>Check timeline, workload, and how hours are spread across the team before saving.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Who will work on this?</Label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={teamPreset === "solo" ? "default" : "outline"}
                    onClick={() => {
                      setTeamPreset("solo")
                      setResources([
                        { id: "res-solo", name: "You", role: "Generalist", weekly_capacity_hours: 30 }
                      ])
                      setAssignments([])
                      setStatusMessage("Team set to just you. Run auto-allocate again to rebalance tasks.")
                    }}
                  >
                    Just me
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={teamPreset === "small" ? "default" : "outline"}
                    onClick={() => {
                      setTeamPreset("small")
                      setResources(defaultResources)
                      setAssignments([])
                      setStatusMessage("Team set to a small squad. Run auto-allocate again to rebalance tasks.")
                    }}
                  >
                    Small team (2–3)
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={teamPreset === "large" ? "default" : "outline"}
                    onClick={() => {
                      setTeamPreset("large")
                      setResources([
                        ...defaultResources,
                        { id: "res-4", name: "Backend Dev", role: "Backend", weekly_capacity_hours: 32 },
                        { id: "res-5", name: "QA", role: "QA", weekly_capacity_hours: 32 }
                      ])
                      setAssignments([])
                      setStatusMessage("Team set to a larger group. Run auto-allocate again to rebalance tasks.")
                    }}
                  >
                    Larger team (4–5)
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button onClick={autoAllocateResources} disabled={!tasks.length}>
                  <Users2 className="h-4 w-4 mr-2" />
                  Auto-allocate resources
                </Button>
                <Button variant="outline" onClick={prevStep}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to sprints
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveStep("backlog")}
                >
                  I want to simplify scope
                </Button>
                <Button onClick={saveProject} disabled={isLoading.saving}>
                  {isLoading.saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ArrowRight className="h-4 w-4 mr-2" />}
                  Looks good, create project
                </Button>
              </div>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-gray-900">Quick recap before you create</CardTitle>
                  <CardDescription>Make sure the plan matches your intent.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 md:grid-cols-3 text-sm text-gray-700">
                  <div>
                    <div className="text-xs font-semibold text-gray-500 mb-1">Goal & outcome</div>
                    <div className="font-medium text-gray-900 line-clamp-3">
                      {projectMeta.goal || "No goal written yet"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-500 mb-1">Timeline</div>
                    <div>
                      Target finish:{" "}
                      {estimatedFinishDate ? formatDate(estimatedFinishDate) : "Not estimated yet"}
                    </div>
                    <div className="text-xs text-gray-500">
                      Timeline risk (based on workload): {timelineRisk}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-500 mb-1">Scope & team load</div>
                    <div>{sprints.length} sprints · {tasks.length} tasks</div>
                    <div className="text-xs text-gray-500">
                      Average team utilization: {overallUtilization}%
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Target className="h-4 w-4 text-emerald-600" />
                    Timeline summary
                  </CardTitle>
                  <CardDescription>{timelineSummary}</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-3 gap-3">
                  <div className="rounded-lg border p-3">
                    <div className="text-xs text-gray-500">Total planned hours</div>
                    <div className="text-xl font-semibold">{totalHours}h</div>
                  </div>
                  <div className="rounded-lg border p-3">
                    <div className="text-xs text-gray-500">Buffer</div>
                    <div className="text-xl font-semibold">{bufferPercentage}%</div>
                  </div>
                  <div className="rounded-lg border p-3">
                    <div className="text-xs text-gray-500">Sprints</div>
                    <div className="text-xl font-semibold">{sprints.length}</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Users2 className="h-4 w-4 text-sky-600" />
                    Resource allocation
                  </CardTitle>
                  <CardDescription>See weekly capacity vs. assigned hours per person.</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-3 gap-3">
                  {resourceLoad.map((resource) => (
                    <div key={resource.id} className="rounded-lg border p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-gray-900">{resource.name}</div>
                          <div className="text-xs text-gray-500">{resource.role}</div>
                        </div>
                        <Badge variant="outline">{resource.weekly_capacity_hours}h/wk</Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Assigned</span>
                        <span>{resource.assigned_hours || 0}h</span>
                      </div>
                      <Progress value={Math.min(100, resource.utilization)} />
                      <div className="text-xs text-gray-500">
                        Utilization: {resource.utilization}% ({resource.assigned_hours || 0}h / {resource.weekly_capacity_hours}h)
                      </div>
                      <div className="text-xs text-gray-600">
                        Tasks:{" "}
                        {assignments
                          .filter((a) => a.resource_id === resource.id)
                          .map((a) => tasks.find((t) => t.id === a.task_id)?.title || "Task")
                          .join(", ") || "None"}
                      </div>
                    </div>
                  ))}
                  {!resourceLoad.length && <div className="text-sm text-gray-500">Add resources to allocate work.</div>}
                </CardContent>
              </Card>

            </CardContent>
          </Card>
        )}

        {statusMessage && (
          <Card>
            <CardContent className="text-sm text-gray-700 py-3">{statusMessage}</CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  )
}
