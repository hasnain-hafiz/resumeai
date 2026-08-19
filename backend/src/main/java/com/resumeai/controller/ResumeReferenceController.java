package com.resumeai.controller;

import com.resumeai.dto.request.resume.ReferenceRequest;
import com.resumeai.dto.response.ApiResponse;
import com.resumeai.dto.response.resume.ReferenceResponse;
import com.resumeai.security.UserPrincipal;
import com.resumeai.service.ResumeReferenceService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/resumes/{resumeId}/references")
@RequiredArgsConstructor
@Tag(name = "Resume References")
public class ResumeReferenceController {

    private final ResumeReferenceService referenceService;

    @PostMapping
    public ResponseEntity<ReferenceResponse> add(
        @AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID resumeId,
        @Valid @RequestBody ReferenceRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(referenceService.add(resumeId, principal.getId(), request));
    }

    @PutMapping("/{referenceId}")
    public ResponseEntity<ReferenceResponse> update(
        @AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID resumeId, @PathVariable UUID referenceId,
        @Valid @RequestBody ReferenceRequest request
    ) {
        return ResponseEntity.ok(referenceService.update(resumeId, referenceId, principal.getId(), request));
    }

    @DeleteMapping("/{referenceId}")
    public ResponseEntity<ApiResponse> delete(
        @AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID resumeId, @PathVariable UUID referenceId
    ) {
        referenceService.delete(resumeId, referenceId, principal.getId());
        return ResponseEntity.ok(ApiResponse.of("Reference deleted."));
    }
}
