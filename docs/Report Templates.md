# XPANDER — Report Templates

This document provides **draft templates** for each report type available in XPANDER. These templates serve as the structural foundation for AI-generated reports and can be customized based on project needs.

---

## Table of Contents

1. [Project Status Report](#1-project-status-report)
2. [Sprint Review Report](#2-sprint-review-report)
3. [Resource Usage Report](#3-resource-usage-report)
4. [Custom Report](#4-custom-report)
5. [Template Variables Reference](#5-template-variables-reference)
6. [Styling Guidelines](#6-styling-guidelines)

---

## 1. Project Status Report

**Report Type:** `project_status`
**Purpose:** Comprehensive overview of project progress, risks, and milestones
**Frequency:** Weekly or bi-weekly
**Audience:** Stakeholders, Project Sponsors, Management

### Template

```markdown
# Project Status Report

**Project:** {{project.name}}
**Report Date:** {{report.date}}
**Reporting Period:** {{report.period_start}} — {{report.period_end}}
**Status:** {{project.status}} <!-- On Track | At Risk | Off Track -->

---

## Executive Summary

{{executive_summary}}

<!-- 2-3 paragraph high-level overview of:
- Current project state
- Key achievements this period
- Critical blockers or concerns
- Overall trajectory toward deadline -->

---

## Key Metrics

| Metric | Current | Target | Trend |
|--------|---------|--------|-------|
| Overall Progress | {{metrics.progress_percentage}}% | 100% | {{metrics.progress_trend}} |
| Tasks Completed | {{metrics.tasks_done}} | {{metrics.tasks_total}} | {{metrics.tasks_trend}} |
| Sprint Velocity | {{metrics.velocity}} pts | {{metrics.target_velocity}} pts | {{metrics.velocity_trend}} |
| Hours Logged | {{metrics.hours_logged}} | {{metrics.hours_estimated}} | — |
| Risks Open | {{metrics.risks_open}} | 0 | {{metrics.risks_trend}} |

### Progress Visualization

```
Overall: [████████████░░░░░░░░] {{metrics.progress_percentage}}%
Sprint:  [██████████████░░░░░░] {{metrics.sprint_progress}}%
Budget:  [████████████████░░░░] {{metrics.budget_used}}%
```

---

## Current Sprint Status

**Sprint:** {{sprint.name}}
**Goal:** {{sprint.goal}}
**Duration:** {{sprint.start_date}} — {{sprint.end_date}}
**Days Remaining:** {{sprint.days_remaining}}

### Sprint Progress

| Status | Count | Percentage |
|--------|-------|------------|
| Completed | {{sprint.tasks_done}} | {{sprint.done_percentage}}% |
| In Progress | {{sprint.tasks_in_progress}} | {{sprint.in_progress_percentage}}% |
| To Do | {{sprint.tasks_todo}} | {{sprint.todo_percentage}}% |
| Blocked | {{sprint.tasks_blocked}} | {{sprint.blocked_percentage}}% |

### Sprint Burndown

<!-- AI to generate text-based burndown or describe trend -->

{{sprint.burndown_analysis}}

---

## Completed This Period

{{#each completed_tasks}}
- **{{this.title}}** ({{this.task_type}})
  - {{this.description}}
  - Completed: {{this.completed_date}}
{{/each}}

### Key Achievements

{{#each achievements}}
- {{this}}
{{/each}}

---

## In Progress

| Task | Assignee | Status | ETA |
|------|----------|--------|-----|
{{#each in_progress_tasks}}
| {{this.title}} | {{this.assignee}} | {{this.status_detail}} | {{this.eta}} |
{{/each}}

---

## Blocked Items

{{#if blocked_tasks.length}}
| Task | Blocker | Impact | Days Blocked |
|------|---------|--------|--------------|
{{#each blocked_tasks}}
| {{this.title}} | {{this.blocker_reason}} | {{this.impact}} | {{this.days_blocked}} |
{{/each}}

### Blocker Resolution Plan

{{blocker_resolution_plan}}
{{else}}
*No blocked items at this time.*
{{/if}}

---

## Risks and Issues

### Active Risks

| ID | Risk | Severity | Probability | Mitigation Status |
|----|------|----------|-------------|-------------------|
{{#each risks}}
| R{{this.id}} | {{this.title}} | {{this.severity}} | {{this.probability}} | {{this.mitigation_status}} |
{{/each}}

### Risk Assessment Summary

{{risk_assessment_summary}}

### New Issues This Period

{{#each new_issues}}
- **{{this.title}}** ({{this.severity}})
  - {{this.description}}
  - Action: {{this.action}}
{{/each}}

---

## Upcoming Milestones

| Milestone | Target Date | Status | Notes |
|-----------|-------------|--------|-------|
{{#each milestones}}
| {{this.name}} | {{this.date}} | {{this.status}} | {{this.notes}} |
{{/each}}

### Next Sprint Preview

**Sprint:** {{next_sprint.name}}
**Goal:** {{next_sprint.goal}}
**Planned Tasks:** {{next_sprint.task_count}}
**Estimated Hours:** {{next_sprint.estimated_hours}}

---

## Dependencies

### External Dependencies

{{#each external_dependencies}}
- **{{this.name}}:** {{this.status}} — {{this.notes}}
{{/each}}

### Internal Dependencies

{{#each internal_dependencies}}
- **{{this.from}}** → **{{this.to}}:** {{this.status}}
{{/each}}

---

## Recommendations

{{#each recommendations}}
1. **{{this.title}}**
   - {{this.description}}
   - Priority: {{this.priority}}
   - Action Owner: {{this.owner}}
{{/each}}

---

## Decisions Needed

{{#if decisions_needed.length}}
{{#each decisions_needed}}
- [ ] **{{this.title}}**
  - Context: {{this.context}}
  - Options: {{this.options}}
  - Deadline: {{this.deadline}}
{{/each}}
{{else}}
*No pending decisions at this time.*
{{/if}}

---

## Appendix

### Task Breakdown by Type

| Type | Total | Done | In Progress | To Do |
|------|-------|------|-------------|-------|
| Frontend | {{breakdown.frontend.total}} | {{breakdown.frontend.done}} | {{breakdown.frontend.in_progress}} | {{breakdown.frontend.todo}} |
| Backend | {{breakdown.backend.total}} | {{breakdown.backend.done}} | {{breakdown.backend.in_progress}} | {{breakdown.backend.todo}} |
| API | {{breakdown.api.total}} | {{breakdown.api.done}} | {{breakdown.api.in_progress}} | {{breakdown.api.todo}} |
| Database | {{breakdown.db.total}} | {{breakdown.db.done}} | {{breakdown.db.in_progress}} | {{breakdown.db.todo}} |
| QA | {{breakdown.qa.total}} | {{breakdown.qa.done}} | {{breakdown.qa.in_progress}} | {{breakdown.qa.todo}} |
| Design | {{breakdown.design.total}} | {{breakdown.design.done}} | {{breakdown.design.in_progress}} | {{breakdown.design.todo}} |

---

*Report generated by XPANDER AI on {{report.generated_at}}*
```

---

## 2. Sprint Review Report

**Report Type:** `sprint_review`
**Purpose:** Summary of completed work, velocity analysis, and sprint learnings
**Frequency:** End of each sprint
**Audience:** Development Team, Product Owner, Stakeholders

### Template

```markdown
# Sprint Review Report

**Sprint:** {{sprint.name}}
**Sprint Number:** {{sprint.number}}
**Duration:** {{sprint.start_date}} — {{sprint.end_date}}
**Team:** {{team.name}}

---

## Sprint Summary

### Sprint Goal

> {{sprint.goal}}

### Goal Achievement: {{sprint.goal_achievement}} <!-- Achieved | Partially Achieved | Not Achieved -->

{{sprint.goal_achievement_summary}}

---

## Sprint Metrics

| Metric | Planned | Actual | Variance |
|--------|---------|--------|----------|
| Story Points | {{metrics.points_planned}} | {{metrics.points_completed}} | {{metrics.points_variance}} |
| Tasks | {{metrics.tasks_planned}} | {{metrics.tasks_completed}} | {{metrics.tasks_variance}} |
| Hours | {{metrics.hours_planned}} | {{metrics.hours_actual}} | {{metrics.hours_variance}} |

### Velocity Analysis

**Current Sprint Velocity:** {{metrics.velocity}} points
**Average Velocity (last 3 sprints):** {{metrics.avg_velocity}} points
**Velocity Trend:** {{metrics.velocity_trend}} <!-- Improving | Stable | Declining -->

```
Sprint Velocity History:
Sprint N-2: [████████████░░░░░░░░] {{history.sprint_n2}} pts
Sprint N-1: [██████████████░░░░░░] {{history.sprint_n1}} pts
Sprint N:   [████████████████████] {{history.sprint_n}} pts
```

### Completion Rate

- **Tasks Completed:** {{completion.tasks_done}} / {{completion.tasks_total}} ({{completion.task_rate}}%)
- **Story Points Completed:** {{completion.points_done}} / {{completion.points_total}} ({{completion.points_rate}}%)
- **Commitment Accuracy:** {{completion.commitment_accuracy}}%

---

## Completed Work

### Features Delivered

{{#each features_delivered}}
#### {{this.title}}

- **Description:** {{this.description}}
- **Story Points:** {{this.points}}
- **Status:** Completed {{this.completed_date}}
- **Demo Notes:** {{this.demo_notes}}

{{/each}}

### Bug Fixes

{{#each bug_fixes}}
- **{{this.title}}** — {{this.description}} ({{this.severity}})
{{/each}}

### Technical Tasks

{{#each technical_tasks}}
- **{{this.title}}** — {{this.description}}
{{/each}}

---

## Incomplete Work

{{#if incomplete_work.length}}
### Carried Over to Next Sprint

| Task | Reason | Points | New Estimate |
|------|--------|--------|--------------|
{{#each incomplete_work}}
| {{this.title}} | {{this.reason}} | {{this.points}} | {{this.new_estimate}} |
{{/each}}

### Impact Analysis

{{incomplete_work_impact}}
{{else}}
*All planned work was completed this sprint.*
{{/if}}

---

## Team Performance

### Capacity Utilization

| Team Member | Capacity (hrs) | Logged (hrs) | Utilization |
|-------------|----------------|--------------|-------------|
{{#each team_members}}
| {{this.name}} | {{this.capacity}} | {{this.logged}} | {{this.utilization}}% |
{{/each}}
| **Total** | **{{team.total_capacity}}** | **{{team.total_logged}}** | **{{team.avg_utilization}}%** |

### Task Distribution

```
Frontend: [████████████░░░░░░░░] {{distribution.frontend}}%
Backend:  [██████████████░░░░░░] {{distribution.backend}}%
API:      [████████░░░░░░░░░░░░] {{distribution.api}}%
QA:       [██████░░░░░░░░░░░░░░] {{distribution.qa}}%
Other:    [████░░░░░░░░░░░░░░░░] {{distribution.other}}%
```

---

## Sprint Health

### What Went Well

{{#each went_well}}
- {{this}}
{{/each}}

### What Could Be Improved

{{#each improvements}}
- {{this}}
{{/each}}

### Action Items from Retrospective

| Action Item | Owner | Due Date | Status |
|-------------|-------|----------|--------|
{{#each action_items}}
| {{this.action}} | {{this.owner}} | {{this.due_date}} | {{this.status}} |
{{/each}}

---

## Blockers Encountered

{{#if blockers.length}}
| Blocker | Duration | Resolution | Impact |
|---------|----------|------------|--------|
{{#each blockers}}
| {{this.description}} | {{this.duration}} | {{this.resolution}} | {{this.impact}} |
{{/each}}

### Blocker Analysis

{{blocker_analysis}}
{{else}}
*No significant blockers encountered this sprint.*
{{/if}}

---

## Quality Metrics

| Metric | This Sprint | Target | Trend |
|--------|-------------|--------|-------|
| Bugs Found | {{quality.bugs_found}} | <{{quality.bugs_target}} | {{quality.bugs_trend}} |
| Bugs Fixed | {{quality.bugs_fixed}} | — | — |
| Code Review Turnaround | {{quality.review_time}} hrs | <{{quality.review_target}} hrs | {{quality.review_trend}} |
| Test Coverage | {{quality.coverage}}% | >{{quality.coverage_target}}% | {{quality.coverage_trend}} |

---

## Risks and Issues

### New Risks Identified

{{#each new_risks}}
- **{{this.title}}** ({{this.severity}})
  - {{this.description}}
  - Mitigation: {{this.mitigation}}
{{/each}}

### Issues Resolved

{{#each resolved_issues}}
- **{{this.title}}** — {{this.resolution}}
{{/each}}

---

## Recommendations

{{#each recommendations}}
1. **{{this.title}}**
   - {{this.description}}
{{/each}}

---

## Next Sprint Preview

**Sprint:** {{next_sprint.name}}
**Goal:** {{next_sprint.goal}}
**Duration:** {{next_sprint.start_date}} — {{next_sprint.end_date}}

### Planned Work

{{#each next_sprint.planned_tasks}}
- {{this.title}} ({{this.points}} pts)
{{/each}}

**Total Planned:** {{next_sprint.total_points}} points

---

## Appendix

### Burndown Chart Data

| Day | Ideal | Actual |
|-----|-------|--------|
{{#each burndown_data}}
| {{this.day}} | {{this.ideal}} | {{this.actual}} |
{{/each}}

### Sprint Timeline

{{sprint_timeline}}

---

*Report generated by XPANDER AI on {{report.generated_at}}*
```

---

## 3. Resource Usage Report

**Report Type:** `resource_usage`
**Purpose:** Time tracking and capacity utilization analysis
**Frequency:** Weekly or on-demand
**Audience:** Project Managers, Team Leads, Resource Managers

### Template

```markdown
# Resource Usage Report

**Project:** {{project.name}}
**Report Date:** {{report.date}}
**Reporting Period:** {{report.period_start}} — {{report.period_end}}

---

## Executive Summary

{{executive_summary}}

<!-- Summary of resource utilization, capacity concerns, and recommendations -->

---

## Overall Resource Metrics

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| Total Capacity | {{metrics.total_capacity}} hrs | — | — |
| Hours Logged | {{metrics.hours_logged}} hrs | — | — |
| Utilization Rate | {{metrics.utilization_rate}}% | 80-90% | {{metrics.utilization_status}} |
| Overtime Hours | {{metrics.overtime_hours}} hrs | 0 hrs | {{metrics.overtime_status}} |
| Idle Capacity | {{metrics.idle_capacity}} hrs | <10% | {{metrics.idle_status}} |

---

## Capacity Overview

### Team Capacity vs. Demand

```
Capacity:  [████████████████████] {{capacity.total}} hrs (100%)
Allocated: [████████████████░░░░] {{capacity.allocated}} hrs ({{capacity.allocated_pct}}%)
Available: [░░░░░░░░░░░░░░░░████] {{capacity.available}} hrs ({{capacity.available_pct}}%)
```

### Capacity Forecast (Next 4 Weeks)

| Week | Capacity | Planned | Gap | Status |
|------|----------|---------|-----|--------|
{{#each capacity_forecast}}
| {{this.week}} | {{this.capacity}} hrs | {{this.planned}} hrs | {{this.gap}} hrs | {{this.status}} |
{{/each}}

---

## Team Member Utilization

### Individual Breakdown

| Team Member | Role | Capacity | Logged | Utilization | Status |
|-------------|------|----------|--------|-------------|--------|
{{#each team_members}}
| {{this.name}} | {{this.role}} | {{this.capacity}} hrs | {{this.logged}} hrs | {{this.utilization}}% | {{this.status}} |
{{/each}}
| **Total** | — | **{{totals.capacity}} hrs** | **{{totals.logged}} hrs** | **{{totals.utilization}}%** | — |

### Utilization Distribution

```
Under-utilized (<70%):  {{utilization_distribution.under}} members
Optimal (70-90%):       {{utilization_distribution.optimal}} members
Over-utilized (>90%):   {{utilization_distribution.over}} members
```

### Individual Details

{{#each team_members}}
#### {{this.name}} — {{this.role}}

**Utilization:** {{this.utilization}}%
**Hours:** {{this.logged}} / {{this.capacity}} hrs

| Task Type | Hours | Percentage |
|-----------|-------|------------|
{{#each this.breakdown}}
| {{this.type}} | {{this.hours}} hrs | {{this.percentage}}% |
{{/each}}

**Top Activities:**
{{#each this.top_activities}}
- {{this.task}}: {{this.hours}} hrs
{{/each}}

---
{{/each}}

---

## Time Allocation by Category

### By Task Type

| Task Type | Hours | Percentage | Trend |
|-----------|-------|------------|-------|
| Frontend Development | {{by_type.frontend.hours}} hrs | {{by_type.frontend.pct}}% | {{by_type.frontend.trend}} |
| Backend Development | {{by_type.backend.hours}} hrs | {{by_type.backend.pct}}% | {{by_type.backend.trend}} |
| API Development | {{by_type.api.hours}} hrs | {{by_type.api.pct}}% | {{by_type.api.trend}} |
| Database Work | {{by_type.db.hours}} hrs | {{by_type.db.pct}}% | {{by_type.db.trend}} |
| QA/Testing | {{by_type.qa.hours}} hrs | {{by_type.qa.pct}}% | {{by_type.qa.trend}} |
| Design | {{by_type.design.hours}} hrs | {{by_type.design.pct}}% | {{by_type.design.trend}} |
| DevOps | {{by_type.devops.hours}} hrs | {{by_type.devops.pct}}% | {{by_type.devops.trend}} |
| Meetings/Admin | {{by_type.meetings.hours}} hrs | {{by_type.meetings.pct}}% | {{by_type.meetings.trend}} |
| Other | {{by_type.other.hours}} hrs | {{by_type.other.pct}}% | {{by_type.other.trend}} |

### Visualization

```
Frontend:  [████████████████░░░░] {{by_type.frontend.pct}}%
Backend:   [██████████████░░░░░░] {{by_type.backend.pct}}%
API:       [████████░░░░░░░░░░░░] {{by_type.api.pct}}%
Database:  [██████░░░░░░░░░░░░░░] {{by_type.db.pct}}%
QA:        [████████████░░░░░░░░] {{by_type.qa.pct}}%
Design:    [████░░░░░░░░░░░░░░░░] {{by_type.design.pct}}%
DevOps:    [██░░░░░░░░░░░░░░░░░░] {{by_type.devops.pct}}%
Meetings:  [██████░░░░░░░░░░░░░░] {{by_type.meetings.pct}}%
```

### By Sprint/Phase

| Sprint | Hours Planned | Hours Actual | Variance |
|--------|---------------|--------------|----------|
{{#each by_sprint}}
| {{this.name}} | {{this.planned}} hrs | {{this.actual}} hrs | {{this.variance}} |
{{/each}}

---

## Workload Analysis

### Current Workload Distribution

{{#each workload_analysis}}
#### {{this.member}}

**Assigned Tasks:** {{this.task_count}}
**Total Estimated Hours:** {{this.estimated_hours}} hrs
**Workload Status:** {{this.status}} <!-- Underloaded | Balanced | Overloaded -->

{{#if this.is_overloaded}}
**Warning:** This team member is overloaded. Consider reassigning tasks.

Tasks to potentially reassign:
{{#each this.reassignment_candidates}}
- {{this.task}} ({{this.hours}} hrs)
{{/each}}
{{/if}}
{{/each}}

### Workload Balance Score

**Score:** {{workload_balance.score}} / 100
**Status:** {{workload_balance.status}}

{{workload_balance.analysis}}

---

## Time Tracking Accuracy

### Estimate vs. Actual Analysis

| Category | Estimated | Actual | Accuracy |
|----------|-----------|--------|----------|
| All Tasks | {{accuracy.total_estimated}} hrs | {{accuracy.total_actual}} hrs | {{accuracy.overall}}% |
| Frontend | {{accuracy.frontend.estimated}} hrs | {{accuracy.frontend.actual}} hrs | {{accuracy.frontend.rate}}% |
| Backend | {{accuracy.backend.estimated}} hrs | {{accuracy.backend.actual}} hrs | {{accuracy.backend.rate}}% |
| QA | {{accuracy.qa.estimated}} hrs | {{accuracy.qa.actual}} hrs | {{accuracy.qa.rate}}% |

### Tasks with Significant Variance

{{#each variance_tasks}}
| {{this.task}} | Est: {{this.estimated}} hrs | Act: {{this.actual}} hrs | {{this.variance_pct}}% |
{{/each}}

### Estimation Trends

{{estimation_trend_analysis}}

---

## Overtime and Burnout Risk

### Overtime Summary

| Team Member | Standard Hours | Logged Hours | Overtime | Risk Level |
|-------------|----------------|--------------|----------|------------|
{{#each overtime_data}}
| {{this.name}} | {{this.standard}} hrs | {{this.logged}} hrs | {{this.overtime}} hrs | {{this.risk_level}} |
{{/each}}

### Burnout Risk Indicators

{{#each burnout_risks}}
- **{{this.member}}** — {{this.risk_level}} Risk
  - Consecutive overtime weeks: {{this.overtime_weeks}}
  - Average weekly hours: {{this.avg_hours}}
  - Recommendation: {{this.recommendation}}
{{/each}}

---

## Unallocated Time Analysis

### Unassigned Hours

**Total Unallocated:** {{unallocated.total}} hrs
**Percentage of Capacity:** {{unallocated.percentage}}%

### Breakdown of Unallocated Time

{{#each unallocated.breakdown}}
- {{this.category}}: {{this.hours}} hrs ({{this.percentage}}%)
{{/each}}

### Recommendations

{{unallocated.recommendations}}

---

## Capacity Planning Recommendations

### Short-term (This Sprint)

{{#each recommendations.short_term}}
1. **{{this.title}}**
   - {{this.description}}
   - Impact: {{this.impact}}
{{/each}}

### Medium-term (Next 2-4 Sprints)

{{#each recommendations.medium_term}}
1. **{{this.title}}**
   - {{this.description}}
   - Impact: {{this.impact}}
{{/each}}

### Resource Requests

{{#if resource_requests.length}}
| Role Needed | Hours/Week | Duration | Justification |
|-------------|------------|----------|---------------|
{{#each resource_requests}}
| {{this.role}} | {{this.hours}} hrs | {{this.duration}} | {{this.justification}} |
{{/each}}
{{else}}
*No additional resources required at this time.*
{{/if}}

---

## Appendix

### Daily Time Log Summary

| Date | Total Hours | Tasks Completed |
|------|-------------|-----------------|
{{#each daily_log}}
| {{this.date}} | {{this.hours}} hrs | {{this.tasks}} |
{{/each}}

### Detailed Time Entries

{{detailed_time_entries}}

---

*Report generated by XPANDER AI on {{report.generated_at}}*
```

---

## 4. Custom Report

**Report Type:** `custom`
**Purpose:** Generate AI-powered reports based on user-defined criteria and prompts
**Frequency:** On-demand
**Audience:** Variable (based on report content)

### Template

```markdown
# {{report.title}}

**Project:** {{project.name}}
**Report Type:** Custom Analysis
**Generated:** {{report.date}}
**Requested By:** {{report.requested_by}}

---

## Report Parameters

**Custom Prompt:**
> {{custom_prompt}}

**Data Sources Used:**
{{#each data_sources}}
- {{this}}
{{/each}}

**Date Range:** {{date_range.start}} — {{date_range.end}}

---

## Executive Summary

{{executive_summary}}

---

## Analysis

{{#each analysis_sections}}
### {{this.title}}

{{this.content}}

{{#if this.data_table}}
{{this.data_table}}
{{/if}}

{{#if this.visualization}}
{{this.visualization}}
{{/if}}

{{/each}}

---

## Key Findings

{{#each key_findings}}
### Finding {{@index}}: {{this.title}}

**Category:** {{this.category}}
**Significance:** {{this.significance}}

{{this.description}}

{{#if this.supporting_data}}
**Supporting Data:**
{{this.supporting_data}}
{{/if}}

{{/each}}

---

## Metrics Summary

| Metric | Value | Context |
|--------|-------|---------|
{{#each metrics}}
| {{this.name}} | {{this.value}} | {{this.context}} |
{{/each}}

---

## Insights

{{#each insights}}
#### {{this.title}}

{{this.description}}

**Relevance:** {{this.relevance}}
{{/each}}

---

## Recommendations

Based on the analysis, here are the recommended actions:

{{#each recommendations}}
### {{@index}}. {{this.title}}

**Priority:** {{this.priority}}
**Effort:** {{this.effort}}
**Impact:** {{this.impact}}

{{this.description}}

**Action Items:**
{{#each this.action_items}}
- [ ] {{this}}
{{/each}}
{{/each}}

---

## Data Appendix

### Raw Data Summary

{{raw_data_summary}}

### Methodology Notes

{{methodology}}

### Limitations

{{#each limitations}}
- {{this}}
{{/each}}

---

## Follow-up Questions

Based on this analysis, you may want to explore:

{{#each follow_up_questions}}
1. {{this}}
{{/each}}

---

*Custom report generated by XPANDER AI on {{report.generated_at}}*
*Based on user prompt: "{{custom_prompt_truncated}}"*
```

### Custom Report Examples

#### Example 1: Risk Deep Dive
```markdown
Custom Prompt: "Analyze all high and critical risks in the project, their interdependencies, and provide a mitigation timeline."
```

#### Example 2: Technology Stack Analysis
```markdown
Custom Prompt: "Review the technical tasks and provide insights on the technology stack complexity and potential technical debt."
```

#### Example 3: Team Velocity Trend
```markdown
Custom Prompt: "Analyze the team's velocity over the past 5 sprints and predict capacity for the remaining project timeline."
```

#### Example 4: Deadline Feasibility
```markdown
Custom Prompt: "Given the current progress and remaining tasks, assess the feasibility of meeting the project deadline and suggest alternatives if at risk."
```

---

## 5. Template Variables Reference

### Project Variables

| Variable | Type | Description |
|----------|------|-------------|
| `project.name` | string | Project name |
| `project.status` | enum | On Track, At Risk, Off Track |
| `project.deadline` | date | Project deadline |
| `project.start_date` | date | Project start date |

### Sprint Variables

| Variable | Type | Description |
|----------|------|-------------|
| `sprint.name` | string | Sprint name |
| `sprint.number` | number | Sprint number |
| `sprint.goal` | string | Sprint goal description |
| `sprint.start_date` | date | Sprint start date |
| `sprint.end_date` | date | Sprint end date |
| `sprint.days_remaining` | number | Days remaining in sprint |
| `sprint.tasks_done` | number | Completed tasks count |
| `sprint.tasks_total` | number | Total tasks in sprint |

### Metrics Variables

| Variable | Type | Description |
|----------|------|-------------|
| `metrics.progress_percentage` | number | Overall project progress |
| `metrics.tasks_done` | number | Total completed tasks |
| `metrics.tasks_total` | number | Total tasks |
| `metrics.velocity` | number | Current velocity (points) |
| `metrics.hours_logged` | number | Total hours logged |
| `metrics.hours_estimated` | number | Total estimated hours |
| `metrics.risks_open` | number | Open risks count |

### Team Variables

| Variable | Type | Description |
|----------|------|-------------|
| `team.name` | string | Team name |
| `team.total_capacity` | number | Team capacity in hours |
| `team_members` | array | List of team members |
| `team_members[].name` | string | Member name |
| `team_members[].role` | string | Member role |
| `team_members[].capacity` | number | Individual capacity |
| `team_members[].logged` | number | Hours logged |
| `team_members[].utilization` | number | Utilization percentage |

### Report Variables

| Variable | Type | Description |
|----------|------|-------------|
| `report.date` | date | Report generation date |
| `report.period_start` | date | Reporting period start |
| `report.period_end` | date | Reporting period end |
| `report.generated_at` | timestamp | Full timestamp |
| `report.title` | string | Report title |

---

## 6. Styling Guidelines

### Markdown Formatting

- Use **headers** (`#`, `##`, `###`) for clear hierarchy
- Use **tables** for data presentation
- Use **bullet points** for lists of items
- Use **bold** for emphasis on key terms
- Use **code blocks** for visualizations and raw data
- Use **blockquotes** for goals, prompts, and important notes

### Status Indicators

| Status | Icon/Text | Color Context |
|--------|-----------|---------------|
| On Track | On Track | Green |
| At Risk | At Risk | Yellow/Amber |
| Off Track | Off Track | Red |
| Completed | Completed | Green |
| In Progress | In Progress | Blue |
| Blocked | Blocked | Red |
| Pending | Pending | Gray |

### Trend Indicators

- Improving / Up
- Stable / Flat
- Declining / Down

### Progress Bars (Text-based)

```
Full:    [████████████████████] 100%
High:    [████████████████░░░░] 80%
Medium:  [██████████░░░░░░░░░░] 50%
Low:     [████░░░░░░░░░░░░░░░░] 20%
Empty:   [░░░░░░░░░░░░░░░░░░░░] 0%
```

### Severity Levels

| Level | Usage |
|-------|-------|
| Critical | Immediate action required |
| High | Action required this sprint |
| Medium | Should be addressed soon |
| Low | Monitor and address when possible |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024-01-22 | Initial draft templates |

---

*This document is maintained by the XPANDER team and should be updated as report requirements evolve.*
