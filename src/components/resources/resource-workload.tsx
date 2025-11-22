"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
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
  Users,
  UserPlus,
  Sparkles,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Calendar,
  Zap
} from "lucide-react"
import type { ResourceRole, WorkloadLevel } from "@/types/database"

interface ResourceWithWorkload {
  id: string
  name: string
  role: string | null
  weekly_capacity_hours: number
  total_assigned_hours: number
  completed_hours: number
  remaining_hours: number
  utilization_percentage: number
  workload_level: WorkloadLevel
  assigned_task_count: number
  sprint_breakdown: {
    sprint_id: string
    sprint_name: string
    assigned_hours: number
    capacity_hours: number
    utilization: number
  }[]
}

interface TeamSummary {
  total_team_capacity: number
  total_assigned_hours: number
  team_utilization_percentage: number
  overallocated_resources: number
  underutilized_resources: number
  workload_distribution: {
    underloaded: number
    optimal: number
    heavy: number
    overloaded: number
  }
  bottlenecks: {
    resource_name: string
    overload_hours: number
  }[]
}

interface Sprint {
  id: string
  name: string
  start_date: string
  end_date: string
  status: string
}

interface ResourceWorkloadProps {
  projectId: string
}

export function ResourceWorkload({ projectId }: ResourceWorkloadProps) {
  const [resources, setResources] = useState<ResourceWithWorkload[]>([])
  const [teamSummary, setTeamSummary] = useState<TeamSummary | null>(null)
  const [sprints, setSprints] = useState<Sprint[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [isAddingResource, setIsAddingResource] = useState(false)
  const [optimizationResult, setOptimizationResult] = useState<{
    summary: string
    current_issues: { issue: string; severity: string; affected_resources: string[] }[]
    recommended_changes: { task_title: string; current_assignee: string | null; recommended_assignee: string; reason: string }[]
    projected_improvement: { before_utilization: number; after_utilization: number; overload_reduction: number }
  } | null>(null)

  // New resource form state
  const [newResourceName, setNewResourceName] = useState("")
  const [newResourceRole, setNewResourceRole] = useState<ResourceRole>("other")
  const [newResourceCapacity, setNewResourceCapacity] = useState(40)

  const fetchResources = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/resources`)
      if (res.ok) {
        const data = await res.json()
        setResources(data.resources || [])
        setTeamSummary(data.team_summary || null)
        setSprints(data.sprints || [])
      }
    } catch (error) {
      console.error("Error fetching resources:", error)
    } finally {
      setIsLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    fetchResources()
  }, [fetchResources])

  const handleAddResource = async () => {
    if (!newResourceName.trim()) return

    setIsAddingResource(true)
    try {
      const res = await fetch(`/api/projects/${projectId}/resources`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newResourceName,
          role: newResourceRole,
          weekly_capacity_hours: newResourceCapacity
        })
      })

      if (res.ok) {
        setShowAddDialog(false)
        setNewResourceName("")
        setNewResourceRole("other")
        setNewResourceCapacity(40)
        fetchResources()
      }
    } catch (error) {
      console.error("Error adding resource:", error)
    } finally {
      setIsAddingResource(false)
    }
  }

  const handleOptimizeWorkload = async () => {
    setIsOptimizing(true)
    setOptimizationResult(null)
    try {
      const res = await fetch("/api/ai/optimize-workload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId })
      })

      if (res.ok) {
        const data = await res.json()
        setOptimizationResult(data.optimization)
      }
    } catch (error) {
      console.error("Error optimizing workload:", error)
    } finally {
      setIsOptimizing(false)
    }
  }

  const getWorkloadBadgeVariant = (level: WorkloadLevel) => {
    switch (level) {
      case "underloaded": return "secondary"
      case "optimal": return "success"
      case "heavy": return "warning"
      case "overloaded": return "destructive"
      default: return "secondary"
    }
  }

  const getWorkloadColor = (percentage: number) => {
    if (percentage < 50) return "bg-gray-500"
    if (percentage <= 80) return "bg-emerald-500"
    if (percentage <= 100) return "bg-amber-500"
    return "bg-red-500"
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
          <p className="text-gray-500 mt-2">Loading resources...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Team Summary */}
      {teamSummary && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Team Capacity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{teamSummary.total_team_capacity}h</div>
              <p className="text-sm text-gray-500">per week</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Assigned Work</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{teamSummary.total_assigned_hours}h</span>
                <span className={`text-sm ${teamSummary.team_utilization_percentage > 100 ? "text-red-500" : "text-emerald-500"}`}>
                  ({teamSummary.team_utilization_percentage}%)
                </span>
              </div>
              <Progress
                value={Math.min(teamSummary.team_utilization_percentage, 100)}
                className="h-2 mt-2"
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Workload Health</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {teamSummary.overallocated_resources > 0 ? (
                  <>
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    <span className="text-red-600 font-medium">{teamSummary.overallocated_resources} overloaded</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    <span className="text-emerald-600 font-medium">Balanced</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-1 h-4">
                {teamSummary.workload_distribution.underloaded > 0 && (
                  <div
                    className="bg-gray-400 rounded"
                    style={{ width: `${(teamSummary.workload_distribution.underloaded / resources.length) * 100}%` }}
                    title={`${teamSummary.workload_distribution.underloaded} underloaded`}
                  />
                )}
                {teamSummary.workload_distribution.optimal > 0 && (
                  <div
                    className="bg-emerald-500 rounded"
                    style={{ width: `${(teamSummary.workload_distribution.optimal / resources.length) * 100}%` }}
                    title={`${teamSummary.workload_distribution.optimal} optimal`}
                  />
                )}
                {teamSummary.workload_distribution.heavy > 0 && (
                  <div
                    className="bg-amber-500 rounded"
                    style={{ width: `${(teamSummary.workload_distribution.heavy / resources.length) * 100}%` }}
                    title={`${teamSummary.workload_distribution.heavy} heavy`}
                  />
                )}
                {teamSummary.workload_distribution.overloaded > 0 && (
                  <div
                    className="bg-red-500 rounded"
                    style={{ width: `${(teamSummary.workload_distribution.overloaded / resources.length) * 100}%` }}
                    title={`${teamSummary.workload_distribution.overloaded} overloaded`}
                  />
                )}
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Underloaded</span>
                <span>Overloaded</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Team Resources</h3>
          <p className="text-sm text-gray-500">{resources.length} resources</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleOptimizeWorkload} disabled={isOptimizing}>
            {isOptimizing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Optimize Workload
              </>
            )}
          </Button>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Resource
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Team Resource</DialogTitle>
                <DialogDescription>
                  Add a new team member to allocate tasks to
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., John Smith"
                    value={newResourceName}
                    onChange={(e) => setNewResourceName(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select value={newResourceRole} onValueChange={(v) => setNewResourceRole(v as ResourceRole)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pm">Project Manager</SelectItem>
                        <SelectItem value="backend">Backend</SelectItem>
                        <SelectItem value="frontend">Frontend</SelectItem>
                        <SelectItem value="fullstack">Fullstack</SelectItem>
                        <SelectItem value="qa">QA</SelectItem>
                        <SelectItem value="design">Design</SelectItem>
                        <SelectItem value="devops">DevOps</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="capacity">Weekly Capacity (hours)</Label>
                    <Input
                      id="capacity"
                      type="number"
                      value={newResourceCapacity}
                      onChange={(e) => setNewResourceCapacity(Number(e.target.value))}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
                <Button onClick={handleAddResource} disabled={isAddingResource || !newResourceName.trim()}>
                  {isAddingResource ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Add Resource
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* AI Optimization Results */}
      {optimizationResult && (
        <Card className="border-emerald-200 bg-emerald-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-emerald-800">
              <Sparkles className="h-5 w-5" />
              AI Workload Optimization
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-emerald-700">{optimizationResult.summary}</p>

            {optimizationResult.current_issues.length > 0 && (
              <div>
                <h4 className="font-medium text-emerald-800 mb-2">Issues Detected</h4>
                <div className="space-y-2">
                  {optimizationResult.current_issues.slice(0, 3).map((issue, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <AlertTriangle className={`h-4 w-4 mt-0.5 ${
                        issue.severity === 'critical' || issue.severity === 'high' ? 'text-red-500' : 'text-amber-500'
                      }`} />
                      <span className="text-emerald-700">{issue.issue}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {optimizationResult.recommended_changes.length > 0 && (
              <div>
                <h4 className="font-medium text-emerald-800 mb-2">Recommended Changes</h4>
                <div className="space-y-2">
                  {optimizationResult.recommended_changes.slice(0, 5).map((change, i) => (
                    <div key={i} className="bg-white rounded p-3 text-sm border border-emerald-200">
                      <p className="font-medium">{change.task_title}</p>
                      <p className="text-gray-600">
                        {change.current_assignee || 'Unassigned'} → {change.recommended_assignee}
                      </p>
                      <p className="text-emerald-600 text-xs mt-1">{change.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {optimizationResult.projected_improvement && (
              <div className="flex gap-4 pt-2 border-t border-emerald-200">
                <div className="text-center">
                  <p className="text-2xl font-bold text-emerald-700">
                    {optimizationResult.projected_improvement.before_utilization}% → {optimizationResult.projected_improvement.after_utilization}%
                  </p>
                  <p className="text-xs text-emerald-600">Team Utilization</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-emerald-700">
                    -{optimizationResult.projected_improvement.overload_reduction}
                  </p>
                  <p className="text-xs text-emerald-600">Overloaded Resources</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Resources List */}
      {resources.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">No resources added yet</p>
            <p className="text-sm text-gray-400">Add team members to start planning workload</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {resources.map((resource) => (
            <Card key={resource.id} className={resource.workload_level === 'overloaded' ? 'border-red-200' : ''}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{resource.name}</CardTitle>
                  <Badge variant={getWorkloadBadgeVariant(resource.workload_level)}>
                    {resource.workload_level}
                  </Badge>
                </div>
                <CardDescription>{resource.role || 'No role specified'}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Utilization Bar */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-500">Utilization</span>
                    <span className="font-medium">{resource.utilization_percentage}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getWorkloadColor(resource.utilization_percentage)} transition-all`}
                      style={{ width: `${Math.min(resource.utilization_percentage, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-gray-50 rounded p-2">
                    <p className="text-gray-500">Capacity</p>
                    <p className="font-medium">{resource.weekly_capacity_hours}h/week</p>
                  </div>
                  <div className="bg-gray-50 rounded p-2">
                    <p className="text-gray-500">Assigned</p>
                    <p className="font-medium">{resource.total_assigned_hours}h</p>
                  </div>
                  <div className="bg-gray-50 rounded p-2">
                    <p className="text-gray-500">Completed</p>
                    <p className="font-medium text-emerald-600">{resource.completed_hours}h</p>
                  </div>
                  <div className="bg-gray-50 rounded p-2">
                    <p className="text-gray-500">Remaining</p>
                    <p className="font-medium">{resource.remaining_hours}h</p>
                  </div>
                </div>

                {/* Sprint Breakdown */}
                {resource.sprint_breakdown.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Sprint Allocation</p>
                    <div className="space-y-1">
                      {resource.sprint_breakdown.slice(0, 3).map((sprint) => (
                        <div key={sprint.sprint_id} className="flex items-center gap-2 text-xs">
                          <span className="flex-1 truncate">{sprint.sprint_name}</span>
                          <span className={`font-medium ${sprint.utilization > 100 ? 'text-red-500' : 'text-gray-600'}`}>
                            {sprint.assigned_hours}h
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Task Count */}
                <div className="pt-2 border-t">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="h-4 w-4" />
                    <span>{resource.assigned_task_count} tasks assigned</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
