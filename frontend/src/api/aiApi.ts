import { apiClient } from "@/lib/axiosClient";
import type { GenerateSummaryRequest, GenerateSummaryResponse } from "@/types/ai.types";

export const aiSummaryApi = {
  generate: (resumeId: string, payload: GenerateSummaryRequest) =>
    apiClient
      .post<GenerateSummaryResponse>(`/resumes/${resumeId}/ai/summary/generate`, payload)
      .then((r) => r.data),
};
