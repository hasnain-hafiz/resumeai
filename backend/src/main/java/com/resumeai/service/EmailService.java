package com.resumeai.service;

public interface EmailService {

    void sendVerificationEmail(String toEmail, String fullName, String rawToken);

    void sendWelcomeEmail(String toEmail, String fullName);

    void sendPasswordResetEmail(String toEmail, String fullName, String rawToken);

    void sendPasswordChangedNotice(String toEmail, String fullName);
}
