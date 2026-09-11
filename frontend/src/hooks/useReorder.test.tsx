import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { act } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useReorderListItems, useReorderSectionItems, useReorderSections } from "@/hooks/useReorder";
import type { Resume } from "@/types/resume.types";

vi.mock("@/api/resumeApi", () => ({
  resumeApi: { reorderSections: vi.fn() },
}));
vi.mock("@/api/resumeSectionsApi", () => ({
  listItemApi: { reorder: vi.fn() },
}));

import { resumeApi } from "@/api/resumeApi";
import { listItemApi } from "@/api/resumeSectionsApi";

const RESUME_ID = "resume-1";

function baseResume(): Resume {
  return {
    id: RESUME_ID,
    title: "Test Resume",
    sectionOrder: ["EXPERIENCE", "EDUCATION", "PROJECTS", "SKILLS", "CERTIFICATIONS", "AWARDS", "PUBLICATIONS", "VOLUNTEER", "REFERENCES", "CUSTOM_SECTIONS"],
    experience: [
      { id: "e1", sortOrder: 0 } as Resume["experience"][number],
      { id: "e2", sortOrder: 1 } as Resume["experience"][number],
    ],
    projects: [],
    listItems: [
      { id: "s1", section: "TECHNICAL_SKILL", value: "React", proficiency: null, sortOrder: 0 },
      { id: "s2", section: "TECHNICAL_SKILL", value: "SQL", proficiency: null, sortOrder: 1 },
      { id: "l1", section: "SPOKEN_LANGUAGE", value: "English", proficiency: null, sortOrder: 0 },
    ],
  } as unknown as Resume;
}

function setup(resume: Resume) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  queryClient.setQueryData(["resumes", RESUME_ID], resume);
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { queryClient, wrapper };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useReorderSectionItems", () => {
  it("optimistically reassigns sortOrder by the new index", async () => {
    const resume = baseResume();
    const { queryClient, wrapper } = setup(resume);
    const reorderFn = vi.fn().mockResolvedValue({});

    const { result } = renderHook(() => useReorderSectionItems(RESUME_ID, "experience", reorderFn), { wrapper });

    act(() => {
      result.current.mutate(["e2", "e1"]);
    });

    await waitFor(() => {
      const cached = queryClient.getQueryData<Resume>(["resumes", RESUME_ID]);
      expect(cached?.experience.map((e) => e.id)).toEqual(["e2", "e1"]);
      expect(cached?.experience.map((e) => e.sortOrder)).toEqual([0, 1]);
    });
  });

  it("rolls back the optimistic update if the request fails", async () => {
    const resume = baseResume();
    const { queryClient, wrapper } = setup(resume);
    const reorderFn = vi.fn().mockRejectedValue(new Error("network error"));

    const { result } = renderHook(() => useReorderSectionItems(RESUME_ID, "experience", reorderFn), { wrapper });

    act(() => {
      result.current.mutate(["e2", "e1"]);
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    const cached = queryClient.getQueryData<Resume>(["resumes", RESUME_ID]);
    expect(cached?.experience.map((e) => e.id)).toEqual(["e1", "e2"]);
  });
});

describe("useReorderListItems", () => {
  it("reorders only the targeted section group, leaving other groups untouched", async () => {
    const resume = baseResume();
    const { queryClient, wrapper } = setup(resume);
    vi.mocked(listItemApi.reorder).mockResolvedValue({});

    const { result } = renderHook(() => useReorderListItems(RESUME_ID), { wrapper });

    act(() => {
      result.current.mutate({ section: "TECHNICAL_SKILL", orderedIds: ["s2", "s1"] });
    });

    await waitFor(() => {
      const cached = queryClient.getQueryData<Resume>(["resumes", RESUME_ID]);
      const skills = cached?.listItems.filter((i) => i.section === "TECHNICAL_SKILL");
      expect(skills?.map((i) => i.id)).toEqual(["s2", "s1"]);
      const languages = cached?.listItems.filter((i) => i.section === "SPOKEN_LANGUAGE");
      expect(languages?.map((i) => i.id)).toEqual(["l1"]);
    });
  });
});

describe("useReorderSections", () => {
  it("optimistically updates sectionOrder", async () => {
    const resume = baseResume();
    const { queryClient, wrapper } = setup(resume);
    vi.mocked(resumeApi.reorderSections).mockResolvedValue(resume);

    const { result } = renderHook(() => useReorderSections(RESUME_ID), { wrapper });
    const newOrder = [
      "SKILLS", "EXPERIENCE", "EDUCATION", "PROJECTS", "CERTIFICATIONS",
      "AWARDS", "PUBLICATIONS", "VOLUNTEER", "REFERENCES", "CUSTOM_SECTIONS",
    ] as Resume["sectionOrder"];

    act(() => {
      result.current.mutate(newOrder);
    });

    await waitFor(() => {
      const cached = queryClient.getQueryData<Resume>(["resumes", RESUME_ID]);
      expect(cached?.sectionOrder[0]).toBe("SKILLS");
    });
  });
});
