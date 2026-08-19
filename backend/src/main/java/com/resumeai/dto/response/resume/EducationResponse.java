package com.resumeai.dto.response.resume;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record EducationResponse(
    UUID id,
    String school,
    String degree,
    String field,
    BigDecimal cgpa,
    LocalDate startDate,
    LocalDate endDate,
    int sortOrder
) {}
