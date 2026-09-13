package com.resumeai.ai.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;

/** Internal wire format for the response from {@code /chat/completions}. Only the fields we use are mapped. */
@JsonIgnoreProperties(ignoreUnknown = true)
public record OpenAiChatCompletionResponse(List<Choice> choices) {

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Choice(OpenAiMessage message, String finish_reason) {
    }

    /** Convenience accessor for the assistant's message content from the first choice, or null if absent. */
    public String firstMessageContent() {
        if (choices == null || choices.isEmpty() || choices.get(0).message() == null) {
            return null;
        }
        return choices.get(0).message().content();
    }
}
