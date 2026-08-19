package com.resumeai.dto.request.resume;

import jakarta.validation.constraints.Size;

public record CreateResumeRequest(
    @Size(max = 200, message = "Title must be under 200 characters")
    String title
) {}
