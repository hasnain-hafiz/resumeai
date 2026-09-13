package com.resumeai.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.resumeai.ai.OpenAiChatClient;
import com.resumeai.ai.dto.SummaryGenerationResult;
import com.resumeai.ai.prompt.SummaryGenerationContext;
import com.resumeai.ai.prompt.SummaryPromptBuilder;
import com.resumeai.dto.request.ai.GenerateSummaryRequest;
import com.resumeai.dto.response.ai.GenerateSummaryResponse;
import com.resumeai.entity.*;
import com.resumeai.exception.AiServiceException;
import com.resumeai.repository.ResumeEducationRepository;
import com.resumeai.repository.ResumeExperienceRepository;
import com.resumeai.repository.ResumeListItemRepository;
import com.resumeai.service.ActivityEventService;
import com.resumeai.service.AiSummaryService;
import com.resumeai.service.AiUsageService;
import com.resumeai.service.ResumeService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.EnumSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AiSummaryServiceImpl implements AiSummaryService {

    private static final int MAX_EXPERIENCE_HIGHLIGHTS = 5;
    private static final int MAX_EDUCATION_HIGHLIGHTS = 2;
    private static final int MAX_SKILLS = 12;
    private static final int MAX_SUMMARY_LENGTH = 1200; // generous ceiling; malformed output is rejected, not truncated silently

    private static final Set<ResumeListItem.Section> SKILL_SECTIONS = EnumSet.of(
        ResumeListItem.Section.TECHNICAL_SKILL,
        ResumeListItem.Section.SOFT_SKILL,
        ResumeListItem.Section.TOOL,
        ResumeListItem.Section.FRAMEWORK,
        ResumeListItem.Section.DATABASE,
        ResumeListItem.Section.PROGRAMMING_LANGUAGE
    );

    private final ResumeService resumeService;
    private final ResumeExperienceRepository experienceRepository;
    private final ResumeEducationRepository educationRepository;
    private final ResumeListItemRepository listItemRepository;
    private final AiUsageService aiUsageService;
    private final ActivityEventService activityEventService;
    private final OpenAiChatClient openAiChatClient;
    private final SummaryPromptBuilder promptBuilder;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public GenerateSummaryResponse generate(UUID resumeId, UUID userId, GenerateSummaryRequest request) {
        Resume resume = resumeService.getOwnedResumeOrThrow(resumeId, userId);
        User user = resume.getUser();

        // Cheap check before the expensive, paid provider call.
        aiUsageService.enforceQuota(user);

        SummaryGenerationContext context = buildContext(resume, request);
        String systemPrompt = promptBuilder.buildSystemPrompt();
        String userPrompt = promptBuilder.buildUserPrompt(context);

        String rawJson = openAiChatClient.completeAsJson(systemPrompt, userPrompt);
        String summary = parseAndValidate(rawJson);

        aiUsageService.recordUsage(user, AiUsageLog.Feature.SUMMARY_GENERATOR);
        activityEventService.record(user, ActivityEvent.Type.AI_FEATURE_USED, "Generated a professional summary with AI");

        return new GenerateSummaryResponse(summary, aiUsageService.remainingQuota(user));
    }

    private SummaryGenerationContext buildContext(Resume resume, GenerateSummaryRequest request) {
        List<ResumeExperience> experiences = experienceRepository.findByResumeOrderBySortOrderAsc(resume);
        List<ResumeEducation> educationEntries = educationRepository.findByResumeOrderBySortOrderAsc(resume);
        List<ResumeListItem> listItems = listItemRepository.findByResumeOrderBySectionAscSortOrderAsc(resume);

        List<String> experienceHighlights = experiences.stream()
            .limit(MAX_EXPERIENCE_HIGHLIGHTS)
            .map(this::describeExperience)
            .toList();

        List<String> educationHighlights = educationEntries.stream()
            .limit(MAX_EDUCATION_HIGHLIGHTS)
            .map(this::describeEducation)
            .toList();

        List<String> skills = listItems.stream()
            .filter(item -> SKILL_SECTIONS.contains(item.getSection()))
            .map(ResumeListItem::getValue)
            .distinct()
            .limit(MAX_SKILLS)
            .toList();

        String targetRole = (request.targetRole() != null && !request.targetRole().isBlank())
            ? request.targetRole().trim()
            : experiences.stream().findFirst().map(ResumeExperience::getPosition).orElse(null);

        return new SummaryGenerationContext(
            request.careerLevel(), targetRole, experienceHighlights, educationHighlights, skills, request.additionalContext()
        );
    }

    private String describeExperience(ResumeExperience experience) {
        StringBuilder sb = new StringBuilder();
        sb.append(experience.getPosition()).append(" at ").append(experience.getCompany());
        if (experience.getResponsibilities() != null && !experience.getResponsibilities().isBlank()) {
            sb.append(" - ").append(truncate(stripHtml(experience.getResponsibilities()), 200));
        }
        if (experience.getAchievements() != null && !experience.getAchievements().isBlank()) {
            sb.append(" Achievements: ").append(truncate(stripHtml(experience.getAchievements()), 200));
        }
        return sb.toString();
    }

    private String describeEducation(ResumeEducation education) {
        StringBuilder sb = new StringBuilder();
        if (education.getDegree() != null && !education.getDegree().isBlank()) {
            sb.append(education.getDegree());
            if (education.getField() != null && !education.getField().isBlank()) {
                sb.append(" in ").append(education.getField());
            }
            sb.append(", ");
        }
        sb.append(education.getSchool());
        return sb.toString();
    }

    private String parseAndValidate(String rawJson) {
        SummaryGenerationResult result;
        try {
            result = objectMapper.readValue(rawJson, SummaryGenerationResult.class);
        } catch (Exception ex) {
            throw new AiServiceException("The AI service returned an unusable response. Please try again.", ex);
        }

        if (result.summary() == null || result.summary().isBlank()) {
            throw new AiServiceException("The AI service returned an empty summary. Please try again.");
        }

        String summary = result.summary().trim();
        if (summary.length() > MAX_SUMMARY_LENGTH) {
            throw new AiServiceException("The AI service returned an unusually long summary. Please try again.");
        }
        return summary;
    }

    /** AI output is instructed to be plain text, but strips defensively in case a field carries residual HTML from the editor. */
    private String stripHtml(String value) {
        return value.replaceAll("<[^>]*>", " ").replaceAll("\\s+", " ").trim();
    }

    private String truncate(String value, int maxLength) {
        return value.length() <= maxLength ? value : value.substring(0, maxLength) + "...";
    }
}
