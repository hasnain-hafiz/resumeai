package com.resumeai.dto.response.resume;

import java.time.LocalDate;
import java.util.UUID;

public record CertificationResponse(
    UUID id, String name, String issuer, LocalDate issueDate, String credentialUrl, int sortOrder
) {}
