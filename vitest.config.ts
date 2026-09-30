import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: { alias: { "rushit/kit": path.resolve("kit/index.ts") } },
  test: { include: ["test/**/*.test.ts", "test/**/*.test.tsx"], testTimeout: 60_000 },
});
