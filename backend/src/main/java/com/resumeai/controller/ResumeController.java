package com.resumeai.controller;

import com.resumeai.dto.request.resume.CreateResumeRequest;
import com.resumeai.dto.request.resume.SectionOrderRequest;
import com.resumeai.dto.request.resume.SelectTemplateRequest;
import com.resumeai.dto.request.resume.UpdateResumeDetailsRequest;
import com.resumeai.dto.response.ApiResponse;
import com.resumeai.dto.response.resume.ResumeResponse;
import com.resumeai.dto.response.resume.ResumeSummaryResponse;
import com.resumeai.security.UserPrincipal;
import com.resumeai.service.ResumeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/resumes")
@RequiredArgsConstructor
@Tag(name = "Resumes", description = "Create and manage resumes and their content")
public class ResumeController {

    private final ResumeService resumeService;

    @PostMapping
    @Operation(summary = "Create a new (blank) resume")
    public ResponseEntity<ResumeSummaryResponse> create(
        @AuthenticationPrincipal UserPrincipal principal,
        @Valid @RequestBody CreateResumeRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(resumeService.create(principal.getId(), request));
    }

    @GetMapping
    @Operation(summary = "List the current user's resumes, most recently updated first")
    public ResponseEntity<List<ResumeSummaryResponse>> list(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(resumeService.listForUser(principal.getId()));
    }

    @GetMapping("/{resumeId}")
    @Operation(summary = "Get a resume with every section populated")
    public ResponseEntity<ResumeResponse> get(
        @AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID resumeId
    ) {
        return ResponseEntity.ok(resumeService.getFull(resumeId, principal.getId()));
    }

    @PutMapping("/{resumeId}")
    @Operation(summary = "Update a resume's title, personal information, and summary")
    public ResponseEntity<ResumeResponse> updateDetails(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable UUID resumeId,
        @Valid @RequestBody UpdateResumeDetailsRequest request
    ) {
        return ResponseEntity.ok(resumeService.updateDetails(resumeId, principal.getId(), request));
    }

    @PatchMapping("/{resumeId}/template")
    @Operation(summary = "Set (or, with a null templateId, clear) the resume's template")
    public ResponseEntity<ResumeResponse> selectTemplate(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable UUID resumeId,
        @Valid @RequestBody SelectTemplateRequest request
    ) {
        return ResponseEntity.ok(resumeService.selectTemplate(resumeId, principal.getId(), request));
    }

    @PatchMapping("/{resumeId}/sections/reorder")
    @Operation(summary = "Set the display order of the top-level resume sections (Experience, Education, Projects, ...)")
    public ResponseEntity<ResumeResponse> reorderSections(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable UUID resumeId,
        @Valid @RequestBody SectionOrderRequest request
    ) {
        return ResponseEntity.ok(resumeService.reorderSections(resumeId, principal.getId(), request));
    }

    @DeleteMapping("/{resumeId}")
    @Operation(summary = "Delete a resume")
    public ResponseEntity<ApiResponse> delete(
        @AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID resumeId
    ) {
        resumeService.delete(resumeId, principal.getId());
        return ResponseEntity.ok(ApiResponse.of("Resume deleted."));
    }
}
