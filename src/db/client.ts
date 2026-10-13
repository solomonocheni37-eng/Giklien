import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is missing. Add it to your .env file or your hosting platform's environment variables."
  );
}

// Neon's serverless HTTP driver: safe for Vercel/Node serverless functions.
const sql = neon(databaseUrl);

export const db = drizzle(sql, { schema });
