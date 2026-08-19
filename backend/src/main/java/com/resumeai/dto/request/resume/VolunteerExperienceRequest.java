package com.resumeai.dto.request.resume;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record VolunteerExperienceRequest(
    @NotBlank(message = "Organization is required") @Size(max = 200) String organization,
    @Size(max = 200) String role,
    LocalDate startDate,
    LocalDate endDate,
    String description,
    int sortOrder
) {}
