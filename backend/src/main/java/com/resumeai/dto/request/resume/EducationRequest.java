package com.resumeai.dto.request.resume;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record EducationRequest(
    @NotBlank(message = "School is required") @Size(max = 200) String school,
    @Size(max = 200) String degree,
    @Size(max = 200) String field,
    @DecimalMin(value = "0.0", message = "CGPA must be between 0 and 10")
    @DecimalMax(value = "10.0", message = "CGPA must be between 0 and 10")
    BigDecimal cgpa,
    LocalDate startDate,
    LocalDate endDate,
    int sortOrder
) {}
