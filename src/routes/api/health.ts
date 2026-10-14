import type { APIEvent } from "@solidjs/start/server";
import { db } from "~/db/client";
import { sql } from "drizzle-orm";

type DbResult =
  | { ok: true }
  | { ok: false; name: string; message: string };

export async function GET(_event: APIEvent) {
  const env = {
    DATABASE_URL_set:
      typeof process.env.DATABASE_URL === "string" &&
      process.env.DATABASE_URL.length > 0,
    DATABASE_URL_length: (process.env.DATABASE_URL ?? "").length,
  };

  let dbResult: DbResult;

  try {
    await db.execute(sql`select 1 as ok`);
    dbResult = { ok: true };
  } catch (err) {
    dbResult = {
      ok: false,
      name: err instanceof Error ? err.name : "unknown",
      message: err instanceof Error ? err.message : String(err),
    };
  }

  return Response.json(
    { env, db: dbResult },
    { status: dbResult.ok ? 200 : 500 }
  );
}
