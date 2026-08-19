package com.resumeai.dto.response.resume;

import java.time.LocalDate;
import java.util.UUID;

public record CustomSectionItemResponse(
    UUID id, String heading, String subheading, String description, LocalDate startDate, LocalDate endDate, int sortOrder
) {}
