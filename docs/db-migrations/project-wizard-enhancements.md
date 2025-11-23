# Project Wizard Enhancements – Schema Notes

This project already uses the Supabase schema defined in `supabase/schema.sql`.  
The new project creation wizard captures richer planning data (goals, audience, scope tier, etc.).  
This document proposes optional schema changes so that information can be persisted cleanly.

> Note: These are migration snippets, not yet applied.  
> Review and adapt before running in your Supabase SQL editor.

---

## 1. Projects – high‑level intent

The requirements step now captures:
- A goal / outcome statement.
- Primary audience (internal team, customers, both, other).
- Success metrics / signals.
- Constraints & non‑negotiables.
- Initiative size (small / medium / large).

These can be stored on `public.projects`:

```sql
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS goal text,
  ADD COLUMN IF NOT EXISTS primary_audience text CHECK (
    primary_audience IN ('internal_team', 'customers', 'both', 'other')
  ),
  ADD COLUMN IF NOT EXISTS success_metrics text,
  ADD COLUMN IF NOT EXISTS constraints text,
  ADD COLUMN IF NOT EXISTS initiative_size text CHECK (
    initiative_size IN ('small', 'medium', 'large')
  );
```

Suggested semantics:
- `goal`: single, human‑readable outcome in 1–3 sentences.
- `primary_audience`: who the project is mainly for.
- `success_metrics`: freeform description of KPIs / signals (launch, usage, revenue, satisfaction, etc.).
- `constraints`: tech, budget, compliance, or other hard limits.
- `initiative_size`: relative size flag used for planning (small/medium/large).

These fields are optional and can be backfilled later from existing project notes.

---

## 2. Tasks – scope tier (Must/Nice/Later)

The wizard lets users tag each task as:
- Must‑have
- Nice‑to‑have
- Later

Add a scope tier to `public.tasks`:

```sql
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS scope_tier text NOT NULL DEFAULT 'must_have'
    CHECK (scope_tier IN ('must_have', 'nice_to_have', 'later'));
```

Usage guidelines:
- `must_have`: required for the initial release or core outcome.
- `nice_to_have`: valuable but can be traded off if timeline/ capacity is tight.
- `later`: explicitly out‑of‑scope for the initial delivery, tracked for future phases.

This field can be used in reporting, AI prompts, and scope cut decisions.

---

## 3. Optional: Project analysis baseline flag

The wizard introduces the concept of marking an AI analysis as a “baseline” for later change impact.  
If you want to persist this, you can add a lightweight flag on `public.ai_project_analysis`:

```sql
ALTER TABLE public.ai_project_analysis
  ADD COLUMN IF NOT EXISTS is_baseline boolean NOT NULL DEFAULT false;
```

Guidelines:
- At most one row per project should be considered the “active baseline”.
- You can enforce that in application logic (e.g., when setting a new baseline, unset previous ones).

---

## 4. No changes required for resources or sprints

The wizard’s new controls for:
- Team presets (just me / small team / larger team),
- Sprint length (1/2/3 weeks),
- Planning pace (conservative/normal/aggressive),

are implemented as planning‑time inputs. They do not require schema changes:
- Resources still use the existing `public.resources` and `public.task_assignments`.
- Sprints still use `public.sprints` (dates + `order_index`).

If you later want to persist wizard choices (e.g., default sprint length or planning pace per project), you can:

```sql
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS preferred_sprint_length_days integer,
  ADD COLUMN IF NOT EXISTS planning_pace text CHECK (
    planning_pace IN ('conservative', 'normal', 'aggressive')
  );
```

These are strictly optional and not required for the current UI to function.

---

## 5. Rollout notes

- All `ALTER TABLE ... ADD COLUMN` statements are additive and backward‑compatible.
- RLS policies in `supabase/schema.sql` operate on `user_id` / `project_id` and do not need changes for these new columns.
- After applying migrations, you can progressively:
  - Map wizard state into these columns in your API routes.
  - Use `scope_tier` in reports, dashboards, and AI prompts for better prioritization and scope management.

