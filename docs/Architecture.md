# XPANDER — Architecture Document

This document defines the complete software architecture for XPANDER, an AI-first project operating system designed to automate planning, execution, and reporting for software projects.

---

# 1. System Overview

XPANDER is designed as a **serverless, AI-driven, lightweight project OS** with:

- **Next.js 15** as both frontend and backend (API Routes)
- **Supabase** as database, auth, and storage
- **OpenAI models** for analysis, planning, and advisor features
- **Vercel** for deployment

There is **no traditional backend (Node/Nest server)**.  
All logic runs in:
- Next.js API Routes (serverless)
- Supabase SQL + policies
- Supabase Edge Functions (optional)

---

# 2. Architecture Goals

- Minimal ops / low maintenance  
- Extremely low cost (< $2/month)
- Fast development iteration  
- Zero backend server to maintain  
- High modularity  
- AI orchestration centralized and reusable  
- Codex-compatible architecture  

---

# 3. High-Level Architecture Diagram (Markdown / Mermaid)

```mermaid
flowchart LR
  subgraph Client
    UI[Next.js Frontend]
    Mobile[React Native (future)]
  end

  subgraph Serverless Backend
    API[Next.js API Routes]
    DB[(Supabase Postgres)]
    Auth[Supabase Auth]
    Storage[Supabase Storage]
    Edge[Supabase Edge Functions]
  end

  subgraph AI
    OpenAI[(OpenAI Models)]
  end

  UI -->|https| API
  Mobile -->|https| API
  API -->|SQL| DB
  API --> Auth
  API --> Storage
  API -->|prompt| OpenAI
  Edge --> DB

5. Logical Architecture
graph TD

A[Requirements Input] --> B[AI Project Analysis]
B --> C[AI Task Breakdown]
C --> D[AI Sprint Planner]
D --> E[Gantt Timeline]
B --> F[AI Advisor Context]
C --> F
D --> F

E --> G[Dashboard Metrics]
C --> G
D --> G

G --> H[Reports Generator]
F --> H

H --> I[User Views]

6. Data Flow Architecture
6.1 AI Project Analysis Flow
sequenceDiagram
User ->> UI: Click "Analyze Project"
UI ->> API: POST /api/ai/analyze-project
API ->> DB: Fetch project + inputs
API ->> OpenAI: Send analysis prompt
OpenAI ->> API: JSON summary/risks/deps
API ->> DB: Store ai_project_analysis
API ->> UI: Return structured result
UI ->> User: Display analysis

6.2 Task Breakdown Flow
sequenceDiagram
User ->> UI: Click "Generate Tasks"
UI ->> API: POST /api/ai/breakdown-tasks
API ->> DB: Load analysis + inputs
API ->> OpenAI: Generate tasks JSON
OpenAI ->> API: Task list
API ->> DB: Insert tasks
API ->> UI: Return tasks array

6.3 Sprint Planner Flow
sequenceDiagram
User ->> UI: Click "Plan Sprints"
UI ->> API: POST /api/ai/sprint-planner
API ->> DB: Fetch tasks & deadline
API ->> OpenAI: Generate sprint plan JSON
OpenAI ->> API: Sprint plan
API ->> DB: Insert sprints + assign tasks
UI ->> User: Display sprint timeline

7. Deployment Architecture

Hosted on Vercel

No servers to maintain

Automatic CI/CD from GitHub

Environment variables:

SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE
OPENAI_API_KEY


Domains:

Production: xpander.trakkflow.com

Preview: Vercel preview URLs

8. Scaling Plan

MVP:

Single-user workload → fully free tier

Very low DB operations

AI cost < $3/month

Zero latency concerns

Future (multi-user):

Move heavy logs to Supabase Edge functions

Add Redis (optional)

Add background worker queue (optional)

Upgrade Supabase to Pro

9. Constraints

Limited Gantt flexibility (no drag & drop)

AI accuracy depends on prompt design

No offline mode

Single-user MVP (no team features)

10. Architecture Summary

XPANDER architecture is intentionally:

Simple

Cheap

Fast to build

AI-first

Serverless

Ready for Codex refactoring

The system extracts maximum value from:

Next.js serverless API

Supabase managed Postgres

OpenAI reasoning models

Minimalist UI style

This gives XPANDER a powerful foundation with minimal overhead.


---

# ✅ Document 4 is complete.  
Reply **Next** to receive:

### **Document 5 — System Diagrams (Markdown + Mermaid)**