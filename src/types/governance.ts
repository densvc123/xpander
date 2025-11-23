// Project Governance Types
// Risks, Decisions, and Milestones for project management

export interface ProjectRisk {
  id: string
  project_id: string
  title: string
  description?: string | null
  owner: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'open' | 'mitigating' | 'watch' | 'closed'
  impact: string
  mitigation_plan?: string | null
  due_date?: string | null
  created_at: string
  updated_at: string
}

export interface ProjectDecision {
  id: string
  project_id: string
  title: string
  description?: string | null
  owner: string
  due_date?: string | null
  status: 'pending' | 'approved' | 'rejected'
  rationale?: string | null
  created_at: string
  updated_at: string
}

export interface ProjectMilestone {
  id: string
  project_id: string
  name: string
  description?: string | null
  due_date: string
  status: 'planned' | 'on_track' | 'at_risk' | 'delayed' | 'done'
  progress: number
  owner?: string | null
  created_at: string
  updated_at: string
}

export interface ProjectGovernanceSnapshot {
  risks: ProjectRisk[]
  decisions: ProjectDecision[]
  milestones: ProjectMilestone[]
}

// Input types for creating/updating
export interface CreateProjectRiskInput {
  title: string
  description?: string
  owner: string
  severity: ProjectRisk['severity']
  status?: ProjectRisk['status']
  impact: string
  mitigation_plan?: string
  due_date?: string
}

export type UpdateProjectRiskInput = Partial<CreateProjectRiskInput>

export interface CreateProjectDecisionInput {
  title: string
  description?: string
  owner: string
  due_date?: string
  status?: ProjectDecision['status']
  rationale?: string
}

export type UpdateProjectDecisionInput = Partial<CreateProjectDecisionInput>

export interface CreateProjectMilestoneInput {
  name: string
  description?: string
  due_date: string
  status?: ProjectMilestone['status']
  progress?: number
  owner?: string
}

export type UpdateProjectMilestoneInput = Partial<CreateProjectMilestoneInput>
