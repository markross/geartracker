# GearTracker

Bike component wear tracking app synced with Strava.

## Tech Stack
- Next.js 14+ (App Router), TypeScript
- Supabase (Postgres, auth, RLS)
- Tailwind CSS
- Vitest + React Testing Library (unit/integration)
- Playwright (e2e)
- Capacitor (future mobile)

## Approach
- TDD: write failing tests first, implement, refactor
- Infrastructure-first stages OK
- Distance (km/mi) is primary wear metric
- Manual Strava sync first, webhooks later

## Shell
- Node 24 via nvm. `.nvmrc` is in repo root. User has nvm auto-use — no PATH prefix needed.

## Conventions
- All API routes under `app/api/`
- Tests colocated: `foo.test.ts` next to `foo.ts`
- E2E tests in `e2e/` directory
- Supabase migrations in `supabase/migrations/`
- Use `vitest` for unit/integration, `playwright` for e2e

## Current Stage
**All stages complete** (Stage 10 Capacitor skipped — web-only for now)

## Key Decisions
- Strava OAuth for auth (no separate email/password)
- RLS policies so users only see their own data
- Component types: chain, cassette, chainring, tire_front, tire_rear, brake_pads, cables, bar_tape, custom
