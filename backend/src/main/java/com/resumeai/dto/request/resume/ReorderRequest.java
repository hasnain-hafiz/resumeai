package com.resumeai.dto.request.resume;

import jakarta.validation.constraints.NotEmpty;

import java.util.List;
import java.util.UUID;

/** Full ordered list of every entry's id, in its new display order (index becomes the new sortOrder). */
public record ReorderRequest(@NotEmpty(message = "orderedIds must not be empty") List<UUID> orderedIds) {}
