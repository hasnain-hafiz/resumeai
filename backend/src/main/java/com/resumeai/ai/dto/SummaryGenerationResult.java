package com.resumeai.ai.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/** Shape of the JSON object the model is instructed to return for summary generation. */
@JsonIgnoreProperties(ignoreUnknown = true)
public record SummaryGenerationResult(String summary) {
}
