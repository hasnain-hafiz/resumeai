package com.resumeai.dto.request.resume;

import jakarta.validation.constraints.NotEmpty;

import java.util.List;

/** Full ordered list of every {@link com.resumeai.entity.Resume.SectionKey} name, in its new display order. */
public record SectionOrderRequest(@NotEmpty(message = "sectionOrder must not be empty") List<String> sectionOrder) {}
