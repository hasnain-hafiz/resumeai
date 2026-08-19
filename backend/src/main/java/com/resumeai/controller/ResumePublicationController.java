package com.resumeai.controller;

import com.resumeai.dto.request.resume.PublicationRequest;
import com.resumeai.dto.response.ApiResponse;
import com.resumeai.dto.response.resume.PublicationResponse;
import com.resumeai.security.UserPrincipal;
import com.resumeai.service.ResumePublicationService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/resumes/{resumeId}/publications")
@RequiredArgsConstructor
@Tag(name = "Resume Publications")
public class ResumePublicationController {

    private final ResumePublicationService publicationService;

    @PostMapping
    public ResponseEntity<PublicationResponse> add(
        @AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID resumeId,
        @Valid @RequestBody PublicationRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(publicationService.add(resumeId, principal.getId(), request));
    }

    @PutMapping("/{publicationId}")
    public ResponseEntity<PublicationResponse> update(
        @AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID resumeId, @PathVariable UUID publicationId,
        @Valid @RequestBody PublicationRequest request
    ) {
        return ResponseEntity.ok(publicationService.update(resumeId, publicationId, principal.getId(), request));
    }

    @DeleteMapping("/{publicationId}")
    public ResponseEntity<ApiResponse> delete(
        @AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID resumeId, @PathVariable UUID publicationId
    ) {
        publicationService.delete(resumeId, publicationId, principal.getId());
        return ResponseEntity.ok(ApiResponse.of("Publication deleted."));
    }
}
