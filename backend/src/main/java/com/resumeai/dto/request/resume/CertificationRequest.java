package com.resumeai.dto.request.resume;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record CertificationRequest(
    @NotBlank(message = "Name is required") @Size(max = 200) String name,
    @Size(max = 200) String issuer,
    LocalDate issueDate,
    @Size(max = 500) String credentialUrl,
    int sortOrder
) {}
