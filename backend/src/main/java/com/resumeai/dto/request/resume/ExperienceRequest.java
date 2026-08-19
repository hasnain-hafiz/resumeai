package com.resumeai.dto.request.resume;

import com.resumeai.entity.ResumeExperience;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record ExperienceRequest(
    @NotBlank(message = "Company is required") @Size(max = 200) String company,
    @NotBlank(message = "Position is required") @Size(max = 200) String position,
    @Size(max = 200) String location,
    ResumeExperience.EmploymentType employmentType,
    LocalDate startDate,
    LocalDate endDate,
    boolean current,
    String responsibilities,
    String achievements,
    int sortOrder
) {}
