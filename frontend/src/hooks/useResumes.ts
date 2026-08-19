import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { resumeApi } from "@/api/resumeApi";
import type { Resume } from "@/types/resume.types";

export function useResumeList() {
  return useQuery({ queryKey: ["resumes"], queryFn: resumeApi.list });
}

export function useResume(resumeId: string | undefined) {
  return useQuery({
    queryKey: ["resumes", resumeId],
    queryFn: () => resumeApi.get(resumeId as string),
    enabled: !!resumeId,
  });
}

export function useCreateResume() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (title: string) => resumeApi.create(title),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["resumes"] }),
  });
}

export function useUpdateResumeDetails(resumeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Parameters<typeof resumeApi.updateDetails>[1]) => resumeApi.updateDetails(resumeId, payload),
    onSuccess: (updated) => {
      queryClient.setQueryData(["resumes", resumeId], updated);
      queryClient.invalidateQueries({ queryKey: ["resumes"] });
    },
  });
}

export function useDeleteResume() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (resumeId: string) => resumeApi.delete(resumeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resumes"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

/**
 * Builds add/update/remove mutations for one resume sub-section. Every
 * section's mutations invalidate the same resume query, since the section
 * endpoints (except Projects/Custom Sections, which return the updated
 * sub-tree directly) don't return the whole resume - simplest correct
 * approach is "something changed, refetch the resume".
 */
export function useSectionMutations<TRequest>(
  resumeId: string,
  sectionApi: {
    add: (resumeId: string, payload: TRequest) => Promise<unknown>;
    update: (resumeId: string, itemId: string, payload: TRequest) => Promise<unknown>;
    remove: (resumeId: string, itemId: string) => Promise<unknown>;
  }
) {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["resumes", resumeId] });

  const add = useMutation({
    mutationFn: (payload: TRequest) => sectionApi.add(resumeId, payload),
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: ({ itemId, payload }: { itemId: string; payload: TRequest }) => sectionApi.update(resumeId, itemId, payload),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (itemId: string) => sectionApi.remove(resumeId, itemId),
    onSuccess: invalidate,
  });

  return { add, update, remove };
}

export function invalidateResume(queryClient: ReturnType<typeof useQueryClient>, resumeId: string) {
  queryClient.invalidateQueries({ queryKey: ["resumes", resumeId] });
}

export type { Resume };
