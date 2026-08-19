package com.resumeai.controller;

import com.resumeai.dto.request.resume.CertificationRequest;
import com.resumeai.dto.response.ApiResponse;
import com.resumeai.dto.response.resume.CertificationResponse;
import com.resumeai.security.UserPrincipal;
import com.resumeai.service.ResumeCertificationService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/resumes/{resumeId}/certifications")
@RequiredArgsConstructor
@Tag(name = "Resume Certifications")
public class ResumeCertificationController {

    private final ResumeCertificationService certificationService;

    @PostMapping
    public ResponseEntity<CertificationResponse> add(
        @AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID resumeId,
        @Valid @RequestBody CertificationRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(certificationService.add(resumeId, principal.getId(), request));
    }

    @PutMapping("/{certificationId}")
    public ResponseEntity<CertificationResponse> update(
        @AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID resumeId, @PathVariable UUID certificationId,
        @Valid @RequestBody CertificationRequest request
    ) {
        return ResponseEntity.ok(certificationService.update(resumeId, certificationId, principal.getId(), request));
    }

    @DeleteMapping("/{certificationId}")
    public ResponseEntity<ApiResponse> delete(
        @AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID resumeId, @PathVariable UUID certificationId
    ) {
        certificationService.delete(resumeId, certificationId, principal.getId());
        return ResponseEntity.ok(ApiResponse.of("Certification deleted."));
    }
}
