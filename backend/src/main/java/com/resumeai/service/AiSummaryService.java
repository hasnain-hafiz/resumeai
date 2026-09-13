package com.resumeai.service;

import com.resumeai.dto.request.ai.GenerateSummaryRequest;
import com.resumeai.dto.response.ai.GenerateSummaryResponse;

import java.util.UUID;

public interface AiSummaryService {

    /**
     * Generates a professional summary for the given resume, tailored to the requested career
     * level. Pulls context (recent experience, education, skills) from the resume's existing
     * data; the result is returned for review, not auto-saved.
     *
     * @throws com.resumeai.exception.AiQuotaExceededException if the user is over their monthly AI quota
     * @throws com.resumeai.exception.AiServiceException if the AI provider call fails
     */
    GenerateSummaryResponse generate(UUID resumeId, UUID userId, GenerateSummaryRequest request);
}
