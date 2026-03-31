import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import dotenv from "dotenv";

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const sqlFile = process.argv[2] || join(__dirname, "migrations", "001_conversations.sql");
const sql = readFileSync(sqlFile, "utf-8");

async function runMigration() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  });

  if (res.ok) {
    console.log("Migration executed successfully via REST API.");
    return true;
  }

  console.log("REST API approach did not work (expected for DDL).");
  console.log("Please run the following SQL in your Supabase Dashboard SQL Editor:");
  console.log("(Dashboard -> SQL Editor -> New Query -> Paste & Run)\n");
  console.log("=".repeat(60));
  console.log(sql);
  console.log("=".repeat(60));
  return false;
}

runMigration().catch((err) => {
  console.error("Error:", err.message);
  console.log("\nPlease run the SQL manually in your Supabase Dashboard SQL Editor:");
  console.log("=".repeat(60));
  console.log(sql);
  console.log("=".repeat(60));
});
