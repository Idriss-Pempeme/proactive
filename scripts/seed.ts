import { createClient } from "@supabase/supabase-js";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../lib/db/schema";
import { seedCatalog } from "../lib/db/seed";
import type { Db } from "../lib/db/types";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const HOUSE_EMAIL = process.env.SEED_HOUSE_EMAIL ?? "academie@proactive-services.com";

async function main() {
  const supabase = createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SECRET_KEY"),
    {
      auth: { persistSession: false },
    }
  );

  // Find or create the house account (no password: owner sets it via "mot de passe oublié").
  let houseId: string | undefined;
  for (let page = 1; ; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 1000,
    });
    if (error) throw error;
    const hit = data.users.find((u) => u.email === HOUSE_EMAIL);
    if (hit) {
      houseId = hit.id;
      break;
    }
    if (data.users.length < 1000) break;
  }

  if (!houseId) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: HOUSE_EMAIL,
      email_confirm: true,
      user_metadata: { display_name: "Proactive Académie" },
    });
    if (error) throw error;
    houseId = data.user.id;
  }

  const sqlClient = postgres(requireEnv("DIRECT_DATABASE_URL"), { max: 1 });
  try {
    const result = await seedCatalog(
      drizzle(sqlClient, { schema }) as unknown as Db,
      houseId
    );
    console.log(
      "Seeded",
      result,
      "house instructor",
      HOUSE_EMAIL
    );
  } finally {
    await sqlClient.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
