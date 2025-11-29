# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

XPANDER is an AI-native project management and delivery assistant that automates project planning end-to-end. It uses AI (OpenAI GPT-4o-mini) to analyze requirements, generate tasks, plan sprints, build Gantt timelines, and provide project advice. The goal is to enable one person to perform the work of an entire PM + Tech Lead + Analyst team.

## Tech Stack

- **Frontend & Backend**: Next.js 16 (App Router)
- **Database**: Supabase (Postgres + Auth + Storage)
- **AI**: OpenAI API (GPT-4o-mini primary model)
- **UI Components**: Pure Tailwind CSS 4 (no UI libraries)
- **Charts**: Recharts
- **Deployment**: Vercel

## Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

The dev server runs at http://localhost:3000.

## Environment Variables

Required environment variables (in `.env.local`):

```
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE=<your-service-role-key>
OPENAI_API_KEY=<your-openai-api-key>
```

## Architecture Overview

### Serverless Architecture
XPANDER uses a serverless architecture with no traditional backend server:
- All business logic runs in Next.js API Routes (serverless functions)
- Supabase handles database, authentication, and storage
- AI operations call OpenAI directly from API routes
- Middleware handles session management

### Key Directories

```
src/
├── app/                    # Next.js App Router pages and API routes
│   ├── api/               # API Routes (serverless functions)
│   │   ├── ai/           # AI endpoints (analyze, breakdown, sprint-plan, advisor, report)
│   │   ├── projects/     # Project CRUD operations
│   │   └── settings/     # User settings
│   ├── dashboard/        # Main dashboard page
│   ├── projects/         # Project pages (list, detail, new)
│   ├── resources/        # Resource management
│   ├── reports/          # Report generation
│   └── settings/         # Settings page
├── components/            # React components
│   ├── ui/               # shadcn/ui components (buttons, cards, dialogs, etc.)
│   ├── layout/           # Layout components (header, sidebar, main-layout)
│   ├── gantt/            # Gantt chart component
│   └── resources/        # Resource-related components
├── lib/                   # Utility libraries
│   ├── supabase/         # Supabase clients (client, server, middleware)
│   ├── ai-prompts.ts     # AI prompt templates
│   ├── openai.ts         # OpenAI client wrapper
│   └── utils.ts          # General utilities
└── types/                 # TypeScript type definitions
    ├── database.ts       # Supabase database types
    └── governance.ts     # Project governance types
```

### Database Schema (Key Tables)

- **users**: User accounts with weekly capacity
- **projects**: Projects with status, health, deadline
- **project_inputs**: Requirements/PRD inputs for projects
- **ai_project_analysis**: AI-generated project analysis (summary, risks, dependencies, complexity)
- **tasks**: Hierarchical tasks with type, status, estimates, sprints
- **sprints**: Sprint planning with goals and dates
- **resources**: Team members with roles and capacity
- **task_assignments**: Resource allocations to tasks
- **gantt_items**: Timeline visualization data
- **ai_insights**: AI-generated insights and warnings
- **reports**: Generated project reports
- **advisor_messages**: AI advisor chat history
- **change_requests**: Change management requests
- **change_request_analysis**: AI impact analysis for changes
- **project_baselines**: Project snapshots for change comparison
- **change_history**: Audit trail for changes
- **resource_availability**: Resource availability tracking

### AI Integration Architecture

All AI interactions follow this pattern:

1. **Context Building**: API routes gather project data (project, inputs, analysis, tasks, sprints, metrics)
2. **Prompt Construction**: Use templates from `src/lib/ai-prompts.ts`
3. **OpenAI Call**: Use `generateAIResponse()` from `src/lib/openai.ts`
4. **Response Validation**: Parse and validate JSON response
5. **Database Storage**: Store AI results in appropriate tables

AI endpoints (`src/app/api/ai/`):
- **analyze**: Analyzes project requirements → generates summary, risks, complexity
- **breakdown**: Converts analysis → hierarchical task list
- **sprint-plan**: Plans sprints based on tasks, capacity, deadline
- **advisor**: Answers questions using project context
- **report**: Generates markdown reports
- **analyze-change**: Analyzes change request impact
- **optimize-workload**: Optimizes resource allocations

### Authentication & Authorization

- Supabase Auth handles authentication
- Middleware (`src/middleware.ts`) updates sessions on every request
- Protected routes check user session via `createClient()` from `src/lib/supabase/server.ts`
- Row-level security policies in Supabase enforce data access

### Path Alias

Use `@/*` to import from `src/*`:
```typescript
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
```

## AI Prompt Guidelines

When modifying AI prompts in `src/lib/ai-prompts.ts`:

1. **Always enforce strict JSON output** - Use `response_format: { type: 'json_object' }`
2. **Define explicit schemas** - Include exact JSON structure in prompts
3. **Be specific about task types** - Use: `backend`, `frontend`, `api`, `database`, `qa`, `design`, `devops`, `other`
4. **Include validation** - Parse JSON responses and handle errors
5. **Consider context size** - Keep prompts concise but complete
6. **Test thoroughly** - AI responses must be parsed successfully

Prompt types:
- `projectAnalysis`: Analyzes requirements → structured analysis
- `taskBreakdown`: Generates hierarchical task list
- `sprintPlanner`: Plans sprints with capacity constraints
- `advisor`: Conversational project advice
- `reportGenerator`: Generates markdown reports
- `changeImpactAnalysis`: Analyzes change request impacts
- `workloadOptimization`: Optimizes resource allocations

## API Route Patterns

Standard API route structure:
```typescript
export async function POST(request: Request) {
  // 1. Get authenticated user
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // 2. Parse request
  const body = await request.json()

  // 3. Fetch context from database
  const { data } = await supabase.from('projects').select('*').eq('id', projectId)

  // 4. Call AI if needed
  const aiResponse = await generateAIResponse(systemPrompt, userPrompt)

  // 5. Validate and store results
  await supabase.from('table_name').insert(aiResponse)

  // 6. Return response
  return NextResponse.json({ success: true, data })
}
```

## Component Patterns

### Server Components (default in App Router)
- Fetch data directly using `createClient()` from `@/lib/supabase/server`
- No useState/useEffect
- Can be async functions

### Client Components
- Use `'use client'` directive at top
- For interactive UI with state, events, hooks
- Use `createClient()` from `@/lib/supabase/client` for client-side operations

### UI Components (Pure Tailwind 4)

All UI components in `src/components/ui/` are custom-built using **pure Tailwind 4** without any external UI libraries.

**Available Components:**
- **Button**: Variants (default, destructive, outline, secondary, ghost, link) and sizes (default, sm, lg, icon)
- **Input, Textarea, Label**: Form elements with consistent styling
- **Card**: Container with Header, Title, Description, Content, Footer sub-components
- **Dialog**: Modal dialogs with Context API, keyboard navigation (Escape), focus trap, and body scroll lock
- **Select**: Custom dropdown with keyboard support, click-outside detection
- **Tabs**: Tab navigation with Context API for state management
- **Badge**: Small status indicators with multiple variants
- **Progress**: Progress bar with configurable value and max
- **Separator**: Horizontal/vertical dividers
- **Skeleton**: Loading placeholders
- **ScrollArea**: Simplified overflow container

**Component Variant Pattern:**
```typescript
// Simple object mapping for variants instead of CVA
const variants = {
  default: "classes for default variant",
  outline: "classes for outline variant",
}

// Apply using array index
className={cn(baseStyles, variants[variant], className)}
```

**Interactive Component Pattern:**
```typescript
// Use Context API for component composition
const ComponentContext = React.createContext<Value>()

function Component({ children }) {
  const [state, setState] = useState()
  return (
    <ComponentContext.Provider value={{ state, setState }}>
      {children}
    </ComponentContext.Provider>
  )
}
```

## Database Operations

### Server-side (API routes, Server Components):
```typescript
import { createClient } from '@/lib/supabase/server'

const supabase = await createClient()
const { data, error } = await supabase.from('projects').select('*')
```

### Client-side (Client Components):
```typescript
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()
const { data, error } = await supabase.from('projects').select('*')
```

## Change Management System

XPANDER includes a change management system that tracks requirement changes:

1. **Baseline Creation**: Snapshot current project state (tasks, sprints, timeline)
2. **Change Request**: User submits new requirement/modification
3. **AI Analysis**: System analyzes impact (affected modules, new/updated tasks, effort, timeline impact)
4. **Approval Flow**: User reviews analysis and approves/rejects
5. **Implementation**: Approved changes update project tasks and sprints
6. **History Tracking**: All changes logged in `change_history` table

## Resource Management System

Resource planning features:
- Track team members with roles and weekly capacity
- Allocate resources to tasks
- Monitor utilization percentages
- Identify overallocation and bottlenecks
- AI-powered workload optimization recommendations

## Testing AI Endpoints

Use these endpoints for testing (see README.md for full examples):

```bash
# Analyze project
POST /api/ai/analyze
{ "projectId": "<id>" }

# Generate tasks
POST /api/ai/breakdown
{ "projectId": "<id>" }

# Plan sprints
POST /api/ai/sprint-plan
{ "projectId": "<id>", "sprintLength": 14, "capacity": 40 }

# Ask advisor
POST /api/ai/advisor
{ "projectId": "<id>", "question": "Can I finish before July 1?" }

# Generate report
POST /api/ai/report
{ "projectId": "<id>", "type": "project_status" }
```

## Key Principles

1. **AI-First Design**: All planning features leverage AI; design prompts carefully
2. **Serverless Constraints**: No background jobs; all processing happens in request/response cycle
3. **Type Safety**: Use TypeScript types from `src/types/database.ts` for all database operations
4. **Pure Tailwind 4**: All UI components built with Tailwind CSS only - no external UI libraries
5. **Minimal UI**: Clean, functional UI without complex visualizations (except Gantt chart)
6. **Context Management**: Always provide complete context to AI (project, tasks, sprints, metrics)
7. **Error Handling**: Gracefully handle AI failures; retry once on invalid JSON
8. **Component Composition**: Use React Context API for interactive component state sharing

## Documentation

Detailed documentation is in the `docs/` folder:
- `Project Overview.md` - High-level project description
- `Vision & Goals.md` - Product vision
- `MVP Scope & Future Scope.md` - Feature scope
- `Architecture.md` - System architecture details
- `System Diagrams.md` - Visual diagrams
- `AI Prompt Specifications.md` - Detailed AI prompt specs
- `UI/UX Specification.md` - UI/UX guidelines
- `Development Plan.md` - Development roadmap

Refer to these docs when working on features that require deeper context.
