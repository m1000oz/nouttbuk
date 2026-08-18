# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project state

Fase 1 (idea + stack) and Fase 2 (UI/UX design system) are closed. Fase 3 (implementation) is in progress:

- **Backend (Supabase)**: done. Full Postgres schema, RLS policies for the `private`/`group`/`community` visibility model, the `@pucp.edu.pe` domain-restriction trigger, and the `profiles`-on-signup trigger are all migrated and tested (`supabase/migrations/`, `supabase/tests/database/`, `tests/rls.spec.ts`).
- **Frontend**: the app shell (visual identity, responsive navigation, login/registro/recuperar-contraseña modal wired to real Supabase Auth) is built. The four destination routes (`/`, `/inicio`, `/apuntes`, `/perfil`) exist with placeholder content; their real screens (editor, feed, library, profile summary) are not built yet. See `todo.md` for the authoritative, up-to-date checklist — keep it in sync with what's actually implemented as work continues.

The five docs below are the source of truth and must stay consistent with each other and with the code as the project evolves:

| File | Contents |
|---|---|
| `NOUTTBUK-IDEA.md` | Product definition: what it is, data model, visibility rules, platform (web + PWA), MVP vs v2.0 scope. |
| `STACK.md` | Chosen stack with rationale for each piece; MVP scope and v2.0 roadmap from a technical angle. |
| `DESIGN-SYSTEM.md` | The full design system (color, typography, icons, components, motion, states, screens, accessibility), each section marked closed/pending. Links interactive mockup Artifacts by name; those mockups are not files in this repo. |
| `design.md` | Screens, flows, navigation, and information model for the web + PWA version. Supersedes the original mobile-first (React Native/Expo) design that `NOUTTBUK-IDEA.md` mentions as historical context only. |
| `todo.md` | Flat implementation checklist for Fase 3, plus what's explicitly deferred to v2.0. |

Treat `STACK.md` and `DESIGN-SYSTEM.md`/`design.md` as binding decisions, not suggestions to re-litigate; they were arrived at through explicit user confirmation across many rounds. If a real implementation constraint forces a deviation, update the relevant doc in the same change, don't let code and docs drift apart.

`AGENTS.md` is auto-generated and re-added by `next dev` (Next.js 16 agent rules): this project's Next.js version has breaking changes vs. what any model's training data assumes. When an API or file convention looks unfamiliar (e.g. `src/proxy.ts` instead of `middleware.ts`, the global `LayoutProps<T>` type), check `node_modules/next/dist/docs/` before assuming it's a mistake.

## Product summary

Nouttbuk is a note-taking app for university students that combines a private, per-subject note library with an academic community feed. The single core mechanic is that every note (`apunte`) has a visibility level set individually: `private` (owner only), `group` (owner + invited collaborators with `read`/`edit` permission), or `community` (publishes to a public feed, readable without login; this is the growth/SEO hook and must never be regressed). Reactions and saves on community posts are per-user rows, not global counters.

MVP is scoped to a single university (Pontificia Universidad Católica del Perú): signup is rejected unless the email ends in `@pucp.edu.pe`, enforced both client-side (`src/lib/auth/dominio-institucional.ts`) and at the database level (trigger in `supabase/migrations/20260817204401_auth_domain_restriction.sql`). Multi-university support is explicit v2.0 scope (see `STACK.md`).

## Stack

Next.js 16 (App Router, TypeScript) + Supabase (Postgres/Auth/Storage/Realtime) + Tailwind CSS v4 + shadcn/ui (`base-nova` style, over `@base-ui/react`, **not** Radix) + Tiptap (editor, not yet integrated) + Liveblocks (real-time co-editing, `group`-visibility notes only, not yet integrated) + Motion (motion.dev, everyday micro-interactions, not yet integrated) + anime.js v4 (2-3 signature moments only, not yet integrated) + Phosphor icons (`@phosphor-icons/react`) + Vercel.

The visibility model (`private`/`group`/`community`) is enforced via Postgres **Row Level Security**, not hand-rolled authorization checks in application code. Public feed reads and authenticated writes (react/save/comment/create) are designed as separate query/mutation paths.

## Commands

```bash
npm run dev              # dev server (Next.js + Turbopack)
npm run build             # production build; also the strongest signal that Server/Client component boundaries are wired correctly
npm run typecheck          # tsc --noEmit
npm run lint                # eslint
npm test                     # vitest run (all specs in tests/**/*.spec.ts)
npx vitest run tests/<archivo>.spec.ts   # run a single test file
npm run db:types              # regenerate src/lib/types/database.types.ts from the local Supabase schema
npm run db:test                # pgTAP tests in supabase/tests/database/, requires local Supabase running
npx supabase start              # local Supabase stack (Postgres/Auth/Storage/Studio), requires Docker or Podman on PATH
npx supabase status               # prints local stack URLs/keys for .env.local; Studio is typically at http://localhost:54323
```

`tests/rls.spec.ts` is a real supabase-js integration suite (signup/signin against a live stack) that self-skips (`describe.skipIf`) when `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY`/`SUPABASE_SERVICE_ROLE_KEY` aren't set in the environment, so `npm test` never fails in an environment without Docker.

## Architecture

**Supabase client pattern** (`src/lib/supabase/`): three separate client factories, standard `@supabase/ssr` split — `client.ts` (browser, used from Client Components and the auth forms), `server.ts` (reads/writes cookies via `next/headers`, used from Server Components/route handlers), `middleware.ts` (`updateSession`, refreshes the session cookie on every request). `middleware.ts` is wired in via `src/proxy.ts` (Next.js 16's replacement for the old `middleware.ts` convention at the project root) — it only refreshes cookies, it does not redirect; route protection happens in each gated page, not centrally.

**Route structure** (`src/app/`): a `(shell)` route group holds the four nav destinations behind one shared layout. `(shell)/layout.tsx` is a Server Component that reads the session once (`auth.getUser()` + a `profiles` lookup) and passes it as a plain prop to `AppShell` (`src/components/nav/app-shell.tsx`, a Client Component that owns nav state and the auth modal). Deliberate decision: `(shell)/page.tsx` (`/`) is the public Comunidad feed with **no auth check**, so it can never accidentally end up gated behind a login wall — this is the SEO/growth-hook route from the product rules above. `/inicio`, `/apuntes`, `/perfil` are Server Components that call `redirect("/?login=1")` when there's no session; `AppShell` reads that query param in an effect (keyed on `pathname`, not mount, since a server-side redirect during a client navigation reuses the existing shell instance instead of remounting it) and auto-opens the login modal.

**Design tokens** (`src/app/globals.css`): the Tailwind v4 `--radius-*` scale is *not* derived from a single multiplier — cards/dialogs/sheets need 26px (`--radius-xl`) and buttons/inputs/selects need 14px (`--radius-lg`) simultaneously, which a single-base chain can't produce, so each step of the scale is set to an explicit value. Colors follow DESIGN-SYSTEM.md's Indigo/Teal/Slate tokens with distinct light/dark values (not auto-inverted).

**Icons**: `@phosphor-icons/react`'s default export needs a client boundary (it isn't RSC-safe); the package ships a separate `@phosphor-icons/react/dist/ssr` entry that is. Use the plain import inside Client Components (shadcn-generated `src/components/ui/*` and anything under `src/components/nav/`, `src/components/auth/`), and the `/dist/ssr` import inside Server Components (the gated route pages in `src/app/(shell)/*/page.tsx`).

**shadcn/ui components** (`src/components/ui/`): generated via `npx shadcn add <name>` using this project's `base-nova` style (`components.json`, `iconLibrary: "phosphor"`) over `@base-ui/react` primitives — the generated API shape (prop names, `render` prop patterns, `data-slot` attributes) follows Base UI conventions, not Radix's, even though it looks similar. Check a freshly-generated file's actual output before assuming an API from Radix-based shadcn docs.

**Auth forms** (`src/components/auth/`): `login-form.tsx`, `signup-form.tsx`, `recuperar-form.tsx` are composed inside `auth-modal.tsx` (a fully controlled `mode`/`open` component, no internal state), all reachable from `AppShell`. Supabase Auth error messages are normalized to Spanish copy in one place, `src/lib/auth/mapear-error-auth.ts` (tested in `tests/mapear-error-auth.spec.ts`), rather than string-matched inline in each form. Signup passes `nombre`/`usuario`/`carrera` via `signUp({ options: { data: {...} } })`; it never inserts into `profiles` directly, that row is created by the `handle_new_user` DB trigger.

## Language rule for all user-facing text

All copy (UI strings, error messages, docs, comments, and any reply written in this project) must be in **neutral/standard Spanish** ("tú" forms). Never Rioplatense/Argentine Spanish (no "vos", no voseo conjugations like "tenés"/"podés"/"hacé"). This has been corrected multiple times in this project; treat it as a hard constraint, not a style preference, and re-check any generated string against it before finalizing. Also avoid em dashes as a sentence/clause separator, use commas or split sentences instead; this is a separate, equally strong standing preference in this project.

## Where things stand (2026-08-17) and how to continue

This session built the app shell + auth modal milestone (todo.md items 1 and 12 are now checked). Live end-to-end verification (signup → session reflected in nav → gated routes reachable → logout) is **blocked**, not by app code:

- `.env.local` points at a real Supabase Cloud project (`https://iyzannepoeygzzyqnztv.supabase.co`), not a local stack (Docker/Podman weren't available in that session's environment).
- A live signup test against that project worked at the Auth layer (a user was created in `auth.users` with the correct `nombre`/`usuario`/`carrera` metadata, confirmed via the admin API, then deleted to clean up) — so the client-side auth code is verified correct.
- But PostgREST (the Data API) on that project currently exposes **zero tables** (confirmed via its OpenAPI root and direct REST calls: `paths` is just `["/"]`). This means the `profiles` row the signup trigger should create was never reachable, and the nav never reflected the new session. This is either (a) the migrations in `supabase/migrations/` were never actually pushed to this specific cloud project, or (b) they were, and PostgREST's schema cache is stale and needs a manual reload from the Supabase dashboard (Settings → API → "Reload schema cache", or a project restart).

**Next steps when resuming (on another machine or after the above is checked):**
1. Confirm in the Supabase dashboard (Table Editor) whether `profiles`/`carpetas`/`apuntes`/etc. actually exist on the linked cloud project. If not, link the CLI (`supabase login`, `supabase link`) and `supabase db push`, or apply `supabase/migrations/` by hand. If they do exist, reload the PostgREST schema cache.
2. Re-run the live click-through: `npm run dev`, sign up with a throwaway `@pucp.edu.pe` email, confirm the nav switches to the authenticated state, confirm `/inicio`/`/apuntes`/`/perfil` become reachable, confirm sign-out from `/perfil` works, then delete the throwaway test user via the admin API (`auth.admin.deleteUser`) so it doesn't linger in the real project.
3. Continue down `todo.md` — item 2 (Inicio: accesos rápidos, materias recientes, últimos apuntes) is the next unchecked item and is the natural continuation, since the shell it depends on is now done.
