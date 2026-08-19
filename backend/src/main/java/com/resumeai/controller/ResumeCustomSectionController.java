package com.resumeai.controller;

import com.resumeai.dto.request.resume.CustomSectionItemRequest;
import com.resumeai.dto.request.resume.CustomSectionRequest;
import com.resumeai.dto.response.ApiResponse;
import com.resumeai.dto.response.resume.CustomSectionResponse;
import com.resumeai.security.UserPrincipal;
import com.resumeai.service.ResumeCustomSectionService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/resumes/{resumeId}/custom-sections")
@RequiredArgsConstructor
@Tag(name = "Resume Custom Sections")
public class ResumeCustomSectionController {

    private final ResumeCustomSectionService customSectionService;

    @PostMapping
    public ResponseEntity<CustomSectionResponse> addSection(
        @AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID resumeId,
        @Valid @RequestBody CustomSectionRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(customSectionService.addSection(resumeId, principal.getId(), request));
    }

    @PutMapping("/{sectionId}")
    public ResponseEntity<CustomSectionResponse> updateSection(
        @AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID resumeId, @PathVariable UUID sectionId,
        @Valid @RequestBody CustomSectionRequest request
    ) {
        return ResponseEntity.ok(customSectionService.updateSection(resumeId, sectionId, principal.getId(), request));
    }

    @DeleteMapping("/{sectionId}")
    public ResponseEntity<ApiResponse> deleteSection(
        @AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID resumeId, @PathVariable UUID sectionId
    ) {
        customSectionService.deleteSection(resumeId, sectionId, principal.getId());
        return ResponseEntity.ok(ApiResponse.of("Custom section deleted."));
    }

    @PostMapping("/{sectionId}/items")
    public ResponseEntity<CustomSectionResponse> addItem(
        @AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID resumeId, @PathVariable UUID sectionId,
        @Valid @RequestBody CustomSectionItemRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(customSectionService.addItem(resumeId, sectionId, principal.getId(), request));
    }

    @PutMapping("/{sectionId}/items/{itemId}")
    public ResponseEntity<CustomSectionResponse> updateItem(
        @AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID resumeId,
        @PathVariable UUID sectionId, @PathVariable UUID itemId,
        @Valid @RequestBody CustomSectionItemRequest request
    ) {
        return ResponseEntity.ok(customSectionService.updateItem(resumeId, sectionId, itemId, principal.getId(), request));
    }

    @DeleteMapping("/{sectionId}/items/{itemId}")
    public ResponseEntity<CustomSectionResponse> deleteItem(
        @AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID resumeId,
        @PathVariable UUID sectionId, @PathVariable UUID itemId
    ) {
        return ResponseEntity.ok(customSectionService.deleteItem(resumeId, sectionId, itemId, principal.getId()));
    }
}
