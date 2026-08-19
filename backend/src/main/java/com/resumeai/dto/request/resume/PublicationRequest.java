package com.resumeai.dto.request.resume;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record PublicationRequest(
    @NotBlank(message = "Title is required") @Size(max = 300) String title,
    @Size(max = 200) String publisher,
    LocalDate publishedDate,
    @Size(max = 500) String url,
    String description,
    int sortOrder
) {}
