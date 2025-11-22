# XPANDER — UI/UX Specification

This document defines the full UI/UX structure, layout, and behavior for XPANDER MVP.  
Style target: **Minimal, Linear.app-like, fast, clean, and AI-first.**

---

# 1. Design Principles

1. **Clarity over decoration**  
   - Thin lines, muted greys, white backgrounds  
   - Emerald green for primary accents  
   - No gradients or shadows unless necessary  

2. **Speed-first interaction**  
   - One click to reach AI  
   - Fast navigation across tabs  
   - Minimal typing (AI handles heavy work)  

3. **Predictable structure**  
   - Left sidebar navigation  
   - Top bar with actions  
   - Page content divided into clear sections  

4. **AI-first workflow**  
   - Every major screen has at least one AI action  
   - Suggestions embedded into UI  
   - AI responses integrated with context (tasks, sprints, reports)  

---

# 2. UI Framework

- Next.js 15 + App Router  
- Tailwind CSS  
- shadcn/ui components  
- Icons: Lucide  
- Typography: Inter  

Spacing scale (Tailwind):
- xs: 4px  
- sm: 8px  
- md: 16px  
- lg: 24px  
- xl: 32px  

---

# 3. Color Tokens

Primary (Emerald):

emerald-500: #10b981 (primary button / highlight)

emerald-600: #059669 (hover)

Grey Scale:

gray-50

gray-100

gray-200

gray-300

gray-400

gray-500

gray-700

gray-900

Background: white
Accent: black (text)
Border: gray-200


---

# 4. Layout Structure

## 4.1 Global App Layout



+---------------------------------------------------------+
| Top Bar: project name or page title |
+-------------------+-------------------------------------+
| Sidebar | Page Content |
| Navigation | - Tabs |
| | - Panels |
| (icons + labels) | - Tables |
| | - Actions |
+-------------------+-------------------------------------+


### Sidebar Items
- Dashboard  
- Projects  
- Reports  
- Settings  

Icons: Lucide (home, folder, bar-chart, settings)

Sidebar width: **220px**  
Background: **gray-50**  
Text: **gray-700**  
Hover: **gray-100**

---

# 5. Screen-by-Screen UI Specification

## 5.1 Dashboard (Global)

### Sections
1. **Header**: “Dashboard”
2. **This Week Summary** (horizontal cards)
3. **Projects Overview Table**

### Card Layout (4 cards)


| Tasks Due | Tasks Overdue | Active Sprints | High-Risk Projects |


### Projects Table Columns
- Name  
- Progress (%)  
- Status (badge: success/warning/danger)  
- Deadline  
- Open Tasks  
- Last Updated  

Rows are clickable → go to project.

---

## 5.2 Projects List

### Components
- Header: “Projects”
- Button: “New Project” (emerald)
- Table:  
  - Project Name  
  - Description  
  - Status  
  - Deadline  
  - Progress  

Empty state:


No projects yet.
[Create your first project]


---

## 5.3 Project Detail Page

### Layout

Tabs:
- Overview
- Requirements
- Tasks
- Sprints
- Gantt
- AI
- Reports

Tabs appear horizontally under the header.

---

## 5.4 Requirements Page

### Components
1. **Text Area Input**
   - Full width
   - 300–600px height
   - Placeholder: “Paste your PRD, notes, or requirements…”

2. **Save Button** (right aligned)
3. **History List**
   - Card list of previous inputs  
   - Show input type, timestamp, preview  

---

## 5.5 AI Analysis Page (Project Analysis)

### Sections
- Button: “Run Project Analysis” (emerald)
- Status indicator: “Last analyzed: <timestamp>”
- Panels:
  - Summary
  - Technical Overview
  - Risks (list with severity badges)
  - Dependencies (graph-like list)
  - Complexity Score (1–10)
  - Effort Estimate (hours)

Panels style:


Rounded border
Padding: 16px
Border: gray-200
Background: white


---

## 5.6 Tasks Page

### Layout

Top-right:
- Button: “Generate Task Breakdown”
- Button secondary: “Regenerate”

Left:
- Filters (task type, status, sprint)

Main:
- Task groups (backend, frontend, api, db, qa, design)
- Inside each group: task cards or table rows

Task Row (table-style but minimalist):


[Checkbox] Task Title
Type Badge Estimate (h) Status Dropdown Priority Dropdown


Hierarchy:
- Children are indented by 16px
- Parent tasks bold

Empty state:


No tasks yet.
[Generate Task Breakdown]


---

## 5.7 Sprints Page

### Layout

Left Column:
- List of sprints (vertical)
  - Sprint name
  - Dates
  - Status indicator

Right Column:
- Sprint details:
  - Goal
  - Tasks assigned (table)
  - Progress bar

Button at top:
- “Plan Sprints”

---

## 5.8 Gantt Page (Basic Timeline View)

### Requirements
- Minimal, no drag-drop
- Horizontal time axis
- Vertical: sprints
- Bars: start → end

Example layout (ASCII):



Sprint 1 | █████████▉
Sprint 2 | ███████████
Sprint 3 | ████


Gantt bar style:
- Height: 8px
- Rounded
- emerald-500 fill

---

## 5.9 AI Advisor Page

### Layout

Chat UI (simple vertical stack)
- User message (right aligned bubble)
- AI response (left aligned bubble)

Input area:


+----------------------------------------------+
| [text input…………………………………] [Send] |
+----------------------------------------------+


Left Panel:
- Quick suggestions:
  - “What are my risks?”
  - “Can I finish before deadline?”
  - “How to reduce workload?”
  - “What should be done next?”

---

## 5.10 Reports Page

### Layout
- Button: “Generate Report”
- Report Types Dropdown:
  - Project Status
  - Sprint Review
  - Resource Report
  - Custom Prompt

List of generated reports:
- Title
- Summary preview
- Timestamp
- “View” button

When viewing a report:
- Markdown rendered in full width
- Copy to clipboard button
- Regenerate button

---

# 6. UI Component Standards

## Buttons
- Primary: emerald-500 bg, white text
- Secondary: white bg, gray-300 border, gray-700 text
- Danger: red-500 bg

## Cards
- Padding 16px  
- Border gray-200  
- Rounded md  

## Tables
- Minimal:
  - No heavy borders
  - Row hover: gray-50
  - Header background: gray-100  

## Modals
- Centered, small to medium size
- Rounded-xl
- Shadow-sm

---

# 7. Navigation Flow



Dashboard
↓
Projects List → Project Detail
↓
┌────────────┬──────────────┬───────────┐
Overview Requirements Tasks Sprints
↓
Gantt
↓
AI
↓
Reports


---

# 8. UX Guidelines

### AI-first workflow
- Every screen must have at least one AI action visible.
- AI results update the UI immediately.
- History (inputs, reports, insights) must be accessible.

### Performance
- Keep Gantt simple (no library)
- Use skeleton loaders for AI endpoints

### Accessibility
- Use color + icon for severity
- Keyboard shortcuts:
  - `Ctrl + K`: global command palette (future)
  - `/`: focus search (future)

---

# 9. Mobile (Future Friendly)

(Not for MVP, but layout must be responsive.)

Rules:
- Sidebar collapses into top dropdown
- Tabs become horizontal scroll list
- Panels stack vertically

---

# 10. UX Acceptance Criteria

XPANDER UI is complete for MVP when:
- All screens load <1s on Vercel
- Task breakdown appears within 3 seconds
- Sprint planner runs without blocking UI
- Advisor responds <2s (4o-mini)
- Reports are clear and structured
- No unnecessary clicks (>3 clicks = redesign)