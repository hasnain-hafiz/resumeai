package com.resumeai.dto.response.resume;

import java.util.List;
import java.util.UUID;

public record ProjectResponse(
    UUID id,
    String title,
    String description,
    String technologies,
    String githubUrl,
    String liveUrl,
    int sortOrder,
    List<ProjectImageResponse> images
) {}
