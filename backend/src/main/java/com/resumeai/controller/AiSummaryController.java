package com.resumeai.controller;

import com.resumeai.dto.request.ai.GenerateSummaryRequest;
import com.resumeai.dto.response.ai.GenerateSummaryResponse;
import com.resumeai.security.UserPrincipal;
import com.resumeai.service.AiSummaryService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/resumes/{resumeId}/ai/summary")
@RequiredArgsConstructor
@Tag(name = "AI Summary Generator")
public class AiSummaryController {

    private final AiSummaryService aiSummaryService;

    @PostMapping("/generate")
    public ResponseEntity<GenerateSummaryResponse> generate(
        @AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID resumeId,
        @Valid @RequestBody GenerateSummaryRequest request
    ) {
        return ResponseEntity.ok(aiSummaryService.generate(resumeId, principal.getId(), request));
    }
}
