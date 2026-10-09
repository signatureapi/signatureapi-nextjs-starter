import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/agreements/[id]/signed.pdf/route";
import { db } from "@/lib/db";
import { agreements } from "@/lib/db/schema";
import * as signatureapi from "@/lib/signatureapi";

vi.mock("@/lib/signatureapi", () => ({ listDeliverables: vi.fn() }));
afterEach(() => vi.clearAllMocks());

function download(id: number) {
  return GET(new Request(`http://localhost/agreements/${id}/signed.pdf`), { params: Promise.resolve({ id: String(id) }) });
}

function completedAgreement() {
  return db
    .insert(agreements)
    .values({ signerName: "Ada", signerEmail: "ada@example.com", envelopeId: "env_1", status: "completed" })
    .returning()
    .get();
}

describe("GET /agreements/:id/signed.pdf", () => {
  it("redirects to a fresh deliverable URL", async () => {
    const agreement = completedAgreement();
    vi.mocked(signatureapi.listDeliverables).mockResolvedValue([
      { id: "del_1", status: "generated", url: "https://files.signatureapi.com/signed.pdf?sig=abc" },
    ]);

    const res = await download(agreement.id);

    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toBe("https://files.signatureapi.com/signed.pdf?sig=abc");
    expect(signatureapi.listDeliverables).toHaveBeenCalledWith("env_1");
  });

  it("returns 404 while the deliverable is not ready", async () => {
    const agreement = completedAgreement();
    vi.mocked(signatureapi.listDeliverables).mockResolvedValue([{ id: "del_1", status: "processing", url: null }]);

    expect((await download(agreement.id)).status).toBe(404);
  });

  it("returns 404 for an unknown agreement", async () => {
    expect((await download(999)).status).toBe(404);
    expect(signatureapi.listDeliverables).not.toHaveBeenCalled();
  });
});
