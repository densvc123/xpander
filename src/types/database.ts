export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type ProjectStatus = 'planning' | 'in_progress' | 'completed' | 'on_hold'
export type ProjectHealth = 'healthy' | 'at_risk' | 'critical'
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'blocked'
export type TaskType = 'backend' | 'frontend' | 'api' | 'database' | 'qa' | 'design' | 'devops' | 'other'
export type SprintStatus = 'planned' | 'active' | 'completed'
export type InputType = 'prd_text' | 'note' | 'ui_description' | 'json_example' | 'other'
export type ReportType = 'project_status' | 'sprint_review' | 'resource_usage' | 'custom'
export type InsightType = 'risk' | 'suggestion' | 'warning' | 'info'

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          weekly_capacity_hours: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          weekly_capacity_hours?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          weekly_capacity_hours?: number
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          status: ProjectStatus
          health: ProjectHealth
          deadline: string | null
          start_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          status?: ProjectStatus
          health?: ProjectHealth
          deadline?: string | null
          start_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          description?: string | null
          status?: ProjectStatus
          health?: ProjectHealth
          deadline?: string | null
          start_date?: string | null
          updated_at?: string
        }
      }
      project_inputs: {
        Row: {
          id: string
          project_id: string
          input_type: InputType
          content: string
          version: number
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          input_type: InputType
          content: string
          version?: number
          created_at?: string
        }
        Update: {
          input_type?: InputType
          content?: string
          version?: number
        }
      }
      ai_project_analysis: {
        Row: {
          id: string
          project_id: string
          input_id: string | null
          summary: string
          technical_overview: string
          risks: Json
          dependencies: Json
          complexity_score: number
          effort_estimate_hours: number
          raw_response: Json
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          input_id?: string | null
          summary: string
          technical_overview: string
          risks?: Json
          dependencies?: Json
          complexity_score?: number
          effort_estimate_hours?: number
          raw_response?: Json
          created_at?: string
        }
        Update: {
          summary?: string
          technical_overview?: string
          risks?: Json
          dependencies?: Json
          complexity_score?: number
          effort_estimate_hours?: number
          raw_response?: Json
        }
      }
      tasks: {
        Row: {
          id: string
          project_id: string
          parent_id: string | null
          sprint_id: string | null
          title: string
          description: string | null
          task_type: TaskType
          status: TaskStatus
          priority: number
          estimated_hours: number
          actual_hours: number | null
          order_index: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          parent_id?: string | null
          sprint_id?: string | null
          title: string
          description?: string | null
          task_type?: TaskType
          status?: TaskStatus
          priority?: number
          estimated_hours?: number
          actual_hours?: number | null
          order_index?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          parent_id?: string | null
          sprint_id?: string | null
          title?: string
          description?: string | null
          task_type?: TaskType
          status?: TaskStatus
          priority?: number
          estimated_hours?: number
          actual_hours?: number | null
          order_index?: number
          updated_at?: string
        }
      }
      sprints: {
        Row: {
          id: string
          project_id: string
          name: string
          goal: string | null
          start_date: string
          end_date: string
          status: SprintStatus
          order_index: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          name: string
          goal?: string | null
          start_date: string
          end_date: string
          status?: SprintStatus
          order_index?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          goal?: string | null
          start_date?: string
          end_date?: string
          status?: SprintStatus
          order_index?: number
          updated_at?: string
        }
      }
      resources: {
        Row: {
          id: string
          user_id: string
          name: string
          role: string | null
          weekly_capacity_hours: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          role?: string | null
          weekly_capacity_hours?: number
          created_at?: string
        }
        Update: {
          name?: string
          role?: string | null
          weekly_capacity_hours?: number
        }
      }
      task_assignments: {
        Row: {
          id: string
          task_id: string
          resource_id: string
          assigned_hours: number | null
          created_at: string
        }
        Insert: {
          id?: string
          task_id: string
          resource_id: string
          assigned_hours?: number | null
          created_at?: string
        }
        Update: {
          assigned_hours?: number | null
        }
      }
      gantt_items: {
        Row: {
          id: string
          project_id: string
          sprint_id: string | null
          task_id: string | null
          name: string
          start_date: string
          end_date: string
          progress: number
          dependencies: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          sprint_id?: string | null
          task_id?: string | null
          name: string
          start_date: string
          end_date: string
          progress?: number
          dependencies?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          start_date?: string
          end_date?: string
          progress?: number
          dependencies?: string[] | null
          updated_at?: string
        }
      }
      ai_insights: {
        Row: {
          id: string
          project_id: string
          insight_type: InsightType
          title: string
          description: string
          is_resolved: boolean
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          insight_type: InsightType
          title: string
          description: string
          is_resolved?: boolean
          created_at?: string
        }
        Update: {
          insight_type?: InsightType
          title?: string
          description?: string
          is_resolved?: boolean
        }
      }
      reports: {
        Row: {
          id: string
          project_id: string
          report_type: ReportType
          title: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          report_type: ReportType
          title: string
          content: string
          created_at?: string
        }
        Update: {
          report_type?: ReportType
          title?: string
          content?: string
        }
      }
      advisor_messages: {
        Row: {
          id: string
          project_id: string
          role: 'user' | 'assistant'
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          role: 'user' | 'assistant'
          content: string
          created_at?: string
        }
        Update: {
          role?: 'user' | 'assistant'
          content?: string
        }
      }
    }
  }
}

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Convenience exports
export type User = Tables<'users'>
export type Project = Tables<'projects'>
export type ProjectInput = Tables<'project_inputs'>
export type AIProjectAnalysis = Tables<'ai_project_analysis'>
export type Task = Tables<'tasks'>
export type Sprint = Tables<'sprints'>
export type Resource = Tables<'resources'>
export type TaskAssignment = Tables<'task_assignments'>
export type GanttItem = Tables<'gantt_items'>
export type AIInsight = Tables<'ai_insights'>
export type Report = Tables<'reports'>
export type AdvisorMessage = Tables<'advisor_messages'>
