# XPANDER — AI-First Project Operating System

XPANDER is an **AI-native project management and delivery assistant** designed for Product Managers, Tech Leads, System Analysts, and Solo Developers.

It automates project planning end-to-end:
- Read requirements  
- Analyze project scope  
- Generate tasks  
- Plan sprints  
- Build Gantt timeline  
- Provide AI advice  
- Generate reports  

XPANDER helps one person perform the work of an entire PM + Tech Lead + Analyst team.

---

## 🚀 Features (MVP)

### ✔ AI Project Analysis  
Paste your PRD or requirements — XPANDER generates:
- Summary  
- Technical overview  
- Risk list  
- Dependencies  
- Complexity score  
- Effort estimate  

---

### ✔ AI Task Breakdown  
Automatically creates:
- Hierarchical task list  
- Task types (FE/BE/API/DB/QA)  
- Priority  
- Estimates  

---

### ✔ AI Sprint Planner  
XPANDER assigns tasks into sprints based on:
- Capacity  
- Dependencies  
- Deadline  
- Sprint length  
- Scope  

---

### ✔ Gantt Timeline  
Minimal, clean timeline:
- Sprints mapped on a horizontal bar  
- Visual clarity  
- Zero external libraries  

---

### ✔ AI Advisor (Chat)  
Ask questions like:
- “Can I finish by June 30?”  
- “What are the risks?”  
- “Which features should I cut?”  

XPANDER answers using **project context**.

---

### ✔ Dashboards  
- Global project dashboard  
- Project-specific progress  
- Sprint health  
- Risk highlights  
- Workload summary  

---

### ✔ AI Reports  
Auto-generate:
- Project status report  
- Sprint review  
- Resource report  
- Custom prompt reports  

---

## 🧱 Architecture

XPANDER uses a **serverless**, low-cost architecture:

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15 (App Router) |
| Backend | Next.js API Routes |
| Database | Supabase Postgres |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| AI Engine | OpenAI 4o-mini (primary) |
| Deployment | Vercel |
| Domain | xpander.trakkflow.com |

No traditional backend server 🎉.

---

## 🗂 Project Structure

/
├─ app/
│ ├─ api/
│ │ ├─ projects/
│ │ ├─ ai/
│ │ ├─ tasks/
│ │ └─ sprints/
│ ├─ dashboard/
│ ├─ projects/
│ └─ reports/
├─ lib/
│ ├─ ai/
│ │ ├─ prompts/
│ │ ├─ context/
│ │ └─ client.ts
│ └─ db/
├─ components/
├─ hooks/
├─ types/
├─ .env.local
└─ README.md


---

## 🛠 Getting Started

### 1. Install dependencies
```bash
npm install

2. Set environment variables

Create .env.local:

NEXT_PUBLIC_SUPABASE_URL=xxxx
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxx
SUPABASE_SERVICE_ROLE=xxxx

OPENAI_API_KEY=xxxx

3. Run Dev Server
npm run dev


Go to http://localhost:3000.

🧪 Testing the AI Endpoints
Analyze a project
POST /api/ai/analyze-project
{
  "projectId": "<id>"
}

Generate tasks
POST /api/ai/breakdown-tasks
{
  "projectId": "<id>"
}

Plan sprints
POST /api/ai/sprint-planner
{
  "projectId": "<id>"
}

Ask AI advisor
POST /api/ai/advisor
{
  "projectId": "<id>",
  "question": "Can I finish before July 1?"
}

Generate report
POST /api/ai/report
{
  "projectId": "<id>",
  "type": "project_status"
}


Documentation Index

XPANDER full documentation is split across multiple markdown files:

01-project-overview.md

02-vision-goals.md

03-mvp-scope.md

04-architecture.md

05-system-diagrams.md

06-database-schema.md

07-api-spec.md

08-ai-prompt-specs.md

09-ui-ux-spec.md

10-dev-plan.md

README.md

folder-structure.md (optional)