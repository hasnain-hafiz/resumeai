package com.resumeai.ai.prompt;

import com.resumeai.ai.CareerLevel;

import java.util.List;

/**
 * Resume data assembled by {@code AiSummaryServiceImpl} and handed to
 * {@link SummaryPromptBuilder}. Keeping this as a plain data holder (rather than passing the
 * Resume entity itself) keeps the prompt builder decoupled from JPA and easy to unit test.
 */
public record SummaryGenerationContext(
    CareerLevel careerLevel,
    String targetRole,
    List<String> experienceHighlights,
    List<String> educationHighlights,
    List<String> skills,
    String additionalContext
) {
}
