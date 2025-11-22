# XPANDER — Change Management System

This document defines the Requirements Change Management System for XPANDER, enabling AI-driven impact analysis, baseline comparison, and approval workflows for project requirement changes.

---

## 1. Overview

The Change Management System allows users to:

1. **Create Change Requests** — Submit proposed changes to project requirements
2. **AI Impact Analysis** — Get AI-generated effort estimates, risk assessment, and timeline impact
3. **Baseline Comparison** — Compare current project state against saved baselines
4. **Approval Workflow** — Approve or reject changes with automatic task creation
5. **Change History** — Track all change-related actions in an audit trail

---

## 2. User Flow

```
Change Request → AI Impact Analysis → Effort Estimation → Time Recalculation →
Compare with Baseline → Approve / Reject Change → Update Tasks & Sprints
```

### Step-by-step:

1. **User submits Change Request**
   - Title
   - Description
   - Type (New Feature / Modify / Remove / Bug / Urgent)
   - Target Area (UI / API / DB / Integration)
   - Priority
   - Desired timeline

2. **AI analyzes impact**
   AI generates:
   - Affected modules
   - Required new tasks
   - Tasks impacted
   - API changes
   - DB changes
   - Risk level
   - Estimated effort (in hours)
   - Estimated rework effort

3. **XPANDER recalculates timeline**
   - Adds new tasks
   - Adjusts sprint load
   - Calculates new completion date
   - Predicts which sprint becomes overloaded

4. **Baseline Plan Comparison**
   XPANDER shows:

   | Metric | Baseline | After Change | Delta |
   |--------|----------|--------------|-------|
   | Total Hours | 120h | 148h | +28h |
   | Delivery Date | Jun 28 | Jul 10 | +12 days |
   | Sprint Overrun | None | Sprint 2 overloaded | New Sprint |

5. **Approve / Reject Change**
   - If approved → update tasks, sprints, timeline
   - If rejected → mark as closed without action

---

## 3. Database Schema

### 3.1 `project_baselines`

Stores project state snapshots for comparison.

```sql
create table if not exists public.project_baselines (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null default 'Initial Baseline',
  total_hours numeric(10,2) default 0,
  task_count integer default 0,
  sprint_count integer default 0,
  planned_delivery_date date,
  risk_level text check (risk_level in ('low', 'medium', 'high', 'critical')),
  tasks_snapshot jsonb default '[]'::jsonb,
  sprints_snapshot jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);
```

**Fields:**
- `total_hours` — Sum of all task estimates at baseline time
- `task_count` — Number of tasks when baseline was created
- `sprint_count` — Number of sprints when baseline was created
- `planned_delivery_date` — Expected delivery date at baseline time
- `risk_level` — Overall project risk level
- `tasks_snapshot` — JSON array of all tasks (for detailed comparison)
- `sprints_snapshot` — JSON array of all sprints

---

### 3.2 `change_requests`

Tracks individual change requests.

```sql
create table if not exists public.change_requests (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  description text,
  change_type text not null check (change_type in
    ('new_feature', 'modification', 'removal', 'bug', 'urgent')) default 'modification',
  priority text not null check (priority in
    ('low', 'medium', 'high', 'critical')) default 'medium',
  area text check (area in
    ('frontend', 'backend', 'api', 'database', 'integration', 'other')) default 'other',
  status text not null check (status in
    ('open', 'analyzed', 'approved', 'rejected', 'implemented')) default 'open',
  desired_due_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

**Status Flow:**
```
open → analyzed → approved → implemented
                ↘ rejected
```

---

### 3.3 `change_request_analysis`

Stores AI-generated impact analysis.

```sql
create table if not exists public.change_request_analysis (
  id uuid primary key default gen_random_uuid(),
  change_request_id uuid not null references public.change_requests(id) on delete cascade,
  impact_summary text,
  affected_modules jsonb default '[]'::jsonb,
  new_tasks jsonb default '[]'::jsonb,
  updated_tasks jsonb default '[]'::jsonb,
  risks jsonb default '[]'::jsonb,
  effort_hours numeric(10,2) default 0,
  rework_hours numeric(10,2) default 0,
  impact_on_deadline_days integer default 0,
  baseline_comparison jsonb default '{}'::jsonb,
  model_used text default 'gpt-4o-mini',
  created_at timestamptz default now()
);
```

**JSONB Structures:**

`new_tasks`:
```json
[
  {
    "title": "Task title",
    "description": "What needs to be done",
    "task_type": "frontend|backend|api|database|integration|other",
    "estimate_hours": 8,
    "priority": "low|medium|high|critical"
  }
]
```

`updated_tasks`:
```json
[
  {
    "original_task": "Title of existing task",
    "impact": "How this task will be affected",
    "new_estimate_hours": 4
  }
]
```

`risks`:
```json
[
  {
    "title": "Risk title",
    "severity": "low|medium|high|critical"
  }
]
```

---

### 3.4 `change_history`

Audit trail for all change-related actions.

```sql
create table if not exists public.change_history (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  change_request_id uuid references public.change_requests(id) on delete set null,
  action text not null check (action in
    ('created', 'analyzed', 'approved', 'rejected', 'implemented', 'baseline_created')),
  description text,
  delta_hours numeric(10,2),
  delta_days integer,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);
```

---

## 4. API Endpoints

### 4.1 Change Requests

#### `GET /api/projects/:id/changes`

**Description:**
List all change requests for a project.

**Response 200:**
```json
{
  "changeRequests": [
    {
      "id": "uuid",
      "project_id": "uuid",
      "title": "Add export feature",
      "description": "User wants ability to export data as Excel",
      "change_type": "new_feature",
      "priority": "high",
      "area": "backend",
      "status": "analyzed",
      "created_at": "2025-06-01T10:00:00Z",
      "change_request_analysis": [
        {
          "id": "uuid",
          "impact_summary": "Adding export affects API layer + UI",
          "effort_hours": 12,
          "rework_hours": 4,
          "impact_on_deadline_days": 3
        }
      ]
    }
  ]
}
```

---

#### `POST /api/projects/:id/changes`

**Description:**
Create a new change request.

**Request Body:**
```json
{
  "title": "Add export feature",
  "description": "User wants ability to export job data as Excel",
  "change_type": "new_feature",
  "priority": "high",
  "area": "backend",
  "desired_due_date": "2025-07-01"
}
```

**Response 201:**
```json
{
  "changeRequest": {
    "id": "uuid",
    "project_id": "uuid",
    "title": "Add export feature",
    "status": "open",
    "created_at": "2025-06-01T10:00:00Z"
  }
}
```

---

#### `GET /api/projects/:id/changes/:changeId`

**Description:**
Get a single change request with its analysis.

**Response 200:**
```json
{
  "changeRequest": {
    "id": "uuid",
    "title": "Add export feature",
    "status": "analyzed",
    "change_request_analysis": [
      {
        "impact_summary": "Adding export affects API layer + UI",
        "affected_modules": ["API", "Frontend"],
        "new_tasks": [...],
        "updated_tasks": [...],
        "risks": [...],
        "effort_hours": 12,
        "rework_hours": 4,
        "impact_on_deadline_days": 3
      }
    ]
  }
}
```

---

#### `PATCH /api/projects/:id/changes/:changeId`

**Description:**
Update a change request.

**Request Body (partial allowed):**
```json
{
  "title": "Updated title",
  "priority": "critical",
  "status": "implemented"
}
```

---

#### `DELETE /api/projects/:id/changes/:changeId`

**Description:**
Delete a change request.

**Response 200:**
```json
{
  "success": true
}
```

---

### 4.2 AI Impact Analysis

#### `POST /api/ai/analyze-change`

**Description:**
Run AI impact analysis for a change request.

**Request Body:**
```json
{
  "changeRequestId": "uuid",
  "projectId": "uuid"
}
```

**Response 200:**
```json
{
  "analysis": {
    "id": "uuid",
    "impact_summary": "Adding export feature requires new API endpoint and frontend button. Medium complexity with potential data formatting challenges.",
    "affected_modules": ["API", "Frontend", "Database (optional)"],
    "new_tasks": [
      {
        "title": "Create /export API endpoint",
        "description": "Build REST endpoint for data export",
        "task_type": "backend",
        "estimate_hours": 4,
        "priority": "high"
      },
      {
        "title": "Build export button component",
        "description": "Add export button to data table",
        "task_type": "frontend",
        "estimate_hours": 2,
        "priority": "medium"
      }
    ],
    "updated_tasks": [
      {
        "original_task": "GET /jobs endpoint",
        "impact": "Needs to support additional filter parameters",
        "new_estimate_hours": 2
      }
    ],
    "risks": [
      {
        "title": "Large dataset performance",
        "severity": "medium"
      }
    ],
    "effort_hours": 12,
    "rework_hours": 4,
    "impact_on_deadline_days": 3
  },
  "baselineComparison": {
    "baseline_total_hours": 120,
    "new_total_hours": 136,
    "delta_hours": 16,
    "baseline_delivery_date": "2025-06-28",
    "new_delivery_date": "2025-07-01",
    "delta_days": 3
  }
}
```

---

### 4.3 Approve/Reject

#### `POST /api/projects/:id/changes/:changeId/approve`

**Description:**
Approve a change request. Automatically creates tasks from the analysis.

**Response 200:**
```json
{
  "success": true,
  "message": "Change request approved",
  "tasksCreated": 4
}
```

**Side Effects:**
- Updates change request status to `approved`
- Creates new tasks from `analysis.new_tasks`
- Adds entry to `change_history`

---

#### `POST /api/projects/:id/changes/:changeId/reject`

**Description:**
Reject a change request.

**Request Body (optional):**
```json
{
  "reason": "Out of scope for current sprint"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Change request rejected"
}
```

---

### 4.4 Baselines

#### `GET /api/projects/:id/baseline`

**Description:**
List all baselines for a project.

**Response 200:**
```json
{
  "baselines": [
    {
      "id": "uuid",
      "name": "Baseline 1",
      "total_hours": 120,
      "task_count": 25,
      "sprint_count": 3,
      "planned_delivery_date": "2025-06-28",
      "risk_level": "medium",
      "created_at": "2025-06-01T10:00:00Z"
    }
  ]
}
```

---

#### `POST /api/projects/:id/baseline`

**Description:**
Create a new baseline snapshot.

**Request Body (optional):**
```json
{
  "name": "Sprint 2 Start Baseline"
}
```

**Response 201:**
```json
{
  "baseline": {
    "id": "uuid",
    "name": "Sprint 2 Start Baseline",
    "total_hours": 120,
    "task_count": 25,
    "sprint_count": 3,
    "planned_delivery_date": "2025-06-28",
    "created_at": "2025-06-01T10:00:00Z"
  }
}
```

---

### 4.5 Baseline Comparison

#### `GET /api/projects/:id/baseline-comparison`

**Description:**
Compare current project state with the latest baseline.

**Response 200:**
```json
{
  "comparison": {
    "has_baseline": true,
    "baseline": {
      "id": "uuid",
      "name": "Baseline 1",
      "total_hours": 120,
      "task_count": 25,
      "sprint_count": 3,
      "planned_delivery_date": "2025-06-28"
    },
    "current": {
      "total_hours": 136,
      "task_count": 29,
      "sprint_count": 3,
      "planned_delivery_date": "2025-07-01"
    },
    "delta": {
      "hours": 16,
      "tasks": 4,
      "sprints": 0,
      "days": 3
    },
    "sprint_overload": ["Sprint 2"]
  }
}
```

---

### 4.6 Change History

#### `GET /api/projects/:id/change-history`

**Description:**
Get the change history audit trail.

**Response 200:**
```json
{
  "history": [
    {
      "id": "uuid",
      "action": "approved",
      "description": "Change request \"Add export feature\" approved",
      "delta_hours": 16,
      "delta_days": 3,
      "created_at": "2025-06-02T14:00:00Z",
      "change_requests": {
        "id": "uuid",
        "title": "Add export feature",
        "change_type": "new_feature",
        "priority": "high"
      }
    },
    {
      "id": "uuid",
      "action": "analyzed",
      "description": "Change request \"Add export feature\" analyzed",
      "delta_hours": 16,
      "delta_days": 3,
      "created_at": "2025-06-02T13:30:00Z"
    },
    {
      "id": "uuid",
      "action": "baseline_created",
      "description": "Baseline \"Baseline 1\" created",
      "created_at": "2025-06-01T10:00:00Z"
    }
  ]
}
```

---

## 5. AI Prompt Specification

### Change Impact Analysis Prompt

```
You are XPANDER Change Impact AI - an expert at analyzing requirement changes
and generating technical impact assessments, effort estimates, and timeline impacts.

Your job is to analyze a change request against the current project baseline
and tasks, then provide a comprehensive impact analysis.

Your response must be a valid JSON object with this exact structure:
{
  "impact_summary": "2-3 sentence summary of the change's overall impact",
  "affected_modules": ["module1", "module2"],
  "new_tasks": [
    {
      "title": "Task title",
      "description": "What needs to be done",
      "task_type": "frontend|backend|api|database|integration|other",
      "estimate_hours": number,
      "priority": "low|medium|high|critical"
    }
  ],
  "updated_tasks": [
    {
      "original_task": "Title of existing task that will be impacted",
      "impact": "How this task will be affected",
      "new_estimate_hours": number
    }
  ],
  "risks": [
    {
      "title": "Risk title",
      "severity": "low|medium|high|critical"
    }
  ],
  "effort_hours": total_new_effort_hours,
  "rework_hours": total_rework_hours_for_existing_tasks,
  "impact_on_deadline_days": estimated_days_delay
}

Guidelines:
- Be realistic about effort estimates - don't underestimate complexity
- Consider ripple effects on dependent tasks
- Identify architectural impacts (API changes, DB schema changes, etc.)
- Account for QA and testing time
- Flag integration risks and dependencies
- Consider team velocity when estimating timeline impact
```

---

## 6. UI Components

### 6.1 Changes Tab

Location: Project Detail Page → "Changes" tab

**Components:**
1. **Baseline Comparison Card** — Shows current vs baseline metrics
2. **Change Request List** — Filterable list of all change requests
3. **Change Request Detail** — Full detail with analysis
4. **Change History Timeline** — Chronological audit trail

---

### 6.2 Baseline Comparison Card

```
┌─────────────────────────────────────────────────────────────────┐
│ Baseline Comparison                      [Create Baseline]      │
├─────────────────────────────────────────────────────────────────┤
│ Total Hours    │ Task Count    │ Timeline Impact │ Sprint Status│
│     136        │     29        │     +3 days     │ Sprint 2     │
│   +16h ↑       │   +4          │   [Delayed]     │ overloaded   │
│ Baseline: 120h │               │                 │              │
└─────────────────────────────────────────────────────────────────┘
```

---

### 6.3 Change Request List

```
┌─────────────────────────────────────────────────────────────────┐
│ CHANGE REQUESTS                         [+ New Change Request]  │
├─────────────────────────────────────────────────────────────────┤
│ Title              │ Type      │ Status    │ Priority           │
├────────────────────┼───────────┼───────────┼────────────────────┤
│ Add export feature │ Feature   │ Analyzed  │ High               │
│ Update UI form     │ Modify    │ Open      │ Medium             │
│ Remove field X     │ Removal   │ Approved  │ Low                │
└─────────────────────────────────────────────────────────────────┘
```

---

### 6.4 Change Request Detail (After Analysis)

```
┌─────────────────────────────────────────────────────────────────┐
│ Add Export Feature                                              │
├─────────────────────────────────────────────────────────────────┤
│ Description:                                                    │
│   User wants ability to export job data as Excel.               │
│                                                                 │
│ [new feature] [high] [backend]                                  │
├─────────────────────────────────────────────────────────────────┤
│ ✨ AI Impact Analysis                                           │
│                                                                 │
│ Adding export affects API layer + UI.                           │
│                                                                 │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐                         │
│ │   12h    │ │    4h    │ │  +3 days │                         │
│ │New Effort│ │ Rework   │ │  Delay   │                         │
│ └──────────┘ └──────────┘ └──────────┘                         │
│                                                                 │
│ New Tasks (4):                                                  │
│ + Create /export API                                            │
│ + Build export button                                           │
│ + Write Excel generator                                         │
│ + more...                                                       │
│                                                                 │
│ Risks (1):                                                      │
│ ⚠ Large dataset performance                                     │
├─────────────────────────────────────────────────────────────────┤
│           [✓ Approve]              [✗ Reject]                   │
└─────────────────────────────────────────────────────────────────┘
```

---

### 6.5 Change History

```
┌─────────────────────────────────────────────────────────────────┐
│ 📜 Change History                                               │
├─────────────────────────────────────────────────────────────────┤
│ ● Approved  │ "Add export feature" approved    │ +16h  +3d     │
│   Jun 2     │                                                   │
├─────────────┼───────────────────────────────────────────────────┤
│ ● Analyzed  │ "Add export feature" analyzed    │ +16h  +3d     │
│   Jun 2     │                                                   │
├─────────────┼───────────────────────────────────────────────────┤
│ ● Created   │ "Add export feature" created     │               │
│   Jun 1     │                                                   │
├─────────────┼───────────────────────────────────────────────────┤
│ ● Baseline  │ Baseline "Initial" created       │               │
│   May 28    │                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. TypeScript Types

```typescript
// Change Management Types
export type ChangeType = 'new_feature' | 'modification' | 'removal' | 'bug' | 'urgent'
export type ChangePriority = 'low' | 'medium' | 'high' | 'critical'
export type ChangeArea = 'frontend' | 'backend' | 'api' | 'database' | 'integration' | 'other'
export type ChangeStatus = 'open' | 'analyzed' | 'approved' | 'rejected' | 'implemented'
export type ChangeHistoryAction = 'created' | 'analyzed' | 'approved' | 'rejected' | 'implemented' | 'baseline_created'
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'

// Interfaces
export interface ChangeRequest {
  id: string
  project_id: string
  title: string
  description: string | null
  change_type: ChangeType
  priority: ChangePriority
  area: ChangeArea | null
  status: ChangeStatus
  desired_due_date: string | null
  created_at: string
  updated_at: string
}

export interface ChangeRequestAnalysis {
  id: string
  change_request_id: string
  impact_summary: string | null
  affected_modules: string[]
  new_tasks: ChangeImpactNewTask[]
  updated_tasks: ChangeImpactUpdatedTask[]
  risks: ChangeImpactRisk[]
  effort_hours: number
  rework_hours: number
  impact_on_deadline_days: number
  baseline_comparison: BaselineComparison
  model_used: string
  created_at: string
}

export interface ChangeImpactNewTask {
  title: string
  description: string
  task_type: string
  estimate_hours: number
  priority: string
}

export interface ChangeImpactUpdatedTask {
  original_task: string
  impact: string
  new_estimate_hours: number
}

export interface ChangeImpactRisk {
  title: string
  severity: string
}

export interface BaselineComparison {
  baseline_total_hours: number
  new_total_hours: number
  delta_hours: number
  baseline_delivery_date: string | null
  new_delivery_date: string | null
  delta_days: number
  baseline_sprint_count: number
  new_sprint_count: number
  sprint_overload: string[]
}
```

---

## 8. Row-Level Security (RLS)

All change management tables have RLS enabled with policies that verify project ownership:

```sql
-- Change requests - verify via project ownership
create policy "Users can view own change requests"
on change_requests for select
using (exists (
  select 1 from projects
  where projects.id = change_requests.project_id
  and projects.user_id = auth.uid()
));

-- Similar policies for insert, update, delete
-- And for change_request_analysis, change_history, project_baselines
```

---

## 9. Implementation Checklist

- [x] Database schema with 4 new tables
- [x] TypeScript types for all entities
- [x] AI prompt for impact analysis
- [x] API route: `POST/GET /api/projects/:id/changes`
- [x] API route: `GET/PATCH/DELETE /api/projects/:id/changes/:changeId`
- [x] API route: `POST /api/ai/analyze-change`
- [x] API route: `POST/GET /api/projects/:id/baseline`
- [x] API route: `GET /api/projects/:id/baseline-comparison`
- [x] API route: `POST /api/projects/:id/changes/:id/approve`
- [x] API route: `POST /api/projects/:id/changes/:id/reject`
- [x] API route: `GET /api/projects/:id/change-history`
- [x] UI: Changes tab in project detail
- [x] UI: Baseline comparison card
- [x] UI: Change request list
- [x] UI: Change request detail with analysis
- [x] UI: Approve/reject workflow
- [x] UI: Change history timeline
- [x] UI: Create change request dialog
- [x] RLS policies for all tables

---

## 10. Future Enhancements

- **Notifications** — Alert stakeholders when changes are submitted/approved
- **Change request templates** — Pre-defined templates for common change types
- **Batch approval** — Approve multiple related changes at once
- **Change request comments** — Discussion thread on each change
- **Version comparison** — Compare different baselines side-by-side
- **Rollback** — Undo approved changes by reverting to baseline
- **Change request metrics** — Dashboard showing change request statistics
- **Integration with Gantt** — Visual timeline showing change impacts
