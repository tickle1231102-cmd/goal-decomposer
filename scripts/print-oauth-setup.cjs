#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */

console.log(`
Goal Decomposer — Supabase OAuth setup
======================================

If Google login redirects to my-planner with ?code=..., Supabase Redirect URLs
are missing this app's callback URL. Add ALL of the following:

Dashboard:
https://supabase.com/dashboard/project/nnulpjepaearokjujbis/auth/url-configuration

Redirect URLs (Additional Redirect URLs):
  https://goal-decomposer-self.vercel.app/auth/callback
  https://goal-decomposer-self.vercel.app/**
  http://localhost:3000/auth/callback
  http://localhost:3000/**

Optional Vercel preview wildcard (Supabase docs):
  https://*-.vercel.app/**

Site URL can stay as my-planner — Redirect URLs above are required.

Vercel env (goal-decomposer project):
  NEXT_PUBLIC_SITE_URL=https://goal-decomposer-self.vercel.app
`);
