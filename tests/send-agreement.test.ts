import { afterEach, describe, expect, it, vi } from "vitest";
import { sendAgreement } from "@/app/actions";
import { listAgreements } from "@/lib/agreements";
import * as signatureapi from "@/lib/signatureapi";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT ${url}`);
  }),
}));
vi.mock("@/lib/signatureapi", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/signatureapi")>()),
  uploadDocument: vi.fn(),
  createEnvelope: vi.fn(),
}));

function form(name: string, email: string) {
  const data = new FormData();
  data.set("signer_name", name);
  data.set("signer_email", email);
  return data;
}

afterEach(() => vi.clearAllMocks());

describe("sendAgreement (POST /agreements)", () => {
  it("uploads the PDF, creates the envelope, saves the agreement and redirects to /", async () => {
    vi.mocked(signatureapi.uploadDocument).mockResolvedValue("https://api.signatureapi.com/v1/uploads/upl_1");
    vi.mocked(signatureapi.createEnvelope).mockResolvedValue({ id: "env_1" });

    await expect(sendAgreement({}, form("Ada Lovelace", "ada@example.com"))).rejects.toThrow("NEXT_REDIRECT /");

    const [pdf] = vi.mocked(signatureapi.uploadDocument).mock.calls[0];
    expect(Buffer.from(pdf).subarray(0, 5).toString()).toBe("%PDF-");
    const [agreement] = listAgreements();
    expect(agreement).toMatchObject({ signerName: "Ada Lovelace", signerEmail: "ada@example.com", envelopeId: "env_1", status: "sent" });
    expect(signatureapi.createEnvelope).toHaveBeenCalledWith({
      agreementId: agreement.id,
      signerName: "Ada Lovelace",
      signerEmail: "ada@example.com",
      documentUrl: "https://api.signatureapi.com/v1/uploads/upl_1",
    });
  });

  it("returns the API error and saves nothing", async () => {
    vi.mocked(signatureapi.uploadDocument).mockResolvedValue("https://api.signatureapi.com/v1/uploads/upl_1");
    vi.mocked(signatureapi.createEnvelope).mockRejectedValue(new signatureapi.SignatureApiError("Invalid API Key", 401));

    const state = await sendAgreement({}, form("Ada Lovelace", "ada@example.com"));

    expect(state).toEqual({ error: "Could not create the envelope: Invalid API Key" });
    expect(listAgreements()).toEqual([]);
  });
});
