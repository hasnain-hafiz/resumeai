package com.resumeai.service;

import com.resumeai.entity.AiUsageLog;
import com.resumeai.entity.User;

/**
 * Shared quota gate for every AI feature (Summary Generator, Experience
 * Writer, ATS Optimizer, ...). Each AI feature service calls
 * {@link #enforceQuota} before making the (paid, slow) call to the AI
 * provider, then {@link #recordUsage} only after a successful generation -
 * failed generations shouldn't count against the user's monthly limit.
 */
public interface AiUsageService {

    /**
     * @throws com.resumeai.exception.AiQuotaExceededException if the user has reached
     *         their free monthly quota for this calendar month (UTC).
     */
    void enforceQuota(User user);

    /** Records one successful AI generation call for {@code feature} against the user's monthly usage. */
    void recordUsage(User user, AiUsageLog.Feature feature);

    /** How many AI generations the user has left this calendar month (never negative). */
    long remainingQuota(User user);
}
