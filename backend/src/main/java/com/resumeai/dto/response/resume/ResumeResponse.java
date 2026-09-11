package com.resumeai.dto.response.resume;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record ResumeResponse(
    UUID id,
    String title,
    String fullName,
    String email,
    String phone,
    String address,
    String linkedinUrl,
    String githubUrl,
    String portfolioUrl,
    String websiteUrl,
    String photoUrl,
    String summary,
    TemplateResponse template,
    List<String> sectionOrder,
    List<ExperienceResponse> experience,
    List<EducationResponse> education,
    List<ProjectResponse> projects,
    List<ListItemResponse> listItems,
    List<CertificationResponse> certifications,
    List<AwardResponse> awards,
    List<PublicationResponse> publications,
    List<VolunteerExperienceResponse> volunteerExperience,
    List<ReferenceResponse> references,
    List<CustomSectionResponse> customSections,
    Instant createdAt,
    Instant updatedAt
) {}
