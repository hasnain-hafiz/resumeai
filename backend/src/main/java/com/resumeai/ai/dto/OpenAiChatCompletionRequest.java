package com.resumeai.ai.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.List;
import java.util.Map;

/** Internal wire format for a POST to {@code /chat/completions}. Not exposed at the API boundary. */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record OpenAiChatCompletionRequest(
    String model,
    List<OpenAiMessage> messages,
    double temperature,
    Integer max_tokens,
    Map<String, String> response_format
) {

    /** Forces the model to return a single JSON object with no surrounding prose, so responses parse reliably. */
    public static OpenAiChatCompletionRequest jsonObject(String model, List<OpenAiMessage> messages, double temperature, int maxTokens) {
        return new OpenAiChatCompletionRequest(model, messages, temperature, maxTokens, Map.of("type", "json_object"));
    }
}
