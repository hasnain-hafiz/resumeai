package com.resumeai.service;

import com.resumeai.dto.request.resume.CreateResumeRequest;
import com.resumeai.dto.request.resume.SectionOrderRequest;
import com.resumeai.dto.request.resume.SelectTemplateRequest;
import com.resumeai.dto.request.resume.UpdateResumeDetailsRequest;
import com.resumeai.dto.response.resume.ResumeResponse;
import com.resumeai.dto.response.resume.ResumeSummaryResponse;
import com.resumeai.entity.Resume;

import java.util.List;
import java.util.UUID;

public interface ResumeService {

    ResumeSummaryResponse create(UUID userId, CreateResumeRequest request);

    List<ResumeSummaryResponse> listForUser(UUID userId);

    /** Full aggregate - resume core fields plus every section, assembled from each section's repository. */
    ResumeResponse getFull(UUID resumeId, UUID userId);

    ResumeResponse updateDetails(UUID resumeId, UUID userId, UpdateResumeDetailsRequest request);

    /** Sets (or, with a null templateId, clears) which template this resume renders with. */
    ResumeResponse selectTemplate(UUID resumeId, UUID userId, SelectTemplateRequest request);

    /** Sets the display order of the top-level resume sections (Experience, Education, Projects, ...). */
    ResumeResponse reorderSections(UUID resumeId, UUID userId, SectionOrderRequest request);

    void delete(UUID resumeId, UUID userId);

    /**
     * Ownership-scoped lookup shared by every section service (Experience,
     * Education, Projects, ...) so each one doesn't re-implement the same
     * "does this resume belong to this user" check.
     */
    Resume getOwnedResumeOrThrow(UUID resumeId, UUID userId);
}
