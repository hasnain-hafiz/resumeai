package com.resumeai.ai.dto;

/** One message in an OpenAI-compatible chat completion request. Internal wire format only. */
public record OpenAiMessage(String role, String content) {

    public static OpenAiMessage system(String content) {
        return new OpenAiMessage("system", content);
    }

    public static OpenAiMessage user(String content) {
        return new OpenAiMessage("user", content);
    }
}
