import { Webhook } from "standardwebhooks";
import { finishAgreement } from "@/lib/agreements";

type SignatureApiEvent = {
  id: string;
  type: string;
  timestamp: string;
  data: { envelope_id?: string; object_id: string; object_type: string };
};

// Event type -> agreement status. Add an entry to react to another event.
const statusByEvent = {
  "envelope.completed": "completed",
  "recipient.rejected": "rejected",
  "envelope.failed": "failed",
  "envelope.canceled": "canceled",
} as const;

export async function POST(request: Request) {
  // Verify the raw body exactly as sent: parsing and re-serializing JSON
  // would change the bytes and break the signature.
  const body = await request.text();

  let event: SignatureApiEvent;
  try {
    const secret = process.env.SIGNATUREAPI_WEBHOOK_SECRET;
    if (!secret) throw new Error("SIGNATUREAPI_WEBHOOK_SECRET is not set");
    event = new Webhook(secret).verify(body, Object.fromEntries(request.headers)) as SignatureApiEvent;
  } catch (error) {
    console.warn("Rejected SignatureAPI webhook:", (error as Error).message);
    return new Response(null, { status: 401 });
  }

  const status = statusByEvent[event.type as keyof typeof statusByEvent];
  // Unknown envelopes and other event types are acknowledged and ignored.
  if (status && event.data.envelope_id) finishAgreement(event.data.envelope_id, status);

  return new Response(null, { status: 204 });
}
