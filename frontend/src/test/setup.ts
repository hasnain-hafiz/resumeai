import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Unmount any rendered component between tests so one test's DOM never
// leaks into the next (Testing Library doesn't do this automatically
// outside of Jest's global afterEach convention).
afterEach(() => {
  cleanup();
});
