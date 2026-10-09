import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    env: { DATABASE_URL: ":memory:", SIGNATUREAPI_KEY: "key_test_unit", SIGNATUREAPI_WEBHOOK_SECRET: "whsec_dGVzdC1zZWNyZXQtZm9yLXVuaXQtdGVzdHM=" },
    include: ["tests/**/*.test.ts"],
    setupFiles: ["tests/setup.ts"],
  },
});
