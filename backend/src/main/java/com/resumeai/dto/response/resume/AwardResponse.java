package com.resumeai.dto.response.resume;

import java.time.LocalDate;
import java.util.UUID;

public record AwardResponse(
    UUID id, String title, String issuer, LocalDate awardedDate, String description, int sortOrder
) {}
