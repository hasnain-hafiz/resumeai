package com.resumeai.service.impl;

import com.resumeai.service.EmailService;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailServiceImpl implements EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailServiceImpl.class);

    private final JavaMailSender mailSender;

    @Value("${app.mail.from}")
    private String fromAddress;

    @Value("${app.frontend.base-url}")
    private String frontendBaseUrl;

    @Override
    @Async
    public void sendVerificationEmail(String toEmail, String fullName, String rawToken) {
        String link = frontendBaseUrl + "/verify-email?token=" + rawToken;
        String body = """
            Hi %s,

            Welcome to ResumeAI! Please confirm your email address to activate your account:

            %s

            This link expires in 24 hours. If you didn't create this account, you can ignore this email.
            """.formatted(fullName, link);
        send(toEmail, "Verify your ResumeAI account", body);
    }

    @Override
    @Async
    public void sendWelcomeEmail(String toEmail, String fullName) {
        String body = """
            Hi %s,

            Your email is verified and your ResumeAI account is ready to go.
            Head back to the app to build your first resume.
            """.formatted(fullName);
        send(toEmail, "Welcome to ResumeAI", body);
    }

    @Override
    @Async
    public void sendPasswordResetEmail(String toEmail, String fullName, String rawToken) {
        String link = frontendBaseUrl + "/reset-password?token=" + rawToken;
        String body = """
            Hi %s,

            We received a request to reset your ResumeAI password. Click below to choose a new one:

            %s

            This link expires in 1 hour. If you didn't request this, you can safely ignore this email -
            your password will not be changed.
            """.formatted(fullName, link);
        send(toEmail, "Reset your ResumeAI password", body);
    }

    @Override
    @Async
    public void sendPasswordChangedNotice(String toEmail, String fullName) {
        String body = """
            Hi %s,

            Your ResumeAI password was just changed. If this was you, no action is needed.
            If you didn't make this change, please reset your password immediately and contact support.
            """.formatted(fullName);
        send(toEmail, "Your ResumeAI password was changed", body);
    }

    private void send(String toEmail, String subject, String body) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(body, false);
            mailSender.send(message);
        } catch (Exception e) {
            // Never let a mail-provider outage break registration/login flows.
            log.error("Failed to send email to {} (subject='{}')", toEmail, subject, e);
        }
    }
}
