-- XPANDER Database Schema
-- Run this SQL in your Supabase SQL Editor to create all tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  weekly_capacity_hours INTEGER DEFAULT 40,
  timezone TEXT,
  default_sprint_length_days INTEGER DEFAULT 14 CHECK (default_sprint_length_days >= 1 AND default_sprint_length_days <= 28),
  default_work_hours_per_day INTEGER DEFAULT 8 CHECK (default_work_hours_per_day >= 1 AND default_work_hours_per_day <= 24),
  ai_use_wizard_suggestions BOOLEAN DEFAULT TRUE,
  ai_show_rebalance_hints BOOLEAN DEFAULT TRUE,
  ai_report_tone TEXT DEFAULT 'internal' CHECK (ai_report_tone IN ('internal', 'client')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'in_progress', 'completed', 'on_hold')),
  health TEXT NOT NULL DEFAULT 'healthy' CHECK (health IN ('healthy', 'at_risk', 'critical')),
  deadline DATE,
  start_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project inputs (requirements, PRDs, notes)
CREATE TABLE IF NOT EXISTS project_inputs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  input_type TEXT NOT NULL DEFAULT 'prd_text' CHECK (input_type IN ('prd_text', 'note', 'ui_description', 'json_example', 'other')),
  content TEXT NOT NULL,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Project Analysis results
CREATE TABLE IF NOT EXISTS ai_project_analysis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  input_id UUID REFERENCES project_inputs(id) ON DELETE SET NULL,
  summary TEXT NOT NULL,
  technical_overview TEXT NOT NULL,
  risks JSONB DEFAULT '[]'::jsonb,
  dependencies JSONB DEFAULT '[]'::jsonb,
  complexity_score INTEGER DEFAULT 5 CHECK (complexity_score >= 1 AND complexity_score <= 10),
  effort_estimate_hours INTEGER DEFAULT 0,
  raw_response JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sprints table
CREATE TABLE IF NOT EXISTS sprints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  goal TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'completed')),
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  sprint_id UUID REFERENCES sprints(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  task_type TEXT NOT NULL DEFAULT 'other' CHECK (task_type IN ('backend', 'frontend', 'api', 'database', 'qa', 'design', 'devops', 'other')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'blocked')),
  priority INTEGER DEFAULT 2 CHECK (priority >= 1 AND priority <= 5),
  estimated_hours DECIMAL(6,2) DEFAULT 0,
  actual_hours DECIMAL(6,2),
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Resources (team members - MVP: just the user)
CREATE TABLE IF NOT EXISTS resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT,
  weekly_capacity_hours INTEGER DEFAULT 40,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Task assignments
CREATE TABLE IF NOT EXISTS task_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  assigned_hours DECIMAL(6,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(task_id, resource_id)
);

-- Gantt items for timeline visualization
CREATE TABLE IF NOT EXISTS gantt_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  sprint_id UUID REFERENCES sprints(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  dependencies UUID[] DEFAULT ARRAY[]::UUID[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Insights
CREATE TABLE IF NOT EXISTS ai_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL CHECK (insight_type IN ('risk', 'suggestion', 'warning', 'info')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  is_resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reports
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL CHECK (report_type IN ('project_status', 'sprint_review', 'resource_usage', 'custom')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Advisor messages (chat history)
CREATE TABLE IF NOT EXISTS advisor_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_project_inputs_project_id ON project_inputs(project_id);
CREATE INDEX IF NOT EXISTS idx_ai_project_analysis_project_id ON ai_project_analysis(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_sprint_id ON tasks(sprint_id);
CREATE INDEX IF NOT EXISTS idx_tasks_parent_id ON tasks(parent_id);
CREATE INDEX IF NOT EXISTS idx_sprints_project_id ON sprints(project_id);
CREATE INDEX IF NOT EXISTS idx_gantt_items_project_id ON gantt_items(project_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_project_id ON ai_insights(project_id);
CREATE INDEX IF NOT EXISTS idx_reports_project_id ON reports(project_id);
CREATE INDEX IF NOT EXISTS idx_advisor_messages_project_id ON advisor_messages(project_id);

-- Row Level Security (RLS) Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_inputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_project_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE sprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE gantt_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE advisor_messages ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- Projects policies
CREATE POLICY "Users can view own projects" ON projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create projects" ON projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own projects" ON projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own projects" ON projects FOR DELETE USING (auth.uid() = user_id);

-- Project inputs policies
CREATE POLICY "Users can view own project inputs" ON project_inputs FOR SELECT
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = project_inputs.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can create project inputs" ON project_inputs FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM projects WHERE projects.id = project_inputs.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can update own project inputs" ON project_inputs FOR UPDATE
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = project_inputs.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can delete own project inputs" ON project_inputs FOR DELETE
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = project_inputs.project_id AND projects.user_id = auth.uid()));

-- AI Project Analysis policies
CREATE POLICY "Users can view own analyses" ON ai_project_analysis FOR SELECT
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = ai_project_analysis.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can create analyses" ON ai_project_analysis FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM projects WHERE projects.id = ai_project_analysis.project_id AND projects.user_id = auth.uid()));

-- Tasks policies
CREATE POLICY "Users can view own tasks" ON tasks FOR SELECT
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = tasks.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can create tasks" ON tasks FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM projects WHERE projects.id = tasks.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can update own tasks" ON tasks FOR UPDATE
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = tasks.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can delete own tasks" ON tasks FOR DELETE
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = tasks.project_id AND projects.user_id = auth.uid()));

-- Sprints policies
CREATE POLICY "Users can view own sprints" ON sprints FOR SELECT
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = sprints.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can create sprints" ON sprints FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM projects WHERE projects.id = sprints.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can update own sprints" ON sprints FOR UPDATE
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = sprints.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can delete own sprints" ON sprints FOR DELETE
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = sprints.project_id AND projects.user_id = auth.uid()));

-- Resources policies
CREATE POLICY "Users can view own resources" ON resources FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create resources" ON resources FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own resources" ON resources FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own resources" ON resources FOR DELETE USING (auth.uid() = user_id);

-- Task assignments policies
CREATE POLICY "Users can view own task assignments" ON task_assignments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM tasks
    JOIN projects ON projects.id = tasks.project_id
    WHERE tasks.id = task_assignments.task_id AND projects.user_id = auth.uid()
  ));
CREATE POLICY "Users can create task assignments" ON task_assignments FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM tasks
    JOIN projects ON projects.id = tasks.project_id
    WHERE tasks.id = task_assignments.task_id AND projects.user_id = auth.uid()
  ));

-- Gantt items policies
CREATE POLICY "Users can view own gantt items" ON gantt_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = gantt_items.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can create gantt items" ON gantt_items FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM projects WHERE projects.id = gantt_items.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can update own gantt items" ON gantt_items FOR UPDATE
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = gantt_items.project_id AND projects.user_id = auth.uid()));

-- AI Insights policies
CREATE POLICY "Users can view own insights" ON ai_insights FOR SELECT
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = ai_insights.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can create insights" ON ai_insights FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM projects WHERE projects.id = ai_insights.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can update own insights" ON ai_insights FOR UPDATE
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = ai_insights.project_id AND projects.user_id = auth.uid()));

-- Reports policies
CREATE POLICY "Users can view own reports" ON reports FOR SELECT
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = reports.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can create reports" ON reports FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM projects WHERE projects.id = reports.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can delete own reports" ON reports FOR DELETE
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = reports.project_id AND projects.user_id = auth.uid()));

-- Advisor messages policies
CREATE POLICY "Users can view own advisor messages" ON advisor_messages FOR SELECT
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = advisor_messages.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can create advisor messages" ON advisor_messages FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM projects WHERE projects.id = advisor_messages.project_id AND projects.user_id = auth.uid()));

-- Functions
-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sprints_updated_at BEFORE UPDATE ON sprints FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_gantt_items_updated_at BEFORE UPDATE ON gantt_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Trigger to create user profile
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- CHANGE MANAGEMENT SYSTEM TABLES
-- ============================================

-- Project baselines (snapshots of project state)
CREATE TABLE IF NOT EXISTS project_baselines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Initial Baseline',
  total_hours DECIMAL(10,2) DEFAULT 0,
  task_count INTEGER DEFAULT 0,
  sprint_count INTEGER DEFAULT 0,
  planned_delivery_date DATE,
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  tasks_snapshot JSONB DEFAULT '[]'::jsonb,
  sprints_snapshot JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Change requests table
CREATE TABLE IF NOT EXISTS change_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  change_type TEXT NOT NULL CHECK (change_type IN ('new_feature', 'modification', 'removal', 'bug', 'urgent')) DEFAULT 'modification',
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
  area TEXT CHECK (area IN ('frontend', 'backend', 'api', 'database', 'integration', 'other')) DEFAULT 'other',
  status TEXT NOT NULL CHECK (status IN ('open', 'analyzed', 'approved', 'rejected', 'implemented')) DEFAULT 'open',
  desired_due_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Change request analysis (AI-generated impact analysis)
CREATE TABLE IF NOT EXISTS change_request_analysis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  change_request_id UUID NOT NULL REFERENCES change_requests(id) ON DELETE CASCADE,
  impact_summary TEXT,
  affected_modules JSONB DEFAULT '[]'::jsonb,
  new_tasks JSONB DEFAULT '[]'::jsonb,
  updated_tasks JSONB DEFAULT '[]'::jsonb,
  risks JSONB DEFAULT '[]'::jsonb,
  effort_hours DECIMAL(10,2) DEFAULT 0,
  rework_hours DECIMAL(10,2) DEFAULT 0,
  impact_on_deadline_days INTEGER DEFAULT 0,
  baseline_comparison JSONB DEFAULT '{}'::jsonb,
  model_used TEXT DEFAULT 'gpt-4o-mini',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Change history (audit trail)
CREATE TABLE IF NOT EXISTS change_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  change_request_id UUID REFERENCES change_requests(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN ('created', 'analyzed', 'approved', 'rejected', 'implemented', 'baseline_created')),
  description TEXT,
  delta_hours DECIMAL(10,2),
  delta_days INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for change management tables
CREATE INDEX IF NOT EXISTS idx_project_baselines_project_id ON project_baselines(project_id);
CREATE INDEX IF NOT EXISTS idx_change_requests_project_id ON change_requests(project_id);
CREATE INDEX IF NOT EXISTS idx_change_requests_status ON change_requests(status);
CREATE INDEX IF NOT EXISTS idx_change_request_analysis_change_request_id ON change_request_analysis(change_request_id);
CREATE INDEX IF NOT EXISTS idx_change_history_project_id ON change_history(project_id);
CREATE INDEX IF NOT EXISTS idx_change_history_change_request_id ON change_history(change_request_id);

-- Enable RLS for change management tables
ALTER TABLE project_baselines ENABLE ROW LEVEL SECURITY;
ALTER TABLE change_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE change_request_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE change_history ENABLE ROW LEVEL SECURITY;

-- Project baselines policies
CREATE POLICY "Users can view own project baselines" ON project_baselines FOR SELECT
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = project_baselines.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can create project baselines" ON project_baselines FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM projects WHERE projects.id = project_baselines.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can delete own project baselines" ON project_baselines FOR DELETE
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = project_baselines.project_id AND projects.user_id = auth.uid()));

-- Change requests policies
CREATE POLICY "Users can view own change requests" ON change_requests FOR SELECT
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = change_requests.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can create change requests" ON change_requests FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM projects WHERE projects.id = change_requests.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can update own change requests" ON change_requests FOR UPDATE
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = change_requests.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can delete own change requests" ON change_requests FOR DELETE
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = change_requests.project_id AND projects.user_id = auth.uid()));

-- Change request analysis policies
CREATE POLICY "Users can view own change request analyses" ON change_request_analysis FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM change_requests
    JOIN projects ON projects.id = change_requests.project_id
    WHERE change_requests.id = change_request_analysis.change_request_id AND projects.user_id = auth.uid()
  ));
CREATE POLICY "Users can create change request analyses" ON change_request_analysis FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM change_requests
    JOIN projects ON projects.id = change_requests.project_id
    WHERE change_requests.id = change_request_analysis.change_request_id AND projects.user_id = auth.uid()
  ));

-- Change history policies
CREATE POLICY "Users can view own change history" ON change_history FOR SELECT
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = change_history.project_id AND projects.user_id = auth.uid()));
CREATE POLICY "Users can create change history" ON change_history FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM projects WHERE projects.id = change_history.project_id AND projects.user_id = auth.uid()));

-- Triggers for updated_at on change_requests
CREATE TRIGGER update_change_requests_updated_at BEFORE UPDATE ON change_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
