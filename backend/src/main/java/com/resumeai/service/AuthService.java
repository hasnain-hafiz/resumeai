package com.resumeai.service;

import com.resumeai.dto.request.*;
import com.resumeai.dto.response.AuthResponse;
import com.resumeai.dto.response.UserResponse;
import jakarta.servlet.http.HttpServletRequest;

import java.util.UUID;

public interface AuthService {

    void register(RegisterRequest request);

    AuthResponse login(LoginRequest request, HttpServletRequest httpRequest);

    AuthResponse refresh(RefreshTokenRequest request, HttpServletRequest httpRequest);

    void logout(RefreshTokenRequest request);

    void verifyEmail(VerifyEmailRequest request);

    void resendVerificationEmail(String email);

    void forgotPassword(ForgotPasswordRequest request);

    void resetPassword(ResetPasswordRequest request);

    void changePassword(UUID userId, ChangePasswordRequest request);

    UserResponse getCurrentUser(UUID userId);

    UserResponse updateProfile(UUID userId, UpdateProfileRequest request);

    void deleteAccount(UUID userId);
}
