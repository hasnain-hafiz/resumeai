package com.resumeai.dto.response.resume;

import java.time.Instant;
import java.util.UUID;

/** Lightweight shape for the resume list screen - the full ResumeResponse is only fetched when opening one resume. */
public record ResumeSummaryResponse(
    UUID id,
    String title,
    String fullName,
    String photoUrl,
    String templateKey,
    Instant createdAt,
    Instant updatedAt
) {}
