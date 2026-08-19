package com.resumeai.dto.request.resume;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ProjectImageRequest(
    @NotBlank(message = "Image URL is required") @Size(max = 1000) String url,
    int sortOrder
) {}
