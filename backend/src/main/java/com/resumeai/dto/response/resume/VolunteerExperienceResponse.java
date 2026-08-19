package com.resumeai.dto.response.resume;

import java.time.LocalDate;
import java.util.UUID;

public record VolunteerExperienceResponse(
    UUID id, String organization, String role, LocalDate startDate, LocalDate endDate, String description, int sortOrder
) {}
