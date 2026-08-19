package com.resumeai.controller;

import com.resumeai.dto.request.resume.VolunteerExperienceRequest;
import com.resumeai.dto.response.ApiResponse;
import com.resumeai.dto.response.resume.VolunteerExperienceResponse;
import com.resumeai.security.UserPrincipal;
import com.resumeai.service.ResumeVolunteerExperienceService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/resumes/{resumeId}/volunteer-experience")
@RequiredArgsConstructor
@Tag(name = "Resume Volunteer Experience")
public class ResumeVolunteerExperienceController {

    private final ResumeVolunteerExperienceService volunteerExperienceService;

    @PostMapping
    public ResponseEntity<VolunteerExperienceResponse> add(
        @AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID resumeId,
        @Valid @RequestBody VolunteerExperienceRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(volunteerExperienceService.add(resumeId, principal.getId(), request));
    }

    @PutMapping("/{entryId}")
    public ResponseEntity<VolunteerExperienceResponse> update(
        @AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID resumeId, @PathVariable UUID entryId,
        @Valid @RequestBody VolunteerExperienceRequest request
    ) {
        return ResponseEntity.ok(volunteerExperienceService.update(resumeId, entryId, principal.getId(), request));
    }

    @DeleteMapping("/{entryId}")
    public ResponseEntity<ApiResponse> delete(
        @AuthenticationPrincipal UserPrincipal principal, @PathVariable UUID resumeId, @PathVariable UUID entryId
    ) {
        volunteerExperienceService.delete(resumeId, entryId, principal.getId());
        return ResponseEntity.ok(ApiResponse.of("Volunteer experience entry deleted."));
    }
}
