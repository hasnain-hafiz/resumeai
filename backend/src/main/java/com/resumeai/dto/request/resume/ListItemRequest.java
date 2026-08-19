package com.resumeai.dto.request.resume;

import com.resumeai.entity.ResumeListItem;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ListItemRequest(
    @NotNull(message = "Section is required") ResumeListItem.Section section,
    @NotBlank(message = "Value is required") @Size(max = 150) String value,
    ResumeListItem.Proficiency proficiency,
    int sortOrder
) {}
