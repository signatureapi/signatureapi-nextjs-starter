"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { db } from "@/lib/db";
import { agreements } from "@/lib/db/schema";
import { createEnvelope, uploadDocument } from "@/lib/signatureapi";

export type SendAgreementState = { error?: string };

export async function sendAgreement(_prev: SendAgreementState, formData: FormData): Promise<SendAgreementState> {
  const signerName = String(formData.get("signer_name") ?? "").trim();
  const signerEmail = String(formData.get("signer_email") ?? "").trim();
  if (!signerName || !signerEmail) return { error: "Could not create the envelope: name and email are required." };

  const agreement = db.insert(agreements).values({ signerName, signerEmail }).returning().get();
  try {
    const pdf = await readFile(path.join(process.cwd(), "assets", "sample-agreement.pdf"));
    const documentUrl = await uploadDocument(pdf);
    const envelope = await createEnvelope({ agreementId: agreement.id, signerName, signerEmail, documentUrl });
    db.update(agreements).set({ envelopeId: envelope.id }).where(eq(agreements.id, agreement.id)).run();
  } catch (error) {
    db.delete(agreements).where(eq(agreements.id, agreement.id)).run();
    return { error: `Could not create the envelope: ${(error as Error).message}` };
  }

  revalidatePath("/");
  redirect("/");
}
