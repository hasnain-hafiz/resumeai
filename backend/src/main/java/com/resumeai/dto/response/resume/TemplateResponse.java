package com.resumeai.dto.response.resume;

import com.resumeai.entity.ResumeTemplate;

import java.util.UUID;

public record TemplateResponse(
    UUID id,
    String key,
    String name,
    ResumeTemplate.Category category,
    boolean atsFriendly
) {}
