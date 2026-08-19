package com.resumeai.dto.response;

import java.time.Instant;
import java.util.List;

public record ErrorResponse(
    Instant timestamp,
    int status,
    String error,
    String message,
    /** Stable, machine-readable identifier (e.g. "EMAIL_NOT_VERIFIED") for clients to branch on. Null for generic/unexpected errors. */
    String code,
    String path,
    List<FieldError> fieldErrors
) {
    public record FieldError(String field, String message) {}
}
