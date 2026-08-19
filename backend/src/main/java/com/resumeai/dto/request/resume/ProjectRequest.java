package com.resumeai.dto.request.resume;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ProjectRequest(
    @NotBlank(message = "Title is required") @Size(max = 200) String title,
    String description,
    @Size(max = 1000) String technologies,
    @Size(max = 255) String githubUrl,
    @Size(max = 255) String liveUrl,
    int sortOrder
) {}
