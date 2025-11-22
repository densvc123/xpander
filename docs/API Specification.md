# XPANDER — API Specification

This document defines the XPANDER MVP HTTP API surface.

- Style: JSON over HTTPS
- Backend: Next.js App Router API routes (`app/api/.../route.ts`)
- Auth: Supabase Auth (JWT-based, passed via cookies or Authorization header)

All endpoints are **per-user scoped** (using `auth.uid()` via Supabase).

---

## 1. Conventions

- Base URL (prod example): `https://xpander.trakkflow.com`
- All responses are JSON.
- Errors return:
  - appropriate HTTP status (4xx/5xx)
  - JSON `{ "error": "message" }`
- Auth:
  - Supabase client supplies session; API validates via Supabase server client.

---

## 2. Endpoint Summary

### 2.1 Project & Inputs

- `GET /api/projects`
- `POST /api/projects`
- `GET /api/projects/:id`
- `PATCH /api/projects/:id`
- `DELETE /api/projects/:id` (optional)
- `POST /api/projects/:id/inputs`
- `GET /api/projects/:id/inputs`

---

### 2.2 AI Operations

- `POST /api/ai/analyze-project`
- `POST /api/ai/breakdown-tasks`
- `POST /api/ai/sprint-planner`
- `POST /api/ai/advisor`
- `POST /api/ai/report`

---

### 2.3 Tasks & Sprints

- `GET /api/projects/:id/tasks`
- `PATCH /api/tasks/:taskId`
- `GET /api/projects/:id/sprints`
- `PATCH /api/sprints/:sprintId`

---

### 2.4 Dashboard & Reports

- `GET /api/dashboard`
- `GET /api/projects/:id/dashboard`
- `GET /api/projects/:id/reports`
- `GET /api/reports/:reportId`

---

### 2.5 Resources & Workload Planning

- `GET /api/projects/:id/resources` — Get resources with workload data
- `POST /api/projects/:id/resources` — Add a new resource
- `PUT /api/projects/:id/resources` — Update a resource
- `GET /api/projects/:id/resources/allocations` — Get task allocations
- `POST /api/projects/:id/resources/allocations` — Assign task to resource
- `DELETE /api/projects/:id/resources/allocations` — Remove task assignment

### 2.6 AI Operations (Extended)

- `POST /api/ai/optimize-workload` — AI workload optimization recommendations

---

## 3. Detailed Endpoint Specs

---

### 3.1 `GET /api/projects`

**Description:**  
List projects for the authenticated user.

**Response 200:**
```json
[
  {
    "id": "uuid",
    "name": "XPANDER MVP",
    "description": "AI-first project OS",
    "status": "active",
    "deadline": "2025-06-30",
    "created_at": "2025-06-01T10:00:00Z",
    "updated_at": "2025-06-02T10:00:00Z"
  }
]

3.2 POST /api/projects

Description:
Create a new project.

Request Body:

{
  "name": "XPANDER MVP",
  "description": "AI-first PM system",
  "deadline": "2025-06-30"
}


Response 201:

{
  "id": "uuid",
  "name": "XPANDER MVP",
  "description": "AI-first PM system",
  "status": "draft",
  "deadline": "2025-06-30",
  "created_at": "2025-06-01T10:00:00Z",
  "updated_at": "2025-06-01T10:00:00Z"
}

3.3 GET /api/projects/:id

Description:
Get project details.

Response 200:

{
  "id": "uuid",
  "name": "XPANDER MVP",
  "description": "AI-first PM system",
  "status": "active",
  "deadline": "2025-06-30",
  "created_at": "2025-06-01T10:00:00Z",
  "updated_at": "2025-06-02T12:00:00Z"
}

3.4 PATCH /api/projects/:id

Description:
Update project fields.

Request Body (partial allowed):

{
  "name": "XPANDER MVP - Phase 1",
  "status": "active",
  "deadline": "2025-07-15"
}


Response 200: updated project JSON.

3.5 POST /api/projects/:id/inputs

Description:
Add a requirement input (PRD, notes, UI description, etc.)

Request Body:

{
  "input_type": "prd_text",
  "content": "User can create, analyze, and plan projects using AI..."
}


input_type ∈ ["prd_text", "note", "ui_description", "json_example", "other"]

Response 201:

{
  "id": "uuid",
  "project_id": "uuid",
  "input_type": "prd_text",
  "content": "User can create...",
  "created_at": "2025-06-02T11:00:00Z"
}

3.6 GET /api/projects/:id/inputs

Description:
List all inputs for a project.

Response 200:

[
  {
    "id": "uuid1",
    "input_type": "prd_text",
    "content": "High-level PRD...",
    "created_at": "2025-06-01T10:00:00Z"
  },
  {
    "id": "uuid2",
    "input_type": "note",
    "content": "Extra notes for sprint 1",
    "created_at": "2025-06-02T09:00:00Z"
  }
]
4. AI Endpoints
4.1 POST /api/ai/analyze-project

Description:
Run AI analysis for a project. Uses project metadata + inputs.

Request Body:

{
  "projectId": "uuid"
}


Response 200 (simplified):

{
  "id": "analysis-uuid",
  "project_id": "uuid",
  "summary": "This project implements XPANDER, an AI-first project OS...",
  "technical_overview": "Frontend: Next.js, Backend: API Routes, DB: Supabase...",
  "risks": [
    {
      "title": "AI reliability",
      "description": "Inconsistent task breakdown if prompts not tuned.",
      "severity": "medium"
    }
  ],
  "dependencies": [
    {
      "from": "AI engine",
      "to": "Supabase DB",
      "note": "Context building requires good DB design."
    }
  ],
  "complexity_score": 7,
  "effort_estimate_hours": 120,
  "created_at": "2025-06-02T12:00:00Z"
}

4.2 POST /api/ai/breakdown-tasks

Description:
Generate a task list (task tree) based on project analysis & inputs.

Request Body:

{
  "projectId": "uuid",
  "regenerate": false
}


Response 200:

{
  "tasks": [
    {
      "id": "uuid-task-1",
      "project_id": "uuid",
      "parent_id": null,
      "title": "Set up Next.js project",
      "description": "Initialize Next.js 15 with Tailwind and shadcn.",
      "task_type": "frontend",
      "status": "todo",
      "priority": "normal",
      "estimate_hours": 4
    },
    {
      "id": "uuid-task-2",
      "project_id": "uuid",
      "parent_id": "uuid-task-1",
      "title": "Configure Supabase client",
      "description": "Set up Supabase client and env vars.",
      "task_type": "backend",
      "status": "todo",
      "priority": "high",
      "estimate_hours": 3
    }
  ]
}


Implementation detail:

The route:

Loads project context

Calls OpenAI with a task breakdown prompt

Persists tasks into tasks table

Returns the newly inserted tasks.

4.3 POST /api/ai/sprint-planner

Description:
Generate sprints and assign tasks to sprints.

Request Body:

{
  "projectId": "uuid",
  "sprintLengthDays": 14,
  "startDate": "2025-06-03",
  "capacityHoursPerWeek": 30
}


Response 200:

{
  "sprints": [
    {
      "id": "sprint-uuid-1",
      "project_id": "uuid",
      "name": "Sprint 1",
      "goal": "Foundation of XPANDER architecture",
      "start_date": "2025-06-03",
      "end_date": "2025-06-16",
      "status": "planned"
    },
    {
      "id": "sprint-uuid-2",
      "project_id": "uuid",
      "name": "Sprint 2",
      "goal": "AI flows & dashboards",
      "start_date": "2025-06-17",
      "end_date": "2025-06-30",
      "status": "planned"
    }
  ],
  "tasks": [
    {
      "id": "uuid-task-1",
      "sprint_id": "sprint-uuid-1"
    },
    {
      "id": "uuid-task-2",
      "sprint_id": "sprint-uuid-1"
    }
  ]
}

4.4 POST /api/ai/advisor

Description:
Ask AI advisor a question about the project, sprints, tasks, or timeline.

Request Body:

{
  "projectId": "uuid",
  "question": "Can I finish XPANDER MVP by July 1st if I only have 20 hours/week?"
}


Response 200:

{
  "answer": "Based on the current estimates (120 total hours) and your capacity of 20 hours/week, you will need approximately 6 weeks. This means July 1st is slightly aggressive. You can either reduce scope by removing 20–30 hours of work (e.g., advanced reporting and Gantt interactivity) or increase your weekly capacity.",
  "suggestions": [
    "Move advanced reporting features to a later phase.",
    "Reduce Gantt to a simple static timeline.",
    "Focus Sprint 1 on core flows only."
  ]
}


Optional: also persist into ai_insights.

4.5 POST /api/ai/report

Description:
Generate a report (project status, sprint review, resource, or custom).

Request Body:

{
  "projectId": "uuid",
  "type": "project_status",
  "options": {
    "includeRisks": true,
    "includeUpcomingWork": true
  }
}


Response 200:

{
  "id": "report-uuid",
  "project_id": "uuid",
  "type": "project_status",
  "generated_summary": "XPANDER MVP is on track with some risk on AI integration complexity.",
  "generated_body": "## Project Status\n\n**Summary:** XPANDER MVP is currently in Sprint 1...\n\n## Progress\n- 5/12 core tasks completed...\n",
  "created_at": "2025-06-03T11:00:00Z"
}
5. Tasks & Sprints Endpoints
5.1 GET /api/projects/:id/tasks

Description:
List tasks for a project (optionally filter by sprint, status, type).

Query Params (optional):

sprintId

status

type

Response 200:

[
  {
    "id": "uuid-task-1",
    "parent_id": null,
    "title": "Set up project structure",
    "task_type": "backend",
    "status": "in_progress",
    "priority": "high",
    "estimate_hours": 4,
    "actual_hours": 1.5,
    "sprint_id": "sprint-uuid-1",
    "due_date": "2025-06-06"
  }
]

5.2 PATCH /api/tasks/:taskId

Description:
Update task status, sprint, or basic fields.

Request Body (partial allowed):

{
  "status": "done",
  "actual_hours": 3.5,
  "sprint_id": "sprint-uuid-2"
}


Response 200: updated task JSON.

5.3 GET /api/projects/:id/sprints

Description:
List sprints for a project.

Response 200:

[
  {
    "id": "sprint-uuid-1",
    "name": "Sprint 1",
    "goal": "Set up core architecture",
    "start_date": "2025-06-03",
    "end_date": "2025-06-16",
    "status": "active"
  }
]

5.4 PATCH /api/sprints/:sprintId

Description:
Update sprint data (status, dates, goal).

Request Body:

{
  "status": "completed",
  "goal": "Core architecture completed, AI analysis working"
}


Response 200: updated sprint JSON.

6. Dashboards & Reports
6.1 GET /api/dashboard

Description:
Global dashboard data for all user projects.

Response 200:

{
  "projects": [
    {
      "id": "uuid",
      "name": "XPANDER MVP",
      "status": "active",
      "health": "at_risk",
      "deadline": "2025-06-30",
      "progress_percent": 42,
      "open_tasks": 18,
      "blocked_tasks": 3
    }
  ],
  "this_week": {
    "tasks_due": 7,
    "tasks_overdue": 2,
    "sprints_active": 1,
    "high_risk_projects": 1
  }
}

6.2 GET /api/projects/:id/dashboard

Description:
Project-specific dashboard.

Response 200:

{
  "project": {
    "id": "uuid",
    "name": "XPANDER MVP",
    "status": "active",
    "deadline": "2025-06-30"
  },
  "progress": {
    "tasks_total": 30,
    "tasks_done": 12,
    "tasks_blocked": 3,
    "progress_percent": 40
  },
  "current_sprint": {
    "id": "sprint-uuid-1",
    "name": "Sprint 1",
    "status": "active",
    "start_date": "2025-06-03",
    "end_date": "2025-06-16",
    "tasks_total": 15,
    "tasks_done": 6
  },
  "risks": [
    {
      "title": "AI integration complexity",
      "severity": "medium"
    }
  ]
}

6.3 GET /api/projects/:id/reports

Description:
List reports for a project.

Response 200:

[
  {
    "id": "report-uuid-1",
    "type": "project_status",
    "generated_summary": "XPANDER MVP is on track with some medium-level risks.",
    "created_at": "2025-06-03T11:00:00Z"
  }
]

6.4 GET /api/reports/:reportId

Description:
Get full contents of a report.

Response 200:

{
  "id": "report-uuid-1",
  "project_id": "uuid",
  "type": "project_status",
  "generated_summary": "XPANDER MVP is on track...",
  "generated_body": "## Project Status\n\n**Summary**: XPANDER MVP...",
  "created_at": "2025-06-03T11:00:00Z"
}

7. Resources
7.1 GET /api/resources

Description:
List resources (for MVP, likely just you).

Response 200:

[
  {
    "id": "resource-uuid-1",
    "name": "Khomsun",
    "role": "fullstack",
    "capacity_hours_per_week": 30,
    "active": true
  }
]

7.2 PATCH /api/resources/:id

Description:
Update capacity or basic resource info.

Request Body:

{
  "capacity_hours_per_week": 25
}


Response 200: updated resource JSON.

---

## 8. Resource Planning Endpoints

### 8.1 GET /api/projects/:id/resources

**Description:**
Get all resources with calculated workload data for a project.

**Response 200:**
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
    "overallocated_resources": 0,
    "underutilized_resources": 1,
    "workload_distribution": {
      "underloaded": 1,
      "optimal": 2,
      "heavy": 0,
      "overloaded": 0
    },
    "bottlenecks": []
  },
  "sprints": [...]
}
```

### 8.2 POST /api/projects/:id/resources

**Description:**
Create a new team resource.

**Request Body:**
```json
{
  "name": "Jane Doe",
  "role": "frontend",
  "weekly_capacity_hours": 40
}
```

**Response 201:**
```json
{
  "resource": {
    "id": "uuid",
    "name": "Jane Doe",
    "role": "frontend",
    "weekly_capacity_hours": 40,
    "created_at": "2025-06-01T10:00:00Z"
  }
}
```

### 8.3 POST /api/projects/:id/resources/allocations

**Description:**
Assign a task to a resource.

**Request Body:**
```json
{
  "task_id": "uuid",
  "resource_id": "uuid",
  "assigned_hours": 8
}
```

**Response 201:**
```json
{
  "assignment": {
    "id": "uuid",
    "task_id": "uuid",
    "resource_id": "uuid",
    "assigned_hours": 8,
    "created_at": "2025-06-01T10:00:00Z"
  }
}
```

### 8.4 POST /api/ai/optimize-workload

**Description:**
Get AI-powered workload optimization recommendations.

**Request Body:**
```json
{
  "projectId": "uuid"
}
```

**Response 200:**
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
        "reason": "Jane has 16 hours available capacity",
        "hours_to_reassign": 12
      }
    ],
    "sprint_adjustments": [],
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

## 9. Error Response Format

Example error:

{
  "error": "Project not found"
}


Typical codes:

400 — invalid input

401 — unauthorized

403 — forbidden (RLS)

404 — not found

500 — internal error
. Notes for Implementation in Next.js

Each endpoint maps to a route like:

// app/api/projects/route.ts
export async function GET(req: Request) { ... }
export async function POST(req: Request) { ... }

// app/api/projects/[id]/route.ts
export async function GET(req: Request, ctx: { params: { id: string } }) { ... }
export async function PATCH(...) { ... }


AI routes live under app/api/ai/* and share:

common OpenAI client

shared context-building utilities

shared error handling

This API spec is intentionally designed to be:

Easy for Codex to generate route code

Easy to evolve (add filters, pagination later)

Clean for consumption by both web and future mobile clients.