package com.resumeai.dto.request.resume;

import java.util.UUID;

/** templateId may be null to clear the resume's selection and fall back to the default rendering. */
public record SelectTemplateRequest(UUID templateId) {}
