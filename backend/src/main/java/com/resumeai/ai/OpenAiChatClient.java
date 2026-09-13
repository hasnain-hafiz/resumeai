package com.resumeai.ai;

/**
 * Thin, reusable wrapper around the AI provider's chat completions endpoint. Every AI feature
 * (Summary Generator, Experience Writer, ATS Optimizer, ...) goes through this single interface
 * instead of calling the provider directly, so retry policy, timeouts, auth, and error handling
 * live in exactly one place.
 */
public interface OpenAiChatClient {

    /**
     * Sends a system + user prompt pair and returns the raw assistant message content as a JSON
     * string (the caller is expected to request/parse structured JSON output).
     *
     * @throws com.resumeai.exception.AiServiceException if the provider call fails after retries,
     *         times out, or returns an unusable response.
     */
    String completeAsJson(String systemPrompt, String userPrompt);
}
