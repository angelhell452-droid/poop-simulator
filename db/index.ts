import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema.js";

export function createD1Client(d1: D1Database) {
  return drizzle(d1, { schema });
}

export * from "./schema.js";
