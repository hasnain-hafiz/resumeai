export type LayoutEngine = "classic" | "sidebar";
export type HeadingStyle = "uppercase" | "bordered" | "bar" | "plain";
export type Density = "compact" | "comfortable" | "spacious";
export type PhotoShape = "circle" | "square" | "none";

export interface TemplateTheme {
  key: string; // must match the `key` seeded in V4__resume_templates_schema.sql
  layout: LayoutEngine;
  colors: {
    background: string;
    sidebarBackground?: string;
    text: string;
    sidebarText?: string;
    muted: string;
    sidebarMuted?: string;
    accent: string;
    divider: string;
  };
  fonts: {
    display: string;
    body: string;
  };
  headingStyle: HeadingStyle;
  density: Density;
  photoShape: PhotoShape;
  /** "lines" (plain comma-separated text) is safer for ATS parsing and more formal; "tags" (pill chips) reads more modern/casual. */
  skillsLayout: "tags" | "lines";
}

// Font stacks. Deliberately mostly system/web-safe fonts rather than loading
// 20 different Google Fonts - and for the classic academic/ATS templates,
// Times New Roman/Arial is more authentic to the genre than a trendy
// typeface would be, not just a performance shortcut.
const SERIF_CLASSIC = "'Times New Roman', Times, serif";
const SERIF_BOOK = "Georgia, 'Iowan Old Style', serif";
const SANS_SYSTEM = "Arial, Helvetica, sans-serif";
const SANS_APP = "'Inter', system-ui, sans-serif";
const DISPLAY_SERIF = "'Fraunces', Georgia, serif";
const MONO = "'IBM Plex Mono', 'Courier New', monospace";

export const TEMPLATE_THEMES: Record<string, TemplateTheme> = {
  modern: {
    key: "modern", layout: "classic",
    colors: { background: "#FFFFFF", text: "#16181D", muted: "#5B6270", accent: "#5B5FEF", divider: "#E7E8EE" },
    fonts: { display: SANS_APP, body: SANS_APP },
    headingStyle: "uppercase", density: "comfortable", photoShape: "none", skillsLayout: "tags",
  },
  minimal: {
    key: "minimal", layout: "classic",
    colors: { background: "#FFFFFF", text: "#1A1A1A", muted: "#767676", accent: "#1A1A1A", divider: "#E5E5E5" },
    fonts: { display: SANS_APP, body: SANS_APP },
    headingStyle: "plain", density: "spacious", photoShape: "none", skillsLayout: "lines",
  },
  corporate: {
    key: "corporate", layout: "classic",
    colors: { background: "#FFFFFF", text: "#1C2430", muted: "#5B6B7C", accent: "#1E3A5F", divider: "#D6DEE6" },
    fonts: { display: SERIF_BOOK, body: SANS_SYSTEM },
    headingStyle: "bordered", density: "comfortable", photoShape: "none", skillsLayout: "lines",
  },
  harvard: {
    key: "harvard", layout: "classic",
    colors: { background: "#FFFFFF", text: "#000000", muted: "#333333", accent: "#A41E22", divider: "#000000" },
    fonts: { display: SERIF_CLASSIC, body: SERIF_CLASSIC },
    headingStyle: "bordered", density: "compact", photoShape: "none", skillsLayout: "lines",
  },
  stanford: {
    key: "stanford", layout: "classic",
    colors: { background: "#FFFFFF", text: "#2B2B2B", muted: "#6E6E6E", accent: "#8C1515", divider: "#DDDDDD" },
    fonts: { display: SERIF_CLASSIC, body: SANS_SYSTEM },
    headingStyle: "plain", density: "comfortable", photoShape: "none", skillsLayout: "lines",
  },
  executive: {
    key: "executive", layout: "classic",
    colors: { background: "#FFFFFF", text: "#22252B", muted: "#6B6F76", accent: "#B08D57", divider: "#E3DED3" },
    fonts: { display: DISPLAY_SERIF, body: SANS_APP },
    headingStyle: "bar", density: "spacious", photoShape: "none", skillsLayout: "lines",
  },
  "ats-friendly": {
    key: "ats-friendly", layout: "classic",
    colors: { background: "#FFFFFF", text: "#000000", muted: "#333333", accent: "#000000", divider: "#000000" },
    fonts: { display: SANS_SYSTEM, body: SANS_SYSTEM },
    headingStyle: "bordered", density: "compact", photoShape: "none", skillsLayout: "lines",
  },
  academic: {
    key: "academic", layout: "classic",
    colors: { background: "#FFFFFF", text: "#241C1C", muted: "#5C5150", accent: "#7A1F2B", divider: "#E4DCDC" },
    fonts: { display: SERIF_BOOK, body: SERIF_BOOK },
    headingStyle: "bar", density: "comfortable", photoShape: "none", skillsLayout: "lines",
  },
  elegant: {
    key: "elegant", layout: "classic",
    colors: { background: "#FFFDFC", text: "#2B2422", muted: "#8A7A76", accent: "#B76E79", divider: "#EFE1E3" },
    fonts: { display: DISPLAY_SERIF, body: SANS_APP },
    headingStyle: "plain", density: "spacious", photoShape: "none", skillsLayout: "tags",
  },
  compact: {
    key: "compact", layout: "classic",
    colors: { background: "#FFFFFF", text: "#1B1F27", muted: "#697180", accent: "#475569", divider: "#E2E5EA" },
    fonts: { display: SANS_APP, body: SANS_APP },
    headingStyle: "uppercase", density: "compact", photoShape: "none", skillsLayout: "lines",
  },
  student: {
    key: "student", layout: "classic",
    colors: { background: "#FFFFFF", text: "#1A2333", muted: "#5C6B84", accent: "#2563EB", divider: "#DCE5F7" },
    fonts: { display: SANS_APP, body: SANS_APP },
    headingStyle: "uppercase", density: "comfortable", photoShape: "none", skillsLayout: "tags",
  },
  monochrome: {
    key: "monochrome", layout: "classic",
    colors: { background: "#FFFFFF", text: "#000000", muted: "#555555", accent: "#000000", divider: "#CCCCCC" },
    fonts: { display: SANS_APP, body: SANS_APP },
    headingStyle: "plain", density: "comfortable", photoShape: "none", skillsLayout: "lines",
  },
  editorial: {
    key: "editorial", layout: "classic",
    colors: { background: "#FFFDF9", text: "#1E1B18", muted: "#7A7168", accent: "#C0392B", divider: "#1E1B18" },
    fonts: { display: DISPLAY_SERIF, body: SANS_APP },
    headingStyle: "bordered", density: "spacious", photoShape: "none", skillsLayout: "lines",
  },

  // --- sidebar layout templates ---
  google: {
    key: "google", layout: "sidebar",
    colors: {
      background: "#FFFFFF", sidebarBackground: "#F3F6FF", text: "#1F2430",
      sidebarText: "#1F2430", muted: "#5B6270", sidebarMuted: "#5B6270", accent: "#4285F4", divider: "#E5EAF5",
    },
    fonts: { display: SANS_APP, body: SANS_APP },
    headingStyle: "uppercase", density: "comfortable", photoShape: "circle", skillsLayout: "tags",
  },
  apple: {
    key: "apple", layout: "sidebar",
    colors: {
      background: "#FFFFFF", sidebarBackground: "#FAFAFA", text: "#1D1D1F",
      sidebarText: "#1D1D1F", muted: "#6E6E73", sidebarMuted: "#6E6E73", accent: "#1D1D1F", divider: "#E8E8ED",
    },
    fonts: { display: SANS_APP, body: SANS_APP },
    headingStyle: "plain", density: "spacious", photoShape: "circle", skillsLayout: "lines",
  },
  developer: {
    key: "developer", layout: "sidebar",
    colors: {
      background: "#FFFFFF", sidebarBackground: "#0F1720", text: "#1A1F29",
      sidebarText: "#E7EEF5", muted: "#586275", sidebarMuted: "#93A1B5", accent: "#10B981", divider: "#E2E6EC",
    },
    fonts: { display: MONO, body: SANS_APP },
    headingStyle: "bar", density: "comfortable", photoShape: "square", skillsLayout: "tags",
  },
  creative: {
    key: "creative", layout: "sidebar",
    colors: {
      background: "#FFFFFF", sidebarBackground: "#FF6B4A", text: "#221C1A",
      sidebarText: "#FFF6F2", muted: "#6E655F", sidebarMuted: "#FFDCD1", accent: "#FF6B4A", divider: "#F0E4DF",
    },
    fonts: { display: DISPLAY_SERIF, body: SANS_APP },
    headingStyle: "bar", density: "comfortable", photoShape: "circle", skillsLayout: "tags",
  },
  dark: {
    key: "dark", layout: "sidebar",
    colors: {
      background: "#14151A", sidebarBackground: "#0B0C10", text: "#F2F3F7",
      sidebarText: "#F2F3F7", muted: "#9498A8", sidebarMuted: "#9498A8", accent: "#8B5CF6", divider: "#2B2D38",
    },
    fonts: { display: SANS_APP, body: SANS_APP },
    headingStyle: "bar", density: "comfortable", photoShape: "circle", skillsLayout: "tags",
  },
  "professional-two-column": {
    key: "professional-two-column", layout: "sidebar",
    colors: {
      background: "#FFFFFF", sidebarBackground: "#0F4C5C", text: "#1B2430",
      sidebarText: "#EAF4F6", muted: "#5B6270", sidebarMuted: "#B9D8DE", accent: "#0F4C5C", divider: "#DCE6E9",
    },
    fonts: { display: SERIF_BOOK, body: SANS_APP },
    headingStyle: "uppercase", density: "comfortable", photoShape: "square", skillsLayout: "lines",
  },
  timeline: {
    key: "timeline", layout: "sidebar",
    colors: {
      background: "#FFFFFF", sidebarBackground: "#F5F1FA", text: "#241E2E",
      sidebarText: "#241E2E", muted: "#6E647F", sidebarMuted: "#6E647F", accent: "#6B4C93", divider: "#E4DCF0",
    },
    fonts: { display: DISPLAY_SERIF, body: SANS_APP },
    headingStyle: "bar", density: "comfortable", photoShape: "circle", skillsLayout: "tags",
  },
};

export function getTheme(key: string | null | undefined): TemplateTheme {
  return (key && TEMPLATE_THEMES[key]) || TEMPLATE_THEMES.modern;
}
