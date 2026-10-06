import { readFileSync } from "node:fs";
import postgres from "postgres";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const file = process.argv[2];
if (!file) {
  console.error("usage: tsx scripts/apply-sql.ts <file.sql>");
  process.exitCode = 1;
  process.exit();
}

const sql = postgres(requireEnv("DIRECT_DATABASE_URL"), { max: 1 });
sql
  .unsafe(readFileSync(file, "utf8"))
  .then(() => console.log("Applied", file))
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => sql.end());
