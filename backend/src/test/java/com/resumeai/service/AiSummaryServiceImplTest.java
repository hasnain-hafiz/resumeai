package com.resumeai.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.resumeai.ai.CareerLevel;
import com.resumeai.ai.OpenAiChatClient;
import com.resumeai.ai.prompt.SummaryPromptBuilder;
import com.resumeai.dto.request.ai.GenerateSummaryRequest;
import com.resumeai.dto.response.ai.GenerateSummaryResponse;
import com.resumeai.entity.*;
import com.resumeai.exception.AiQuotaExceededException;
import com.resumeai.exception.AiServiceException;
import com.resumeai.repository.ResumeEducationRepository;
import com.resumeai.repository.ResumeExperienceRepository;
import com.resumeai.repository.ResumeListItemRepository;
import com.resumeai.service.impl.AiSummaryServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AiSummaryServiceImplTest {

    @Mock private ResumeService resumeService;
    @Mock private ResumeExperienceRepository experienceRepository;
    @Mock private ResumeEducationRepository educationRepository;
    @Mock private ResumeListItemRepository listItemRepository;
    @Mock private AiUsageService aiUsageService;
    @Mock private ActivityEventService activityEventService;
    @Mock private OpenAiChatClient openAiChatClient;

    private AiSummaryServiceImpl aiSummaryService;

    private User user;
    private Resume resume;
    private UUID resumeId;
    private GenerateSummaryRequest request;

    @BeforeEach
    void setUp() {
        aiSummaryService = new AiSummaryServiceImpl(
            resumeService, experienceRepository, educationRepository, listItemRepository,
            aiUsageService, activityEventService, openAiChatClient, new SummaryPromptBuilder(), new ObjectMapper()
        );

        user = User.builder().fullName("Ada Lovelace").email("ada@example.com").build();
        user.setId(UUID.randomUUID());
        resume = Resume.builder().user(user).title("Resume").build();
        resumeId = UUID.randomUUID();
        resume.setId(resumeId);

        request = new GenerateSummaryRequest(CareerLevel.MID_LEVEL, "Backend Engineer", null);
    }

    @Test
    void generate_returnsGeneratedSummary_andRecordsUsage() {
        when(resumeService.getOwnedResumeOrThrow(resumeId, user.getId())).thenReturn(resume);
        when(experienceRepository.findByResumeOrderBySortOrderAsc(resume)).thenReturn(List.of());
        when(educationRepository.findByResumeOrderBySortOrderAsc(resume)).thenReturn(List.of());
        when(listItemRepository.findByResumeOrderBySectionAscSortOrderAsc(resume)).thenReturn(List.of());
        when(openAiChatClient.completeAsJson(anyString(), anyString()))
            .thenReturn("{\"summary\": \"A concise, achievement-oriented pitch.\"}");
        when(aiUsageService.remainingQuota(user)).thenReturn(41L);

        GenerateSummaryResponse response = aiSummaryService.generate(resumeId, user.getId(), request);

        assertThat(response.summary()).isEqualTo("A concise, achievement-oriented pitch.");
        assertThat(response.aiUsageRemaining()).isEqualTo(41L);
        verify(aiUsageService).enforceQuota(user);
        verify(aiUsageService).recordUsage(user, AiUsageLog.Feature.SUMMARY_GENERATOR);
        verify(activityEventService).record(eq(user), eq(ActivityEvent.Type.AI_FEATURE_USED), anyString());
    }

    @Test
    void generate_throwsQuotaExceeded_withoutCallingAiProvider() {
        when(resumeService.getOwnedResumeOrThrow(resumeId, user.getId())).thenReturn(resume);
        org.mockito.Mockito.doThrow(new AiQuotaExceededException("Quota exceeded")).when(aiUsageService).enforceQuota(user);

        assertThatThrownBy(() -> aiSummaryService.generate(resumeId, user.getId(), request))
            .isInstanceOf(AiQuotaExceededException.class);

        verifyNoInteractions(openAiChatClient);
        verify(aiUsageService, never()).recordUsage(any(), any());
    }

    @Test
    void generate_throwsAiServiceException_onMalformedJsonResponse() {
        when(resumeService.getOwnedResumeOrThrow(resumeId, user.getId())).thenReturn(resume);
        when(experienceRepository.findByResumeOrderBySortOrderAsc(resume)).thenReturn(List.of());
        when(educationRepository.findByResumeOrderBySortOrderAsc(resume)).thenReturn(List.of());
        when(listItemRepository.findByResumeOrderBySectionAscSortOrderAsc(resume)).thenReturn(List.of());
        when(openAiChatClient.completeAsJson(anyString(), anyString())).thenReturn("not valid json");

        assertThatThrownBy(() -> aiSummaryService.generate(resumeId, user.getId(), request))
            .isInstanceOf(AiServiceException.class);

        verify(aiUsageService, never()).recordUsage(any(), any());
    }

    @Test
    void generate_throwsAiServiceException_onBlankSummary() {
        when(resumeService.getOwnedResumeOrThrow(resumeId, user.getId())).thenReturn(resume);
        when(experienceRepository.findByResumeOrderBySortOrderAsc(resume)).thenReturn(List.of());
        when(educationRepository.findByResumeOrderBySortOrderAsc(resume)).thenReturn(List.of());
        when(listItemRepository.findByResumeOrderBySectionAscSortOrderAsc(resume)).thenReturn(List.of());
        when(openAiChatClient.completeAsJson(anyString(), anyString())).thenReturn("{\"summary\": \"   \"}");

        assertThatThrownBy(() -> aiSummaryService.generate(resumeId, user.getId(), request))
            .isInstanceOf(AiServiceException.class);
    }

    @Test
    void generate_fallsBackToMostRecentExperiencePosition_whenTargetRoleOmitted() {
        GenerateSummaryRequest noRoleRequest = new GenerateSummaryRequest(CareerLevel.SENIOR, null, null);
        ResumeExperience experience = ResumeExperience.builder()
            .resume(resume).company("Acme").position("Staff Engineer").build();

        when(resumeService.getOwnedResumeOrThrow(resumeId, user.getId())).thenReturn(resume);
        when(experienceRepository.findByResumeOrderBySortOrderAsc(resume)).thenReturn(List.of(experience));
        when(educationRepository.findByResumeOrderBySortOrderAsc(resume)).thenReturn(List.of());
        when(listItemRepository.findByResumeOrderBySectionAscSortOrderAsc(resume)).thenReturn(List.of());
        when(openAiChatClient.completeAsJson(anyString(), anyString()))
            .thenReturn("{\"summary\": \"Staff engineer with deep systems expertise.\"}");
        when(aiUsageService.remainingQuota(user)).thenReturn(40L);

        aiSummaryService.generate(resumeId, user.getId(), noRoleRequest);

        // The user prompt should have been built with "Staff Engineer" pulled from the experience entry.
        verify(openAiChatClient).completeAsJson(anyString(), org.mockito.ArgumentMatchers.contains("Staff Engineer"));
    }
}
