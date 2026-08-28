import { apiClient } from "@/lib/axiosClient";
import type { Template } from "@/types/template.types";

export const templateApi = {
  list: () => apiClient.get<Template[]>("/templates").then((r) => r.data),
};
