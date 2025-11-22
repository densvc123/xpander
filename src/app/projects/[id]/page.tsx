"use client"

import { useState } from "react"
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
  Clock
} from "lucide-react"
import Link from "next/link"
import { formatDate } from "@/lib/utils"

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

export default function ProjectDetailPage() {
  useParams()
  const [activeTab, setActiveTab] = useState("overview")
  const [requirements, setRequirements] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [advisorInput, setAdvisorInput] = useState("")
  const [messages, setMessages] = useState<Message[]>(mockMessages)

  const handleAnalyze = async () => {
    setIsAnalyzing(true)
    // Simulate AI analysis
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
          <TabsList className="grid w-full grid-cols-7 lg:w-auto lg:inline-grid">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="requirements">Requirements</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="sprints">Sprints</TabsTrigger>
            <TabsTrigger value="gantt">Gantt</TabsTrigger>
            <TabsTrigger value="advisor">AI Advisor</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Timeline View
                </CardTitle>
                <CardDescription>Visual timeline of sprints and tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockSprints.map((sprint, index) => (
                    <div key={sprint.id} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{sprint.name}</span>
                        <span className="text-gray-500">{sprint.tasksCount} tasks</span>
                      </div>
                      <div className="relative h-8 bg-gray-100 rounded">
                        <div
                          className={`absolute h-full rounded transition-all ${
                            sprint.status === "completed" ? "bg-emerald-500" :
                            sprint.status === "active" ? "bg-blue-500" : "bg-gray-300"
                          }`}
                          style={{
                            left: `${index * 33}%`,
                            width: "30%"
                          }}
                        />
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-between text-xs text-gray-400 pt-2">
                    <span>Jan 1</span>
                    <span>Jan 14</span>
                    <span>Jan 28</span>
                    <span>Feb 11</span>
                  </div>
                </div>
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
