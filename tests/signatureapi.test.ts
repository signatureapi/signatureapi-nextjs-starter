import { afterEach, describe, expect, it, vi } from "vitest";
import { createEnvelope, listDeliverables, SignatureApiError, uploadDocument } from "@/lib/signatureapi";

const fetchMock = vi.fn<typeof fetch>();
vi.stubGlobal("fetch", fetchMock);
afterEach(() => fetchMock.mockReset());

describe("SignatureAPI client", () => {
  it("uploads raw PDF bytes and returns the upload url", async () => {
    fetchMock.mockResolvedValue(Response.json({ url: "https://api.signatureapi.com/v1/uploads/upl_1" }, { status: 201 }));

    const url = await uploadDocument(new Uint8Array([37, 80, 68, 70]));

    expect(url).toBe("https://api.signatureapi.com/v1/uploads/upl_1");
    const [requestUrl, init] = fetchMock.mock.calls[0];
    expect(requestUrl).toBe("https://api.signatureapi.com/v1/uploads");
    expect(init?.method).toBe("POST");
    expect(init?.headers).toMatchObject({ "X-API-Key": "key_test_unit", "Content-Type": "application/pdf" });
  });

  it("creates an envelope with one signer and one signature place", async () => {
    fetchMock.mockResolvedValue(Response.json({ id: "env_1" }, { status: 201 }));

    await createEnvelope({
      agreementId: 7,
      signerName: "Ada Lovelace",
      signerEmail: "ada@example.com",
      documentUrl: "https://api.signatureapi.com/v1/uploads/upl_1",
    });

    const [requestUrl, init] = fetchMock.mock.calls[0];
    expect(requestUrl).toBe("https://api.signatureapi.com/v1/envelopes");
    expect(JSON.parse(String(init?.body))).toEqual({
      title: "Sample agreement",
      documents: [
        {
          format: "pdf",
          url: "https://api.signatureapi.com/v1/uploads/upl_1",
          places: [{ key: "signer_signature", type: "signature", recipient_key: "signer" }],
        },
      ],
      recipients: [{ type: "signer", key: "signer", name: "Ada Lovelace", email: "ada@example.com" }],
      metadata: { agreement_id: "7" },
    });
  });

  it("lists deliverables", async () => {
    fetchMock.mockResolvedValue(Response.json({ data: [{ id: "del_1", status: "generated", url: "https://files/x.pdf" }] }));

    await expect(listDeliverables("env_1")).resolves.toEqual([{ id: "del_1", status: "generated", url: "https://files/x.pdf" }]);
    expect(fetchMock.mock.calls[0][0]).toBe("https://api.signatureapi.com/v1/envelopes/env_1/deliverables");
  });

  it("turns a problem response into a SignatureApiError", async () => {
    fetchMock.mockResolvedValue(
      Response.json(
        { type: "https://signatureapi.com/docs/v1/errors/validation-error", title: "Validation Error", status: 422, errors: ["recipients[0].email must be a valid email address"] },
        { status: 422 },
      ),
    );

    const error = await createEnvelope({ agreementId: 1, signerName: "A", signerEmail: "bad", documentUrl: "https://x" }).catch((e) => e);
    expect(error).toBeInstanceOf(SignatureApiError);
    expect(error.message).toBe("recipients[0].email must be a valid email address");
    expect(error.status).toBe(422);
  });
});
