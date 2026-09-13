package com.resumeai.ai.impl;

import com.resumeai.ai.OpenAiChatClient;
import com.resumeai.ai.dto.OpenAiChatCompletionRequest;
import com.resumeai.ai.dto.OpenAiChatCompletionResponse;
import com.resumeai.ai.dto.OpenAiMessage;
import com.resumeai.config.AiClientConfig.AiProviderProperties;
import com.resumeai.exception.AiServiceException;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class OpenAiChatClientImpl implements OpenAiChatClient {

    private static final Logger log = LoggerFactory.getLogger(OpenAiChatClientImpl.class);

    private static final double DEFAULT_TEMPERATURE = 0.7;
    private static final int DEFAULT_MAX_TOKENS = 700;

    private final RestClient openAiRestClient;
    private final AiProviderProperties properties;

    @Override
    public String completeAsJson(String systemPrompt, String userPrompt) {
        OpenAiChatCompletionRequest request = OpenAiChatCompletionRequest.jsonObject(
            properties.model(),
            List.of(OpenAiMessage.system(systemPrompt), OpenAiMessage.user(userPrompt)),
            DEFAULT_TEMPERATURE,
            DEFAULT_MAX_TOKENS
        );

        int attempts = Math.max(1, properties.maxRetries() + 1);
        RuntimeException lastFailure = null;

        for (int attempt = 1; attempt <= attempts; attempt++) {
            try {
                OpenAiChatCompletionResponse response = openAiRestClient.post()
                    .uri("/chat/completions")
                    .body(request)
                    .retrieve()
                    .body(OpenAiChatCompletionResponse.class);

                String content = response == null ? null : response.firstMessageContent();
                if (content == null || content.isBlank()) {
                    throw new AiServiceException("The AI provider returned an empty response.");
                }
                return content;
            } catch (RestClientResponseException ex) {
                // 4xx from the provider (bad request, invalid key, ...) won't succeed on retry.
                if (ex.getStatusCode().is4xxClientError()) {
                    log.error("AI provider rejected the request: {}", ex.getStatusCode(), ex);
                    throw new AiServiceException("The AI provider rejected the request.", ex);
                }
                lastFailure = ex;
                log.warn("AI provider call failed (attempt {}/{}): {}", attempt, attempts, ex.getMessage());
            } catch (RestClientException ex) {
                lastFailure = ex;
                log.warn("AI provider call failed (attempt {}/{}): {}", attempt, attempts, ex.getMessage());
            }
        }

        throw new AiServiceException("The AI service is temporarily unavailable. Please try again shortly.", lastFailure);
    }
}
