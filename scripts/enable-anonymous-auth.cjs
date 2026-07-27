#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */

const fs = require("fs");
const path = require("path");

function loadEnv() {
  const envPath = path.join(__dirname, "..", ".env");
  if (!fs.existsSync(envPath)) {
    return;
  }

  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;

    const key = trimmed.slice(0, eq);
    let value = trimmed.slice(eq + 1);

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

async function main() {
  loadEnv();

  const projectRef = "nnulpjepaearokjujbis";
  const token = process.env.SUPABASE_ACCESS_TOKEN;

  if (!token) {
    console.log(`
Enable Supabase Anonymous sign-ins (guest mode)
=============================================

Dashboard (manual):
  https://supabase.com/dashboard/project/${projectRef}/auth/providers
  → Anonymous sign-ins → Enable

Or run with a personal access token:
  1. Create token: https://supabase.com/dashboard/account/tokens
  2. Add to .env: SUPABASE_ACCESS_TOKEN=your_token
  3. Run: npm run auth:enable-guest
`);
    process.exit(1);
  }

  const response = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/config/auth`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        external_anonymous_users_enabled: true,
      }),
    },
  );

  const body = await response.text();

  if (!response.ok) {
    console.error("Failed to enable anonymous sign-ins:", response.status, body);
    process.exit(1);
  }

  console.log("Anonymous sign-ins enabled for project", projectRef);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
