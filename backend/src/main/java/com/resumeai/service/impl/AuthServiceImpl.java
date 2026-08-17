package com.resumeai.service.impl;

import com.resumeai.dto.request.*;
import com.resumeai.dto.response.AuthResponse;
import com.resumeai.dto.response.UserResponse;
import com.resumeai.entity.PasswordResetToken;
import com.resumeai.entity.ActivityEvent;
import com.resumeai.entity.User;
import com.resumeai.entity.VerificationToken;
import com.resumeai.exception.*;
import com.resumeai.mapper.UserMapper;
import com.resumeai.repository.PasswordResetTokenRepository;
import com.resumeai.repository.UserRepository;
import com.resumeai.repository.VerificationTokenRepository;
import com.resumeai.security.JwtTokenProvider;
import com.resumeai.service.ActivityEventService;
import com.resumeai.service.AuthService;
import com.resumeai.service.EmailService;
import com.resumeai.service.RefreshTokenService;
import com.resumeai.util.TokenGenerator;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthServiceImpl.class);

    private static final int MAX_FAILED_LOGIN_ATTEMPTS = 5;
    private static final long EMAIL_VERIFICATION_TTL_HOURS = 24;
    private static final long PASSWORD_RESET_TTL_HOURS = 1;

    private final UserRepository userRepository;
    private final VerificationTokenRepository verificationTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final RefreshTokenService refreshTokenService;
    private final EmailService emailService;
    private final UserMapper userMapper;
    private final ActivityEventService activityEventService;

    @Override
    @Transactional
    public void register(RegisterRequest request) {
        if (userRepository.existsByEmailIgnoreCase(request.email())) {
            throw new EmailAlreadyInUseException(request.email());
        }

        User user = User.builder()
            .fullName(request.fullName())
            .email(request.email().toLowerCase())
            .passwordHash(passwordEncoder.encode(request.password()))
            .provider(User.AuthProvider.LOCAL)
            .role(User.Role.USER)
            .emailVerified(false)
            .build();
        userRepository.save(user);

        issueVerificationToken(user);
        activityEventService.record(user, ActivityEvent.Type.ACCOUNT_CREATED, "Account created");
    }

    @Override
    @Transactional
    public AuthResponse login(LoginRequest request, HttpServletRequest httpRequest) {
        User user = userRepository.findByEmailIgnoreCase(request.email())
            .orElseThrow(InvalidCredentialsException::new);

        if (user.isAccountLocked()) {
            throw new AccountLockedException();
        }

        if (user.getPasswordHash() == null || !passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            registerFailedLoginAttempt(user);
            throw new InvalidCredentialsException();
        }

        if (!user.isEmailVerified()) {
            throw new EmailNotVerifiedException();
        }

        user.setFailedLoginAttempts(0);
        user.setLastLoginAt(Instant.now());
        userRepository.save(user);

        return issueTokens(user, httpRequest);
    }

    @Override
    @Transactional
    public AuthResponse refresh(RefreshTokenRequest request, HttpServletRequest httpRequest) {
        var rotation = refreshTokenService.rotate(request.refreshToken(), httpRequest);
        return buildAuthResponse(rotation.user(), rotation.newRawRefreshToken());
    }

    @Override
    @Transactional
    public void logout(RefreshTokenRequest request) {
        refreshTokenService.revoke(request.refreshToken());
    }

    @Override
    @Transactional
    public void verifyEmail(VerifyEmailRequest request) {
        String hash = TokenGenerator.hash(request.token());
        VerificationToken token = verificationTokenRepository.findByTokenHash(hash)
            .orElseThrow(() -> new InvalidOrExpiredTokenException("verification"));

        if (!token.isValid()) {
            throw new InvalidOrExpiredTokenException("verification");
        }

        User user = token.getUser();
        user.setEmailVerified(true);
        userRepository.save(user);

        token.setConsumedAt(Instant.now());
        verificationTokenRepository.save(token);

        emailService.sendWelcomeEmail(user.getEmail(), user.getFullName());
    }

    @Override
    @Transactional
    public void resendVerificationEmail(String email) {
        userRepository.findByEmailIgnoreCase(email).ifPresent(user -> {
            if (!user.isEmailVerified()) {
                issueVerificationToken(user);
            }
            // If already verified, say nothing different to the caller - this
            // method's controller-level response is always generic, so we don't
            // leak whether the address exists or its verification state.
        });
    }

    @Override
    @Transactional
    public void forgotPassword(ForgotPasswordRequest request) {
        userRepository.findByEmailIgnoreCase(request.email()).ifPresent(user -> {
            String rawToken = TokenGenerator.generateRawToken();
            PasswordResetToken resetToken = PasswordResetToken.builder()
                .user(user)
                .tokenHash(TokenGenerator.hash(rawToken))
                .expiresAt(Instant.now().plus(PASSWORD_RESET_TTL_HOURS, ChronoUnit.HOURS))
                .build();
            passwordResetTokenRepository.save(resetToken);
            emailService.sendPasswordResetEmail(user.getEmail(), user.getFullName(), rawToken);
        });
        // Always respond as if it succeeded (controller layer) - never reveal
        // whether an email address has an account.
    }

    @Override
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        String hash = TokenGenerator.hash(request.token());
        PasswordResetToken token = passwordResetTokenRepository.findByTokenHash(hash)
            .orElseThrow(() -> new InvalidOrExpiredTokenException("password reset"));

        if (!token.isValid()) {
            throw new InvalidOrExpiredTokenException("password reset");
        }

        User user = token.getUser();
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        user.setAccountLocked(false);
        user.setFailedLoginAttempts(0);
        userRepository.save(user);

        token.setConsumedAt(Instant.now());
        passwordResetTokenRepository.save(token);

        refreshTokenService.revokeAllForUser(user); // force re-login everywhere
        emailService.sendPasswordChangedNotice(user.getEmail(), user.getFullName());
    }

    @Override
    @Transactional
    public void changePassword(UUID userId, ChangePasswordRequest request) {
        User user = getUserOrThrow(userId);

        if (user.getPasswordHash() == null || !passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new InvalidCredentialsException();
        }

        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);

        refreshTokenService.revokeAllForUser(user);
        emailService.sendPasswordChangedNotice(user.getEmail(), user.getFullName());
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse getCurrentUser(UUID userId) {
        return userMapper.toResponse(getUserOrThrow(userId));
    }

    @Override
    @Transactional
    public UserResponse updateProfile(UUID userId, UpdateProfileRequest request) {
        User user = getUserOrThrow(userId);
        if (request.fullName() != null && !request.fullName().isBlank()) {
            user.setFullName(request.fullName());
        }
        if (request.photoUrl() != null) {
            user.setPhotoUrl(request.photoUrl());
        }
        User saved = userRepository.save(user);
        activityEventService.record(saved, ActivityEvent.Type.PROFILE_UPDATED, "Profile updated");
        return userMapper.toResponse(saved);
    }

    @Override
    @Transactional
    public void deleteAccount(UUID userId) {
        User user = getUserOrThrow(userId);
        user.markDeleted(); // soft delete - see BaseEntity
        userRepository.save(user);
        refreshTokenService.revokeAllForUser(user);
    }

    // ---- helpers ----------------------------------------------------

    private User getUserOrThrow(UUID userId) {
        return userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private void issueVerificationToken(User user) {
        String rawToken = TokenGenerator.generateRawToken();
        VerificationToken token = VerificationToken.builder()
            .user(user)
            .tokenHash(TokenGenerator.hash(rawToken))
            .expiresAt(Instant.now().plus(EMAIL_VERIFICATION_TTL_HOURS, ChronoUnit.HOURS))
            .build();
        verificationTokenRepository.save(token);
        emailService.sendVerificationEmail(user.getEmail(), user.getFullName(), rawToken);
    }

    private void registerFailedLoginAttempt(User user) {
        int attempts = user.getFailedLoginAttempts() + 1;
        user.setFailedLoginAttempts(attempts);
        if (attempts >= MAX_FAILED_LOGIN_ATTEMPTS) {
            user.setAccountLocked(true);
            log.warn("Account locked after {} failed login attempts: userId={}", attempts, user.getId());
        }
        userRepository.save(user);
    }

    private AuthResponse issueTokens(User user, HttpServletRequest httpRequest) {
        String rawRefreshToken = refreshTokenService.issue(user, httpRequest);
        return buildAuthResponse(user, rawRefreshToken);
    }

    private AuthResponse buildAuthResponse(User user, String rawRefreshToken) {
        String accessToken = jwtTokenProvider.generateAccessToken(user.getId(), user.getEmail(), user.getRole().name());
        return new AuthResponse(
            accessToken,
            rawRefreshToken,
            jwtTokenProvider.getAccessTokenTtlSeconds(),
            userMapper.toResponse(user)
        );
    }
}
