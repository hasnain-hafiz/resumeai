package com.resumeai.dto.request.ai;

import com.resumeai.ai.CareerLevel;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Everything the caller can optionally steer the generation with. {@code targetRole},
 * {@code additionalSkills}, and {@code additionalContext} are all optional - when omitted the
 * service falls back to whatever the resume itself already has (most recent experience's
 * position, saved skills, ...).
 */
public record GenerateSummaryRequest(
    @NotNull(message = "Career level is required") CareerLevel careerLevel,

    @Size(max = 200) String targetRole,

    @Size(max = 1000, message = "Additional context must be 1000 characters or fewer") String additionalContext
) {}
