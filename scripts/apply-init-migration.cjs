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

async function tableExists(client, tableName) {
  const result = await client.query(
    `SELECT 1 FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = $1`,
    [tableName],
  );
  return result.rowCount > 0;
}

async function main() {
  loadEnv();

  const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DIRECT_URL or DATABASE_URL is required in .env");
    process.exit(1);
  }

  const migrationPath = path.join(
    __dirname,
    "..",
    "prisma",
    "migrations",
    "20260727163000_init",
    "migration.sql",
  );
  const sql = fs.readFileSync(migrationPath, "utf8");

  const client = new Client({ connectionString });
  await client.connect();

  try {
    if (await tableExists(client, "Goal")) {
      console.log("✅ Goal tables already exist. Skipping SQL apply.");
      return;
    }

    console.log("Applying init migration SQL...");
    await client.query(sql);
    console.log("✅ Init migration SQL applied.");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("❌ Failed to apply init migration:", error.message);
  process.exit(1);
});
