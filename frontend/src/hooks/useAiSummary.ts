import { useMutation, useQueryClient } from "@tanstack/react-query";
import { aiSummaryApi } from "@/api/aiApi";
import type { GenerateSummaryRequest } from "@/types/ai.types";

/**
 * Generation only - it does not save the resume. The caller is responsible for letting the
 * user review the suggestion (and apply it into the summary field) before it's persisted via
 * the existing resume details save, matching how Resume Import treats extracted data.
 */
export function useGenerateAiSummary(resumeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: GenerateSummaryRequest) => aiSummaryApi.generate(resumeId, payload),
    onSuccess: () => {
      // The AI usage counter on the dashboard just changed.
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
