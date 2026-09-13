package com.resumeai.service.impl;

import com.resumeai.entity.AiUsageLog;
import com.resumeai.entity.User;
import com.resumeai.exception.AiQuotaExceededException;
import com.resumeai.repository.AiUsageLogRepository;
import com.resumeai.service.AiUsageService;
import com.resumeai.util.MonthlyWindow;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AiUsageServiceImpl implements AiUsageService {

    private final AiUsageLogRepository aiUsageLogRepository;

    /** Placeholder until the Subscriptions/Billing feature introduces real, plan-based quotas. */
    @Value("${app.ai.free-monthly-quota:50}")
    private long freeMonthlyAiQuota;

    @Override
    @Transactional(readOnly = true)
    public void enforceQuota(User user) {
        long used = aiUsageLogRepository.countByUserAndCreatedAtAfter(user, MonthlyWindow.startOfCurrentMonthUtc());
        if (used >= freeMonthlyAiQuota) {
            throw new AiQuotaExceededException(
                "You've used all " + freeMonthlyAiQuota + " AI generations included this month. It resets on the 1st."
            );
        }
    }

    @Override
    @Transactional
    public void recordUsage(User user, AiUsageLog.Feature feature) {
        aiUsageLogRepository.save(AiUsageLog.builder().user(user).feature(feature).build());
    }

    @Override
    @Transactional(readOnly = true)
    public long remainingQuota(User user) {
        long used = aiUsageLogRepository.countByUserAndCreatedAtAfter(user, MonthlyWindow.startOfCurrentMonthUtc());
        return Math.max(0, freeMonthlyAiQuota - used);
    }
}
