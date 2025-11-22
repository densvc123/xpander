# XPANDER — System Diagrams (Mermaid)

This document contains the main system diagrams for XPANDER in Mermaid format:

1. High-Level System Diagram  
2. Logical Modules Diagram  
3. Data Flow Diagrams  
4. Page-to-API Mapping Diagram  
5. AI Orchestration Diagram  

You can copy-paste these into any Mermaid-supported Markdown environment (including many IDEs, docs tools, and GitHub-compatible viewers).

---

## 1. High-Level System Diagram

```mermaid
flowchart LR
  subgraph Client
    UI[Next.js Web App<br/>(XPANDER UI)]
    Mobile[React Native App<br/>(Future)]
  end

  subgraph Backend[Serverless Backend]
    API[Next.js API Routes]
    DB[(Supabase Postgres)]
    Auth[Supabase Auth]
    Storage[Supabase Storage]
    Edge[Supabase Edge Functions<br/>(optional)]
  end

  subgraph AI[AI Layer]
    OpenAI[(OpenAI Models<br/>4o-mini / 5.1)]
  end

  UI -->|HTTPS| API
  Mobile -->|HTTPS| API

  API -->|SQL| DB
  API --> Auth
  API --> Storage

  API -->|Prompt/Response| OpenAI

  Edge --> DB


2. Logical Modules Diagram
flowchart TB
  P[Projects] --> IN[Inputs<br/>(Requirements, PRDs)]
  IN --> ANA[AI Project Analysis]
  ANA --> T[Tasks & Task Tree]
  T --> S[Sprints]
  S --> G[Gantt Timeline]

  T --> RSC[Resources & Capacity]
  S --> RSC

  T --> DSH[Dashboards]
  S --> DSH
  ANA --> DSH
  RSC --> DSH

  DSH --> REP[Reports]
  ANA --> REP
  S --> REP
  T --> REP

  ANA --> ADV[AI Advisor]
  T --> ADV
  S --> ADV
  G --> ADV
  RSC --> ADV

3. Data Flow Diagrams
3.1 Project Creation & Requirements Input
sequenceDiagram
  participant U as User
  participant UI as XPANDER UI
  participant API as Next.js API
  participant DB as Supabase DB

  U ->> UI: Open "New Project"
  U ->> UI: Enter name, description, deadline
  UI ->> API: POST /api/projects
  API ->> DB: INSERT into projects
  DB -->> API: Project row
  API -->> UI: Project created (id)

  U ->> UI: Open Project → Requirements tab
  U ->> UI: Paste PRD / notes
  UI ->> API: POST /api/projects/:id/inputs
  API ->> DB: INSERT into project_inputs
  DB -->> API: Input row
  API -->> UI: Requirements saved

3.2 AI Project Analysis
sequenceDiagram
  participant U as User
  participant UI as XPANDER UI
  participant API as /api/ai/analyze-project
  participant DB as Supabase DB
  participant AI as OpenAI

  U ->> UI: Click "Run Project Analysis"
  UI ->> API: POST /api/ai/analyze-project { projectId }
  API ->> DB: SELECT project, project_inputs
  DB -->> API: Project + Inputs

  API ->> AI: Send analysis prompt (project context)
  AI -->> API: JSON { summary, risks, deps, complexity, effort }

  API ->> DB: INSERT into ai_project_analysis
  API -->> UI: Analysis result JSON
  UI ->> U: Render summary, risks, overview

3.3 Task Breakdown
sequenceDiagram
  participant U as User
  participant UI as XPANDER UI
  participant API as /api/ai/breakdown-tasks
  participant DB as Supabase DB
  participant AI as OpenAI

  U ->> UI: Click "Generate Task Breakdown"
  UI ->> API: POST /api/ai/breakdown-tasks { projectId }
  API ->> DB: SELECT project, inputs, latest analysis
  DB -->> API: Context rows

  API ->> AI: Prompt for tasks JSON
  AI -->> API: List of tasks (title, type, estimate, parent)
  API ->> DB: INSERT into tasks (bulk)
  API -->> UI: Tasks array
  UI ->> U: Show tasks grouped by type / hierarchy

3.4 Sprint Planning & Gantt
sequenceDiagram
  participant U as User
  participant UI as XPANDER UI
  participant API as /api/ai/sprint-planner
  participant DB as Supabase DB
  participant AI as OpenAI

  U ->> UI: Click "Plan Sprints"
  UI ->> API: POST /api/ai/sprint-planner { projectId }
  API ->> DB: SELECT tasks, project.deadline, resource capacity
  DB -->> API: Tasks + constraints

  API ->> AI: Prompt for sprint plan
  AI -->> API: Sprints + task->sprint mapping
  API ->> DB: INSERT into sprints
  API ->> DB: UPDATE tasks.sprint_id
  API -->> UI: Sprint summary + timeline data
  UI ->> U: Render sprint list + mini Gantt

3.5 Advisor Q&A
sequenceDiagram
  participant U as User
  participant UI as XPANDER UI
  participant API as /api/ai/advisor
  participant DB as Supabase DB
  participant AI as OpenAI

  U ->> UI: Ask "Can I finish before DATE?"
  UI ->> API: POST /api/ai/advisor { projectId, question }
  API ->> DB: SELECT project, analysis, tasks, sprints, metrics
  DB -->> API: Context

  API ->> AI: Prompt + user question + context
  AI -->> API: Advice (text + suggestions)
  API ->> DB: INSERT into ai_insights (optional)
  API -->> UI: Advisor response
  UI ->> U: Show advisor message

4. Page-to-API Mapping Diagram
flowchart LR
  DSH[Dashboard Page] -->|GET /api/dashboard| API1[Dashboard API]

  PROJ_LIST[Projects Page] -->|GET /api/projects| API2[Projects API]
  PROJ_DETAIL[Project Page] -->|GET /api/projects/:id| API3[Project Detail API]

  REQ[Requirements Tab] -->|POST /api/projects/:id/inputs| API4[Project Inputs API]

  ANALYSIS[AI Analysis Tab] -->|POST /api/ai/analyze-project| API5[Analyze Project API]

  TASKS[Tasks Tab] -->|GET /api/projects/:id/tasks| API6[Tasks API]
  TASKS -->|POST /api/ai/breakdown-tasks| API7[Task Breakdown API]

  SPRINTS[Sprints Tab] -->|GET /api/projects/:id/sprints| API8[Sprints API]
  SPRINTS -->|POST /api/ai/sprint-planner| API9[Sprint Planner API]

  AI_TAB[Advisor Tab] -->|POST /api/ai/advisor| API10[Advisor API]

  REPORTS[Reports Tab] -->|GET /api/projects/:id/reports| API11[Reports API]
  REPORTS -->|POST /api/ai/report| API12[Report Generator API]

5. AI Orchestration Diagram
flowchart TB
  subgraph ContextBuilder
    C1[Load Project] --> C2[Load Inputs]
    C2 --> C3[Load Latest Analysis]
    C3 --> C4[Load Tasks & Sprints]
    C4 --> C5[Build JSON Context]
  end

  subgraph Prompts
    P1[Project Analysis Prompt]
    P2[Task Breakdown Prompt]
    P3[Sprint Planner Prompt]
    P4[Advisor Prompt]
    P5[Report Prompt]
  end

  subgraph ClientCode[API Route /lib]
    A1[/api/ai/analyze-project]
    A2[/api/ai/breakdown-tasks]
    A3[/api/ai/sprint-planner]
    A4[/api/ai/advisor]
    A5[/api/ai/report]
  end

  subgraph AI[OpenAI Models]
    M1[(4o-mini)]
    M2[(5.1 - optional)]
  end

  C5 --> A1
  C5 --> A2
  C5 --> A3
  C5 --> A4
  C5 --> A5

  A1 --> P1
  A2 --> P2
  A3 --> P3
  A4 --> P4
  A5 --> P5

  P1 --> M1
  P2 --> M1
  P3 --> M1
  P4 --> M1
  P5 --> M1

  M1 --> A1
  M1 --> A2
  M1 --> A3
  M1 --> A4
  M1 --> A5

6. Diagram Usage Notes

You can keep each diagram in its own .md file or combine them.

They can be used as system docs, or as context in Codex when asking it to generate:

APIs

Services

TS types

React components

Supabase logic

When you want Codex to “think like XPANDER”, paste the relevant diagram(s) plus the architecture document before giving it a coding task.


---

✅ **Document 5 complete.**  
Reply **Next** and I’ll send:

