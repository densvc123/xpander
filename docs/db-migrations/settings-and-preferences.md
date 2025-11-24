# Settings & Preferences Enhancements Migration

This migration adds user-level planning defaults and AI preferences that back the revised **Settings** screen.

These changes are safe to run multiple times thanks to `IF NOT EXISTS` guards.

## SQL Migration

Run the following SQL in the Supabase SQL editor for your XPANDER project:

```sql
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS timezone TEXT,
  ADD COLUMN IF NOT EXISTS default_sprint_length_days INTEGER DEFAULT 14 CHECK (default_sprint_length_days >= 1 AND default_sprint_length_days <= 28),
  ADD COLUMN IF NOT EXISTS default_work_hours_per_day INTEGER DEFAULT 8 CHECK (default_work_hours_per_day >= 1 AND default_work_hours_per_day <= 24),
  ADD COLUMN IF NOT EXISTS ai_use_wizard_suggestions BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS ai_show_rebalance_hints BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS ai_report_tone TEXT DEFAULT 'internal' CHECK (ai_report_tone IN ('internal', 'client'));
```

## Notes

- `weekly_capacity_hours` already exists on `public.users` and continues to be used as the base capacity for sprint planning and workload charts.
- `timezone` is optional; when `NULL`, the application falls back to the browser or environment time zone.
- These fields are exposed via `/api/settings` and edited from `src/app/settings/page.tsx`.

