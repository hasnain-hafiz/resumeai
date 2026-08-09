package com.resumeai.dto.response;

public record AuthResponse(
    String accessToken,
    String refreshToken,
    long expiresInSeconds,
    UserResponse user
) {}
