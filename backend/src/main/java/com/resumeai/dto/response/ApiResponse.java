package com.resumeai.dto.response;

import java.time.Instant;

/**
 * Generic envelope for simple success/message responses
 * (e.g. "check your inbox", "password changed").
 */
public record ApiResponse(
    boolean success,
    String message,
    Instant timestamp
) {
    public static ApiResponse of(String message) {
        return new ApiResponse(true, message, Instant.now());
    }
}
