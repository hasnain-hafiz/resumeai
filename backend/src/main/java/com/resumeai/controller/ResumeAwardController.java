package com.resumeai.controller;

import com.resumeai.dto.request.resume.AwardRequest;
import com.resumeai.dto.response.ApiResponse;
import com.resumeai.dto.response.resume.AwardResponse;
import com.resumeai.security.UserPrincipal;
import com.resumeai.service.ResumeAwardService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/resumes/{resumeId}/awards")
@RequiredArgsConstructor
@Tag(name = "Resume Awards")
public class ResumeAwardController {

    private final ResumeAwardService awardService;

    @PostMapping
    public ResponseEntity<AwardResponse> add(
        @AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID resumeId,
        @Valid @RequestBody AwardRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(awardService.add(resumeId, principal.getId(), request));
    }

    @PutMapping("/{awardId}")
    public ResponseEntity<AwardResponse> update(
        @AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID resumeId, @PathVariable UUID awardId,
        @Valid @RequestBody AwardRequest request
    ) {
        return ResponseEntity.ok(awardService.update(resumeId, awardId, principal.getId(), request));
    }

    @DeleteMapping("/{awardId}")
    public ResponseEntity<ApiResponse> delete(
        @AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID resumeId, @PathVariable UUID awardId
    ) {
        awardService.delete(resumeId, awardId, principal.getId());
        return ResponseEntity.ok(ApiResponse.of("Award deleted."));
    }
}
