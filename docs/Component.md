4.1 Frontend (Next.js 15)

Fully server-side capable (App Router)

React components (shadcn + Tailwind)

Renders:

Dashboard

Project pages

Tasks

Sprints

Gantt

Reports

AI Advisor

Authentication handled via Supabase Auth client

4.2 Backend (Next.js API Routes)

Backend logic exists inside:

/app/api/*


API Route categories:

AI Endpoints

/api/ai/analyze-project

/api/ai/breakdown-tasks

/api/ai/sprint-planner

/api/ai/advisor

/api/ai/report

Data CRUD

/api/projects

/api/tasks

/api/sprints

/api/resources

All API routes:

Run server-side

Use Supabase Service Role when needed

Call OpenAI with predefined prompts

Return JSON

4.3 Database (Supabase Postgres)

Purpose:

Store projects

Requirements (inputs)

Analysis results

Tasks + tree hierarchy

Sprints

Gantt timeline items

AI insights

Reports

Resources & workload

Security:

Protected by Supabase RLS

user_id = auth.uid() requirements enforced

Performance:

Indexes on all project_id columns

Light usage for single-user MVP

4.4 Storage (Supabase Storage)

Used for:

Uploaded PRD files

UI screenshots

Exported reports (if needed)

Generated diagrams (optional)

4.5 Authentication

Supabase Auth (email/password)

Supabase Auth Helpers on frontend

Full session management handled automatically

4.6 AI Engine

Two key models:

4o-mini (default, cheap, fast)

GPT-5.1 (optional for deep analysis)

AI orchestration involves:

Fetching context from database

Transforming context → JSON

Selecting correct prompt template

Sending request to OpenAI

Validating output

Persisting result into database

Prompt templates stored under:

/lib/ai/prompts/*


AI client wrapper stored at:

/lib/ai/client.ts


Context builders stored at:

/lib/ai/context/*