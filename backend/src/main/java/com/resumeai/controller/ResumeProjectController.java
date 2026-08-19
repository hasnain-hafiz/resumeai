package com.resumeai.controller;

import com.resumeai.dto.request.resume.ProjectImageRequest;
import com.resumeai.dto.request.resume.ProjectRequest;
import com.resumeai.dto.response.ApiResponse;
import com.resumeai.dto.response.resume.ProjectResponse;
import com.resumeai.security.UserPrincipal;
import com.resumeai.service.ResumeProjectService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/resumes/{resumeId}/projects")
@RequiredArgsConstructor
@Tag(name = "Resume Projects")
public class ResumeProjectController {

    private final ResumeProjectService projectService;

    @PostMapping
    public ResponseEntity<ProjectResponse> add(
        @AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID resumeId,
        @Valid @RequestBody ProjectRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(projectService.add(resumeId, principal.getId(), request));
    }

    @PutMapping("/{projectId}")
    public ResponseEntity<ProjectResponse> update(
        @AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID resumeId, @PathVariable UUID projectId,
        @Valid @RequestBody ProjectRequest request
    ) {
        return ResponseEntity.ok(projectService.update(resumeId, projectId, principal.getId(), request));
    }

    @DeleteMapping("/{projectId}")
    public ResponseEntity<ApiResponse> delete(
        @AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID resumeId, @PathVariable UUID projectId
    ) {
        projectService.delete(resumeId, projectId, principal.getId());
        return ResponseEntity.ok(ApiResponse.of("Project deleted."));
    }

    @PostMapping("/{projectId}/images")
    public ResponseEntity<ProjectResponse> addImage(
        @AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID resumeId, @PathVariable UUID projectId,
        @Valid @RequestBody ProjectImageRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(projectService.addImage(resumeId, projectId, principal.getId(), request));
    }

    @DeleteMapping("/{projectId}/images/{imageId}")
    public ResponseEntity<ProjectResponse> deleteImage(
        @AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID resumeId,
        @PathVariable UUID projectId, @PathVariable UUID imageId
    ) {
        return ResponseEntity.ok(projectService.deleteImage(resumeId, projectId, imageId, principal.getId()));
    }
}
