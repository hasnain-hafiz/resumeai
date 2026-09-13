package com.resumeai.exception;

import org.springframework.http.HttpStatus;

/**
 * Thrown when a user has used up their monthly AI generation quota
 * (see {@code app.ai.free-monthly-quota}). Checked before every paid AI
 * call across every AI feature, so the expensive provider call is never
 * made once the caller is already over quota.
 */
public class AiQuotaExceededException extends ApiException {

    public AiQuotaExceededException(String message) {
        super(HttpStatus.TOO_MANY_REQUESTS, message, "AI_QUOTA_EXCEEDED");
    }
}
