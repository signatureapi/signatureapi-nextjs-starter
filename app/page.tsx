import { connection } from "next/server";
import { listAgreements } from "@/lib/agreements";
import { AgreementForm } from "./agreement-form";

export default function Home() {
  return (
    <main>
      <header>
        <h1>Send an agreement</h1>
        <p className="hint">A SignatureAPI e-signature API example for Next.js. Test mode: no emails are sent.</p>
      </header>

      <section className="card">
        <h2>New agreement</h2>
        <AgreementForm />
      </section>

      <section className="card">
        <h2>Agreements</h2>
        <table>
          <thead>
            <tr>
              <th>Signer</th>
              <th>Status</th>
              <th>Sent</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <AgreementRows />
          </tbody>
        </table>
      </section>
    </main>
  );
}

async function AgreementRows() {
  await connection(); // Render on every request so the list is always current.
  const rows = listAgreements();

  if (rows.length === 0) {
    return (
      <tr>
        <td colSpan={4} className="empty">
          No agreements yet.
        </td>
      </tr>
    );
  }

  return rows.map((agreement) => (
    <tr key={agreement.id} data-agreement-id={agreement.id} data-envelope-id={agreement.envelopeId ?? ""}>
      <td className="signer">
        <strong>{agreement.signerName}</strong>
        {agreement.signerEmail}
      </td>
      <td>
        <span className={`status status-${agreement.status}`} data-status={agreement.status}>
          {agreement.status.charAt(0).toUpperCase() + agreement.status.slice(1)}
        </span>
      </td>
      <td>{agreement.createdAt.toISOString().slice(0, 16).replace("T", " ")}</td>
      <td>{agreement.status === "completed" && <a href={`/agreements/${agreement.id}/signed.pdf`}>Signed PDF</a>}</td>
    </tr>
  ));
}
