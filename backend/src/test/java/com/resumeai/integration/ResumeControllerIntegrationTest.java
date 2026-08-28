package com.resumeai.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.resumeai.dto.request.LoginRequest;
import com.resumeai.dto.request.RegisterRequest;
import com.resumeai.dto.request.VerifyEmailRequest;
import com.resumeai.dto.request.resume.*;
import com.resumeai.entity.ResumeListItem;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.clearInvocations;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Testcontainers
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ResumeControllerIntegrationTest {

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

    private String registerVerifyAndLogin(String email) throws Exception {
        // Reset here, not just once per test: this helper is called more than
        // once within a single test (e.g. cannotAccessAnotherUsersResume registers
        // two separate users), and each call's own verify() below should only see
        // that call's invocation, not accumulate across repeated calls.
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

    @Test
    void unauthenticatedRequestsAreRejected() throws Exception {
        mockMvc.perform(get("/api/v1/resumes")).andExpect(status().isUnauthorized());
    }

    @Test
    void fullResumeLifecycle() throws Exception {
        String token = registerVerifyAndLogin("resume-user@example.com");
        String auth = "Bearer " + token;

        // Create
        String createResponse = mockMvc.perform(post("/api/v1/resumes")
                .header("Authorization", auth)
                .contentType("application/json")
                .content(objectMapper.writeValueAsString(new CreateResumeRequest("My First Resume"))))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.title").value("My First Resume"))
            // Personal info is seeded from the account.
            .andExpect(jsonPath("$.fullName").value("Grace Hopper"))
            .andReturn().getResponse().getContentAsString();
        String resumeId = objectMapper.readTree(createResponse).get("id").asText();

        // Appears in the list
        mockMvc.perform(get("/api/v1/resumes").header("Authorization", auth))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(1));

        // Update core details
        UpdateResumeDetailsRequest detailsRequest = new UpdateResumeDetailsRequest(
            "Senior Software Engineer Resume", "Grace Hopper", "grace@example.com", "555-0100",
            "New York, NY", "linkedin.com/in/grace", "github.com/grace", "grace.dev", "grace.dev",
            null, "<p>Pioneering computer scientist.</p>"
        );
        mockMvc.perform(put("/api/v1/resumes/" + resumeId)
                .header("Authorization", auth)
                .contentType("application/json")
                .content(objectMapper.writeValueAsString(detailsRequest)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.title").value("Senior Software Engineer Resume"))
            .andExpect(jsonPath("$.summary").value("<p>Pioneering computer scientist.</p>"));

        // Add an experience entry
        ExperienceRequest experienceRequest = new ExperienceRequest(
            "US Navy", "Rear Admiral", "Washington, DC", null, null, null, true,
            "Led early computer programming efforts.", "Developed the first compiler.", 0
        );
        mockMvc.perform(post("/api/v1/resumes/" + resumeId + "/experience")
                .header("Authorization", auth)
                .contentType("application/json")
                .content(objectMapper.writeValueAsString(experienceRequest)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.company").value("US Navy"));

        // Add an education entry
        EducationRequest educationRequest = new EducationRequest("Yale University", "PhD", "Mathematics", null, null, null, 0);
        mockMvc.perform(post("/api/v1/resumes/" + resumeId + "/education")
                .header("Authorization", auth)
                .contentType("application/json")
                .content(objectMapper.writeValueAsString(educationRequest)))
            .andExpect(status().isCreated());

        // Add a project, then an image on that project
        ProjectRequest projectRequest = new ProjectRequest("COBOL Compiler", "Early compiler work", "Assembly, FLOW-MATIC", null, null, 0);
        String projectResponse = mockMvc.perform(post("/api/v1/resumes/" + resumeId + "/projects")
                .header("Authorization", auth)
                .contentType("application/json")
                .content(objectMapper.writeValueAsString(projectRequest)))
            .andExpect(status().isCreated())
            .andReturn().getResponse().getContentAsString();
        JsonNode projectNode = objectMapper.readTree(projectResponse);
        String projectId = projectNode.get("id").asText();

        mockMvc.perform(post("/api/v1/resumes/" + resumeId + "/projects/" + projectId + "/images")
                .header("Authorization", auth)
                .contentType("application/json")
                .content(objectMapper.writeValueAsString(new ProjectImageRequest("https://cdn.example.com/img.png", 0))))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.images.length()").value(1));

        // Add a skill
        ListItemRequest skillRequest = new ListItemRequest(ResumeListItem.Section.PROGRAMMING_LANGUAGE, "COBOL", null, 0);
        mockMvc.perform(post("/api/v1/resumes/" + resumeId + "/list-items")
                .header("Authorization", auth)
                .contentType("application/json")
                .content(objectMapper.writeValueAsString(skillRequest)))
            .andExpect(status().isCreated());

        // Full resume reflects everything added
        mockMvc.perform(get("/api/v1/resumes/" + resumeId).header("Authorization", auth))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.experience.length()").value(1))
            .andExpect(jsonPath("$.education.length()").value(1))
            .andExpect(jsonPath("$.projects.length()").value(1))
            .andExpect(jsonPath("$.projects[0].images.length()").value(1))
            .andExpect(jsonPath("$.listItems.length()").value(1));

        // Cross-feature check: Dashboard's resume count now reflects the resume created above.
        mockMvc.perform(get("/api/v1/dashboard").header("Authorization", auth))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.resumeCount").value(1))
            // Creating a resume satisfies the "Create your first resume" profile-completion step.
            .andExpect(jsonPath("$.profileCompletion.percentage").value(67));

        // Delete removes it from the list and the count
        mockMvc.perform(delete("/api/v1/resumes/" + resumeId).header("Authorization", auth))
            .andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/resumes").header("Authorization", auth))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.length()").value(0));
        mockMvc.perform(get("/api/v1/resumes/" + resumeId).header("Authorization", auth))
            .andExpect(status().isNotFound());
    }

    @Test
    void cannotAccessAnotherUsersResume() throws Exception {
        String ownerToken = registerVerifyAndLogin("owner@example.com");
        String intruderToken = registerVerifyAndLogin("intruder@example.com");

        String createResponse = mockMvc.perform(post("/api/v1/resumes")
                .header("Authorization", "Bearer " + ownerToken)
                .contentType("application/json")
                .content(objectMapper.writeValueAsString(new CreateResumeRequest("Owner's Resume"))))
            .andReturn().getResponse().getContentAsString();
        String resumeId = objectMapper.readTree(createResponse).get("id").asText();

        mockMvc.perform(get("/api/v1/resumes/" + resumeId).header("Authorization", "Bearer " + intruderToken))
            .andExpect(status().isNotFound());
    }

    @Test
    void canBrowseAndSelectATemplate() throws Exception {
        // The catalog is public - no Authorization header at all.
        String catalogResponse = mockMvc.perform(get("/api/v1/templates"))
            .andExpect(status().isOk())
            // Seeded by V4__resume_templates_schema.sql - at least the 20 required templates.
            .andExpect(jsonPath("$.length()").value(org.hamcrest.Matchers.greaterThanOrEqualTo(20)))
            .andReturn().getResponse().getContentAsString();

        String modernTemplateId = null;
        for (var node : objectMapper.readTree(catalogResponse)) {
            if ("modern".equals(node.get("key").asText())) {
                modernTemplateId = node.get("id").asText();
                break;
            }
        }
        assertThat(modernTemplateId).as("seeded 'modern' template should be in the catalog").isNotNull();

        String token = registerVerifyAndLogin("template-user@example.com");
        String auth = "Bearer " + token;

        String createResponse = mockMvc.perform(post("/api/v1/resumes")
                .header("Authorization", auth)
                .contentType("application/json")
                .content(objectMapper.writeValueAsString(new CreateResumeRequest("Templated Resume"))))
            .andReturn().getResponse().getContentAsString();
        String resumeId = objectMapper.readTree(createResponse).get("id").asText();

        // No template selected yet.
        mockMvc.perform(get("/api/v1/resumes/" + resumeId).header("Authorization", auth))
            .andExpect(jsonPath("$.template").doesNotExist());

        mockMvc.perform(patch("/api/v1/resumes/" + resumeId + "/template")
                .header("Authorization", auth)
                .contentType("application/json")
                .content("{\"templateId\":\"" + modernTemplateId + "\"}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.template.key").value("modern"));

        // It shows up in the resume list summary too, e.g. for a thumbnail.
        mockMvc.perform(get("/api/v1/resumes").header("Authorization", auth))
            .andExpect(jsonPath("$[0].templateKey").value("modern"));

        // Clearing it (null templateId) removes the selection.
        mockMvc.perform(patch("/api/v1/resumes/" + resumeId + "/template")
                .header("Authorization", auth)
                .contentType("application/json")
                .content("{\"templateId\":null}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.template").doesNotExist());
    }
}
