package com.resumeai.dto.response;

import com.resumeai.entity.User;

import java.time.Instant;
import java.util.UUID;

public record UserResponse(
    UUID id,
    String fullName,
    String email,
    String photoUrl,
    User.Role role,
    User.AuthProvider provider,
    boolean emailVerified,
    Instant createdAt
) {}
