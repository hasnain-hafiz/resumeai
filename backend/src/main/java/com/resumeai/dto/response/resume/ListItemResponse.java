package com.resumeai.dto.response.resume;

import com.resumeai.entity.ResumeListItem;

import java.util.UUID;

public record ListItemResponse(
    UUID id,
    ResumeListItem.Section section,
    String value,
    ResumeListItem.Proficiency proficiency,
    int sortOrder
) {}
