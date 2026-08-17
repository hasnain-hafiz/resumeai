package com.resumeai.service.impl;

import com.resumeai.dto.response.DashboardResponse;
import com.resumeai.entity.ActivityEvent;
import com.resumeai.entity.User;
import com.resumeai.exception.ResourceNotFoundException;
import com.resumeai.repository.AiUsageLogRepository;
import com.resumeai.repository.AtsAnalysisRepository;
import com.resumeai.repository.CoverLetterRepository;
import com.resumeai.repository.ResumeRepository;
import com.resumeai.repository.UserRepository;
import com.resumeai.service.ActivityEventService;
import com.resumeai.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {

    private final UserRepository userRepository;
    private final ResumeRepository resumeRepository;
    private final CoverLetterRepository coverLetterRepository;
    private final AtsAnalysisRepository atsAnalysisRepository;
    private final AiUsageLogRepository aiUsageLogRepository;
    private final ActivityEventService activityEventService;

    /**
     * Placeholder until the Subscriptions/Billing feature introduces real,
     * plan-based quotas. Every account is treated as the free tier for now.
     */
    @Value("${app.ai.free-monthly-quota:50}")
    private long freeMonthlyAiQuota;

    @Override
    @Transactional(readOnly = true)
    public DashboardResponse getDashboard(UUID userId, int recentActivityLimit) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        long resumeCount = resumeRepository.countByUser(user);
        long coverLetterCount = coverLetterRepository.countByUser(user);
        long atsAnalysisCount = atsAnalysisRepository.countByUser(user);

        return new DashboardResponse(
            buildWelcome(user),
            resumeCount,
            coverLetterCount,
            atsAnalysisCount,
            buildAiUsage(user),
            buildRecentActivity(user, recentActivityLimit),
            buildProfileCompletion(user, resumeCount)
        );
    }

    private DashboardResponse.Welcome buildWelcome(User user) {
        return new DashboardResponse.Welcome(user.getFullName(), user.getPhotoUrl(), user.getCreatedAt());
    }

    private DashboardResponse.AiUsage buildAiUsage(User user) {
        Instant startOfMonth = ZonedDateTime.now(ZoneOffset.UTC)
            .withDayOfMonth(1).toLocalDate().atStartOfDay(ZoneOffset.UTC).toInstant();
        Instant startOfNextMonth = ZonedDateTime.now(ZoneOffset.UTC)
            .withDayOfMonth(1).plusMonths(1).toLocalDate().atStartOfDay(ZoneOffset.UTC).toInstant();

        long used = aiUsageLogRepository.countByUserAndCreatedAtAfter(user, startOfMonth);
        long remaining = Math.max(0, freeMonthlyAiQuota - used);

        return new DashboardResponse.AiUsage(used, freeMonthlyAiQuota, remaining, startOfNextMonth);
    }

    private List<DashboardResponse.ActivityItem> buildRecentActivity(User user, int limit) {
        return activityEventService.recent(user, limit).stream()
            .map(event -> new DashboardResponse.ActivityItem(
                event.getId(), event.getType().name(), event.getTitle(), event.getCreatedAt()
            ))
            .toList();
    }

    private DashboardResponse.ProfileCompletion buildProfileCompletion(User user, long resumeCount) {
        List<String> missingSteps = new ArrayList<>();
        int totalSteps = 3;
        int completedSteps = 0;

        if (user.isEmailVerified()) {
            completedSteps++;
        } else {
            missingSteps.add("Verify your email address");
        }

        if (user.getPhotoUrl() != null && !user.getPhotoUrl().isBlank()) {
            completedSteps++;
        } else {
            missingSteps.add("Add a profile photo");
        }

        if (resumeCount > 0) {
            completedSteps++;
        } else {
            missingSteps.add("Create your first resume");
        }

        int percentage = Math.round((completedSteps * 100f) / totalSteps);
        return new DashboardResponse.ProfileCompletion(percentage, missingSteps);
    }
}
