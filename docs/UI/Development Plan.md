# XPANDER — 14-Day Development Plan (MVP Build)

This document defines a focused, high-speed 14-day sprint to build the entire XPANDER MVP from end-to-end.

The plan assumes:
- Solo developer (you)
- Next.js + Supabase expertise
- ~2–4 hours per day
- AI-first workflow (Codex assists coding)

Each day focuses on *one deliverable* so momentum stays strong.

---

# 🗓️ Day-by-Day Breakdown

## **Day 1 — Project Bootstrap & Repo Setup**
**Goals**
- Create the XPANDER project foundation.

**Tasks**
- Create GitHub repo `xpander`
- Init **Next.js 15 (App Router + TypeScript)**
- Add Tailwind CSS + shadcn
- Set up `.env.local`
- Install Supabase client
- Install OpenAI client
- Add layout: sidebar + top bar
- Deploy initial empty project to Vercel

**Deliverables**
- xpander.trakkflow.com shows the skeleton UI

---

## **Day 2 — Supabase Setup & DB Migration**
**Goals**
- Database ready for data insertion.

**Tasks**
- Create Supabase project
- Add all schema tables (from DB Schema doc)
- Enable RLS on every table
- Add policies for `auth.uid() = user_id`
- Insert default resource (you)
- Connect Next.js to Supabase

**Deliverables**
- All tables created, RLS enforced, Supabase ready

---

## **Day 3 — Project CRUD**
**Goals**
- User creates and views projects.

**Tasks**
- `/api/projects` routes
- `/projects` list page
- “New Project” modal
- “Project Detail” page shell (tabs only)
- Save & fetch projects via API

**Deliverables**
- You can create/read/update project entries

---

## **Day 4 — Requirements Input Page**
**Goals**
- Store requirements text for each project.

**Tasks**
- Input form with textarea
- Save to `project_inputs`
- Display previous inputs as list
- `/api/projects/:id/inputs` route

**Deliverables**
- Requirements screen fully functional

---

## **Day 5 — AI Analysis Endpoint**
**Goals**
- First core AI feature working.

**Tasks**
- Add `lib/ai/client.ts`
- Add prompt template for analysis
- Implement `/api/ai/analyze-project`
- Parse output, store in `ai_project_analysis`
- Render analysis in UI with panels:
  - Summary
  - Technical overview
  - Risks
  - Dependencies
  - Complexity score
  - Effort estimate

**Deliverables**
- Click “Analyze Project” → structured analysis appears

---

## **Day 6 — Task Breakdown (AI)**
**Goals**
- Convert analysis → tasks.

**Tasks**
- Implement `/api/ai/breakdown-tasks`
- Add task breakdown prompt template
- Insert tasks into DB
- Create Tasks page:
  - Table or card list
  - Group by type
  - Parent/child indenting

**Deliverables**
- Click “Generate Tasks” → tasks display immediately

---

## **Day 7 — Sprint Planner (AI)**
**Goals**
- Automatically generate sprints.

**Tasks**
- Implement `/api/ai/sprint-planner`
- Sprint planner prompt
- Insert generated sprints into DB
- Update tasks with sprint assignments
- Visual sprint list in UI

**Deliverables**
- Sprints appear with proper date ranges

---

## **Day 8 — Basic Gantt Timeline**
**Goals**
- Show sprint timeline visually.

**Tasks**
- Simple Gantt using divs (no library)
- Map sprints to horizontal bars
- Display tasks under sprint if needed
- Add Gantt tab & routing

**Deliverables**
- Mini Gantt chart visible and accurate

---

## **Day 9 — AI Advisor**
**Goals**
- Chat UI with project-aware insights.

**Tasks**
- Implement `/api/ai/advisor`
- Advisor prompt template
- Chat UI:
  - Message list
  - User bubble (right)
  - AI bubble (left)
- Quick question shortcuts

**Deliverables**
- You can ask “Can I finish by June 30?” and get an answer

---

## **Day 10 — Dashboards (Global + Project)**
**Goals**
- Real-time overview of progress and health.

**Tasks**
- `/api/dashboard`
- `/api/projects/:id/dashboard`
- Global dashboard cards
- Project dashboard cards
- Progress %, risk indicators, metrics

**Deliverables**
- Dashboard reflects live DB state

---

## **Day 11 — Report Generator (AI)**
**Goals**
- AI-generated Project Status Reports.

**Tasks**
- Implement `/api/ai/report`
- Report prompt template
- Save report to DB
- Render report list
- Markdown viewer for report body

**Deliverables**
- “Generate Report” works end-to-end

---

## **Day 12 — UI Polish & Error Handling**
**Goals**
- Smooth, reliable UX.

**Tasks**
- Skeleton loaders
- API error toast
- Retry logic for AI parsing
- Better table styling
- Layout consistency
- Mobile-friendly

**Deliverables**
- XPANDER feels stable and professional

---

## **Day 13 — Deployment + Domain Setup**
**Goals**
- Production ready.

**Tasks**
- Deploy to Vercel Production
- Add domain: `xpander.trakkflow.com`
- Add DNS record in Z.com (CNAME)
- Test:
  - Auth
  - AI endpoints
  - Dashboard
  - Reports

**Deliverables**
- XPANDER is live on your subdomain

---

## **Day 14 — Self-Usage + Backlog v2**
**Goals**
- XPANDER used for a real project.

**Tasks**
- Use XPANDER to plan its own next version
- Generate self-status report
- Identify UI issues
- Create XPANDER v1 backlog inside XPANDER itself

**Deliverables**
- XPANDER MVP validated
- v1 roadmap created

---

# 🏁 Sprint Completion Criteria

XPANDER MVP is complete when:

- AI analysis works  
- Tasks are auto-generated  
- Sprints are auto-planned  
- Gantt shows timeline  
- Dashboard shows progress + risks  
- AI Advisor answers context-aware questions  
- Reports generate correctly  
- UI is stable  
- System deployed under your domain  

