package com.resumeai.controller;

import com.resumeai.dto.request.resume.ExperienceRequest;
import com.resumeai.dto.request.resume.ReorderRequest;
import com.resumeai.dto.response.ApiResponse;
import com.resumeai.dto.response.resume.ExperienceResponse;
import com.resumeai.security.UserPrincipal;
import com.resumeai.service.ResumeExperienceService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/resumes/{resumeId}/experience")
@RequiredArgsConstructor
@Tag(name = "Resume Experience")
public class ResumeExperienceController {

    private final ResumeExperienceService experienceService;

    @PostMapping
    public ResponseEntity<ExperienceResponse> add(
        @AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID resumeId,
        @Valid @RequestBody ExperienceRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(experienceService.add(resumeId, principal.getId(), request));
    }

    @PutMapping("/{experienceId}")
    public ResponseEntity<ExperienceResponse> update(
        @AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID resumeId, @PathVariable UUID experienceId,
        @Valid @RequestBody ExperienceRequest request
    ) {
        return ResponseEntity.ok(experienceService.update(resumeId, experienceId, principal.getId(), request));
    }

    @DeleteMapping("/{experienceId}")
    public ResponseEntity<ApiResponse> delete(
        @AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID resumeId, @PathVariable UUID experienceId
    ) {
        experienceService.delete(resumeId, experienceId, principal.getId());
        return ResponseEntity.ok(ApiResponse.of("Experience entry deleted."));
    }

    @PatchMapping("/reorder")
    public ResponseEntity<ApiResponse> reorder(
        @AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID resumeId,
        @Valid @RequestBody ReorderRequest request
    ) {
        experienceService.reorder(resumeId, principal.getId(), request);
        return ResponseEntity.ok(ApiResponse.of("Experience order updated."));
    }
}
