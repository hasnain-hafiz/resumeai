package com.resumeai.controller;

import com.resumeai.dto.request.resume.ListItemRequest;
import com.resumeai.dto.request.resume.ReorderListItemsRequest;
import com.resumeai.dto.response.ApiResponse;
import com.resumeai.dto.response.resume.ListItemResponse;
import com.resumeai.security.UserPrincipal;
import com.resumeai.service.ResumeListItemService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/** Covers Skills (all categories), Interests, and Spoken Languages - all just labelled tags on a resume. */
@RestController
@RequestMapping("/api/v1/resumes/{resumeId}/list-items")
@RequiredArgsConstructor
@Tag(name = "Resume Skills, Interests & Languages")
public class ResumeListItemController {

    private final ResumeListItemService listItemService;

    @PostMapping
    public ResponseEntity<ListItemResponse> add(
        @AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID resumeId,
        @Valid @RequestBody ListItemRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(listItemService.add(resumeId, principal.getId(), request));
    }

    @PutMapping("/{itemId}")
    public ResponseEntity<ListItemResponse> update(
        @AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID resumeId, @PathVariable UUID itemId,
        @Valid @RequestBody ListItemRequest request
    ) {
        return ResponseEntity.ok(listItemService.update(resumeId, itemId, principal.getId(), request));
    }

    @DeleteMapping("/{itemId}")
    public ResponseEntity<ApiResponse> delete(
        @AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID resumeId, @PathVariable UUID itemId
    ) {
        listItemService.delete(resumeId, itemId, principal.getId());
        return ResponseEntity.ok(ApiResponse.of("Item deleted."));
    }

    @PatchMapping("/reorder")
    public ResponseEntity<ApiResponse> reorder(
        @AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID resumeId,
        @Valid @RequestBody ReorderListItemsRequest request
    ) {
        listItemService.reorder(resumeId, principal.getId(), request);
        return ResponseEntity.ok(ApiResponse.of("Item order updated."));
    }
}
