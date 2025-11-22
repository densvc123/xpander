# XPANDER — Database Schema

This document defines the core database schema for XPANDER MVP.

- Target DB: **Postgres (Supabase)**
- Style: simple, explicit, index-friendly
- Scope: single-user (per auth user), but upgradable to multi-user/team later

---

## 1. Entity List

Core tables:

1. `users` (profile info, extends Supabase auth)
2. `projects`
3. `project_inputs`
4. `ai_project_analysis`
5. `sprints`
6. `tasks`
7. `resources`
8. `task_assignments`
9. `gantt_items`
10. `ai_insights`
11. `reports`

---

## 2. Schema Overview (ER-style)

- One `user` has many `projects`
- One `project` has many:
  - `project_inputs`
  - `ai_project_analysis`
  - `tasks`
  - `sprints`
  - `gantt_items`
  - `ai_insights`
  - `reports`
- `tasks` can be hierarchical (parent_id → tasks.id)
- `sprints` belong to a project
- `tasks` may belong to a sprint
- `resources` represent people (initially: only the owner)
- `task_assignments` = many-to-many between tasks and resources

---

## 3. SQL — Core Tables

> You can run this on Supabase (SQL Editor) or adapt into migrations.  
> Types are standard Postgres; enums can be real enums or text with constraints.

### 3.1 `users`

> Supabase already has `auth.users`. This table is an optional profile extension.

```sql
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);
3.2 projects
create type project_status as enum ('draft', 'active', 'completed', 'archived');

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  description text,
  status project_status not null default 'draft',
  deadline date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_projects_user_id on public.projects(user_id);
create index if not exists idx_projects_status on public.projects(status);


3.3 project_inputs
Stores raw requirement inputs: PRDs, notes, structured snippets.
create type project_input_type as enum ('prd_text', 'note', 'ui_description', 'json_example', 'other');

create table if not exists public.project_inputs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  input_type project_input_type not null default 'prd_text',
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_project_inputs_project_id on public.project_inputs(project_id);
create index if not exists idx_project_inputs_type on public.project_inputs(input_type);


3.4 ai_project_analysis
Stores results from the AI Project Analysis step.
create table if not exists public.ai_project_analysis (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  summary text,                           -- human-readable summary
  technical_overview text,               -- tech view (APIs, DB, flows)
  risks jsonb,                           -- [{title, description, severity}, ...]
  dependencies jsonb,                    -- [{from, to, note}, ...]
  complexity_score int,                  -- e.g. 1–10
  effort_estimate_hours numeric(10,2),   -- total rough estimate
  model_used text,                       -- e.g., 'gpt-4o-mini'
  created_at timestamptz not null default now()
);

create index if not exists idx_ai_analysis_project_id on public.ai_project_analysis(project_id);
create index if not exists idx_ai_analysis_created_at on public.ai_project_analysis(created_at);


3.5 sprints
create type sprint_status as enum ('planned', 'active', 'completed');

create table if not exists public.sprints (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,                       -- e.g. "Sprint 1"
  goal text,
  start_date date,
  end_date date,
  status sprint_status not null default 'planned',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_sprints_project_id on public.sprints(project_id);
create index if not exists idx_sprints_status on public.sprints(status);
create index if not exists idx_sprints_dates on public.sprints(start_date, end_date);


3.6 tasks
Tasks are core execution units of XPANDER.
create type task_type as enum ('backend', 'frontend', 'api', 'db', 'qa', 'design', 'other');
create type task_status as enum ('todo', 'in_progress', 'blocked', 'done');
create type task_priority as enum ('low', 'normal', 'high', 'critical');

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  sprint_id uuid references public.sprints(id) on delete set null,
  parent_id uuid references public.tasks(id) on delete set null, -- task tree
  title text not null,
  description text,
  task_type task_type not null default 'other',
  status task_status not null default 'todo',
  priority task_priority not null default 'normal',
  estimate_hours numeric(10,2),
  actual_hours numeric(10,2),
  due_date date,
  order_index int,                             -- optional ordering within sprint
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_tasks_project_id on public.tasks(project_id);
create index if not exists idx_tasks_sprint_id on public.tasks(sprint_id);
create index if not exists idx_tasks_parent_id on public.tasks(parent_id);
create index if not exists idx_tasks_status on public.tasks(status);
create index if not exists idx_tasks_type on public.tasks(task_type);


3.7 resources
Represents people with capacity. For MVP: only you, but schema supports more later.
create type resource_role as enum ('pm', 'backend', 'frontend', 'fullstack', 'qa', 'design', 'other');

create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade, -- owner
  name text not null,                        -- display name (you or team member)
  role resource_role not null default 'other',
  capacity_hours_per_week numeric(10,2) not null default 40,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_resources_user_id on public.resources(user_id);
create index if not exists idx_resources_active on public.resources(active);


3.8 task_assignments
Many-to-many mapping between tasks and resources.
create table if not exists public.task_assignments (
  task_id uuid not null references public.tasks(id) on delete cascade,
  resource_id uuid not null references public.resources(id) on delete cascade,
  primary key (task_id, resource_id)
);

create index if not exists idx_task_assignments_task_id on public.task_assignments(task_id);
create index if not exists idx_task_assignments_resource_id on public.task_assignments(resource_id);


3.9 gantt_items
Optional explicit storage for timeline view.
You can also derive dates from sprints + tasks, but this table provides flexibility.
create table if not exists public.gantt_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  task_id uuid references public.tasks(id) on delete cascade,
  sprint_id uuid references public.sprints(id) on delete set null,
  start_date date not null,
  end_date date not null,
  dependency_task_id uuid references public.tasks(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_gantt_project_id on public.gantt_items(project_id);
create index if not exists idx_gantt_task_id on public.gantt_items(task_id);
create index if not exists idx_gantt_dates on public.gantt_items(start_date, end_date);


3.10 ai_insights
Stores AI-generated insights, warnings, or recommendations.
create type insight_scope as enum ('project', 'sprint', 'resource', 'task', 'global');
create type insight_severity as enum ('info', 'warning', 'critical');

create table if not exists public.ai_insights (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  scope insight_scope not null default 'project',
  source text,                    -- e.g. 'analysis', 'advisor', 'report'
  title text not null,
  content text not null,
  severity insight_severity not null default 'info',
  created_at timestamptz not null default now()
);

create index if not exists idx_ai_insights_project_id on public.ai_insights(project_id);
create index if not exists idx_ai_insights_scope on public.ai_insights(scope);
create index if not exists idx_ai_insights_severity on public.ai_insights(severity);


3.11 reports
Stores AI-generated reports.
create type report_type as enum ('project_status', 'sprint_review', 'resource', 'custom');

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  type report_type not null,
  filters jsonb,                    -- e.g. { "sprintId": "...", "range": "last_2_weeks" }
  generated_summary text,           -- short executive summary
  generated_body text,              -- full markdown body
  created_at timestamptz not null default now()
);

create index if not exists idx_reports_project_id on public.reports(project_id);
create index if not exists idx_reports_type on public.reports(type);
create index if not exists idx_reports_created_at on public.reports(created_at);


4. Row-Level Security (RLS) Concepts
In Supabase, you’ll typically enable RLS on all tables and apply:
-- Example for projects
alter table public.projects enable row level security;

create policy "User can see own projects"
on public.projects
for select using (user_id = auth.uid());

create policy "User can insert own projects"
on public.projects
for insert with check (user_id = auth.uid());

create policy "User can update own projects"
on public.projects
for update using (user_id = auth.uid());

create policy "User can delete own projects"
on public.projects
for delete using (user_id = auth.uid());

You'd repeat similarly for other tables, typically joining via project_id → projects.user_id.

5. Notes & Extensions


For MVP (single user):


user_id will always be your ID.


You can hardcode or infer it from auth.




For multi-user:


Convert to team/org-based schema (add orgs, memberships).




If you want to simplify early:


You can skip gantt_items and derive from sprints/tasks.


You can skip ai_insights and just generate on the fly.





6. Recommended Index Summary
To keep XPANDER fast:


projects.user_id


project_inputs.project_id


ai_project_analysis.project_id


sprints.project_id


tasks.project_id, tasks.sprint_id, tasks.status


gantt_items.project_id


ai_insights.project_id, ai_insights.severity


reports.project_id, reports.type


This is enough for smooth dashboard queries and AI context-building.

---

---

## 7. Resource Planning Extensions

The following types support the Resource Planning feature:

### 7.1 Resource Planning Types

```typescript
// Role types for team members
type ResourceRole = 'pm' | 'backend' | 'frontend' | 'fullstack' | 'qa' | 'design' | 'devops' | 'other'

// Status of resource allocation
type AllocationStatus = 'available' | 'allocated' | 'overallocated' | 'on_leave'

// Workload categorization
type WorkloadLevel = 'underloaded' | 'optimal' | 'heavy' | 'overloaded'
```

### 7.2 Resource Availability Table (Optional)

For tracking resource availability exceptions:

```sql
create table if not exists public.resource_availability (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references public.resources(id) on delete cascade,
  date date not null,
  available_hours numeric(10,2) not null default 0,
  reason text,
  created_at timestamptz not null default now()
);

create index if not exists idx_resource_availability_resource_id on public.resource_availability(resource_id);
create index if not exists idx_resource_availability_date on public.resource_availability(date);
```

---

✅ **Document complete.**
