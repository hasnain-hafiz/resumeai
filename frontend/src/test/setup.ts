import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// jsdom doesn't implement ResizeObserver. usePageCount() guards against its
// absence (so nothing crashes without this), but this stub keeps components
// like TemplateRenderer behaving closer to how they would in a real browser
// for any test that renders them.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver;
}

// Unmount any rendered component between tests so one test's DOM never
// leaks into the next (Testing Library doesn't do this automatically
// outside of Jest's global afterEach convention).
afterEach(() => {
  cleanup();
});
