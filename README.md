# awssbguc-web

Next.js (App Router) + Supabase scaffold for AWSSBG-UC.

## Stack

- Next.js 14, TypeScript, Tailwind CSS
- Supabase (`@supabase/ssr`) with cookie-based auth, wired for
  Server Components, Client Components, and middleware session refresh

## Structure

```
app/
  (auth)/login/      login page (placeholder)
  (auth)/signup/     signup page (placeholder)
  dashboard/         example protected route
  layout.tsx
  page.tsx
lib/supabase/
  client.ts          browser client (Client Components)
  server.ts          server client (Server Components, Route Handlers, Server Actions)
middleware.ts         refreshes the Supabase session cookie on every request
types/supabase.ts      placeholder for generated DB types
```

## Setup

1. `npm install`
2. Copy env vars: `cp .env.local.example .env.local` and fill in your
   Supabase project URL + anon key (Project Settings → API in the
   Supabase dashboard).
3. `npm run dev` — runs at http://localhost:3000

## Next steps

- Build out the three-tier role model (likely a `profiles` table with
  a `role` column + Postgres RLS policies)
- Wire the login/signup forms to `supabase.auth.signInWithPassword` /
  `signUp`
- Add route protection in `middleware.ts` for `/dashboard` once roles exist
- Generate real DB types once the schema is in place:
  `npx supabase gen types typescript --project-id <id> > types/supabase.ts`
- Event registration (v1.1 scope, per the existing PRD/SPEC)

