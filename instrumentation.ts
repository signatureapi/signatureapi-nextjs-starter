// Runs once when the Next.js server starts.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  if (!process.env.SIGNATUREAPI_KEY) {
    console.error(
      "SIGNATUREAPI_KEY is not set. Run `npx --yes signatureapi init --env-path .env.local` to write a test key to .env.local.",
    );
    process.exit(1);
  }

  const { migrateDatabase } = await import("@/lib/db");
  migrateDatabase();
}
