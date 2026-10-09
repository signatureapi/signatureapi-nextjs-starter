import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const agreementStatuses = ["sent", "completed", "rejected", "failed", "canceled"] as const;
export type AgreementStatus = (typeof agreementStatuses)[number];

export const agreements = sqliteTable("agreements", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  signerName: text("signer_name").notNull(),
  signerEmail: text("signer_email").notNull(),
  // Set right after SignatureAPI creates the envelope. The envelope needs
  // the agreement id (in its metadata) first, so this starts empty.
  envelopeId: text("envelope_id").unique(),
  status: text("status", { enum: agreementStatuses }).notNull().default("sent"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date())
    .$onUpdateFn(() => new Date()),
});

export type Agreement = typeof agreements.$inferSelect;
