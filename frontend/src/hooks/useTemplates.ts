import { useQuery } from "@tanstack/react-query";
import { templateApi } from "@/api/templateApi";

export function useTemplates() {
  return useQuery({
    queryKey: ["templates"],
    queryFn: templateApi.list,
    staleTime: 10 * 60 * 1000, // catalog rarely changes
  });
}
