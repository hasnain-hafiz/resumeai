package com.resumeai.service.impl;

import com.resumeai.entity.RefreshToken;
import com.resumeai.entity.User;
import com.resumeai.exception.InvalidOrExpiredTokenException;
import com.resumeai.repository.RefreshTokenRepository;
import com.resumeai.service.RefreshTokenService;
import com.resumeai.util.TokenGenerator;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Service
@RequiredArgsConstructor
public class RefreshTokenServiceImpl implements RefreshTokenService {

    private static final Logger log = LoggerFactory.getLogger(RefreshTokenServiceImpl.class);

    private final RefreshTokenRepository refreshTokenRepository;

    @Value("${app.security.jwt.refresh-token-ttl-days:30}")
    private long refreshTokenTtlDays;

    @Override
    @Transactional
    public String issue(User user, HttpServletRequest request) {
        String rawToken = TokenGenerator.generateRawToken();

        RefreshToken token = RefreshToken.builder()
            .user(user)
            .tokenHash(TokenGenerator.hash(rawToken))
            .expiresAt(Instant.now().plus(refreshTokenTtlDays, ChronoUnit.DAYS))
            .userAgent(safeHeader(request, "User-Agent"))
            .ipAddress(clientIp(request))
            .build();

        refreshTokenRepository.save(token);
        return rawToken;
    }

    @Override
    @Transactional
    public RotationResult rotate(String rawToken, HttpServletRequest request) {
        String hash = TokenGenerator.hash(rawToken);
        RefreshToken existing = refreshTokenRepository.findByTokenHash(hash)
            .orElseThrow(() -> new InvalidOrExpiredTokenException("refresh"));

        if (existing.isRevoked()) {
            // Token reuse after rotation strongly suggests the token was stolen.
            // Defensively revoke the entire session family for this user.
            log.warn("Refresh token reuse detected for user {} - revoking all sessions", existing.getUser().getId());
            refreshTokenRepository.revokeAllForUser(existing.getUser());
            throw new InvalidOrExpiredTokenException("refresh");
        }

        if (existing.isExpired()) {
            throw new InvalidOrExpiredTokenException("refresh");
        }

        String newRawToken = TokenGenerator.generateRawToken();
        String newHash = TokenGenerator.hash(newRawToken);

        existing.setRevoked(true);
        existing.setReplacedByTokenHash(newHash);
        refreshTokenRepository.save(existing);

        RefreshToken replacement = RefreshToken.builder()
            .user(existing.getUser())
            .tokenHash(newHash)
            .expiresAt(Instant.now().plus(refreshTokenTtlDays, ChronoUnit.DAYS))
            .userAgent(safeHeader(request, "User-Agent"))
            .ipAddress(clientIp(request))
            .build();
        refreshTokenRepository.save(replacement);

        return new RotationResult(existing.getUser(), newRawToken, existing);
    }

    @Override
    @Transactional
    public void revokeAllForUser(User user) {
        refreshTokenRepository.revokeAllForUser(user);
    }

    @Override
    @Transactional
    public void revoke(String rawToken) {
        refreshTokenRepository.findByTokenHash(TokenGenerator.hash(rawToken))
            .ifPresent(token -> {
                token.setRevoked(true);
                refreshTokenRepository.save(token);
            });
    }

    private String safeHeader(HttpServletRequest request, String name) {
        String value = request.getHeader(name);
        return value != null ? value : "unknown";
    }

    private String clientIp(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
