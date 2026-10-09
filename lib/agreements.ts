import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { agreements, type AgreementStatus } from "@/lib/db/schema";

export function listAgreements() {
  return db.select().from(agreements).orderBy(desc(agreements.createdAt), desc(agreements.id)).all();
}

export function findAgreement(id: number) {
  return db.select().from(agreements).where(eq(agreements.id, id)).get();
}

/**
 * Moves an agreement out of `sent`. Terminal statuses never change again,
 * so a late or repeated event is harmless.
 */
export function finishAgreement(envelopeId: string, status: Exclude<AgreementStatus, "sent">) {
  db.update(agreements)
    .set({ status })
    .where(and(eq(agreements.envelopeId, envelopeId), eq(agreements.status, "sent")))
    .run();
}
