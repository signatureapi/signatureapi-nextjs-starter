// The one place that talks to SignatureAPI. Plain REST over fetch; there is no SDK.
// Request and response shapes: https://spec.signatureapi.com/openapi.yaml

const BASE_URL = "https://api.signatureapi.com/v1";

export class SignatureApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "SignatureApiError";
  }
}

export type Deliverable = {
  id: string;
  status: "pending" | "processing" | "generated" | "failed";
  /** Pre-signed download URL, null until generated. Expires after one hour. */
  url: string | null;
};

/** Uploads a file and returns its temporary URL, usable as a document `url` for 24 hours. */
export async function uploadDocument(bytes: Uint8Array<ArrayBuffer>): Promise<string> {
  const upload = await request<{ url: string }>("POST", "/uploads", {
    body: bytes,
    contentType: "application/pdf",
  });
  return upload.url;
}

export async function createEnvelope(input: {
  agreementId: number;
  signerName: string;
  signerEmail: string;
  documentUrl: string;
}): Promise<{ id: string }> {
  return request("POST", "/envelopes", {
    json: {
      title: "Sample agreement",
      documents: [
        {
          format: "pdf",
          url: input.documentUrl,
          // Bound to the [[signer_signature]] placeholder in the PDF.
          places: [{ key: "signer_signature", type: "signature", recipient_key: "signer" }],
        },
      ],
      // No `ceremony`: SignatureAPI emails the signer a link (email_link, the default).
      recipients: [{ type: "signer", key: "signer", name: input.signerName, email: input.signerEmail }],
      metadata: { agreement_id: String(input.agreementId) },
    },
  });
}

export async function listDeliverables(envelopeId: string): Promise<Deliverable[]> {
  const page = await request<{ data: Deliverable[] }>(
    "GET",
    `/envelopes/${encodeURIComponent(envelopeId)}/deliverables`,
  );
  return page.data;
}

async function request<T>(
  method: string,
  path: string,
  options: { json?: unknown; body?: BodyInit; contentType?: string } = {},
): Promise<T> {
  const apiKey = process.env.SIGNATUREAPI_KEY;
  if (!apiKey) throw new Error("SIGNATUREAPI_KEY is not set. Run `npx --yes signatureapi init --env-path .env.local`.");

  const headers: Record<string, string> = { "X-API-Key": apiKey, Accept: "application/json" };
  let body = options.body;
  if (options.json !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(options.json);
  } else if (options.contentType) {
    headers["Content-Type"] = options.contentType;
  }

  const res = await fetch(`${BASE_URL}${path}`, { method, headers, body, cache: "no-store" });
  if (!res.ok) throw new SignatureApiError(await problemMessage(res), res.status);
  return (await res.json()) as T;
}

// Errors are RFC 9457 problem details; validation errors list each problem in `errors`.
async function problemMessage(res: Response): Promise<string> {
  try {
    const problem = (await res.json()) as { title?: string; detail?: string; errors?: string[] };
    if (problem.errors?.length) return problem.errors.join("; ");
    return problem.detail ?? problem.title ?? `HTTP ${res.status}`;
  } catch {
    return `HTTP ${res.status}`;
  }
}
