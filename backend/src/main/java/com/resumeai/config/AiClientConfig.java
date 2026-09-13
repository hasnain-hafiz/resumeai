package com.resumeai.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

import java.net.http.HttpClient;
import java.time.Duration;

/**
 * Wires the HTTP client used by {@link com.resumeai.ai.impl.OpenAiChatClientImpl} to reach the
 * AI provider. Kept as a single reusable bean rather than instantiated per-service, so every
 * current and future AI feature (Experience Writer, ATS Optimizer, ...) shares one configured
 * client, one timeout policy, and one place to swap providers later.
 */
@Configuration
@EnableConfigurationProperties(AiClientConfig.AiProviderProperties.class)
public class AiClientConfig {

    @Bean
    public RestClient openAiRestClient(AiProviderProperties properties) {
        HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofMillis(properties.connectTimeoutMs()))
            .build();

        JdkClientHttpRequestFactory requestFactory = new JdkClientHttpRequestFactory(httpClient);
        requestFactory.setReadTimeout(Duration.ofMillis(properties.readTimeoutMs()));

        return RestClient.builder()
            .baseUrl(properties.baseUrl())
            .requestFactory(requestFactory)
            .defaultHeader("Authorization", "Bearer " + properties.apiKey())
            .defaultHeader("Content-Type", "application/json")
            .build();
    }

    @ConfigurationProperties(prefix = "app.ai.provider")
    public record AiProviderProperties(
        String apiKey,
        String baseUrl,
        String model,
        long connectTimeoutMs,
        long readTimeoutMs,
        int maxRetries
    ) {
    }
}
