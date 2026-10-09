import { beforeEach } from "vitest";
import { db, migrateDatabase } from "@/lib/db";
import { agreements } from "@/lib/db/schema";

migrateDatabase();

beforeEach(() => {
  db.delete(agreements).run();
});
