# XPANDER — Resource Planning System

This document describes the Resource Planning feature in XPANDER, which enables workload management, capacity planning, and AI-powered optimization for team resources.

---

## 1. Feature Overview

The Resource Planning System allows users to:

- **Manage Team Resources**: Add, edit, and track team members with their roles and weekly capacity
- **Track Workload Distribution**: Visualize how work is distributed across the team
- **Monitor Utilization**: See real-time utilization percentages for each resource
- **Identify Bottlenecks**: Automatically detect overloaded and underutilized resources
- **AI-Powered Optimization**: Get intelligent recommendations to balance workload

---

## 2. Core Concepts

### 2.1 Resources

A **Resource** represents a team member who can be assigned tasks.

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Unique identifier |
| `user_id` | UUID | Owner of the resource |
| `name` | String | Display name |
| `role` | ResourceRole | Role type (pm, backend, frontend, fullstack, qa, design, devops, other) |
| `weekly_capacity_hours` | Number | Available hours per week (default: 40) |

### 2.2 Workload Levels

Resources are categorized into workload levels based on utilization percentage:

| Level | Utilization | Description |
|-------|-------------|-------------|
| `underloaded` | < 50% | Resource has significant available capacity |
| `optimal` | 50-80% | Healthy workload balance |
| `heavy` | 80-100% | High utilization, monitor closely |
| `overloaded` | > 100% | Over capacity, action required |

### 2.3 Resource Allocations

**Task Assignments** link tasks to resources:

| Field | Type | Description |
|-------|------|-------------|
| `task_id` | UUID | The assigned task |
| `resource_id` | UUID | The assigned resource |
| `assigned_hours` | Number | Hours allocated (defaults to task estimate) |

---

## 3. API Endpoints

### 3.1 Resource Management

#### GET /api/projects/:id/resources

Fetches all resources with calculated workload data.

**Response:**
```json
{
  "resources": [
    {
      "id": "uuid",
      "name": "John Smith",
      "role": "backend",
      "weekly_capacity_hours": 40,
      "total_assigned_hours": 32,
      "completed_hours": 12,
      "remaining_hours": 20,
      "utilization_percentage": 80,
      "workload_level": "optimal",
      "assigned_task_count": 5,
      "sprint_breakdown": [
        {
          "sprint_id": "uuid",
          "sprint_name": "Sprint 1",
          "assigned_hours": 20,
          "capacity_hours": 40,
          "utilization": 50
        }
      ]
    }
  ],
  "team_summary": {
    "total_team_capacity": 120,
    "total_assigned_hours": 96,
    "team_utilization_percentage": 80,
    "overallocated_resources": 1,
    "underutilized_resources": 0,
    "workload_distribution": {
      "underloaded": 0,
      "optimal": 2,
      "heavy": 1,
      "overloaded": 0
    },
    "bottlenecks": []
  },
  "sprints": [...]
}
```

#### POST /api/projects/:id/resources

Creates a new resource.

**Request Body:**
```json
{
  "name": "Jane Doe",
  "role": "frontend",
  "weekly_capacity_hours": 40
}
```

#### PUT /api/projects/:id/resources

Updates an existing resource.

**Request Body:**
```json
{
  "resource_id": "uuid",
  "name": "Jane Doe",
  "role": "fullstack",
  "weekly_capacity_hours": 32
}
```

### 3.2 Resource Allocations

#### GET /api/projects/:id/resources/allocations

Fetches all task-to-resource allocations for the project.

**Response:**
```json
{
  "allocations": [
    {
      "resource_id": "uuid",
      "resource_name": "John Smith",
      "role": "backend",
      "sprint_allocations": [
        {
          "sprint_id": "uuid",
          "sprint_name": "Sprint 1",
          "tasks": [
            {
              "task_id": "uuid",
              "task_title": "Build API endpoint",
              "task_type": "backend",
              "status": "in_progress",
              "allocated_hours": 8
            }
          ],
          "total_hours": 8
        }
      ],
      "unassigned_tasks": [],
      "total_allocated_hours": 32
    }
  ]
}
```

#### POST /api/projects/:id/resources/allocations

Assigns a task to a resource.

**Request Body:**
```json
{
  "task_id": "uuid",
  "resource_id": "uuid",
  "assigned_hours": 8
}
```

#### DELETE /api/projects/:id/resources/allocations

Removes a task assignment.

**Request Body:**
```json
{
  "task_id": "uuid",
  "resource_id": "uuid"
}
```

### 3.3 AI Workload Optimization

#### POST /api/ai/optimize-workload

Analyzes workload distribution and provides optimization recommendations.

**Request Body:**
```json
{
  "projectId": "uuid"
}
```

**Response:**
```json
{
  "optimization": {
    "summary": "Team is currently at 85% utilization with 1 overloaded resource...",
    "current_issues": [
      {
        "issue": "John Smith is overloaded by 20 hours",
        "severity": "high",
        "affected_resources": ["John Smith"]
      }
    ],
    "recommended_changes": [
      {
        "task_id": "uuid",
        "task_title": "Build dashboard UI",
        "current_assignee": "John Smith",
        "recommended_assignee": "Jane Doe",
        "reason": "Jane has 16 hours available capacity and frontend skills",
        "hours_to_reassign": 12
      }
    ],
    "sprint_adjustments": [
      {
        "sprint_id": "uuid",
        "sprint_name": "Sprint 2",
        "current_load": 120,
        "recommended_load": 90,
        "tasks_to_move": ["Task to defer"]
      }
    ],
    "projected_improvement": {
      "before_utilization": 110,
      "after_utilization": 85,
      "overload_reduction": 1,
      "timeline_impact_days": 0
    }
  },
  "current_state": {
    "resources": [...],
    "sprints": [...],
    "unassigned_tasks": 3,
    "team_summary": {...}
  }
}
```

---

## 4. UI Components

### 4.1 Resources Tab

Located in the project detail page, the Resources tab provides:

1. **Team Summary Cards**
   - Total team capacity (hours/week)
   - Total assigned work with utilization percentage
   - Workload health indicator
   - Distribution visualization bar

2. **Action Bar**
   - "Add Resource" button to add team members
   - "Optimize Workload" button for AI recommendations

3. **Resource Cards**
   - Individual resource details
   - Utilization progress bar (color-coded)
   - Statistics: capacity, assigned, completed, remaining hours
   - Sprint allocation breakdown
   - Assigned task count

4. **AI Optimization Panel**
   - Summary of current workload situation
   - Detected issues with severity levels
   - Recommended task reassignments
   - Projected improvement metrics

### 4.2 Quick Access

The Resources feature is accessible via:
- **Resources tab** in project detail view
- **Quick Action button** "Team Resources" in Overview tab

---

## 5. Workload Calculation

### 5.1 Utilization Formula

```
Utilization % = (Total Assigned Hours / Weekly Capacity Hours) × 100
```

### 5.2 Sprint Capacity Calculation

```
Sprint Capacity = Weekly Capacity Hours × Sprint Duration (weeks)
```

### 5.3 Team Summary Calculation

```
Team Utilization % = (Sum of All Assigned Hours / Sum of All Capacities) × 100
```

---

## 6. Database Schema

### 6.1 Existing Tables Used

- **resources**: Team member definitions
- **task_assignments**: Task-to-resource mappings
- **tasks**: Project tasks with estimates
- **sprints**: Sprint definitions with dates

### 6.2 New Types Added

```typescript
// Resource Planning Types
export type ResourceRole = 'pm' | 'backend' | 'frontend' | 'fullstack' | 'qa' | 'design' | 'devops' | 'other'
export type AllocationStatus = 'available' | 'allocated' | 'overallocated' | 'on_leave'
export type WorkloadLevel = 'underloaded' | 'optimal' | 'heavy' | 'overloaded'

// Resource Workload Interface
export interface ResourceWorkload {
  resource_id: string
  resource_name: string
  role: ResourceRole
  weekly_capacity: number
  total_assigned_hours: number
  completed_hours: number
  remaining_hours: number
  utilization_percentage: number
  workload_level: WorkloadLevel
  overdue_tasks: number
  upcoming_deadlines: number
  sprint_breakdown: SprintAllocation[]
}

// Team Summary Interface
export interface TeamWorkloadSummary {
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
  bottlenecks: Bottleneck[]
  recommendations: string[]
}
```

---

## 7. AI Prompt Specification

The workload optimization uses the following AI prompt:

```
You are XPANDER Workload Optimizer AI - an expert at analyzing team workload distribution, identifying bottlenecks, and recommending optimal task assignments.

Your job is to analyze the current resource allocations and workload distribution, then provide actionable recommendations to balance workload across the team.

Guidelines:
- Consider resource skills/roles when recommending reassignments
- Prioritize reducing overload on critical resources first
- Balance workload to keep everyone in 60-80% utilization range when possible
- Consider task dependencies when suggesting sprint moves
- Be realistic - some overload may be unavoidable for deadlines
- Flag critical timeline risks if workload cannot be balanced
```

---

## 8. Best Practices

### 8.1 Capacity Planning

- Set realistic weekly capacity (account for meetings, breaks)
- Default 40h/week is typical; adjust for part-time or senior roles
- Review capacity when sprint-planning for accuracy

### 8.2 Task Assignment

- Match task types with resource roles when possible
- Spread critical path tasks across multiple resources
- Leave buffer capacity (aim for 70-80% utilization)

### 8.3 Workload Monitoring

- Check Resources tab regularly during sprints
- Address overloaded resources immediately
- Use AI optimization for complex rebalancing

### 8.4 Team Health

- Watch for consistently heavy-loaded resources
- Rotate difficult tasks to prevent burnout
- Use underloaded periods for learning/improvement

---

## 9. Integration with Other Features

### 9.1 Sprint Planning

The sprint planner considers resource capacity when distributing tasks across sprints.

### 9.2 Change Impact Analysis

Change requests analyze resource availability when estimating timeline impact.

### 9.3 Reports

The Resource Usage Report provides detailed workload analysis including:
- Historical utilization trends
- Burnout risk indicators
- Capacity forecasting

### 9.4 AI Advisor

The AI Advisor can answer questions about team workload:
- "Is the team overloaded?"
- "Who has capacity for new tasks?"
- "Can we meet the deadline with current resources?"

---

## 10. Future Enhancements

Planned improvements for the Resource Planning System:

1. **Resource Availability Calendar**: Track vacations, holidays, and reduced capacity days
2. **Skill Matrix**: Define skills per resource for smarter task matching
3. **Historical Analytics**: Track utilization trends over time
4. **Auto-Assignment**: AI-powered automatic task assignment during sprint planning
5. **Conflict Detection**: Alert when resources are double-booked
6. **Cost Tracking**: Calculate resource costs for budget planning

---

**Document Version:** 1.0
**Last Updated:** November 2024
