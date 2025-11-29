"use client"

import { useEffect, useMemo, useState, type DragEvent } from "react"
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
import { FILE_UPLOAD_CONFIG, formatFileSize } from "@/lib/file-upload-config"
import {
  ArrowLeft,
  ArrowRight,
  CalendarRange,
  Check,
  ClipboardList,
  FileSpreadsheet,
  FileText,
  Loader2,
  ShieldAlert,
  Sparkles,
  Target,
  Users2,
  Wand2,
  X
} from "lucide-react"
import type {
  InputType,
  ProjectHealth,
  ProjectStatus,
  SprintStatus,
  TaskStatus,
  TaskType
} from "@/types/database"

type StepId = "basics" | "requirements" | "tasks" | "resources" | "sprints"

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
  { id: "basics", title: "Project Basics", description: "Name, dates, and goals" },
  { id: "requirements", title: "Requirements & AI", description: "Input requirements and analyze" },
  { id: "tasks", title: "Task Breakdown", description: "Generate and review tasks" },
  { id: "resources", title: "Team & Resources", description: "Define team capacity" },
  { id: "sprints", title: "Sprint Planning", description: "Plan sprints and timeline" }
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
  const [activeStep, setActiveStep] = useState<StepId>("basics")
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
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ file: File; content: string }>>([])
  const [isDraggingFile, setIsDraggingFile] = useState(false)
  const [inputMethod, setInputMethod] = useState<"text" | "file">("text")
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
    if (step === "basics") return Boolean(project.name && projectMeta.goal)
    if (step === "requirements") return Boolean(requirementsInput.content) && Boolean(analysis)
    if (step === "tasks") return tasks.length > 0
    if (step === "resources") return resources.length > 0
    if (step === "sprints") return sprints.length > 0
    return true
  }

  const nextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      const nextId = steps[currentStepIndex + 1].id
      setActiveStep(nextId)
    }
  }

  const prevStep = () => {
    if (currentStepIndex > 0) {
      setActiveStep(steps[currentStepIndex - 1].id)
    }
  }

  const handleDragOverUpload = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    event.dataTransfer.dropEffect = "copy"
    if (!isDraggingFile) {
      setIsDraggingFile(true)
    }
  }

  const handleDragLeaveUpload = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    if (event.relatedTarget && event.currentTarget.contains(event.relatedTarget as Node)) {
      return
    }
    setIsDraggingFile(false)
  }

  const handleDropUpload = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDraggingFile(false)
    const file = event.dataTransfer.files?.[0]
    if (file) {
      void handleFileUpload(file)
    }
  }

  const handleFileUpload = async (file: File) => {
    // Import validation and config
    const { validateFile, FILE_UPLOAD_CONFIG } = await import('@/lib/file-upload-config')

    // Check file count limit
    if (uploadedFiles.length >= FILE_UPLOAD_CONFIG.MAX_FILES) {
      setStatusMessage(`Maximum ${FILE_UPLOAD_CONFIG.MAX_FILES} files allowed. Please remove a file before adding another.`)
      return
    }

    // Check if file already exists
    const isDuplicate = uploadedFiles.some(f => f.file.name === file.name && f.file.size === file.size)
    if (isDuplicate) {
      setStatusMessage(`File "${file.name}" is already uploaded.`)
      return
    }

    // Validate individual file
    const validation = validateFile(file)
    if (!validation.valid) {
      setStatusMessage(validation.error || 'Invalid file')
      return
    }

    // Check total size
    const totalSize = uploadedFiles.reduce((sum, f) => sum + f.file.size, 0) + file.size
    if (totalSize > FILE_UPLOAD_CONFIG.MAX_TOTAL_SIZE) {
      setStatusMessage(`Total file size exceeds ${FILE_UPLOAD_CONFIG.MAX_TOTAL_SIZE_MB}MB limit. Current: ${(totalSize / 1024 / 1024).toFixed(2)}MB`)
      return
    }

    setStatusMessage(`Processing ${file.name}...`)

    try {
      const fileExtension = file.name.split('.').pop()?.toLowerCase()
      let content = ''

      if (fileExtension === 'txt' || fileExtension === 'md') {
        content = await file.text()
      } else if (fileExtension === 'pdf' || fileExtension === 'xlsx' || fileExtension === 'xls' || fileExtension === 'docx') {
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/ai/parse-file', {
          method: 'POST',
          body: formData
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
          setStatusMessage(`Failed to parse ${file.name}: ${errorData.error}`)
          return
        }

        const result = await response.json()
        content = result.content
      } else {
        setStatusMessage("Unsupported file type. Please use .txt, .md, .pdf, .xlsx, or .docx")
        return
      }

      // Add file to the list
      const newFiles = [...uploadedFiles, { file, content }]
      setUploadedFiles(newFiles)

      // Merge all content
      const mergedContent = newFiles.map((f, idx) =>
        `=== File ${idx + 1}: ${f.file.name} ===\n\n${f.content}`
      ).join('\n\n')

      setRequirementsInput({ ...requirementsInput, content: mergedContent, input_type: "prd_text" })
      setStatusMessage(`${file.name} uploaded successfully. Total files: ${newFiles.length}`)
    } catch (error) {
      console.error("File upload error:", error)
      setStatusMessage(`Failed to process ${file.name}. Please try again.`)
    }
  }

  const removeFile = (fileToRemove: File) => {
    const newFiles = uploadedFiles.filter(f => f.file !== fileToRemove)
    setUploadedFiles(newFiles)

    if (newFiles.length === 0) {
      setRequirementsInput({ ...requirementsInput, content: "" })
      setStatusMessage(null)
    } else {
      // Merge remaining content
      const mergedContent = newFiles.map((f, idx) =>
        `=== File ${idx + 1}: ${f.file.name} ===\n\n${f.content}`
      ).join('\n\n')
      setRequirementsInput({ ...requirementsInput, content: mergedContent })
      setStatusMessage(`File removed. ${newFiles.length} file(s) remaining.`)
    }
  }

  const runAnalysis = async (refinementNote?: string) => {
    setIsLoading((prev) => ({ ...prev, analysis: true }))
    setStatusMessage(null)

    const requirementsContent = requirementsInput.content

    try {
      const response = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requirements: requirementsContent + (refinementNote ? `\n\nRefinement note from user:\n${refinementNote}` : ""),
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
    const requirementsContent = requirementsInput.content
    try {
      const response = await fetch("/api/ai/breakdown", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requirements: requirementsContent,
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
      // Step 1: Create project
      const projectResponse = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: project.name,
          description: project.description,
          deadline: project.deadline,
          startDate: project.start_date,
          status: project.status,
          health: project.health
        })
      })

      if (!projectResponse.ok) {
        const errorData = await projectResponse.json().catch(() => ({ error: "Unknown error" }))
        console.error("API Error:", errorData)
        throw new Error(errorData.error || "Failed to create project")
      }

      const { project: createdProject } = await projectResponse.json()
      setStatusMessage("Project created! Saving additional data...")

      // Step 2: Save requirements input if exists
      const requirementsContent = requirementsInput.content
      if (requirementsContent) {
        await fetch(`/api/projects/${createdProject.id}/inputs`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            inputType: requirementsInput.input_type,
            content: requirementsContent
          })
        }).catch(err => console.warn("Failed to save requirements:", err))
      }

      // Step 3: Save sprints if exists
      const sprintIdMap = new Map<string, string>()
      if (sprints.length > 0) {
        for (const sprint of sprints) {
          const sprintResponse = await fetch(`/api/projects/${createdProject.id}/sprints`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: sprint.name,
              goal: sprint.goal,
              startDate: sprint.start_date,
              endDate: sprint.end_date,
              status: sprint.status,
              orderIndex: sprint.order_index
            })
          }).catch(err => {
            console.warn("Failed to save sprint:", err)
            return null
          })

          if (sprintResponse?.ok) {
            const { sprint: createdSprint } = await sprintResponse.json()
            sprintIdMap.set(sprint.id, createdSprint.id)
          }
        }
      }

      // Step 4: Save tasks if exists
      if (tasks.length > 0) {
        for (const task of tasks) {
          const mappedSprintId = task.sprint_id ? sprintIdMap.get(task.sprint_id) : null
          await fetch(`/api/projects/${createdProject.id}/tasks`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sprintId: mappedSprintId,
              title: task.title,
              description: task.description,
              taskType: task.task_type,
              status: task.status,
              priority: task.priority,
              estimatedHours: task.estimated_hours
            })
          }).catch(err => console.warn("Failed to save task:", err))
        }
      }

      setStatusMessage("Project created successfully with all planning data!")
      setTimeout(() => router.push("/projects"), 1500)
    } catch (error) {
      console.error("Save error:", error)
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      setStatusMessage(`Project save failed: ${errorMessage}. Please try again.`)
    } finally {
      setIsLoading((prev) => ({ ...prev, saving: false }))
    }
  }

  const basicsReady = canProceed("basics")
  const requirementsReady = canProceed("requirements")
  const tasksReady = canProceed("tasks")
  const resourcesReady = canProceed("resources")
  const sprintsReady = canProceed("sprints")

  return (
    <MainLayout title="New Project Wizard">
      <div className="max-w-6xl mx-auto space-y-6">
        <Link href="/projects" className="inline-flex items-center text-gray-500 hover:text-gray-700">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Projects
        </Link>

        <div className="py-4">
          <nav
            aria-label="Wizard progress"
            className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8"
          >
            <ol
              role="list"
              className="overflow-hidden rounded-md border border-gray-200 md:flex"
            >
                  {steps.map((step, idx) => {
                    const state = idx < currentStepIndex ? "complete" : idx === currentStepIndex ? "current" : "upcoming"
                    const isFirst = idx === 0
                    const isLast = idx === steps.length - 1
                    const stepId = `0${idx + 1}`

                    return (
                      <li key={step.id} className="relative overflow-hidden md:flex-1">
                        <div
                          className={cn(
                            isFirst ? "rounded-l-md md:rounded-l-md" : "",
                            isLast ? "rounded-r-md md:rounded-r-md" : "",
                            "overflow-hidden"
                          )}
                        >
                          {/* Completed */}
                          {state === "complete" && (
                            <div className="group">
                              <span
                                aria-hidden="true"
                                className="absolute top-0 left-0 h-full w-1 bg-transparent group-hover:bg-gray-200 md:top-auto md:bottom-0 md:h-1 md:w-full"
                              />
                              <span
                                className={cn(
                                  !isFirst && "md:pl-9",
                                  "flex items-start px-6 py-4 text-sm font-medium"
                                )}
                              >
                                <span className="shrink-0">
                                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600">
                                    <Check className="h-5 w-5 text-white" aria-hidden="true" />
                                  </span>
                                </span>
                                <span className="ml-4 mt-0.5 flex min-w-0 flex-col">
                                  <span className="text-sm font-medium text-gray-900">
                                    {step.title}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {step.description}
                                  </span>
                                </span>
                              </span>
                            </div>
                          )}

                          {/* Current */}
                          {state === "current" && (
                            <div aria-current="step">
                              <span
                                aria-hidden="true"
                                className="absolute top-0 left-0 h-full w-1 bg-blue-600 md:top-auto md:bottom-0 md:h-1 md:w-full"
                              />
                              <span
                                className={cn(
                                  !isFirst && "md:pl-9",
                                  "flex items-start px-6 py-4 text-sm font-medium"
                                )}
                              >
                                <span className="shrink-0">
                                  <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-blue-600">
                                    <span className="text-blue-600 text-xs font-semibold">
                                      {stepId}
                                    </span>
                                  </span>
                                </span>
                                <span className="ml-4 mt-0.5 flex min-w-0 flex-col">
                                  <span className="text-sm font-medium text-blue-600">
                                    {step.title}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {step.description}
                                  </span>
                                </span>
                              </span>
                            </div>
                          )}

                          {/* Upcoming */}
                          {state === "upcoming" && (
                            <div className="group">
                              <span
                                aria-hidden="true"
                                className="absolute top-0 left-0 h-full w-1 bg-transparent group-hover:bg-gray-200 md:top-auto md:bottom-0 md:h-1 md:w-full"
                              />
                              <span
                                className={cn(
                                  !isFirst && "md:pl-9",
                                  "flex items-start px-6 py-4 text-sm font-medium"
                                )}
                              >
                                <span className="shrink-0">
                                  <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-gray-300">
                                    <span className="text-xs text-gray-500 font-semibold">
                                      {stepId}
                                    </span>
                                  </span>
                                </span>
                                <span className="ml-4 mt-0.5 flex min-w-0 flex-col">
                                  <span className="text-sm font-medium text-gray-500">
                                    {step.title}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {step.description}
                                  </span>
                                </span>
                              </span>
                            </div>
                          )}

                          {!isFirst && (
                            <div
                              aria-hidden="true"
                              className="absolute inset-0 top-0 left-0 hidden w-3 md:block"
                            >
                              <svg
                                fill="none"
                                viewBox="0 0 12 82"
                                preserveAspectRatio="none"
                                className="h-full w-full text-gray-300"
                              >
                                <path
                                  d="M0.5 0V31L10.5 41L0.5 51V82"
                                  stroke="currentcolor"
                                  vectorEffect="non-scaling-stroke"
                                />
                              </svg>
                            </div>
                          )}
                        </div>
                      </li>
                    )
                  })}
                </ol>
              </nav>
        </div>

        {activeStep === "basics" && (
          <Card>
            <CardHeader>
              <CardTitle>Project Basics</CardTitle>
              <CardDescription>Set up your project foundation with essential information and goals.</CardDescription>
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
                <Label htmlFor="goal">Goal (3–6 month outcome)</Label>
                <Textarea
                  id="goal"
                  rows={3}
                  placeholder="e.g. Launch an AI project planning wizard that helps PMs go from idea to plan in under 10 minutes."
                  value={projectMeta.goal}
                  onChange={(e) => setProjectMeta({ ...projectMeta, goal: e.target.value })}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
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
                <div className="space-y-3">
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

              {/* Navigation */}
              <div className="flex justify-between items-center pt-6 border-t">
                <Button variant="outline" onClick={() => router.push("/projects")}>
                  Cancel
                </Button>
                <Button onClick={nextStep} disabled={!basicsReady}>
                  Continue to Requirements
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {activeStep === "requirements" && (
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle>Requirements & AI Analysis</CardTitle>
                  <CardDescription>Input your requirements via text or file upload, then let AI analyze and plan.</CardDescription>
                </div>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Sparkles className="h-4 w-4" /> AI
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Input Method Selection */}
              <div className="space-y-3">
                <Label>Input Method</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={inputMethod === "text" ? "default" : "outline"}
                    onClick={() => setInputMethod("text")}
                  >
                    Text Input
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={inputMethod === "file" ? "default" : "outline"}
                    onClick={() => setInputMethod("file")}
                  >
                    Upload File
                  </Button>
                </div>
              </div>

              {/* Text Input */}
              {inputMethod === "text" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="requirements">Requirements / PRD</Label>
                    <Badge variant="outline">Tip: include goals and acceptance criteria</Badge>
                  </div>
                  <Textarea
                    id="requirements"
                    rows={12}
                    placeholder="Paste requirements, acceptance criteria, constraints, stakeholders..."
                    value={requirementsInput.content}
                    onChange={(e) => setRequirementsInput({ ...requirementsInput, content: e.target.value })}
                  />
                </div>
              )}

              {/* File Upload */}
              {inputMethod === "file" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="file-upload">Upload Requirements Document</Label>
                    <div className="text-xs text-gray-500">
                      Max 5 files • 10MB each • 50MB total
                    </div>
                  </div>
                  <div
                    className={cn(
                      "border-2 border-dashed rounded-lg p-8 text-center space-y-3 transition-colors",
                      isDraggingFile ? "border-emerald-500 bg-emerald-50/60" : "border-gray-300"
                    )}
                    onDragOver={handleDragOverUpload}
                    onDragEnter={handleDragOverUpload}
                    onDragLeave={handleDragLeaveUpload}
                    onDrop={handleDropUpload}
                  >
                    <div className="flex justify-center">
                      <ClipboardList className="h-12 w-12 text-gray-400" />
                    </div>
                    <div>
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <span className="text-sm font-medium text-emerald-600 hover:text-emerald-700">
                          Click to upload
                        </span>
                        <span className="text-sm text-gray-500"> or drag and drop</span>
                      </label>
                      <input
                        id="file-upload"
                        type="file"
                        className="hidden"
                        accept={FILE_UPLOAD_CONFIG.ACCEPT_ATTRIBUTE}
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            void handleFileUpload(file)
                            // Reset input so the same file can be uploaded again if needed
                            e.target.value = ''
                          }
                        }}
                      />
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-gray-500">
                        Supported formats: .txt, .md, .pdf, .xlsx, .docx
                      </p>
                      <p className="text-xs text-gray-400">
                        Maximum file size: 10MB
                      </p>
                    </div>
                    {uploadedFiles.length > 0 && (
                      <div className="text-sm text-emerald-600 pt-2">
                        <div className="flex items-center justify-center gap-2">
                          <Check className="h-4 w-4" />
                          <span>{uploadedFiles.length} file{uploadedFiles.length > 1 ? 's' : ''} uploaded</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Uploaded Files List */}
                  {uploadedFiles.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Uploaded Files ({uploadedFiles.length}/{FILE_UPLOAD_CONFIG.MAX_FILES})</Label>
                        <div className="text-xs text-gray-500">
                          Total: {formatFileSize(uploadedFiles.reduce((sum, f) => sum + f.file.size, 0))} / {FILE_UPLOAD_CONFIG.MAX_TOTAL_SIZE_MB}MB
                        </div>
                      </div>
                      <div className="space-y-2">
                        {uploadedFiles.map((uploadedFile, index) => {
                          const fileExtension = uploadedFile.file.name.split('.').pop()?.toLowerCase()
                          const FileIcon = fileExtension === 'pdf' ? FileText :
                                          (fileExtension === 'xlsx' || fileExtension === 'xls') ? FileSpreadsheet :
                                          fileExtension === 'docx' ? FileText :
                                          FileText

                          return (
                            <div
                              key={index}
                              className="flex items-center justify-between p-3 rounded-md border border-gray-200 bg-white"
                            >
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <FileIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium text-gray-900 truncate">
                                    {uploadedFile.file.name}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {formatFileSize(uploadedFile.file.size)} • .{fileExtension}
                                  </p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeFile(uploadedFile.file)}
                                className="ml-3 p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                                title="Remove file"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Merged Content Preview */}
                  {requirementsInput.content && uploadedFiles.length > 0 && (
                    <div className="space-y-2">
                      <Label>Merged Content Preview</Label>
                      <div className="rounded-md border border-gray-200 bg-gray-50 p-4 max-h-64 overflow-y-auto">
                        <pre className="text-xs text-gray-700 whitespace-pre-wrap">{requirementsInput.content}</pre>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* AI Analysis Action */}
              <div className="space-y-3">
                <Button
                  onClick={() => runAnalysis()}
                  disabled={isLoading.analysis || !requirementsInput.content}
                >
                  {isLoading.analysis ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Wand2 className="h-4 w-4 mr-2" />}
                  Analyze requirements
                </Button>
                {!analysis && (
                  <p className="text-xs text-gray-500">Run AI analysis to proceed to the next step</p>
                )}
              </div>

              {/* AI Analysis Results */}
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
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-between items-center pt-6 border-t">
                <Button variant="outline" onClick={prevStep}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Basics
                </Button>
                <Button onClick={nextStep} disabled={!requirementsReady}>
                  Continue to Tasks
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {activeStep === "tasks" && (
          <Card>
            <CardHeader>
              <CardTitle>Task Breakdown</CardTitle>
              <CardDescription>Generate and review AI-created tasks from your requirements.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Action Button */}
              <div className="flex flex-wrap gap-3">
                <Button onClick={runBacklogBreakdown} disabled={isLoading.backlog}>
                  {isLoading.backlog ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                  AI task breakdown
                </Button>
              </div>

              {/* Metrics */}
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Total Tasks</CardTitle>
                    <CardDescription>Number of work items</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-semibold">{tasks.length || 0}</div>
                    <div className="text-xs text-gray-500">
                      {topEffortArea ? `Most effort: ${topEffortArea}` : "No tasks yet"}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Total Effort</CardTitle>
                    <CardDescription>Estimated hours</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-semibold">{totalHours}h</div>
                    {analysis && (
                      <div className="text-xs text-gray-500">
                        vs AI estimate: {analysis.effort_estimate_hours}h
                      </div>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Must-Have Tasks</CardTitle>
                    <CardDescription>Critical for MVP</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-semibold">
                      {tasks.filter(t => t.scope === "must_have").length}
                    </div>
                    <div className="text-xs text-gray-500">
                      {tasks.filter(t => t.scope === "must_have").reduce((sum, t) => sum + t.estimated_hours, 0)}h total
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Task List */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <ClipboardList className="h-4 w-4 text-slate-600" />
                    Task List
                  </CardTitle>
                  <CardDescription>Click scope badges to adjust priority (must-have → nice-to-have → later)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-6 text-xs font-medium text-gray-500">
                    <div className="col-span-2">Title</div>
                    <div>Type</div>
                    <div>Estimate</div>
                    <div>Priority</div>
                    <div>Scope</div>
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
                      </div>
                    ))}
                    {!tasks.length && <div className="py-6 text-sm text-gray-500">Run AI task breakdown to populate tasks.</div>}
                  </div>
                </CardContent>
              </Card>

              {/* Navigation */}
              <div className="flex justify-between items-center pt-6 border-t">
                <Button variant="outline" onClick={prevStep}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Requirements
                </Button>
                <Button onClick={nextStep} disabled={!tasksReady}>
                  Continue to Resources
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {activeStep === "resources" && (
          <Card>
            <CardHeader>
              <CardTitle>Team & Resources</CardTitle>
              <CardDescription>Define your team size and capacity before planning sprints.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Team Selection */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-700">Who will work on this project?</Label>
                <div className="grid gap-3 md:grid-cols-3">
                  <button
                    type="button"
                    className={cn(
                      "rounded-lg border-2 p-4 text-left transition-all hover:border-blue-300",
                      teamPreset === "solo" ? "border-blue-600 bg-blue-50" : "border-gray-200"
                    )}
                    onClick={() => {
                      setTeamPreset("solo")
                      setResources([
                        { id: "res-solo", name: "You", role: "Generalist", weekly_capacity_hours: 30 }
                      ])
                      setAssignments([])
                      setStatusMessage("Team set to solo. You can plan sprints next.")
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className={cn(
                        "w-4 h-4 rounded-full border-2",
                        teamPreset === "solo" ? "border-blue-600 bg-blue-600" : "border-gray-300"
                      )}>
                        {teamPreset === "solo" && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <div className="font-semibold text-gray-900">Just Me</div>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">Solo developer mode</div>
                    <div className="text-xs text-gray-500">30h/week capacity</div>
                  </button>

                  <button
                    type="button"
                    className={cn(
                      "rounded-lg border-2 p-4 text-left transition-all hover:border-blue-300",
                      teamPreset === "small" ? "border-blue-600 bg-blue-50" : "border-gray-200"
                    )}
                    onClick={() => {
                      setTeamPreset("small")
                      setResources(defaultResources)
                      setAssignments([])
                      setStatusMessage("Team set to small squad. You can plan sprints next.")
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className={cn(
                        "w-4 h-4 rounded-full border-2",
                        teamPreset === "small" ? "border-blue-600 bg-blue-600" : "border-gray-300"
                      )}>
                        {teamPreset === "small" && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <div className="font-semibold text-gray-900">Small Team</div>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">2-3 people</div>
                    <div className="text-xs text-gray-500">76h/week total capacity</div>
                  </button>

                  <button
                    type="button"
                    className={cn(
                      "rounded-lg border-2 p-4 text-left transition-all hover:border-blue-300",
                      teamPreset === "large" ? "border-blue-600 bg-blue-50" : "border-gray-200"
                    )}
                    onClick={() => {
                      setTeamPreset("large")
                      setResources([
                        ...defaultResources,
                        { id: "res-4", name: "Backend Dev", role: "Backend", weekly_capacity_hours: 32 },
                        { id: "res-5", name: "QA", role: "QA", weekly_capacity_hours: 32 }
                      ])
                      setAssignments([])
                      setStatusMessage("Team set to larger group. You can plan sprints next.")
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className={cn(
                        "w-4 h-4 rounded-full border-2",
                        teamPreset === "large" ? "border-blue-600 bg-blue-600" : "border-gray-300"
                      )}>
                        {teamPreset === "large" && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <div className="font-semibold text-gray-900">Larger Team</div>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">4-5 people</div>
                    <div className="text-xs text-gray-500">140h/week total capacity</div>
                  </button>
                </div>
              </div>

              {/* Team Members */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Users2 className="h-4 w-4 text-blue-600" />
                    Team Members
                  </CardTitle>
                  <CardDescription>Your selected team and their weekly capacity</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-3 gap-3">
                  {resources.map((resource) => (
                    <div key={resource.id} className="rounded-lg border p-3">
                      <div className="font-semibold text-gray-900">{resource.name}</div>
                      <div className="text-sm text-gray-600">{resource.role}</div>
                      <div className="text-sm text-gray-500 mt-2">
                        {resource.weekly_capacity_hours}h/week
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Capacity Analysis */}
              <Card className="border-blue-100 bg-blue-50/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-gray-900">Capacity vs. Required Effort</CardTitle>
                  <CardDescription>Can your team handle the workload?</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Total Team Capacity</div>
                    <div className="text-2xl font-semibold text-gray-900">
                      {resources.reduce((sum, r) => sum + r.weekly_capacity_hours, 0)}h/week
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Required Effort</div>
                    <div className="text-2xl font-semibold text-gray-900">{totalHours}h total</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Estimated Duration</div>
                    <div className="text-2xl font-semibold text-gray-900">
                      {resources.reduce((sum, r) => sum + r.weekly_capacity_hours, 0) > 0
                        ? Math.ceil(totalHours / resources.reduce((sum, r) => sum + r.weekly_capacity_hours, 0))
                        : 0}{" "}
                      weeks
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      (at full capacity)
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Navigation */}
              <div className="flex justify-between items-center pt-6 border-t">
                <Button variant="outline" onClick={prevStep}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Tasks
                </Button>
                <Button onClick={nextStep} disabled={!resourcesReady}>
                  Continue to Sprint Planning
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {activeStep === "sprints" && (
          <Card>
            <CardHeader>
              <CardTitle>Sprint Planning</CardTitle>
              <CardDescription>Plan sprints based on your tasks and team capacity, then review before creating.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Sprint Planning Controls */}
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
                        {level === "conservative" && "Conservative (80%)"}
                        {level === "normal" && "Normal (100%)"}
                        {level === "aggressive" && "Aggressive (120%)"}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <Button onClick={runSprintPlan} disabled={!tasks.length || isLoading.plan}>
                  {isLoading.plan ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CalendarRange className="h-4 w-4 mr-2" />}
                  Plan sprints & dates
                </Button>
                <Button onClick={autoAllocateResources} disabled={!tasks.length || !sprints.length}>
                  <Users2 className="h-4 w-4 mr-2" />
                  Auto-allocate resources
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveStep("tasks")}
                >
                  Adjust tasks
                </Button>
              </div>

              {/* Sprints List */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <CalendarRange className="h-4 w-4 text-indigo-600" />
                    Sprint Plan
                  </CardTitle>
                  <CardDescription>{timelineSummary}</CardDescription>
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
                  {!sprints.length && (
                    <div className="col-span-2 py-6 text-sm text-gray-500 text-center">
                      Run sprint planning to generate sprint timeline.
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-gray-900">Final Review</CardTitle>
                  <CardDescription>Confirm your plan before creating the project.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 md:grid-cols-3 text-sm">
                    <div>
                      <div className="text-xs font-semibold text-gray-600 mb-1">Goal</div>
                      <div className="text-gray-900 line-clamp-3">
                        {projectMeta.goal || "No goal written yet"}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-gray-600 mb-1">Timeline</div>
                      <div className="text-gray-900">
                        {estimatedFinishDate ? formatDate(estimatedFinishDate) : "Not estimated"}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Risk: <span className={cn(
                          timelineRisk === "High" ? "text-red-600 font-medium" :
                          timelineRisk === "Medium" ? "text-amber-600 font-medium" :
                          "text-emerald-600"
                        )}>{timelineRisk}</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-gray-600 mb-1">Scope</div>
                      <div className="text-gray-900">{sprints.length} sprints · {tasks.length} tasks</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Avg utilization: {overallUtilization}%
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-3 md:grid-cols-3 pt-2 border-t">
                    <div className="text-center p-3 rounded-lg bg-gray-50">
                      <div className="text-xs text-gray-600">Total Effort</div>
                      <div className="text-2xl font-semibold text-gray-900">{totalHours}h</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-gray-50">
                      <div className="text-xs text-gray-600">Buffer</div>
                      <div className="text-2xl font-semibold text-gray-900">{bufferPercentage}%</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-gray-50">
                      <div className="text-xs text-gray-600">Team Capacity</div>
                      <div className="text-2xl font-semibold text-gray-900">
                        {resources.reduce((sum, r) => sum + r.weekly_capacity_hours, 0)}h/wk
                      </div>
                    </div>
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

              {/* Navigation */}
              <div className="flex justify-between items-center pt-6 border-t">
                <Button variant="outline" onClick={prevStep}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Resources
                </Button>
                <Button onClick={saveProject} disabled={isLoading.saving || !sprintsReady}>
                  {isLoading.saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Create Project
                  {!isLoading.saving && <ArrowRight className="h-4 w-4 ml-2" />}
                </Button>
              </div>
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
