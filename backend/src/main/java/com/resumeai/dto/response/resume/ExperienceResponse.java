package com.resumeai.dto.response.resume;

import com.resumeai.entity.ResumeExperience;

import java.time.LocalDate;
import java.util.UUID;

public record ExperienceResponse(
    UUID id,
    String company,
    String position,
    String location,
    ResumeExperience.EmploymentType employmentType,
    LocalDate startDate,
    LocalDate endDate,
    boolean current,
    String responsibilities,
    String achievements,
    int sortOrder
) {}
