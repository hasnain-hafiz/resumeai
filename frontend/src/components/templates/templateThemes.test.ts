import { describe, expect, it } from "vitest";
import { getTheme, TEMPLATE_THEMES } from "@/components/templates/templateThemes";

const REQUIRED_KEYS = [
  "modern", "minimal", "corporate", "harvard", "stanford", "executive", "ats-friendly",
  "academic", "elegant", "compact", "student", "monochrome", "editorial", "google",
  "apple", "developer", "creative", "dark", "professional-two-column", "timeline",
];

describe("TEMPLATE_THEMES catalog", () => {
  it("has at least the 20 required templates", () => {
    expect(Object.keys(TEMPLATE_THEMES).length).toBeGreaterThanOrEqual(20);
  });

  it.each(REQUIRED_KEYS)("includes the required '%s' template", (key) => {
    expect(TEMPLATE_THEMES[key]).toBeDefined();
  });

  it("gives every theme a self-consistent key", () => {
    for (const [mapKey, theme] of Object.entries(TEMPLATE_THEMES)) {
      expect(theme.key).toBe(mapKey);
    }
  });

  it("only uses the two supported layout engines", () => {
    for (const theme of Object.values(TEMPLATE_THEMES)) {
      expect(["classic", "sidebar"]).toContain(theme.layout);
    }
  });

  it("supplies sidebar-only colors for every sidebar-layout theme", () => {
    for (const theme of Object.values(TEMPLATE_THEMES)) {
      if (theme.layout === "sidebar") {
        expect(theme.colors.sidebarBackground).toBeDefined();
      }
    }
  });
});

describe("getTheme", () => {
  it("returns the matching theme for a known key", () => {
    expect(getTheme("dark").key).toBe("dark");
  });

  it("falls back to 'modern' for an unknown key", () => {
    expect(getTheme("some-template-that-does-not-exist").key).toBe("modern");
  });

  it("falls back to 'modern' for null or undefined (no template selected yet)", () => {
    expect(getTheme(null).key).toBe("modern");
    expect(getTheme(undefined).key).toBe("modern");
  });
});
