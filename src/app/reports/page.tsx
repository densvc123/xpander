"use client"

import { useEffect, useState } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  FileText,
  Download,
  Calendar,
  BarChart3,
  Users,
  Sparkles,
  AlertTriangle,
  CheckCircle2
} from "lucide-react"
import { formatDate } from "@/lib/utils"

// Mock reports data
const mockReports = [
  {
    id: "1",
    title: "XPANDER MVP - Status Report",
    type: "project_status",
    project: "XPANDER MVP",
    createdAt: "2024-01-20T10:30:00Z"
  },
  {
    id: "2",
    title: "Sprint 1 Review",
    type: "sprint_review",
    project: "XPANDER MVP",
    createdAt: "2024-01-14T15:00:00Z"
  },
  {
    id: "3",
    title: "Resource Utilization - Week 2",
    type: "resource_usage",
    project: "API Integration",
    createdAt: "2024-01-12T09:00:00Z"
  },
]

const reportTypes = [
  {
    type: "project_status",
    name: "Project Status",
    description: "Comprehensive overview of project progress, risks, and milestones",
    includes: "Health, milestones, key metrics, blockers summary.",
    bestFor: "Weekly steering and sponsor updates.",
    icon: FileText
  },
  {
    type: "sprint_review",
    name: "Sprint Review",
    description: "Summary of completed work, velocity, and learnings",
    includes: "Velocity, completed vs planned, highlights & learnings.",
    bestFor: "Sprint reviews and team retrospectives.",
    icon: Calendar
  },
  {
    type: "resource_usage",
    name: "Resource Usage",
    description: "Time tracking and capacity utilization analysis",
    includes: "Capacity vs allocation, overload/availability signals.",
    bestFor: "Capacity planning and staffing discussions.",
    icon: Users
  },
  {
    type: "custom",
    name: "Custom Report",
    description: "Generate a custom AI-powered report with your own prompt",
    includes: "Flexible format driven by your prompt.",
    bestFor: "Ad-hoc client summaries or internal deep dives.",
    icon: Sparkles
  },
] as const

const MOCK_REPORT_SAMPLES: Record<string, "project_status" | "sprint_review" | "resource_usage" | "custom"> = {
  project_status: "project_status",
  sprint_review: "sprint_review",
  resource_usage: "resource_usage",
  custom: "custom"
}

interface ProjectStatusReportData {
  projectName: string
  reportDate: string
  status: string
  executiveSummary: string
  metrics: {
    overallProgress: number
    tasksCompleted: string
    sprintVelocity: string
    risksOpen: number
  }
  sprint: {
    name: string
    period: string
    progressSummary: string
    focusItems: string[]
    risks: string[]
  }
  recommendations: string[]
}

const ProjectStatusReport = ({ data }: { data: ProjectStatusReportData }) => (
  <div className="space-y-4">
    <div>
      <h4 className="text-base font-semibold text-gray-900">Project Status Report (Sample)</h4>
      <p className="text-sm text-gray-600">
        Project: {data.projectName} • Report Date: {data.reportDate} • Status: {data.status}
      </p>
    </div>
    <div>
      <h5 className="text-sm font-semibold text-gray-800 mb-1">Executive Summary</h5>
      <p className="text-sm text-gray-700">
        {data.executiveSummary}
      </p>
    </div>
    <div>
      <h5 className="text-sm font-semibold text-gray-800 mb-1">Key Metrics</h5>
      <div className="grid gap-2 md:grid-cols-4 text-sm">
        <div className="rounded-lg border p-2">
          <p className="text-xs text-gray-500">Overall Progress</p>
          <p className="text-lg font-semibold">{data.metrics.overallProgress}%</p>
        </div>
        <div className="rounded-lg border p-2">
          <p className="text-xs text-gray-500">Tasks Completed</p>
          <p className="text-lg font-semibold">{data.metrics.tasksCompleted}</p>
        </div>
        <div className="rounded-lg border p-2">
          <p className="text-xs text-gray-500">Sprint Velocity</p>
          <p className="text-lg font-semibold">{data.metrics.sprintVelocity}</p>
        </div>
        <div className="rounded-lg border p-2">
          <p className="text-xs text-gray-500">Risks Open</p>
          <p className="text-lg font-semibold">{data.metrics.risksOpen}</p>
        </div>
      </div>
    </div>
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2">
        <h5 className="text-sm font-semibold text-gray-800 mb-1">Current Sprint Status</h5>
        <p className="text-xs text-gray-500">{data.sprint.name} • {data.sprint.period}</p>
        <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
          <li>{data.sprint.progressSummary}</li>
          {data.sprint.focusItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
      <div className="space-y-2">
        <h5 className="text-sm font-semibold text-gray-800 mb-1">Risks &amp; Issues (Snapshot)</h5>
        <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
          {data.sprint.risks.map((risk) => (
            <li key={risk}>{risk}</li>
          ))}
        </ul>
      </div>
    </div>
    <div>
      <h5 className="text-sm font-semibold text-gray-800 mb-1">Recommendations</h5>
      <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1">
        {data.recommendations.map((rec) => (
          <li key={rec}>{rec}</li>
        ))}
      </ol>
    </div>
  </div>
)

const SAMPLE_PROJECT_STATUS_REPORT_DATA: ProjectStatusReportData = {
  projectName: "XPANDER MVP",
  reportDate: "2024-02-01",
  status: "On Track",
  executiveSummary:
    "XPANDER MVP is tracking well toward the planned launch date. Core flows (auth, dashboard, reporting) are implemented, and the current sprint is focused on stabilizing critical paths and tightening UX. The main risk is backend congestion around reporting performance, which is being addressed in the next sprint.",
  metrics: {
    overallProgress: 68,
    tasksCompleted: "42 / 62",
    sprintVelocity: "26 pts (target 24 pts)",
    risksOpen: 3
  },
  sprint: {
    name: "Sprint 4 – Reporting & Polish",
    period: "2024-01-25 — 2024-02-07",
    progressSummary: "60% of committed work completed; remaining items focus on reporting API hardening and UX polish on the main dashboard.",
    focusItems: [
      "Stabilize reporting API under peak load.",
      "Tighten error handling and empty states in dashboard widgets.",
      "Close high-impact defects raised in the last internal demo."
    ],
    risks: [
      "Reporting performance under peak load (High, Mitigating).",
      "Limited QA capacity for mobile flows (Medium, Watching)."
    ]
  },
  recommendations: [
    "Hold a focused performance review for the reporting API before the next sprint.",
    "Protect at least 20% of the next sprint for testing and bug fixing.",
    "Confirm launch-readiness criteria with stakeholders this week."
  ]
}

const SampleProjectStatusReport = () => (
  <ProjectStatusReport data={SAMPLE_PROJECT_STATUS_REPORT_DATA} />
)

const SampleSprintReviewReport = () => (
  <div className="space-y-4">
    <div>
      <h4 className="text-base font-semibold text-gray-900">Sprint Review Report (Sample)</h4>
      <p className="text-sm text-gray-600">
        Sprint 3 – Dashboard Foundations • 2024-01-10 — 2024-01-24 • Team: XPANDER Squad A
      </p>
    </div>
    <div>
      <h5 className="text-sm font-semibold text-gray-800 mb-1">Sprint Summary</h5>
      <p className="text-sm text-gray-700">
        Sprint 3 delivered the first end-to-end view of the project dashboard, including KPIs, basic filters, and the initial
        risk panel. The team hit 95% of its commitment and kept velocity stable across the last three sprints.
      </p>
      <p className="mt-1 text-xs text-gray-500">
        Goal: deliver a usable dashboard that lets PMs understand project health at a glance. – <span className="font-semibold">Achieved</span>
      </p>
    </div>
    <div>
      <h5 className="text-sm font-semibold text-gray-800 mb-1">Sprint Metrics</h5>
      <div className="grid gap-2 md:grid-cols-3 text-sm">
        <div className="rounded-lg border p-2">
          <p className="text-xs text-gray-500">Story Points</p>
          <p className="text-lg font-semibold">32 planned / 30 actual</p>
        </div>
        <div className="rounded-lg border p-2">
          <p className="text-xs text-gray-500">Tasks</p>
          <p className="text-lg font-semibold">24 planned / 23 completed</p>
        </div>
        <div className="rounded-lg border p-2">
          <p className="text-xs text-gray-500">Velocity</p>
          <p className="text-lg font-semibold">30 pts (avg 29 pts)</p>
        </div>
      </div>
    </div>
    <div className="grid gap-4 md:grid-cols-2">
      <div>
        <h5 className="text-sm font-semibold text-gray-800 mb-1">Completed Work (Highlights)</h5>
        <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
          <li>Dashboard layout and navigation shell.</li>
          <li>Health, progress, and risk summary widgets.</li>
          <li>Basic filtering by project and timeframe.</li>
        </ul>
      </div>
      <div>
        <h5 className="text-sm font-semibold text-gray-800 mb-1">What Went Well / To Improve</h5>
        <p className="text-xs font-semibold text-gray-700">Went well</p>
        <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 mb-2">
          <li>Smooth coordination across frontend/backend.</li>
          <li>Dashboard MVP ready for internal demo.</li>
        </ul>
        <p className="text-xs font-semibold text-gray-700">Could be improved</p>
        <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
          <li>Better alignment on acceptance criteria before sprint start.</li>
          <li>Earlier involvement from QA in test planning.</li>
        </ul>
      </div>
    </div>
    <div>
      <h5 className="text-sm font-semibold text-gray-800 mb-1">Next Sprint Preview</h5>
      <p className="text-sm text-gray-700">
        Sprint 4 will focus on reporting, performance tuning, and UX polish on dashboard cards.
      </p>
    </div>
  </div>
)

const SampleResourceUsageReport = () => (
  <div className="space-y-4">
    <div>
      <h4 className="text-base font-semibold text-gray-900">Resource Usage Report (Sample)</h4>
      <p className="text-sm text-gray-600">
        Reporting Period: 2024-01-01 — 2024-01-28
      </p>
    </div>
    <div>
      <h5 className="text-sm font-semibold text-gray-800 mb-1">Executive Summary</h5>
      <p className="text-sm text-gray-700">
        Overall utilization is healthy at ~83%, with one backend engineer running above 110% and two roles with remaining
        capacity. The next four weeks look slightly overcommitted if all planned work is kept as-is.
      </p>
    </div>
    <div className="grid gap-2 md:grid-cols-4 text-sm">
      <div className="rounded-lg border p-2">
        <p className="text-xs text-gray-500">Total Capacity</p>
        <p className="text-lg font-semibold">160h</p>
      </div>
      <div className="rounded-lg border p-2">
        <p className="text-xs text-gray-500">Hours Logged</p>
        <p className="text-lg font-semibold">132h</p>
      </div>
      <div className="rounded-lg border p-2">
        <p className="text-xs text-gray-500">Utilization Rate</p>
        <p className="text-lg font-semibold">83%</p>
      </div>
      <div className="rounded-lg border p-2">
        <p className="text-xs text-gray-500">Overtime Hours</p>
        <p className="text-lg font-semibold">6h</p>
      </div>
    </div>
    <div>
      <h5 className="text-sm font-semibold text-gray-800 mb-1">Team Member Utilization (Snapshot)</h5>
      <div className="space-y-2 text-sm text-gray-700">
        <p>Maya Singh – Backend – 112% (Overloaded)</p>
        <p>Ava Chen – Eng Lead – 92% (High load)</p>
        <p>Leo Park – Frontend – 68% (Available)</p>
        <p>Noah Wright – Product – 74% (Healthy)</p>
      </div>
    </div>
    <div>
      <h5 className="text-sm font-semibold text-gray-800 mb-1">Recommendation</h5>
      <p className="text-sm text-gray-700">
        Shift 6–8h of backend work from Maya to Leo, and protect Eng Lead time for reviews and planning rather than execution-only tasks.
      </p>
    </div>
  </div>
)

const SampleCustomReport = () => (
  <div className="space-y-4">
    <div>
      <h4 className="text-base font-semibold text-gray-900">Custom Report (Sample)</h4>
      <p className="text-sm text-gray-700">
        This is an example of what a custom report could look like. The structure depends on the prompt you provide.
      </p>
    </div>
    <div>
      <h5 className="text-sm font-semibold text-gray-800 mb-1">Example use cases</h5>
      <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
        <li>Client-ready one-pager summarizing risks and mitigations.</li>
        <li>Deep dive on technical debt and refactoring priorities.</li>
        <li>Roll-up summary across several projects for leadership.</li>
      </ul>
    </div>
    <div>
      <p className="text-sm text-gray-700">
        When you enter a prompt and generate a custom report, XPANDER will follow your instructions and adapt sections from the
        templates to match your needs.
      </p>
    </div>
  </div>
)
const mockWorkloadSummary = {
  capacity: 160,
  assigned: 132,
  utilization: 83,
  overloadedCount: 1,
  availableCount: 2
}

const mockWorkloadPeople = [
  {
    name: "Maya Singh",
    role: "Backend",
    utilization: 112,
    projects: [
      { name: "XPANDER MVP", hours: 22 },
      { name: "API Integration", hours: 18 }
    ]
  },
  {
    name: "Leo Park",
    role: "Frontend",
    utilization: 68,
    projects: [
      { name: "XPANDER MVP", hours: 14 },
      { name: "Documentation Portal", hours: 10 }
    ]
  },
  {
    name: "Ava Chen",
    role: "Eng Lead",
    utilization: 92,
    projects: [
      { name: "XPANDER MVP", hours: 18 },
      { name: "Mobile App Redesign", hours: 14 }
    ]
  },
  {
    name: "Noah Wright",
    role: "Product",
    utilization: 74,
    projects: [
      { name: "XPANDER MVP", hours: 12 },
      { name: "Mobile App Redesign", hours: 10 }
    ]
  }
]

export default function ReportsPage() {
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [isLoadingProjects, setIsLoadingProjects] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedReport, setGeneratedReport] = useState<string | null>(null)
  const [generatedMeta, setGeneratedMeta] = useState<{
    type: string
    projectName: string
    generatedAt: string
  } | null>(null)
  const [savedReports, setSavedReports] = useState(mockReports)
  const [customPrompt, setCustomPrompt] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [showRebalanceHints, setShowRebalanceHints] = useState(true)
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null)
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null)

  const getTypeIcon = (type: string) => {
    const reportType = reportTypes.find(rt => rt.type === type)
    const Icon = reportType?.icon || FileText
    return <Icon className="h-4 w-4" />
  }

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setIsLoadingProjects(true)
        const res = await fetch("/api/projects")
        if (!res.ok) return
        const data = await res.json()
        const proj = Array.isArray(data.projects) ? data.projects : []
        setProjects(proj.map((p: { id: string; name: string }) => ({ id: p.id, name: p.name })))
        if (proj.length > 0) {
          setSelectedProjectId(proj[0].id)
        }
      } catch {
        // ignore; keep mock-only view
      } finally {
        setIsLoadingProjects(false)
      }
    }
    fetchProjects()
  }, [])

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await fetch("/api/settings")
        if (!res.ok) return
        const data = await res.json()
        const s = data.settings
        if (typeof s?.ai_show_rebalance_hints === "boolean") {
          setShowRebalanceHints(s.ai_show_rebalance_hints)
        }
      } catch {
        // ignore; keep default hints visible
      }
    }
    void loadSettings()
  }, [])

  const getCopyContent = () => {
    if (!generatedReport || !generatedMeta) return ""

    if (generatedReport === "project_status") {
      const d = SAMPLE_PROJECT_STATUS_REPORT_DATA
      return [
        "Project Status Report (Sample)",
        "",
        `Project: ${d.projectName}`,
        `Report Date: ${d.reportDate}`,
        `Status: ${d.status}`,
        "",
        "Executive Summary",
        d.executiveSummary,
        "",
        "Key Metrics",
        `- Overall Progress: ${d.metrics.overallProgress}%`,
        `- Tasks Completed: ${d.metrics.tasksCompleted}`,
        `- Sprint Velocity: ${d.metrics.sprintVelocity}`,
        `- Risks Open: ${d.metrics.risksOpen}`,
        "",
        "Current Sprint Status",
        `${d.sprint.name} (${d.sprint.period})`,
        `• ${d.sprint.progressSummary}`,
        ...d.sprint.focusItems.map(item => `• ${item}`),
        "",
        "Risks & Issues (Snapshot)",
        ...d.sprint.risks.map(risk => `• ${risk}`),
        "",
        "Recommendations",
        ...d.recommendations.map((rec, idx) => `${idx + 1}. ${rec}`)
      ].join("\n")
    }

    if (
      generatedReport === "sprint_review" ||
      generatedReport === "resource_usage" ||
      generatedReport === "custom"
    ) {
      // For other sample layouts we give a simple textual note
      return `Sample ${generatedMeta.type.replace("_", " ")} report for ${generatedMeta.projectName}.`
    }

    return generatedReport
  }

  const handleCopy = async () => {
    const content = getCopyContent()
    if (!content) return
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(content)
        setCopyFeedback("Copied to clipboard")
        setTimeout(() => setCopyFeedback(null), 2000)
      }
    } catch {
      setCopyFeedback("Unable to copy")
      setTimeout(() => setCopyFeedback(null), 2000)
    }
  }

  const handleSaveGeneratedReport = () => {
    if (!generatedMeta) return

    const existing = savedReports.find(
      (r) =>
        r.type === generatedMeta.type &&
        r.project === generatedMeta.projectName &&
        formatDate(r.createdAt) === formatDate(generatedMeta.generatedAt)
    )
    if (existing) {
      setSaveFeedback("Already saved")
      setTimeout(() => setSaveFeedback(null), 2000)
      return
    }

    const reportTypeConfig = reportTypes.find(rt => rt.type === generatedMeta.type)
    const titleBase = reportTypeConfig?.name ?? generatedMeta.type.replace("_", " ")
    const newReport = {
      id: `${Date.now()}`,
      title: `${titleBase} – ${generatedMeta.projectName}`,
      type: generatedMeta.type,
      project: generatedMeta.projectName,
      createdAt: generatedMeta.generatedAt
    }
    setSavedReports((prev) => [newReport, ...prev])
    setSaveFeedback("Saved to recent")
    setTimeout(() => setSaveFeedback(null), 2000)
  }

  const handleGenerate = async () => {
    if (!selectedType) {
      setError("Select a report type first.")
      return
    }
    const isProjectSpecific = selectedType === "sprint_review"
    if (isProjectSpecific && !selectedProjectId) {
      setError("Select a project for a sprint review report.")
      return
    }
    if (selectedType === "custom" && !customPrompt.trim()) {
      setError("Please provide a prompt for the custom report.")
      return
    }

    setError(null)
    setIsGenerating(true)
    setGeneratedReport(null)
    setGeneratedMeta(null)

    try {
      let projectData: unknown
      let projectName = "All projects"

      if (isProjectSpecific && selectedProjectId) {
        const projectRes = await fetch(`/api/projects/${selectedProjectId}`)
        if (!projectRes.ok) {
          setError("Failed to load project data for reporting.")
          return
        }
        projectData = await projectRes.json()
        projectName = projects.find(p => p.id === selectedProjectId)?.name || projectName
      } else {
        const res = await fetch("/api/projects")
        if (!res.ok) {
          setError("Failed to load portfolio data for reporting.")
          return
        }
        projectData = await res.json()
      }

      const reportRes = await fetch("/api/ai/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportType: selectedType,
          projectData,
          customPrompt: selectedType === "custom" ? customPrompt.trim() : undefined
        })
      })

      if (!reportRes.ok) {
        const sample = MOCK_REPORT_SAMPLES[selectedType] ?? "project_status"
        setGeneratedReport(sample)
        setGeneratedMeta({
          type: selectedType,
          projectName,
          generatedAt: new Date().toISOString()
        })
        return
      }

      const { report, reportType, generatedAt } = await reportRes.json()

      // For now, project status reports are rendered via a structured template
      // so we ignore raw markdown/JSON content and show the sample layout.
      if (reportType === "project_status") {
        setGeneratedReport("project_status")
      } else {
        const raw = typeof report === "string" ? report : JSON.stringify(report, null, 2)
        setGeneratedReport(raw)
      }
      setGeneratedMeta({
        type: reportType,
        projectName,
        generatedAt
      })
    } catch (err) {
      console.error("Error generating report:", err)
      const sample = selectedType ? MOCK_REPORT_SAMPLES[selectedType] : null
      if (sample) {
        setGeneratedReport(sample)
        setGeneratedMeta({
          type: selectedType!,
          projectName: selectedProjectId
            ? projects.find(p => p.id === selectedProjectId)?.name || "Selected project"
            : "All projects",
          generatedAt: new Date().toISOString()
        })
      } else {
        setError("Unexpected error while generating report.")
      }
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <MainLayout title="Reports">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Reports</h2>
          <p className="text-gray-500">Generate and view AI-powered project and portfolio reports</p>
        </div>

        {/* Resource Workload Snapshot */}
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Resource workload
              </CardTitle>
              <CardDescription>Portfolio-level capacity view (mock)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold">{mockWorkloadSummary.utilization}%</span>
                <Badge variant={mockWorkloadSummary.utilization > 100 ? "destructive" : "secondary"}>
                  {mockWorkloadSummary.assigned}h / {mockWorkloadSummary.capacity}h
                </Badge>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-100">
                <div
                  className={`h-2 rounded-full ${mockWorkloadSummary.utilization > 100 ? "bg-amber-500" : "bg-emerald-500"}`}
                  style={{ width: `${Math.min(mockWorkloadSummary.utilization, 130)}%` }}
                />
              </div>
              <div className="flex items-center gap-2 text-sm">
                {mockWorkloadSummary.overloadedCount > 0 ? (
                  <>
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <span className="text-amber-700">{mockWorkloadSummary.overloadedCount} overloaded</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span className="text-emerald-700">All balanced</span>
                  </>
                )}
                <span className="text-gray-500">• {mockWorkloadSummary.availableCount} with capacity</span>
              </div>
              {showRebalanceHints && (
                <Button variant="outline" size="sm">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Ask AI to rebalance
                </Button>
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Per-person utilization
              </CardTitle>
              <CardDescription>Top signals across active projects (mock)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                {mockWorkloadPeople.map((person) => {
                  const barColor =
                    person.utilization < 80 ? "bg-emerald-200" :
                    person.utilization <= 100 ? "bg-amber-200" : "bg-red-200"
                  const textColor =
                    person.utilization > 100 ? "text-red-600" : "text-gray-700"
                  return (
                    <div key={person.name} className="rounded-lg border p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{person.name}</p>
                          <p className="text-xs text-gray-500">{person.role}</p>
                        </div>
                        <Badge variant={person.utilization > 100 ? "destructive" : "secondary"}>
                          {person.utilization}%
                        </Badge>
                      </div>
                      <div className="h-2 bg-gray-100 rounded">
                        <div
                          className={`${barColor} h-2 rounded`}
                          style={{ width: `${Math.min(person.utilization, 140)}%` }}
                        />
                      </div>
                      <div className="space-y-1 text-xs text-gray-600">
                        {person.projects.map((project) => (
                          <div key={project.name} className="flex items-center justify-between">
                            <span>{project.name}</span>
                            <span className={textColor}>{project.hours}h</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Report Types */}
        <div>
          <h3 className="text-lg font-semibold mb-1">Generate new report</h3>
          <p className="text-xs text-gray-500 mb-4">
            Choose a template, then generate a report powered by current project or portfolio data.
          </p>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {reportTypes.map((rt) => (
              <Card
                key={rt.type}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedType === rt.type ? "ring-2 ring-emerald-500" : ""
                }`}
                onClick={() => setSelectedType(rt.type)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-emerald-50">
                      <rt.icon className="h-5 w-5 text-emerald-600" />
                    </div>
                    <CardTitle className="text-base">{rt.name}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>{rt.description}</CardDescription>
                  <p className="mt-1 text-xs text-gray-500">{rt.includes}</p>
                  <p className="mt-1 text-[11px] text-gray-400">Best for: {rt.bestFor}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          {selectedType && (
            <div className="mt-4 space-y-3">
              {selectedType === "sprint_review" && (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-gray-700">Project for this report</p>
                  <Select
                    value={selectedProjectId ?? undefined}
                    onValueChange={(value) => setSelectedProjectId(value)}
                    disabled={isLoadingProjects || projects.length === 0}
                  >
                    <SelectTrigger className="w-full md:w-[260px]">
                      <SelectValue placeholder={isLoadingProjects ? "Loading projects..." : "Select a project"} />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {projects.length === 0 && !isLoadingProjects && (
                    <span className="text-[11px] text-amber-600">
                      No projects found. Create a project first to run a sprint review.
                    </span>
                  )}
                </div>
              )}
              {selectedType === "custom" && (
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-gray-700">Custom prompt</p>
                  <Textarea
                    rows={3}
                    placeholder="Describe the report you need (e.g., client-ready summary focusing on risks and mitigation)."
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                  />
                </div>
              )}
              <div className="flex justify-end">
                <Button
                  onClick={handleGenerate}
                  disabled={
                    isGenerating ||
                    !selectedType ||
                    (selectedType === "sprint_review" && !selectedProjectId) ||
                    (selectedType === "custom" && !customPrompt.trim())
                  }
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  {isGenerating
                    ? "Generating..."
                    : `Generate ${reportTypes.find(rt => rt.type === selectedType)?.name}`}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Recent Reports */}
        <div>
          <h3 className="text-lg font-semibold mb-1">Recent reports</h3>
          <p className="text-xs text-gray-500 mb-3">
            Reports generated across all projects. Use them as-is or copy into your own docs.
          </p>
          <Card>
            <CardContent className="p-0">
              {savedReports.length > 0 ? (
                <div className="divide-y">
                  {savedReports.map((report) => (
                    <div
                      key={report.id}
                      className="flex items-center justify-between p-4 hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-gray-100">
                          {getTypeIcon(report.type)}
                        </div>
                        <div>
                          <h4 className="font-medium">{report.title}</h4>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span>{report.project}</span>
                            <span>•</span>
                            <span>{formatDate(report.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          {report.type.replace("_", " ")}
                        </Badge>
                        <Button variant="ghost" size="icon">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h4 className="font-medium text-gray-900">No reports yet</h4>
                  <p className="text-sm text-gray-500">
                    Generate your first report to get started
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {error && (
          <Card>
            <CardContent className="py-3 text-sm text-red-600">
              {error}
            </CardContent>
          </Card>
        )}

        {generatedReport && generatedMeta && (
          <Card>
            <CardHeader className="pb-2 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle className="text-base">Generated report</CardTitle>
                <CardDescription>
                  {generatedMeta.type.replace("_", " ")} for {generatedMeta.projectName} •{" "}
                  {formatDate(generatedMeta.generatedAt)}
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                >
                  <FileText className="h-4 w-4 mr-1" />
                  {copyFeedback ?? "Copy to clipboard"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSaveGeneratedReport}
                >
                  <Download className="h-4 w-4 mr-1" />
                  {saveFeedback ?? "Save to recent"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {generatedReport === "project_status" && <SampleProjectStatusReport />}
              {generatedReport === "sprint_review" && <SampleSprintReviewReport />}
              {generatedReport === "resource_usage" && <SampleResourceUsageReport />}
              {generatedReport === "custom" && <SampleCustomReport />}
              {generatedReport !== "project_status" &&
                generatedReport !== "sprint_review" &&
                generatedReport !== "resource_usage" &&
                generatedReport !== "custom" && (
                  <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800 bg-white rounded-md border p-4">
                    {generatedReport}
                  </div>
                )}
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  )
}
