package com.resumeai.dto.request.resume;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CustomSectionRequest(
    @NotBlank(message = "Title is required") @Size(max = 150) String title,
    int sortOrder
) {}
