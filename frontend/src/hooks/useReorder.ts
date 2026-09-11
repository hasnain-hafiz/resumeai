import { useMutation, useQueryClient } from "@tanstack/react-query";
import { resumeApi } from "@/api/resumeApi";
import { listItemApi } from "@/api/resumeSectionsApi";
import type { ListItem, ListItemSection, Resume, SectionKey } from "@/types/resume.types";

/**
 * Every reorder hook below updates the `["resumes", resumeId]` cache
 * optimistically in `onMutate` (so the drag feels instant, not "drop and
 * wait for a round trip"), rolls back on error, and reconciles with the
 * server in `onSettled`. This mirrors the optimistic-update shape already
 * used elsewhere in the app, just applied to array order instead of a
 * single field.
 */

type Reorderable = { id: string; sortOrder: number };

/** For whole-list reordering: Experience, Projects. `field` is the array's key on Resume. */
export function useReorderSectionItems<TField extends "experience" | "projects">(
  resumeId: string,
  field: TField,
  reorderFn: (resumeId: string, orderedIds: string[]) => Promise<unknown>
) {
  const queryClient = useQueryClient();
  const queryKey = ["resumes", resumeId];

  return useMutation({
    mutationFn: (orderedIds: string[]) => reorderFn(resumeId, orderedIds),
    onMutate: async (orderedIds: string[]) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Resume>(queryKey);

      if (previous) {
        const items = previous[field] as unknown as Reorderable[];
        const byId = new Map(items.map((item) => [item.id, item]));
        const reordered = orderedIds
          .map((id, index) => {
            const item = byId.get(id);
            return item ? { ...item, sortOrder: index } : null;
          })
          .filter((item): item is Reorderable => item !== null);

        queryClient.setQueryData(queryKey, { ...previous, [field]: reordered });
      }

      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });
}

/** Skills/tools/frameworks/spoken languages: reorders items within one Section group at a time. */
export function useReorderListItems(resumeId: string) {
  const queryClient = useQueryClient();
  const queryKey = ["resumes", resumeId];

  return useMutation({
    mutationFn: ({ section, orderedIds }: { section: ListItemSection; orderedIds: string[] }) =>
      listItemApi.reorder(resumeId, section, orderedIds),
    onMutate: async ({ section, orderedIds }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Resume>(queryKey);

      if (previous) {
        const byId = new Map(previous.listItems.filter((i) => i.section === section).map((i) => [i.id, i]));
        const reorderedGroup = orderedIds
          .map((id, index) => {
            const item = byId.get(id);
            return item ? { ...item, sortOrder: index } : null;
          })
          .filter((item): item is ListItem => item !== null);

        const untouched = previous.listItems.filter((i) => i.section !== section);
        queryClient.setQueryData(queryKey, { ...previous, listItems: [...untouched, ...reorderedGroup] });
      }

      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });
}

/** Top-level resume section order (Experience before Education before Projects, ...). */
export function useReorderSections(resumeId: string) {
  const queryClient = useQueryClient();
  const queryKey = ["resumes", resumeId];

  return useMutation({
    mutationFn: (sectionOrder: SectionKey[]) => resumeApi.reorderSections(resumeId, sectionOrder),
    onMutate: async (sectionOrder: SectionKey[]) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Resume>(queryKey);
      if (previous) queryClient.setQueryData(queryKey, { ...previous, sectionOrder });
      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });
}
