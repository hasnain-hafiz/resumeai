package com.resumeai.service;

import com.resumeai.entity.RefreshToken;
import com.resumeai.entity.User;
import jakarta.servlet.http.HttpServletRequest;

public interface RefreshTokenService {

    /** Issues a brand-new refresh token for the user and returns the RAW (unhashed) value. */
    String issue(User user, HttpServletRequest request);

    /**
     * Validates the raw refresh token, revokes it, and issues a replacement
     * (rotation). Throws InvalidOrExpiredTokenException if the token is
     * unknown, expired, or already revoked/reused.
     */
    RotationResult rotate(String rawToken, HttpServletRequest request);

    void revokeAllForUser(User user);

    /** Revokes a single refresh token by its raw value. Used by logout - safe to call even if already invalid. */
    void revoke(String rawToken);

    record RotationResult(User user, String newRawRefreshToken, RefreshToken previousToken) {}
}
