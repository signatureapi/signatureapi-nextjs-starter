import { findAgreement } from "@/lib/agreements";
import { listDeliverables } from "@/lib/signatureapi";

// Deliverable URLs expire after an hour, so fetch a fresh one on every
// download instead of storing it.
export async function GET(_request: Request, ctx: RouteContext<"/agreements/[id]/signed.pdf">) {
  const { id } = await ctx.params;
  const agreement = findAgreement(Number(id));
  if (!agreement?.envelopeId || agreement.status !== "completed") {
    return new Response("Agreement not found or not completed.", { status: 404 });
  }

  const [deliverable] = await listDeliverables(agreement.envelopeId);
  if (!deliverable?.url) {
    return new Response("The signed PDF is not ready yet. Try again in a few seconds.", { status: 404 });
  }

  return Response.redirect(deliverable.url, 302);
}
