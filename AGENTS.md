# Repository Guidelines

This document is a short contributor guide for humans and AI agents working in this repo.

## Project Structure & Module Organization

- `src/app/` – Next.js 16 app routes (`dashboard`, `projects`, `resources`, `reports`, `settings`, API routes in `api/`).
- `components/` – Shared UI (cards, layout, inputs, charts).
- `supabase/` – Database schema and RLS policies.
- `docs/` – Product/PM docs, report templates, and DB migration notes.
- `public/` – Static assets.

When adding new features, prefer extending existing routes/components over creating parallel patterns.

## Build, Test, and Development Commands

- `npm install` – Install dependencies.
- `npm run dev` – Run the Next.js dev server at `http://localhost:3000`.
- `npm run build` – Production build.
- `npm start` – Run the built app.
- `npm run lint` – Run ESLint over the codebase.

No formal test suite is configured yet; keep changes small and manually verify core flows (project wizard, project detail, resources, reports).

## Coding Style & Naming Conventions

- TypeScript + React with functional components and hooks.
- Follow existing file layout: feature pages in `src/app/<feature>/page.tsx`, shared logic in `components` or `lib`.
- Use descriptive names (`ProjectDetailPage`, `ReportsPage`), avoid one-letter identifiers.
- Prefer existing UI primitives from `@/components/ui/*` and keep Tailwind classes consistent with nearby code.
- Run `npm run lint` before committing.

## Testing Guidelines

- For now, rely on manual testing:
  - Create/edit projects via the wizard.
  - Open project detail tabs (Overview, Plan & Sprints, Resources, Reports).
  - Generate AI reports and run resource optimization flows where available.
- If you add tests later, mirror the structure of `src/app` and keep test names descriptive (what behavior is being asserted).

## Commit & Pull Request Guidelines

- Write clear, imperative commit messages (e.g., `Align project reports with templates`, `Wire settings into sprint planner`).
- Keep PRs focused on a single feature or fix; describe:
  - What changed,
  - Why it changed (link issues if relevant),
  - How to verify (commands, screens to click).
- Include screenshots or short notes for visible UI changes (especially wizard, project detail, resources, and reports). 

