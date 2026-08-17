import { apiClient } from "@/lib/axiosClient";
import type { DashboardSummary } from "@/types/dashboard.types";

export const dashboardApi = {
  getSummary: (activityLimit = 10) =>
    apiClient
      .get<DashboardSummary>("/dashboard", { params: { activityLimit } })
      .then((r) => r.data),
};
