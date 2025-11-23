"use client"

import { useState } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
    icon: FileText
  },
  {
    type: "sprint_review",
    name: "Sprint Review",
    description: "Summary of completed work, velocity, and learnings",
    icon: Calendar
  },
  {
    type: "resource_usage",
    name: "Resource Usage",
    description: "Time tracking and capacity utilization analysis",
    icon: Users
  },
  {
    type: "custom",
    name: "Custom Report",
    description: "Generate a custom AI-powered report with your own prompt",
    icon: Sparkles
  },
]

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

  const getTypeIcon = (type: string) => {
    const reportType = reportTypes.find(rt => rt.type === type)
    const Icon = reportType?.icon || FileText
    return <Icon className="h-4 w-4" />
  }

  return (
    <MainLayout title="Reports">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Reports</h2>
          <p className="text-gray-500">Generate and view AI-powered project reports</p>
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
              <Button variant="outline" size="sm">
                <Sparkles className="h-4 w-4 mr-2" />
                Ask AI to rebalance
              </Button>
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
          <h3 className="text-lg font-semibold mb-4">Generate New Report</h3>
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
                </CardContent>
              </Card>
            ))}
          </div>
          {selectedType && (
            <div className="mt-4 flex justify-end">
              <Button>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate {reportTypes.find(rt => rt.type === selectedType)?.name}
              </Button>
            </div>
          )}
        </div>

        {/* Recent Reports */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Recent Reports</h3>
          <Card>
            <CardContent className="p-0">
              {mockReports.length > 0 ? (
                <div className="divide-y">
                  {mockReports.map((report) => (
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
      </div>
    </MainLayout>
  )
}
