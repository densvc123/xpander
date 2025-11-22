"use client"

import { useState, useMemo, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ChevronDown,
  ChevronRight,
  Calendar,
  ZoomIn,
  ZoomOut,
  User,
  Flag,
  AlertCircle,
  CheckCircle2,
  Clock,
  Play
} from "lucide-react"
import { cn } from "@/lib/utils"

// Types
export interface GanttTask {
  id: string
  name: string
  startDate: Date
  endDate: Date
  progress: number
  status: "completed" | "in_progress" | "pending" | "at_risk"
  type: "task" | "milestone"
  assignee?: string
  dependencies?: string[]
  priority?: "high" | "medium" | "low"
}

export interface GanttSprint {
  id: string
  name: string
  startDate: Date
  endDate: Date
  status: "completed" | "active" | "planned"
  tasks: GanttTask[]
}

export interface GanttChartProps {
  sprints: GanttSprint[]
  projectStartDate: Date
  projectEndDate: Date
}

type ViewMode = "day" | "week" | "month"

// Helper functions
const getDaysBetween = (start: Date, end: Date): number => {
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
}

const formatDateShort = (date: Date): string => {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

const formatMonthYear = (date: Date): string => {
  return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" })
}

const getWeekNumber = (date: Date): number => {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1)
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)
}

const addDays = (date: Date, days: number): Date => {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

const isWeekend = (date: Date): boolean => {
  const day = date.getDay()
  return day === 0 || day === 6
}

const isSameDay = (date1: Date, date2: Date): boolean => {
  return date1.toDateString() === date2.toDateString()
}

export function GanttChart({ sprints, projectStartDate, projectEndDate }: GanttChartProps) {
  const [expandedSprints, setExpandedSprints] = useState<Set<string>>(new Set(sprints.map(s => s.id)))
  const [viewMode, setViewMode] = useState<ViewMode>("week")
  const [hoveredTask, setHoveredTask] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Calculate timeline units based on view mode
  const timelineUnits = useMemo(() => {
    const units: { date: Date; label: string; isWeekend: boolean }[] = []
    const totalDays = getDaysBetween(projectStartDate, projectEndDate) + 1

    const cellWidth = viewMode === "day" ? 40 : viewMode === "week" ? 120 : 200

    if (viewMode === "day") {
      for (let i = 0; i < totalDays; i++) {
        const date = addDays(projectStartDate, i)
        units.push({
          date,
          label: date.getDate().toString(),
          isWeekend: isWeekend(date)
        })
      }
    } else if (viewMode === "week") {
      for (let i = 0; i < totalDays; i += 7) {
        const date = addDays(projectStartDate, i)
        units.push({
          date,
          label: `W${getWeekNumber(date)}`,
          isWeekend: false
        })
      }
    } else {
      let currentMonth = new Date(projectStartDate.getFullYear(), projectStartDate.getMonth(), 1)
      while (currentMonth <= projectEndDate) {
        units.push({
          date: new Date(currentMonth),
          label: formatMonthYear(currentMonth),
          isWeekend: false
        })
        currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
      }
    }

    return { units, cellWidth }
  }, [projectStartDate, projectEndDate, viewMode])

  // Calculate position and width for a date range
  const getBarStyle = (startDate: Date, endDate: Date) => {
    const totalDays = getDaysBetween(projectStartDate, projectEndDate) + 1
    const startOffset = getDaysBetween(projectStartDate, startDate)
    const duration = getDaysBetween(startDate, endDate) + 1

    const left = (startOffset / totalDays) * 100
    const width = (duration / totalDays) * 100

    return { left: `${left}%`, width: `${Math.max(width, 1)}%` }
  }

  // Calculate today marker position
  const getTodayPosition = () => {
    if (today < projectStartDate || today > projectEndDate) return null
    const totalDays = getDaysBetween(projectStartDate, projectEndDate) + 1
    const daysFromStart = getDaysBetween(projectStartDate, today)
    return `${(daysFromStart / totalDays) * 100}%`
  }

  const todayPosition = getTodayPosition()

  const toggleSprint = (sprintId: string) => {
    const newExpanded = new Set(expandedSprints)
    if (newExpanded.has(sprintId)) {
      newExpanded.delete(sprintId)
    } else {
      newExpanded.add(sprintId)
    }
    setExpandedSprints(newExpanded)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-emerald-500"
      case "in_progress":
      case "active":
        return "bg-blue-500"
      case "at_risk":
        return "bg-amber-500"
      case "pending":
      case "planned":
        return "bg-gray-400"
      default:
        return "bg-gray-300"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-3 w-3 text-emerald-600" />
      case "in_progress":
        return <Play className="h-3 w-3 text-blue-600" />
      case "at_risk":
        return <AlertCircle className="h-3 w-3 text-amber-600" />
      default:
        return <Clock className="h-3 w-3 text-gray-400" />
    }
  }

  const getPriorityBadge = (priority?: string) => {
    if (!priority) return null
    const colors = {
      high: "bg-red-100 text-red-700 border-red-200",
      medium: "bg-amber-100 text-amber-700 border-amber-200",
      low: "bg-gray-100 text-gray-600 border-gray-200"
    }
    return (
      <span className={cn("text-[10px] px-1.5 py-0.5 rounded border", colors[priority as keyof typeof colors])}>
        {priority}
      </span>
    )
  }

  const totalWidth = timelineUnits.units.length * timelineUnits.cellWidth

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-4 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Project Timeline
          </CardTitle>
          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              {(["day", "week", "month"] as ViewMode[]).map((mode) => (
                <Button
                  key={mode}
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode(mode)}
                  className={cn(
                    "h-7 px-3 text-xs capitalize",
                    viewMode === mode && "bg-white shadow-sm"
                  )}
                >
                  {mode}
                </Button>
              ))}
            </div>
            {/* Zoom Controls */}
            <div className="flex items-center gap-1 border-l pl-2 ml-2">
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        {/* Legend */}
        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-emerald-500" />
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-blue-500" />
            <span>In Progress</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-amber-500" />
            <span>At Risk</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-gray-400" />
            <span>Planned</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rotate-45 bg-purple-500" />
            <span>Milestone</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="flex">
          {/* Left Panel - Task Names */}
          <div className="w-72 flex-shrink-0 border-r bg-gray-50/50">
            {/* Header */}
            <div className="h-14 border-b bg-gray-100/80 flex items-center px-4 font-medium text-sm text-gray-600">
              Task / Sprint
            </div>
            {/* Rows */}
            <div className="divide-y">
              {sprints.map((sprint) => (
                <div key={sprint.id}>
                  {/* Sprint Row */}
                  <div
                    className="h-12 flex items-center px-3 hover:bg-gray-100/80 cursor-pointer transition-colors"
                    onClick={() => toggleSprint(sprint.id)}
                  >
                    <button className="p-1 hover:bg-gray-200 rounded mr-2">
                      {expandedSprints.has(sprint.id) ? (
                        <ChevronDown className="h-4 w-4 text-gray-500" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-500" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{sprint.name}</div>
                      <div className="text-xs text-gray-500">
                        {sprint.tasks.length} tasks • {formatDateShort(sprint.startDate)} - {formatDateShort(sprint.endDate)}
                      </div>
                    </div>
                    <Badge
                      variant={sprint.status === "completed" ? "success" : sprint.status === "active" ? "default" : "secondary"}
                      className="ml-2 text-[10px]"
                    >
                      {sprint.status}
                    </Badge>
                  </div>
                  {/* Task Rows */}
                  {expandedSprints.has(sprint.id) && sprint.tasks.map((task) => (
                    <div
                      key={task.id}
                      className={cn(
                        "h-10 flex items-center pl-10 pr-3 transition-colors",
                        hoveredTask === task.id ? "bg-blue-50" : "hover:bg-gray-50"
                      )}
                      onMouseEnter={() => setHoveredTask(task.id)}
                      onMouseLeave={() => setHoveredTask(null)}
                    >
                      <div className="mr-2">{getStatusIcon(task.status)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm truncate flex items-center gap-2">
                          {task.type === "milestone" && (
                            <Flag className="h-3 w-3 text-purple-500" />
                          )}
                          <span className={task.status === "completed" ? "text-gray-400 line-through" : ""}>
                            {task.name}
                          </span>
                          {getPriorityBadge(task.priority)}
                        </div>
                      </div>
                      {task.assignee && (
                        <div className="flex items-center gap-1 text-xs text-gray-500 ml-2">
                          <User className="h-3 w-3" />
                          <span className="truncate max-w-[60px]">{task.assignee}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Right Panel - Timeline */}
          <div className="flex-1 overflow-x-auto" ref={scrollRef}>
            <div style={{ minWidth: `${totalWidth}px` }}>
              {/* Timeline Header */}
              <div className="h-14 border-b bg-gray-100/80 flex">
                {/* Month/Week headers */}
                <div className="flex">
                  {timelineUnits.units.map((unit, index) => (
                    <div
                      key={index}
                      className={cn(
                        "flex flex-col items-center justify-center border-r text-xs",
                        unit.isWeekend && "bg-gray-200/50"
                      )}
                      style={{ width: `${timelineUnits.cellWidth}px` }}
                    >
                      <span className="font-medium text-gray-600">{unit.label}</span>
                      {viewMode === "day" && (
                        <span className="text-[10px] text-gray-400">
                          {unit.date.toLocaleDateString("en-US", { weekday: "short" })}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Timeline Body */}
              <div className="relative divide-y">
                {/* Grid lines */}
                <div className="absolute inset-0 flex pointer-events-none">
                  {timelineUnits.units.map((unit, index) => (
                    <div
                      key={index}
                      className={cn(
                        "border-r border-gray-100",
                        unit.isWeekend && "bg-gray-50/50"
                      )}
                      style={{ width: `${timelineUnits.cellWidth}px` }}
                    />
                  ))}
                </div>

                {/* Today marker */}
                {todayPosition && (
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20"
                    style={{ left: todayPosition }}
                  >
                    <div className="absolute -top-6 -translate-x-1/2 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded">
                      Today
                    </div>
                  </div>
                )}

                {/* Sprint and Task Bars */}
                {sprints.map((sprint) => (
                  <div key={sprint.id}>
                    {/* Sprint Bar */}
                    <div className="h-12 relative">
                      <div
                        className={cn(
                          "absolute top-2 h-8 rounded-md shadow-sm border border-opacity-20 transition-all",
                          getStatusColor(sprint.status),
                          "opacity-30"
                        )}
                        style={getBarStyle(sprint.startDate, sprint.endDate)}
                      />
                      {/* Sprint progress overlay */}
                      <div
                        className={cn(
                          "absolute top-2 h-8 rounded-l-md",
                          getStatusColor(sprint.status)
                        )}
                        style={{
                          ...getBarStyle(sprint.startDate, sprint.endDate),
                          width: `calc(${getBarStyle(sprint.startDate, sprint.endDate).width} * ${
                            sprint.tasks.filter(t => t.status === "completed").length / sprint.tasks.length
                          })`
                        }}
                      />
                      {/* Sprint label */}
                      <div
                        className="absolute top-2 h-8 flex items-center px-2 text-xs font-medium text-white truncate"
                        style={getBarStyle(sprint.startDate, sprint.endDate)}
                      >
                        {sprint.name}
                      </div>
                    </div>

                    {/* Task Bars */}
                    {expandedSprints.has(sprint.id) && sprint.tasks.map((task) => (
                      <div
                        key={task.id}
                        className={cn(
                          "h-10 relative",
                          hoveredTask === task.id && "bg-blue-50/50"
                        )}
                        onMouseEnter={() => setHoveredTask(task.id)}
                        onMouseLeave={() => setHoveredTask(null)}
                      >
                        {task.type === "milestone" ? (
                          // Milestone diamond
                          <div
                            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
                            style={{ left: getBarStyle(task.startDate, task.endDate).left }}
                          >
                            <div className="w-4 h-4 rotate-45 bg-purple-500 border-2 border-white shadow-md" />
                          </div>
                        ) : (
                          // Task bar
                          <>
                            {/* Background bar */}
                            <div
                              className={cn(
                                "absolute top-2 h-6 rounded shadow-sm transition-all",
                                hoveredTask === task.id ? "ring-2 ring-blue-400 ring-offset-1" : "",
                                task.status === "completed" ? "bg-emerald-200" :
                                task.status === "in_progress" ? "bg-blue-200" :
                                task.status === "at_risk" ? "bg-amber-200" : "bg-gray-200"
                              )}
                              style={getBarStyle(task.startDate, task.endDate)}
                            />
                            {/* Progress bar */}
                            <div
                              className={cn(
                                "absolute top-2 h-6 rounded-l transition-all",
                                task.status === "completed" ? "bg-emerald-500" :
                                task.status === "in_progress" ? "bg-blue-500" :
                                task.status === "at_risk" ? "bg-amber-500" : "bg-gray-400"
                              )}
                              style={{
                                left: getBarStyle(task.startDate, task.endDate).left,
                                width: `calc(${getBarStyle(task.startDate, task.endDate).width} * ${task.progress / 100})`,
                                borderTopRightRadius: task.progress === 100 ? "0.25rem" : 0,
                                borderBottomRightRadius: task.progress === 100 ? "0.25rem" : 0
                              }}
                            />
                            {/* Progress text */}
                            <div
                              className="absolute top-2 h-6 flex items-center px-2 text-[10px] font-medium text-gray-700"
                              style={getBarStyle(task.startDate, task.endDate)}
                            >
                              {task.progress > 0 && `${task.progress}%`}
                            </div>
                          </>
                        )}

                        {/* Tooltip on hover */}
                        {hoveredTask === task.id && (
                          <div
                            className="absolute z-30 top-full mt-1 bg-gray-900 text-white text-xs rounded-lg shadow-lg p-3 min-w-[200px]"
                            style={{ left: getBarStyle(task.startDate, task.endDate).left }}
                          >
                            <div className="font-medium mb-2">{task.name}</div>
                            <div className="space-y-1 text-gray-300">
                              <div className="flex justify-between">
                                <span>Start:</span>
                                <span>{formatDateShort(task.startDate)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>End:</span>
                                <span>{formatDateShort(task.endDate)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Progress:</span>
                                <span>{task.progress}%</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Status:</span>
                                <span className="capitalize">{task.status.replace("_", " ")}</span>
                              </div>
                              {task.assignee && (
                                <div className="flex justify-between">
                                  <span>Assignee:</span>
                                  <span>{task.assignee}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Summary */}
        <div className="border-t bg-gray-50 px-4 py-3 flex items-center justify-between text-sm">
          <div className="flex items-center gap-6 text-gray-600">
            <span>
              <strong className="text-gray-900">{sprints.length}</strong> Sprints
            </span>
            <span>
              <strong className="text-gray-900">{sprints.reduce((acc, s) => acc + s.tasks.length, 0)}</strong> Tasks
            </span>
            <span>
              <strong className="text-gray-900">
                {sprints.reduce((acc, s) => acc + s.tasks.filter(t => t.status === "completed").length, 0)}
              </strong> Completed
            </span>
          </div>
          <div className="text-gray-500">
            {formatDateShort(projectStartDate)} — {formatDateShort(projectEndDate)}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
