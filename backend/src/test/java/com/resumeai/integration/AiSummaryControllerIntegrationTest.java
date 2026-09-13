package com.resumeai.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.resumeai.ai.OpenAiChatClient;
import com.resumeai.dto.request.LoginRequest;
import com.resumeai.dto.request.RegisterRequest;
import com.resumeai.dto.request.VerifyEmailRequest;
import com.resumeai.dto.request.ai.GenerateSummaryRequest;
import com.resumeai.dto.request.resume.CreateResumeRequest;
import com.resumeai.exception.AiServiceException;
import com.resumeai.service.EmailService;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.clearInvocations;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Testcontainers
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AiSummaryControllerIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
        .withDatabaseName("resumeai_test")
        .withUsername("test")
        .withPassword("test");

    @DynamicPropertySource
    static void registerProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("app.ai.free-monthly-quota", () -> "2");
    }

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;

    @MockBean private EmailService emailService;
    // The only real external boundary - everything else (quota, prompt building, persistence) runs for real.
    @MockBean private OpenAiChatClient openAiChatClient;

    private String registerVerifyAndLogin(String email) throws Exception {
        clearInvocations(emailService);
        doNothing().when(emailService).sendVerificationEmail(anyString(), anyString(), anyString());

        mockMvc.perform(post("/api/v1/auth/register")
                .contentType("application/json")
                .content(objectMapper.writeValueAsString(new RegisterRequest("Grace Hopper", email, "Password1"))))
            .andExpect(status().isCreated());

        ArgumentCaptor<String> tokenCaptor = ArgumentCaptor.forClass(String.class);
        verify(emailService).sendVerificationEmail(anyString(), anyString(), tokenCaptor.capture());
        mockMvc.perform(post("/api/v1/auth/verify-email")
                .contentType("application/json")
                .content(objectMapper.writeValueAsString(new VerifyEmailRequest(tokenCaptor.getValue()))))
            .andExpect(status().isOk());

        String loginResponse = mockMvc.perform(post("/api/v1/auth/login")
                .contentType("application/json")
                .content(objectMapper.writeValueAsString(new LoginRequest(email, "Password1"))))
            .andReturn().getResponse().getContentAsString();

        return objectMapper.readTree(loginResponse).get("accessToken").asText();
    }

    private String createResume(String auth) throws Exception {
        String createResponse = mockMvc.perform(post("/api/v1/resumes")
                .header("Authorization", auth)
                .contentType("application/json")
                .content(objectMapper.writeValueAsString(new CreateResumeRequest("AI Summary Test Resume"))))
            .andExpect(status().isCreated())
            .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(createResponse).get("id").asText();
    }

    @Test
    void unauthenticatedRequestIsRejected() throws Exception {
        mockMvc.perform(post("/api/v1/resumes/" + java.util.UUID.randomUUID() + "/ai/summary/generate")
                .contentType("application/json")
                .content("{}"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void generatesSummaryAndDecrementsQuota() throws Exception {
        String token = registerVerifyAndLogin("ai-summary-user@example.com");
        String auth = "Bearer " + token;
        String resumeId = createResume(auth);

        when(openAiChatClient.completeAsJson(anyString(), anyString()))
            .thenReturn("{\"summary\": \"A driven mid-level engineer who ships reliable systems.\"}");

        GenerateSummaryRequest request = new GenerateSummaryRequest(
            com.resumeai.ai.CareerLevel.MID_LEVEL, "Backend Engineer", null
        );

        mockMvc.perform(post("/api/v1/resumes/" + resumeId + "/ai/summary/generate")
                .header("Authorization", auth)
                .contentType("application/json")
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.summary").value("A driven mid-level engineer who ships reliable systems."))
            .andExpect(jsonPath("$.aiUsageRemaining").value(1)); // quota=2, one call made
    }

    @Test
    void returns429_whenMonthlyQuotaExhausted() throws Exception {
        String token = registerVerifyAndLogin("ai-quota-user@example.com");
        String auth = "Bearer " + token;
        String resumeId = createResume(auth);

        when(openAiChatClient.completeAsJson(anyString(), anyString()))
            .thenReturn("{\"summary\": \"A capable professional ready for new challenges.\"}");

        GenerateSummaryRequest request = new GenerateSummaryRequest(com.resumeai.ai.CareerLevel.JUNIOR, null, null);
        String body = objectMapper.writeValueAsString(request);

        // Quota is set to 2 for this test - the first two calls succeed...
        mockMvc.perform(post("/api/v1/resumes/" + resumeId + "/ai/summary/generate")
                .header("Authorization", auth).contentType("application/json").content(body))
            .andExpect(status().isOk());
        mockMvc.perform(post("/api/v1/resumes/" + resumeId + "/ai/summary/generate")
                .header("Authorization", auth).contentType("application/json").content(body))
            .andExpect(status().isOk());

        // ...and the third is rejected before ever reaching the (mocked) AI provider.
        mockMvc.perform(post("/api/v1/resumes/" + resumeId + "/ai/summary/generate")
                .header("Authorization", auth).contentType("application/json").content(body))
            .andExpect(status().isTooManyRequests())
            .andExpect(jsonPath("$.code").value("AI_QUOTA_EXCEEDED"));
    }

    @Test
    void returns503_whenAiProviderFails() throws Exception {
        String token = registerVerifyAndLogin("ai-failure-user@example.com");
        String auth = "Bearer " + token;
        String resumeId = createResume(auth);

        when(openAiChatClient.completeAsJson(anyString(), anyString()))
            .thenThrow(new AiServiceException("The AI service is temporarily unavailable. Please try again shortly."));

        GenerateSummaryRequest request = new GenerateSummaryRequest(com.resumeai.ai.CareerLevel.SENIOR, null, null);

        mockMvc.perform(post("/api/v1/resumes/" + resumeId + "/ai/summary/generate")
                .header("Authorization", auth)
                .contentType("application/json")
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isServiceUnavailable())
            .andExpect(jsonPath("$.code").value("AI_SERVICE_UNAVAILABLE"));
    }

    @Test
    void rejectsMissingCareerLevel() throws Exception {
        String token = registerVerifyAndLogin("ai-validation-user@example.com");
        String auth = "Bearer " + token;
        String resumeId = createResume(auth);

        mockMvc.perform(post("/api/v1/resumes/" + resumeId + "/ai/summary/generate")
                .header("Authorization", auth)
                .contentType("application/json")
                .content("{}"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    }
}
