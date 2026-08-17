package com.resumeai.controller;

import com.resumeai.dto.response.DashboardResponse;
import com.resumeai.security.UserPrincipal;
import com.resumeai.service.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
@Validated
@Tag(name = "Dashboard", description = "Aggregated post-login overview: counts, AI usage, activity, profile completion")
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping
    @Operation(summary = "Get the current user's dashboard summary")
    public ResponseEntity<DashboardResponse> getDashboard(
        @AuthenticationPrincipal UserPrincipal principal,
        @RequestParam(name = "activityLimit", defaultValue = "10")
        @Min(1) @Max(50) int activityLimit
    ) {
        return ResponseEntity.ok(dashboardService.getDashboard(principal.getId(), activityLimit));
    }
}
