import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

// Using vitest/config's defineConfig (a typed superset of Vite's) rather than
// vite's own, so the `test` block below is type-checked - this is the single
// config file for both `vite build` and `vitest run`, no separate config needed.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: true,
    css: true,
  },
});
