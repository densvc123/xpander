import { GanttSprint } from "./gantt-chart"

// Helper to create dates relative to project start
const createDate = (year: number, month: number, day: number) => new Date(year, month - 1, day)

// Realistic mock data for XPANDER MVP project
export const mockGanttSprints: GanttSprint[] = [
  {
    id: "sprint-1",
    name: "Sprint 1 - Foundation",
    startDate: createDate(2024, 1, 1),
    endDate: createDate(2024, 1, 14),
    status: "completed",
    tasks: [
      {
        id: "task-1-1",
        name: "Project Setup & Configuration",
        startDate: createDate(2024, 1, 1),
        endDate: createDate(2024, 1, 2),
        progress: 100,
        status: "completed",
        type: "task",
        assignee: "Alex Chen",
        priority: "high"
      },
      {
        id: "task-1-2",
        name: "Database Schema Design",
        startDate: createDate(2024, 1, 2),
        endDate: createDate(2024, 1, 4),
        progress: 100,
        status: "completed",
        type: "task",
        assignee: "Sarah Kim",
        priority: "high",
        dependencies: ["task-1-1"]
      },
      {
        id: "task-1-3",
        name: "Authentication System",
        startDate: createDate(2024, 1, 4),
        endDate: createDate(2024, 1, 8),
        progress: 100,
        status: "completed",
        type: "task",
        assignee: "Alex Chen",
        priority: "high",
        dependencies: ["task-1-2"]
      },
      {
        id: "task-1-4",
        name: "UI Component Library Setup",
        startDate: createDate(2024, 1, 3),
        endDate: createDate(2024, 1, 6),
        progress: 100,
        status: "completed",
        type: "task",
        assignee: "Maria Lopez",
        priority: "medium"
      },
      {
        id: "task-1-5",
        name: "Main Layout & Navigation",
        startDate: createDate(2024, 1, 6),
        endDate: createDate(2024, 1, 10),
        progress: 100,
        status: "completed",
        type: "task",
        assignee: "Maria Lopez",
        priority: "medium",
        dependencies: ["task-1-4"]
      },
      {
        id: "milestone-1",
        name: "Foundation Complete",
        startDate: createDate(2024, 1, 14),
        endDate: createDate(2024, 1, 14),
        progress: 100,
        status: "completed",
        type: "milestone",
        priority: "high"
      }
    ]
  },
  {
    id: "sprint-2",
    name: "Sprint 2 - Core Features",
    startDate: createDate(2024, 1, 15),
    endDate: createDate(2024, 1, 28),
    status: "active",
    tasks: [
      {
        id: "task-2-1",
        name: "Dashboard Overview Page",
        startDate: createDate(2024, 1, 15),
        endDate: createDate(2024, 1, 18),
        progress: 100,
        status: "completed",
        type: "task",
        assignee: "Maria Lopez",
        priority: "high"
      },
      {
        id: "task-2-2",
        name: "Project CRUD Operations",
        startDate: createDate(2024, 1, 15),
        endDate: createDate(2024, 1, 19),
        progress: 100,
        status: "completed",
        type: "task",
        assignee: "Alex Chen",
        priority: "high"
      },
      {
        id: "task-2-3",
        name: "Task Management System",
        startDate: createDate(2024, 1, 18),
        endDate: createDate(2024, 1, 23),
        progress: 75,
        status: "in_progress",
        type: "task",
        assignee: "Sarah Kim",
        priority: "high",
        dependencies: ["task-2-2"]
      },
      {
        id: "task-2-4",
        name: "Sprint Planning Interface",
        startDate: createDate(2024, 1, 20),
        endDate: createDate(2024, 1, 25),
        progress: 50,
        status: "in_progress",
        type: "task",
        assignee: "Maria Lopez",
        priority: "medium",
        dependencies: ["task-2-1"]
      },
      {
        id: "task-2-5",
        name: "Real-time Notifications",
        startDate: createDate(2024, 1, 22),
        endDate: createDate(2024, 1, 26),
        progress: 25,
        status: "at_risk",
        type: "task",
        assignee: "Alex Chen",
        priority: "medium"
      },
      {
        id: "task-2-6",
        name: "API Rate Limiting",
        startDate: createDate(2024, 1, 24),
        endDate: createDate(2024, 1, 27),
        progress: 0,
        status: "pending",
        type: "task",
        assignee: "Sarah Kim",
        priority: "low"
      },
      {
        id: "milestone-2",
        name: "MVP Core Ready",
        startDate: createDate(2024, 1, 28),
        endDate: createDate(2024, 1, 28),
        progress: 0,
        status: "pending",
        type: "milestone",
        priority: "high"
      }
    ]
  },
  {
    id: "sprint-3",
    name: "Sprint 3 - AI Integration",
    startDate: createDate(2024, 1, 29),
    endDate: createDate(2024, 2, 11),
    status: "planned",
    tasks: [
      {
        id: "task-3-1",
        name: "AI Requirements Analysis",
        startDate: createDate(2024, 1, 29),
        endDate: createDate(2024, 2, 2),
        progress: 0,
        status: "pending",
        type: "task",
        assignee: "Alex Chen",
        priority: "high"
      },
      {
        id: "task-3-2",
        name: "Task Breakdown Engine",
        startDate: createDate(2024, 2, 1),
        endDate: createDate(2024, 2, 6),
        progress: 0,
        status: "pending",
        type: "task",
        assignee: "Sarah Kim",
        priority: "high",
        dependencies: ["task-3-1"]
      },
      {
        id: "task-3-3",
        name: "AI Advisor Chatbot",
        startDate: createDate(2024, 2, 4),
        endDate: createDate(2024, 2, 9),
        progress: 0,
        status: "pending",
        type: "task",
        assignee: "Alex Chen",
        priority: "medium",
        dependencies: ["task-3-1"]
      },
      {
        id: "task-3-4",
        name: "Sprint Auto-planning",
        startDate: createDate(2024, 2, 6),
        endDate: createDate(2024, 2, 10),
        progress: 0,
        status: "pending",
        type: "task",
        assignee: "Sarah Kim",
        priority: "medium",
        dependencies: ["task-3-2"]
      },
      {
        id: "milestone-3",
        name: "AI Features Live",
        startDate: createDate(2024, 2, 11),
        endDate: createDate(2024, 2, 11),
        progress: 0,
        status: "pending",
        type: "milestone",
        priority: "high"
      }
    ]
  },
  {
    id: "sprint-4",
    name: "Sprint 4 - Polish & Launch",
    startDate: createDate(2024, 2, 12),
    endDate: createDate(2024, 2, 25),
    status: "planned",
    tasks: [
      {
        id: "task-4-1",
        name: "Performance Optimization",
        startDate: createDate(2024, 2, 12),
        endDate: createDate(2024, 2, 15),
        progress: 0,
        status: "pending",
        type: "task",
        assignee: "Alex Chen",
        priority: "high"
      },
      {
        id: "task-4-2",
        name: "Mobile Responsive Fixes",
        startDate: createDate(2024, 2, 13),
        endDate: createDate(2024, 2, 17),
        progress: 0,
        status: "pending",
        type: "task",
        assignee: "Maria Lopez",
        priority: "high"
      },
      {
        id: "task-4-3",
        name: "User Testing & Feedback",
        startDate: createDate(2024, 2, 16),
        endDate: createDate(2024, 2, 20),
        progress: 0,
        status: "pending",
        type: "task",
        priority: "medium"
      },
      {
        id: "task-4-4",
        name: "Bug Fixes & Iterations",
        startDate: createDate(2024, 2, 18),
        endDate: createDate(2024, 2, 23),
        progress: 0,
        status: "pending",
        type: "task",
        assignee: "Sarah Kim",
        priority: "high",
        dependencies: ["task-4-3"]
      },
      {
        id: "task-4-5",
        name: "Documentation",
        startDate: createDate(2024, 2, 20),
        endDate: createDate(2024, 2, 24),
        progress: 0,
        status: "pending",
        type: "task",
        priority: "low"
      },
      {
        id: "milestone-4",
        name: "MVP Launch",
        startDate: createDate(2024, 2, 25),
        endDate: createDate(2024, 2, 25),
        progress: 0,
        status: "pending",
        type: "milestone",
        priority: "high"
      }
    ]
  }
]

// Project date range
export const projectStartDate = createDate(2024, 1, 1)
export const projectEndDate = createDate(2024, 2, 28)
