package com.resumeai.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.resumeai.dto.request.LoginRequest;
import com.resumeai.dto.request.RegisterRequest;
import com.resumeai.dto.request.VerifyEmailRequest;
import com.resumeai.service.EmailService;
import org.junit.jupiter.api.BeforeEach;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Testcontainers
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class DashboardControllerIntegrationTest {

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
    }

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;

    @MockBean private EmailService emailService;

    @BeforeEach
    void resetEmailServiceMock() {
        clearInvocations(emailService);
    }

    @Test
    void unauthenticatedRequestIsRejected() throws Exception {
        mockMvc.perform(get("/api/v1/dashboard"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void returnsAggregatedDashboardForNewlyVerifiedUser() throws Exception {
        doNothing().when(emailService).sendVerificationEmail(anyString(), anyString(), anyString());

        String email = "dashboard-user@example.com";
        RegisterRequest registerRequest = new RegisterRequest("Grace Hopper", email, "Password1");
        mockMvc.perform(post("/api/v1/auth/register")
                .contentType("application/json")
                .content(objectMapper.writeValueAsString(registerRequest)))
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
            .andExpect(status().isOk())
            .andReturn().getResponse().getContentAsString();

        String accessToken = objectMapper.readTree(loginResponse).get("accessToken").asText();

        mockMvc.perform(get("/api/v1/dashboard").header("Authorization", "Bearer " + accessToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.welcome.fullName").value("Grace Hopper"))
            .andExpect(jsonPath("$.resumeCount").value(0))
            .andExpect(jsonPath("$.coverLetterCount").value(0))
            .andExpect(jsonPath("$.atsAnalysisCount").value(0))
            .andExpect(jsonPath("$.aiUsage.used").value(0))
            .andExpect(jsonPath("$.aiUsage.monthlyLimit").value(50))
            // Registering triggers an ACCOUNT_CREATED activity event.
            .andExpect(jsonPath("$.recentActivity[0].type").value("ACCOUNT_CREATED"))
            // Email is verified but there's no photo or resume yet.
            .andExpect(jsonPath("$.profileCompletion.percentage").value(33))
            .andExpect(jsonPath("$.profileCompletion.missingSteps.length()").value(2));
    }

    @Test
    void rejectsOutOfRangeActivityLimit() throws Exception {
        doNothing().when(emailService).sendVerificationEmail(anyString(), anyString(), anyString());

        String email = "limit-test@example.com";
        mockMvc.perform(post("/api/v1/auth/register")
                .contentType("application/json")
                .content(objectMapper.writeValueAsString(new RegisterRequest("Limit Test", email, "Password1"))))
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
        String accessToken = objectMapper.readTree(loginResponse).get("accessToken").asText();

        mockMvc.perform(get("/api/v1/dashboard?activityLimit=999")
                .header("Authorization", "Bearer " + accessToken))
            .andExpect(status().isBadRequest());
    }
}
