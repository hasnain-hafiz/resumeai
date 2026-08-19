package com.resumeai.dto.response.resume;

import java.time.LocalDate;
import java.util.UUID;

public record PublicationResponse(
    UUID id, String title, String publisher, LocalDate publishedDate, String url, String description, int sortOrder
) {}
