"use client"

import { useMemo, useState } from "react"
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
    "Requirements capture with validation",
    "AI analysis mapped to ai_project_analysis",
    "Sprint/task planning aligned to schema",
    "Resource allocation and utilization view"
  ],
  suggested_phases: [
    { name: "Foundation", description: "Project metadata + requirements capture mapped to projects and project_inputs.", estimated_hours: 14 },
    { name: "Planning", description: "AI analysis + task breakdown mapped to ai_project_analysis and tasks.", estimated_hours: 20 },
    { name: "Execution Setup", description: "Sprint timelines, resource allocation, and assignments.", estimated_hours: 18 }
  ]
}

const fallbackTasks: TaskItem[] = [
  {
    id: "task-setup-schema",
    title: "Create Supabase schema for projects/sprints/tasks",
    description: "Ensure data model and permissions match the wizard flow.",
    task_type: "database",
    estimated_hours: 4,
    priority: 1,
    status: "pending"
  },
  {
    id: "task-requirements-ui",
    title: "Build requirements capture UI",
    description: "Inputs for name, description, dates, and PRD text mapped to project_inputs.",
    task_type: "frontend",
    estimated_hours: 6,
    priority: 1,
    status: "pending"
  },
  {
    id: "task-ai-analysis",
    title: "AI analysis call + parsing",
    description: "Call /api/ai/analyze and map JSON to ai_project_analysis fields.",
    task_type: "backend",
    estimated_hours: 6,
    priority: 2,
    status: "pending"
  },
  {
    id: "task-backlog-breakdown",
    title: "Generate backlog tasks",
    description: "Break requirements into tasks with task_type, estimates, and priorities.",
    task_type: "backend",
    estimated_hours: 8,
    priority: 2,
    status: "pending"
  },
  {
    id: "task-sprint-plan",
    title: "Sprint plan and sequencing",
    description: "Create sprints with start/end dates and ordering.",
    task_type: "backend",
    estimated_hours: 6,
    priority: 2,
    status: "pending"
  },
  {
    id: "task-resource-alloc",
    title: "Resource allocation and utilization",
    description: "Assign tasks to resources with assigned_hours.",
    task_type: "devops",
    estimated_hours: 5,
    priority: 3,
    status: "pending"
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
  const [requirementsInput, setRequirementsInput] = useState<RequirementInput>({
    id: generateId(),
    input_type: "prd_text",
    content: ""
  })
  const [analysis, setAnalysis] = useState<AnalysisPayload | null>(null)
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [sprints, setSprints] = useState<SprintItem[]>([])
  const [resources] = useState<ResourceItem[]>(defaultResources)
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

  const canProceed = (step: StepId) => {
    if (step === "requirements") return Boolean(project.name && requirementsInput.content)
    if (step === "analysis") return Boolean(analysis)
    if (step === "backlog") return tasks.length > 0 && sprints.length > 0
    return true
  }

  const nextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      setActiveStep(steps[currentStepIndex + 1].id)
    }
  }

  const prevStep = () => {
    if (currentStepIndex > 0) {
      setActiveStep(steps[currentStepIndex - 1].id)
    }
  }

  const runAnalysis = async () => {
    setIsLoading((prev) => ({ ...prev, analysis: true }))
    setStatusMessage(null)
    try {
      const response = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requirements: requirementsInput.content,
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

  const buildFallbackSprints = (start: string) => {
    const sprintLength = 14
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
    const sprintLength = 14
    try {
      const response = await fetch("/api/ai/sprint-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tasks,
          startDate: start,
          deadline: project.deadline,
          sprintLength,
          weeklyCapacity: resources.reduce((sum, r) => sum + r.weekly_capacity_hours, 0)
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
    setStatusMessage("Resources auto-allocated; ready to persist to task_assignments.")
  }

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
      setStatusMessage("Project save failed. Data prepared for Supabase insert remains in memory.")
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
                  <Badge variant="outline">project_inputs.input_type = prd_text</Badge>
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
                <Button onClick={runAnalysis} disabled={isLoading.analysis}>
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
                <div className="space-y-4">
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
                    <div className="text-xs text-gray-500">Status set to pending</div>
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
                  <div className="grid grid-cols-6 text-xs font-medium text-gray-500">
                    <div className="col-span-2">Title</div>
                    <div>Type</div>
                    <div>Estimate</div>
                    <div>Priority</div>
                    <div>Sprint</div>
                  </div>
                  <div className="divide-y">
                    {tasks.map((task) => (
                      <div key={task.id} className="grid grid-cols-6 py-3 items-start">
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
              <div className="flex flex-wrap gap-3">
                <Button onClick={autoAllocateResources} disabled={!tasks.length}>
                  <Users2 className="h-4 w-4 mr-2" />
                  Auto-allocate resources
                </Button>
                <Button variant="outline" onClick={prevStep}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to sprints
                </Button>
                <Button onClick={saveProject} disabled={isLoading.saving}>
                  {isLoading.saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ArrowRight className="h-4 w-4 mr-2" />}
                  Save project
                </Button>
              </div>

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
