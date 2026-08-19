package com.resumeai.dto.response.resume;

import java.util.UUID;

public record ReferenceResponse(
    UUID id, String name, String relationship, String company, String email, String phone, int sortOrder
) {}
