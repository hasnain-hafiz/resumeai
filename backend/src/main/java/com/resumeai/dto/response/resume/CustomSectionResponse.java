package com.resumeai.dto.response.resume;

import java.util.List;
import java.util.UUID;

public record CustomSectionResponse(
    UUID id, String title, int sortOrder, List<CustomSectionItemResponse> items
) {}
