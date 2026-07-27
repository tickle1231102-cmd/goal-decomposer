/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

function loadEnv() {
  const envPath = path.join(__dirname, "..", ".env");
  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
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

async function tryConnect(label, connectionString) {
  let username = "unknown";
  try {
    username = decodeURIComponent(new URL(connectionString).username);
  } catch {
    // ignore parse errors
  }

  const client = new Client({
    connectionString,
    connectionTimeoutMillis: 10_000,
  });

  try {
    await client.connect();
    const result = await client.query("SELECT 1 AS ok");
    console.log(
      `✅ ${label}: connected as "${username}" (${JSON.stringify(result.rows[0])})`,
    );
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`❌ ${label} (user: ${username}): ${message.split("\n")[0]}`);
    return false;
  } finally {
    await client.end().catch(() => undefined);
  }
}

async function main() {
  loadEnv();

  const databaseUrl = process.env.DATABASE_URL;
  const directUrl = process.env.DIRECT_URL;

  if (!databaseUrl) {
    console.error("DATABASE_URL is missing in .env");
    process.exit(1);
  }

  console.log("Testing Supabase connections from .env...\n");

  if (directUrl && directUrl !== databaseUrl) {
    await tryConnect("DIRECT_URL", directUrl);
  }

  await tryConnect("DATABASE_URL", databaseUrl);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
