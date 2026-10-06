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
if (!file) throw new Error("usage: tsx scripts/apply-sql.ts <file.sql>");
const sql = postgres(requireEnv("DIRECT_DATABASE_URL"), { max: 1 });
sql
  .unsafe(readFileSync(file, "utf8"))
  .then(() => console.log("Applied", file))
  .finally(() => sql.end());
