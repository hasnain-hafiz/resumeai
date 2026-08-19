package com.resumeai.controller;

import com.resumeai.dto.request.resume.EducationRequest;
import com.resumeai.dto.response.ApiResponse;
import com.resumeai.dto.response.resume.EducationResponse;
import com.resumeai.security.UserPrincipal;
import com.resumeai.service.ResumeEducationService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/resumes/{resumeId}/education")
@RequiredArgsConstructor
@Tag(name = "Resume Education")
public class ResumeEducationController {

    private final ResumeEducationService educationService;

    @PostMapping
    public ResponseEntity<EducationResponse> add(
        @AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID resumeId,
        @Valid @RequestBody EducationRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(educationService.add(resumeId, principal.getId(), request));
    }

    @PutMapping("/{educationId}")
    public ResponseEntity<EducationResponse> update(
        @AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID resumeId, @PathVariable UUID educationId,
        @Valid @RequestBody EducationRequest request
    ) {
        return ResponseEntity.ok(educationService.update(resumeId, educationId, principal.getId(), request));
    }

    @DeleteMapping("/{educationId}")
    public ResponseEntity<ApiResponse> delete(
        @AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID resumeId, @PathVariable UUID educationId
    ) {
        educationService.delete(resumeId, educationId, principal.getId());
        return ResponseEntity.ok(ApiResponse.of("Education entry deleted."));
    }
}
