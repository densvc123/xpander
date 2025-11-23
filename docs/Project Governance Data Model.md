# Project Governance Data Model (Risks, Decisions, Milestones)

## Overview

This document defines the data model and implementation guide for project governance features including **Risks**, **Decisions**, and **Milestones**. These entities support the Project Overview UI for tracking project health, pending decisions, and delivery milestones.

### Current State
- Mock data is defined in `src/app/projects/[id]/page.tsx` (lines 126-140)
- UI components exist in the Overview tab ("Risks & Decisions" and "Milestones" cards)
- No dedicated API endpoints or database tables yet

### Target State
- Supabase tables for persistent storage
- REST API endpoints for CRUD operations
- Real-time data binding in UI components

---

## Data Model

### 1. ProjectRisk

Tracks project risks that need monitoring or mitigation.

```typescript
// src/types/governance.ts
export interface ProjectRisk {
  id: string                                          // UUID, primary key
  project_id: string                                  // FK to projects table
  title: string                                       // Short label (e.g., "Reporting API dependency")
  description?: string                                // Detailed context
  owner: string                                       // Person responsible for monitoring
  severity: 'low' | 'medium' | 'high' | 'critical'   // Risk severity level
  status: 'open' | 'mitigating' | 'watch' | 'closed' // Current status
  impact: string                                      // Impact statement (e.g., "+3d if delayed")
  mitigation_plan?: string                            // Optional mitigation actions
  due_date?: string                                   // ISO date for mitigation deadline
  created_at: string                                  // ISO timestamp
  updated_at: string                                  // ISO timestamp
}
```

**Status Flow:** `open` → `watch` → `mitigating` → `closed`

### 2. ProjectDecision

Tracks decisions that need to be made by project stakeholders.

```typescript
export interface ProjectDecision {
  id: string                                    // UUID, primary key
  project_id: string                            // FK to projects table
  title: string                                 // Decision to make (e.g., "Freeze dashboard scope")
  description?: string                          // Additional context
  owner: string                                 // Decision DRI (Directly Responsible Individual)
  due_date?: string                             // ISO date for target decision date
  status: 'pending' | 'approved' | 'rejected'  // Decision status
  rationale?: string                            // Reasoning once decided
  created_at: string                            // ISO timestamp
  updated_at: string                            // ISO timestamp
}
```

**Status Flow:** `pending` → `approved` | `rejected`

### 3. ProjectMilestone

Tracks key project milestones and their progress.

```typescript
export interface ProjectMilestone {
  id: string                                                    // UUID, primary key
  project_id: string                                            // FK to projects table
  name: string                                                  // Milestone name (e.g., "Sprint 2 Complete")
  description?: string                                          // Optional notes
  due_date: string                                              // ISO date for the milestone
  status: 'planned' | 'on_track' | 'at_risk' | 'delayed' | 'done'  // Health status
  progress: number                                              // 0-100 percentage
  owner?: string                                                // Optional milestone owner
  created_at: string                                            // ISO timestamp
  updated_at: string                                            // ISO timestamp
}
```

**Status Flow:** `planned` → `on_track` | `at_risk` | `delayed` → `done`

### 4. ProjectGovernanceSnapshot

Bundled API response for overview screens.

```typescript
export interface ProjectGovernanceSnapshot {
  risks: ProjectRisk[]
  decisions: ProjectDecision[]
  milestones: ProjectMilestone[]
}
```

---

## Database Schema (Supabase)

### SQL Migration

```sql
-- Create project_risks table
CREATE TABLE project_risks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  owner TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'mitigating', 'watch', 'closed')),
  impact TEXT NOT NULL,
  mitigation_plan TEXT,
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create project_decisions table
CREATE TABLE project_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  owner TEXT NOT NULL,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rationale TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create project_milestones table
CREATE TABLE project_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'on_track', 'at_risk', 'delayed', 'done')),
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  owner TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX idx_project_risks_project_id ON project_risks(project_id);
CREATE INDEX idx_project_decisions_project_id ON project_decisions(project_id);
CREATE INDEX idx_project_milestones_project_id ON project_milestones(project_id);

-- Enable Row Level Security
ALTER TABLE project_risks ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_milestones ENABLE ROW LEVEL SECURITY;

-- RLS Policies (adjust based on your auth setup)
CREATE POLICY "Users can view risks for their projects" ON project_risks
  FOR SELECT USING (true);

CREATE POLICY "Users can manage risks for their projects" ON project_risks
  FOR ALL USING (true);

CREATE POLICY "Users can view decisions for their projects" ON project_decisions
  FOR SELECT USING (true);

CREATE POLICY "Users can manage decisions for their projects" ON project_decisions
  FOR ALL USING (true);

CREATE POLICY "Users can view milestones for their projects" ON project_milestones
  FOR SELECT USING (true);

CREATE POLICY "Users can manage milestones for their projects" ON project_milestones
  FOR ALL USING (true);
```

---

## API Endpoints

### Risks API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects/[id]/risks` | List all risks for a project |
| POST | `/api/projects/[id]/risks` | Create a new risk |
| GET | `/api/projects/[id]/risks/[riskId]` | Get a specific risk |
| PATCH | `/api/projects/[id]/risks/[riskId]` | Update a risk |
| DELETE | `/api/projects/[id]/risks/[riskId]` | Delete a risk |

### Decisions API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects/[id]/decisions` | List all decisions for a project |
| POST | `/api/projects/[id]/decisions` | Create a new decision |
| GET | `/api/projects/[id]/decisions/[decisionId]` | Get a specific decision |
| PATCH | `/api/projects/[id]/decisions/[decisionId]` | Update a decision |
| DELETE | `/api/projects/[id]/decisions/[decisionId]` | Delete a decision |

### Milestones API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects/[id]/milestones` | List all milestones for a project |
| POST | `/api/projects/[id]/milestones` | Create a new milestone |
| GET | `/api/projects/[id]/milestones/[milestoneId]` | Get a specific milestone |
| PATCH | `/api/projects/[id]/milestones/[milestoneId]` | Update a milestone |
| DELETE | `/api/projects/[id]/milestones/[milestoneId]` | Delete a milestone |

### Governance Snapshot API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects/[id]/governance` | Get all risks, decisions, milestones in one call |

---

## Implementation Guide

### Step 1: Create Types File

Create `src/types/governance.ts` with the TypeScript interfaces defined above.

### Step 2: Run Database Migration

Execute the SQL migration in Supabase SQL Editor or via migration file.

### Step 3: Create API Route (Example: Risks)

```typescript
// src/app/api/projects/[id]/risks/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('project_risks')
    .select('*')
    .eq('project_id', params.id)
    .order('severity', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const body = await request.json()

  const { data, error } = await supabase
    .from('project_risks')
    .insert({
      project_id: params.id,
      ...body
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
```

### Step 4: Update Project Detail Page

Replace mock data with API calls:

```typescript
// src/app/projects/[id]/page.tsx

// Add state for governance data
const [risks, setRisks] = useState<ProjectRisk[]>([])
const [decisions, setDecisions] = useState<ProjectDecision[]>([])
const [milestones, setMilestones] = useState<ProjectMilestone[]>([])
const [isLoadingGovernance, setIsLoadingGovernance] = useState(true)

// Fetch governance data on mount
useEffect(() => {
  async function fetchGovernanceData() {
    setIsLoadingGovernance(true)
    try {
      const [risksRes, decisionsRes, milestonesRes] = await Promise.all([
        fetch(`/api/projects/${projectId}/risks`),
        fetch(`/api/projects/${projectId}/decisions`),
        fetch(`/api/projects/${projectId}/milestones`)
      ])

      if (risksRes.ok) setRisks(await risksRes.json())
      if (decisionsRes.ok) setDecisions(await decisionsRes.json())
      if (milestonesRes.ok) setMilestones(await milestonesRes.json())
    } catch (error) {
      console.error('Failed to fetch governance data:', error)
    } finally {
      setIsLoadingGovernance(false)
    }
  }

  fetchGovernanceData()
}, [projectId])
```

### Step 5: Create Management UI (Optional)

Add dialogs for creating/editing risks, decisions, and milestones:

```typescript
// Example: Add Risk Dialog
<Dialog open={addRiskDialog} onOpenChange={setAddRiskDialog}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Add Risk</DialogTitle>
    </DialogHeader>
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="risk-title">Title</Label>
        <Input id="risk-title" placeholder="Risk title..." />
      </div>
      <div className="space-y-2">
        <Label htmlFor="risk-severity">Severity</Label>
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {/* ... more fields */}
    </div>
    <DialogFooter>
      <Button onClick={handleAddRisk}>Add Risk</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

## UI Mapping Guide

### Badge Variants by Severity/Status

| Value | Badge Variant | Color |
|-------|---------------|-------|
| `critical` | `destructive` | Red |
| `high` | `warning` | Amber |
| `medium` | `secondary` | Gray |
| `low` | `outline` | Gray outline |
| `open` | `default` | Default |
| `at_risk` | `warning` | Amber |
| `delayed` | `destructive` | Red |
| `on_track` | `success` | Green |
| `done` | `success` | Green |

### Example Badge Usage

```tsx
<Badge variant={
  risk.severity === 'critical' ? 'destructive' :
  risk.severity === 'high' ? 'warning' :
  'secondary'
}>
  {risk.severity}
</Badge>
```

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/types/governance.ts` | Create | TypeScript interfaces |
| `supabase/migrations/xxx_governance.sql` | Create | Database migration |
| `src/app/api/projects/[id]/risks/route.ts` | Create | Risks API endpoint |
| `src/app/api/projects/[id]/decisions/route.ts` | Create | Decisions API endpoint |
| `src/app/api/projects/[id]/milestones/route.ts` | Create | Milestones API endpoint |
| `src/app/api/projects/[id]/governance/route.ts` | Create | Bundled snapshot API |
| `src/app/projects/[id]/page.tsx` | Modify | Replace mock data with API calls |

---

## Testing Checklist

- [ ] Database tables created successfully
- [ ] RLS policies configured correctly
- [ ] API endpoints return expected data
- [ ] UI displays risks, decisions, milestones from API
- [ ] CRUD operations work for all entities
- [ ] Badge variants display correct colors
- [ ] Loading states handled properly
- [ ] Error states handled gracefully
