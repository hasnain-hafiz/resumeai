package com.resumeai.dto.request.resume;

import com.resumeai.entity.ResumeListItem;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;
import java.util.UUID;

/**
 * List items (skills/tools/frameworks/.../spoken languages) are rendered as
 * independent groups by {@link ResumeListItem.Section} - dragging a skill
 * pill only ever reorders it among its own group, so the reorder is scoped
 * to one section at a time rather than the whole list-items table at once.
 */
public record ReorderListItemsRequest(
    @NotNull(message = "section is required") ResumeListItem.Section section,
    @NotEmpty(message = "orderedIds must not be empty") List<UUID> orderedIds
) {}
