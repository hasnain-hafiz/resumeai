package com.resumeai.dto.request.resume;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record AwardRequest(
    @NotBlank(message = "Title is required") @Size(max = 200) String title,
    @Size(max = 200) String issuer,
    LocalDate awardedDate,
    String description,
    int sortOrder
) {}
