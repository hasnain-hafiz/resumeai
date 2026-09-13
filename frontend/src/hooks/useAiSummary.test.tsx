import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { act } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useGenerateAiSummary } from "@/hooks/useAiSummary";
import type { GenerateSummaryResponse } from "@/types/ai.types";

vi.mock("@/api/aiApi", () => ({
  aiSummaryApi: { generate: vi.fn() },
}));

import { aiSummaryApi } from "@/api/aiApi";

const RESUME_ID = "resume-1";

function setup() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { queryClient, wrapper, invalidateSpy };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("useGenerateAiSummary", () => {
  it("calls the API with the resume id and payload, and invalidates the dashboard query on success", async () => {
    const response: GenerateSummaryResponse = { summary: "A concise, achievement-oriented pitch.", aiUsageRemaining: 41 };
    vi.mocked(aiSummaryApi.generate).mockResolvedValue(response);

    const { wrapper, invalidateSpy } = setup();
    const { result } = renderHook(() => useGenerateAiSummary(RESUME_ID), { wrapper });

    act(() => {
      result.current.mutate({ careerLevel: "MID_LEVEL", targetRole: "Backend Engineer" });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(aiSummaryApi.generate).toHaveBeenCalledWith(RESUME_ID, { careerLevel: "MID_LEVEL", targetRole: "Backend Engineer" });
    expect(result.current.data).toEqual(response);
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["dashboard"] });
  });

  it("surfaces the error when generation fails", async () => {
    vi.mocked(aiSummaryApi.generate).mockRejectedValue(new Error("Quota exceeded"));

    const { wrapper } = setup();
    const { result } = renderHook(() => useGenerateAiSummary(RESUME_ID), { wrapper });

    act(() => {
      result.current.mutate({ careerLevel: "JUNIOR" });
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
