package com.resumeai.service;

import com.resumeai.dto.response.DashboardResponse;

import java.util.UUID;

public interface DashboardService {

    /**
     * Aggregates everything the post-login dashboard needs for one user into
     * a single response, so the frontend makes exactly one request to render
     * the whole screen.
     */
    DashboardResponse getDashboard(UUID userId, int recentActivityLimit);
}
