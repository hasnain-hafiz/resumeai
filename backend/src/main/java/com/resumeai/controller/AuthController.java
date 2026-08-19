package com.resumeai.controller;

import com.resumeai.dto.request.*;
import com.resumeai.dto.response.ApiResponse;
import com.resumeai.dto.response.AuthResponse;
import com.resumeai.dto.response.UserResponse;
import com.resumeai.security.UserPrincipal;
import com.resumeai.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Register, login, tokens, verification and password management")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    @Operation(summary = "Create a new local account and send a verification email")
    public ResponseEntity<ApiResponse> register(@Valid @RequestBody RegisterRequest request) {
        authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.of("Check your inbox to verify your email address."));
    }

    @PostMapping("/login")
    @Operation(summary = "Authenticate with email + password and receive access/refresh tokens")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        return ResponseEntity.ok(authService.login(request, httpRequest));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Exchange a valid refresh token for a new access/refresh token pair")
    public ResponseEntity<AuthResponse> refresh(@Valid @RequestBody RefreshTokenRequest request, HttpServletRequest httpRequest) {
        return ResponseEntity.ok(authService.refresh(request, httpRequest));
    }

    @PostMapping("/logout")
    @Operation(summary = "Revoke a refresh token, ending that session")
    public ResponseEntity<ApiResponse> logout(@Valid @RequestBody RefreshTokenRequest request) {
        authService.logout(request);
        return ResponseEntity.ok(ApiResponse.of("Logged out successfully."));
    }

    @PostMapping("/verify-email")
    @Operation(summary = "Confirm an email address using the token sent by /register")
    public ResponseEntity<ApiResponse> verifyEmail(@Valid @RequestBody VerifyEmailRequest request) {
        authService.verifyEmail(request);
        return ResponseEntity.ok(ApiResponse.of("Email verified. You can now log in."));
    }

    @PostMapping("/resend-verification")
    @Operation(summary = "Resend the verification email (always returns success to avoid leaking account existence)")
    public ResponseEntity<ApiResponse> resendVerification(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.resendVerificationEmail(request.email());
        return ResponseEntity.ok(ApiResponse.of("If that email exists and isn't verified yet, a new link has been sent."));
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Request a password reset email (always returns success to avoid leaking account existence)")
    public ResponseEntity<ApiResponse> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request);
        return ResponseEntity.ok(ApiResponse.of("If that email exists, a password reset link has been sent."));
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Set a new password using a forgot-password token")
    public ResponseEntity<ApiResponse> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.ok(ApiResponse.of("Password reset successfully. Please log in again."));
    }

    @PostMapping("/change-password")
    @Operation(summary = "Change password while authenticated (requires current password)")
    public ResponseEntity<ApiResponse> changePassword(
        @AuthenticationPrincipal UserPrincipal principal,
        @Valid @RequestBody ChangePasswordRequest request
    ) {
        authService.changePassword(principal.getId(), request);
        return ResponseEntity.ok(ApiResponse.of("Password changed successfully."));
    }

    @GetMapping("/me")
    @Operation(summary = "Get the currently authenticated user's profile")
    public ResponseEntity<UserResponse> getCurrentUser(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(authService.getCurrentUser(principal.getId()));
    }

    @PatchMapping("/me")
    @Operation(summary = "Update the currently authenticated user's profile")
    public ResponseEntity<UserResponse> updateProfile(
        @AuthenticationPrincipal UserPrincipal principal,
        @Valid @RequestBody UpdateProfileRequest request
    ) {
        return ResponseEntity.ok(authService.updateProfile(principal.getId(), request));
    }

    @DeleteMapping("/me")
    @Operation(summary = "Soft-delete the currently authenticated user's account")
    public ResponseEntity<ApiResponse> deleteAccount(@AuthenticationPrincipal UserPrincipal principal) {
        authService.deleteAccount(principal.getId());
        return ResponseEntity.ok(ApiResponse.of("Account deleted."));
    }
}
