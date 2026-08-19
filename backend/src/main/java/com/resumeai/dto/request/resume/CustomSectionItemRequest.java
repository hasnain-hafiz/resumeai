package com.resumeai.dto.request.resume;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record CustomSectionItemRequest(
    @NotBlank(message = "Heading is required") @Size(max = 200) String heading,
    @Size(max = 200) String subheading,
    String description,
    LocalDate startDate,
    LocalDate endDate,
    int sortOrder
) {}
