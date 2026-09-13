package com.resumeai.dto.response.ai;

/**
 * The generated summary is returned for the user to review/edit - it is NOT auto-saved onto the
 * resume. Saving happens through the existing {@code PUT /resumes/{id}} details endpoint once the
 * user accepts (or edits) the suggestion, consistent with how Resume Import treats extracted data.
 */
public record GenerateSummaryResponse(
    String summary,
    long aiUsageRemaining
) {}
