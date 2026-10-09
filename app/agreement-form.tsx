"use client";

import { useActionState } from "react";
import { sendAgreement } from "./actions";

export function AgreementForm() {
  const [state, formAction] = useActionState(sendAgreement, {});

  return (
    <>
      <form action={formAction}>
        <label>
          Signer name <input name="signer_name" required autoComplete="off" />
        </label>
        <label>
          Signer email <input name="signer_email" type="email" required autoComplete="off" />
        </label>
        <button type="submit">Send for signature</button>
      </form>
      {state.error && (
        <p className="error" role="alert">
          {state.error}
        </p>
      )}
    </>
  );
}
