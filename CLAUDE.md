# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project state

This repository currently contains **no code**, only planning and design documents. Fase 1 (idea + stack) and Fase 2 (UI/UX design system) are closed; Fase 3 (implementation) has not started. There is no `package.json`, no `src/`, no git repository, and therefore no build/lint/test commands to run. Do not assume a Next.js project scaffold exists; check before running any framework-specific command.

The five files in this directory are the source of truth and must stay consistent with each other as the project evolves:

| File | Contents |
|---|---|
| `NOUTTBUK-IDEA.md` | Product definition: what it is, data model, visibility rules, platform (web + PWA), MVP vs v2.0 scope. |
| `STACK.md` | Chosen stack with rationale for each piece; MVP scope and v2.0 roadmap from a technical angle. |
| `DESIGN-SYSTEM.md` | The full design system (color, typography, icons, components, motion, states, screens, accessibility), each section marked closed/pending. Links to interactive mockup artifacts published during the design conversation. Those mockups are **not files in this repo**, they only exist as Claude Artifacts, referenced by name here and findable via claude.ai/code/artifacts or prior conversation history if the link is lost. |
| `design.md` | Screens, flows, navigation, and information model for the web + PWA version. Supersedes the original mobile-first (React Native/Expo) design that `NOUTTBUK-IDEA.md` mentions as historical context only. |
| `todo.md` | Flat implementation checklist for Fase 3, plus what's explicitly deferred to v2.0. |

When implementation starts, treat `STACK.md` and `DESIGN-SYSTEM.md`/`design.md` as binding decisions, not suggestions to re-litigate; they were arrived at through explicit user confirmation across many rounds. If a real implementation constraint forces a deviation, update the relevant doc in the same change, don't let code and docs drift apart.

## Product summary

Nouttbuk is a note-taking app for university students that combines a private, per-subject note library with an academic community feed. The single core mechanic is that every note (`apunte`) has a visibility level set individually: `private` (owner only), `group` (owner + invited collaborators with `read`/`edit` permission), or `community` (publishes to a public feed, readable without login; this is the growth/SEO hook and must never be regressed). Reactions and saves on community posts are per-user rows, not global counters.

MVP is scoped to a single university (Pontificia Universidad Católica del Perú): signup is rejected unless the email ends in `@pucp.edu.pe`. Multi-university support is explicit v2.0 scope (see `STACK.md`).

## Stack (Fase 3, once implementation starts)

Next.js (App Router, TypeScript) + Supabase (Postgres/Auth/Storage/Realtime) + Tailwind CSS + shadcn/ui + Tiptap (editor) + Liveblocks (real-time co-editing, `group`-visibility notes only) + Motion (motion.dev, everyday micro-interactions) + anime.js v4 (2-3 signature moments only: hero reveal, visibility-switch pill, first community feed load) + Vercel.

The visibility model (`private`/`group`/`community`) is meant to be enforced via Postgres **Row Level Security**, not hand-rolled authorization checks in application code; that was the deciding factor for choosing Supabase. Public feed reads and authenticated writes (react/save/comment/create) have different auth requirements and should be designed as separate query/mutation paths from the start.

## Design tokens (see `DESIGN-SYSTEM.md` for full detail)

Indigo `#4F46E5` (Tailwind Indigo scale) as primary, Teal `#14B8A6` (Tailwind Teal scale) as community/collaboration accent, Slate neutral scale, DM Sans (single family), Phosphor icons (outline + fill for active states). Card radius 26px, button/input/select radius 14px. Native browser defaults are intentionally re-themed (custom select, custom checkbox, themed scrollbar) rather than left as-is. Motion follows the hybrid rule above: don't default to spring/bounce easing, it was explicitly rejected in favor of `ease-out-expo`.

## Language rule for all user-facing text

All copy (UI strings, error messages, docs, comments, and any reply written in this project) must be in **neutral/standard Spanish** ("tú" forms). Never Rioplatense/Argentine Spanish (no "vos", no voseo conjugations like "tenés"/"podés"/"hacé"). This has been corrected multiple times in this project; treat it as a hard constraint, not a style preference, and re-check any generated string against it before finalizing. Also avoid em dashes as a sentence/clause separator, use commas or split sentences instead; this is a separate, equally strong standing preference in this project.
