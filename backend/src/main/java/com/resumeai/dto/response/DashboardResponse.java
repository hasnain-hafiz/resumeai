package com.resumeai.dto.response;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record DashboardResponse(
    Welcome welcome,
    long resumeCount,
    long coverLetterCount,
    long atsAnalysisCount,
    AiUsage aiUsage,
    List<ActivityItem> recentActivity,
    ProfileCompletion profileCompletion
) {
    public record Welcome(
        String fullName,
        String photoUrl,
        Instant memberSince
    ) {}

    public record AiUsage(
        long used,
        long monthlyLimit,
        long remaining,
        Instant resetsAt
    ) {}

    public record ActivityItem(
        UUID id,
        String type,
        String title,
        Instant createdAt
    ) {}

    public record ProfileCompletion(
        int percentage,
        List<String> missingSteps
    ) {}
}
