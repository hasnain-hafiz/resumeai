package com.resumeai.ai.prompt;

import com.resumeai.ai.CareerLevel;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Builds the prompt pair for the AI Summary Generator (spec section 9.1). Kept separate from
 * {@code AiSummaryServiceImpl} so the prompt text can evolve (or be A/B tested) without touching
 * quota, persistence, or HTTP concerns.
 */
@Component
public class SummaryPromptBuilder {

    public String buildSystemPrompt() {
        return """
            You are an expert resume writer. You write concise, achievement-oriented professional \
            summaries for resumes. You always respond with a single JSON object of the exact shape \
            {"summary": "<text>"} and nothing else - no markdown, no code fences, no commentary.

            Rules for the summary text:
            - 2 to 4 sentences, written in the first person implied (no "I"), present tense.
            - No placeholder brackets like "[Company]" - work only with the facts provided.
            - No invented employers, titles, metrics, or years of experience beyond what is given.
            - Avoid cliches like "hardworking team player" or "results-driven professional".
            - Tailor tone and scope to the candidate's career level.
            """;
    }

    public String buildUserPrompt(SummaryGenerationContext context) {
        StringBuilder sb = new StringBuilder();
        sb.append("Career level: ").append(describeLevel(context.careerLevel())).append('\n');

        if (context.targetRole() != null && !context.targetRole().isBlank()) {
            sb.append("Target role: ").append(context.targetRole()).append('\n');
        }

        appendList(sb, "Relevant experience", context.experienceHighlights());
        appendList(sb, "Education", context.educationHighlights());
        appendList(sb, "Key skills", context.skills());

        if (context.additionalContext() != null && !context.additionalContext().isBlank()) {
            sb.append("Additional context from the candidate: ").append(context.additionalContext().trim()).append('\n');
        }

        if (context.experienceHighlights().isEmpty()
            && context.educationHighlights().isEmpty()
            && context.skills().isEmpty()
            && (context.additionalContext() == null || context.additionalContext().isBlank())) {
            sb.append("No resume details are available yet - write a generic but plausible summary ")
                .append("for this career level and role, using only general, non-fabricated language.\n");
        }

        sb.append("\nWrite the professional summary now, following the system rules.");
        return sb.toString();
    }

    private void appendList(StringBuilder sb, String label, List<String> items) {
        if (items == null || items.isEmpty()) {
            return;
        }
        sb.append(label).append(":\n");
        for (String item : items) {
            sb.append("- ").append(item).append('\n');
        }
    }

    private String describeLevel(CareerLevel level) {
        return switch (level) {
            case STUDENT -> "Student (still studying, little or no paid work experience)";
            case FRESHER -> "Fresher (recently graduated, 0-1 years of experience)";
            case JUNIOR -> "Junior professional (roughly 1-3 years of experience)";
            case MID_LEVEL -> "Mid-level professional (roughly 3-7 years of experience)";
            case SENIOR -> "Senior professional (7+ years of experience)";
            case ARCHITECT -> "Architect / principal-level professional (deep technical leadership experience)";
        };
    }
}
