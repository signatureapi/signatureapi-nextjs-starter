import { describe, expect, it } from "vitest";
import { Webhook } from "standardwebhooks";
import { POST } from "@/app/webhooks/signatureapi/route";
import { findAgreement } from "@/lib/agreements";
import { db } from "@/lib/db";
import { agreements } from "@/lib/db/schema";

const webhook = new Webhook(process.env.SIGNATUREAPI_WEBHOOK_SECRET!);

function signedRequest(type: string, envelopeId: string, signer = webhook) {
  const id = `evt_${Math.random().toString(36).slice(2)}`;
  const timestamp = new Date();
  const body = JSON.stringify({
    id,
    type,
    timestamp: timestamp.toISOString(),
    data: { envelope_id: envelopeId, object_id: envelopeId, object_type: "envelope", envelope_metadata: {} },
  });
  return new Request("http://localhost/webhooks/signatureapi", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "webhook-id": id,
      "webhook-timestamp": String(Math.floor(timestamp.getTime() / 1000)),
      "webhook-signature": signer.sign(id, timestamp, body),
    },
    body,
  });
}

function agreementWithEnvelope(envelopeId: string) {
  return db.insert(agreements).values({ signerName: "Ada", signerEmail: "ada@example.com", envelopeId }).returning().get();
}

describe("POST /webhooks/signatureapi", () => {
  it("marks the agreement completed on envelope.completed", async () => {
    const agreement = agreementWithEnvelope("env_1");

    const res = await POST(signedRequest("envelope.completed", "env_1"));

    expect(res.status).toBe(204);
    expect(findAgreement(agreement.id)?.status).toBe("completed");
  });

  it.each([
    ["recipient.rejected", "rejected"],
    ["envelope.failed", "failed"],
    ["envelope.canceled", "canceled"],
  ])("maps %s to %s", async (type, status) => {
    const agreement = agreementWithEnvelope("env_1");
    await POST(signedRequest(type, "env_1"));
    expect(findAgreement(agreement.id)?.status).toBe(status);
  });

  it("rejects a bad signature with 401 and changes nothing", async () => {
    const agreement = agreementWithEnvelope("env_1");
    const forger = new Webhook("whsec_" + Buffer.from("not-the-real-secret").toString("base64"));

    const res = await POST(signedRequest("envelope.completed", "env_1", forger));

    expect(res.status).toBe(401);
    expect(findAgreement(agreement.id)?.status).toBe("sent");
  });

  it("acknowledges other event types without changes", async () => {
    const agreement = agreementWithEnvelope("env_1");

    const res = await POST(signedRequest("recipient.viewed", "env_1"));

    expect(res.status).toBe(204);
    expect(findAgreement(agreement.id)?.status).toBe("sent");
  });

  it("acknowledges events for unknown envelopes", async () => {
    const res = await POST(signedRequest("envelope.completed", "env_unknown"));
    expect(res.status).toBe(204);
  });

  it("never moves a terminal status", async () => {
    const agreement = agreementWithEnvelope("env_1");

    await POST(signedRequest("envelope.completed", "env_1"));
    await POST(signedRequest("envelope.canceled", "env_1"));

    expect(findAgreement(agreement.id)?.status).toBe("completed");
  });
});
