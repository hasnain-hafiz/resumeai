package com.resumeai.service;

import com.resumeai.dto.request.LoginRequest;
import com.resumeai.dto.request.RegisterRequest;
import com.resumeai.entity.User;
import com.resumeai.exception.AccountLockedException;
import com.resumeai.exception.EmailAlreadyInUseException;
import com.resumeai.exception.EmailNotVerifiedException;
import com.resumeai.exception.InvalidCredentialsException;
import com.resumeai.mapper.UserMapper;
import com.resumeai.repository.PasswordResetTokenRepository;
import com.resumeai.repository.UserRepository;
import com.resumeai.repository.VerificationTokenRepository;
import com.resumeai.security.JwtTokenProvider;
import com.resumeai.service.ActivityEventService;
import com.resumeai.service.impl.AuthServiceImpl;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceImplTest {

    @Mock private UserRepository userRepository;
    @Mock private VerificationTokenRepository verificationTokenRepository;
    @Mock private PasswordResetTokenRepository passwordResetTokenRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtTokenProvider jwtTokenProvider;
    @Mock private RefreshTokenService refreshTokenService;
    @Mock private EmailService emailService;
    @Mock private UserMapper userMapper;
    @Mock private HttpServletRequest httpServletRequest;
    @Mock private ActivityEventService activityEventService;

    @InjectMocks
    private AuthServiceImpl authService;

    private User existingUser;

    @BeforeEach
    void setUp() {
        existingUser = User.builder()
            .fullName("Ada Lovelace")
            .email("ada@example.com")
            .passwordHash("hashed-password")
            .provider(User.AuthProvider.LOCAL)
            .role(User.Role.USER)
            .emailVerified(true)
            .failedLoginAttempts(0)
            .accountLocked(false)
            .build();
        existingUser.setId(UUID.randomUUID());
    }

    @Test
    void register_throwsWhenVerifiedAccountAlreadyExists() {
        RegisterRequest request = new RegisterRequest("Ada Lovelace", "ada@example.com", "Password1");
        existingUser.setEmailVerified(true);
        when(userRepository.findByEmailIgnoreCase("ada@example.com")).thenReturn(Optional.of(existingUser));

        assertThatThrownBy(() -> authService.register(request))
            .isInstanceOf(EmailAlreadyInUseException.class);

        verify(userRepository, never()).save(any());
        verify(emailService, never()).sendVerificationEmail(any(), any(), any());
    }

    @Test
    void register_resendsVerificationInsteadOfConflictWhenExistingAccountIsUnverified() {
        RegisterRequest request = new RegisterRequest("Ada Lovelace", "ada@example.com", "Password1");
        existingUser.setEmailVerified(false);
        existingUser.setProvider(User.AuthProvider.LOCAL);
        when(userRepository.findByEmailIgnoreCase("ada@example.com")).thenReturn(Optional.of(existingUser));

        // Should not throw - this is the "link expired, closed the page" recovery path.
        authService.register(request);

        // A brand new user is never created, and the existing password is left untouched...
        verify(userRepository, never()).save(any());
        verify(passwordEncoder, never()).encode(any());
        // ...but a fresh verification email does go out.
        verify(emailService).sendVerificationEmail(eq("ada@example.com"), eq("Ada Lovelace"), anyString());
    }

    @Test
    void register_throwsWhenExistingGoogleAccountHasSameEmail() {
        RegisterRequest request = new RegisterRequest("Ada Lovelace", "ada@example.com", "Password1");
        existingUser.setProvider(User.AuthProvider.GOOGLE);
        existingUser.setEmailVerified(true);
        when(userRepository.findByEmailIgnoreCase("ada@example.com")).thenReturn(Optional.of(existingUser));

        assertThatThrownBy(() -> authService.register(request))
            .isInstanceOf(EmailAlreadyInUseException.class);
    }

    @Test
    void register_hashesPasswordAndSendsVerificationEmail() {
        RegisterRequest request = new RegisterRequest("Ada Lovelace", "ada@example.com", "Password1");
        when(userRepository.findByEmailIgnoreCase("ada@example.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("Password1")).thenReturn("hashed-password");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        authService.register(request);

        verify(passwordEncoder).encode("Password1");
        verify(userRepository).save(argThat(u ->
            u.getEmail().equals("ada@example.com") && !u.isEmailVerified()
        ));
        verify(emailService).sendVerificationEmail(eq("ada@example.com"), eq("Ada Lovelace"), anyString());
    }

    @Test
    void login_throwsInvalidCredentialsForWrongPassword() {
        LoginRequest request = new LoginRequest("ada@example.com", "wrong-password");
        when(userRepository.findByEmailIgnoreCase("ada@example.com")).thenReturn(Optional.of(existingUser));
        when(passwordEncoder.matches("wrong-password", "hashed-password")).thenReturn(false);

        assertThatThrownBy(() -> authService.login(request, httpServletRequest))
            .isInstanceOf(InvalidCredentialsException.class);

        assertThat(existingUser.getFailedLoginAttempts()).isEqualTo(1);
    }

    @Test
    void login_locksAccountAfterFiveFailedAttempts() {
        existingUser.setFailedLoginAttempts(4);
        LoginRequest request = new LoginRequest("ada@example.com", "wrong-password");
        when(userRepository.findByEmailIgnoreCase("ada@example.com")).thenReturn(Optional.of(existingUser));
        when(passwordEncoder.matches("wrong-password", "hashed-password")).thenReturn(false);

        assertThatThrownBy(() -> authService.login(request, httpServletRequest))
            .isInstanceOf(InvalidCredentialsException.class);

        assertThat(existingUser.isAccountLocked()).isTrue();
    }

    @Test
    void login_throwsWhenAccountIsLocked() {
        existingUser.setAccountLocked(true);
        LoginRequest request = new LoginRequest("ada@example.com", "Password1");
        when(userRepository.findByEmailIgnoreCase("ada@example.com")).thenReturn(Optional.of(existingUser));

        assertThatThrownBy(() -> authService.login(request, httpServletRequest))
            .isInstanceOf(AccountLockedException.class);

        verify(passwordEncoder, never()).matches(anyString(), anyString());
    }

    @Test
    void login_throwsWhenEmailNotVerified() {
        existingUser.setEmailVerified(false);
        LoginRequest request = new LoginRequest("ada@example.com", "Password1");
        when(userRepository.findByEmailIgnoreCase("ada@example.com")).thenReturn(Optional.of(existingUser));
        when(passwordEncoder.matches("Password1", "hashed-password")).thenReturn(true);

        assertThatThrownBy(() -> authService.login(request, httpServletRequest))
            .isInstanceOf(EmailNotVerifiedException.class);
    }

    @Test
    void login_succeedsAndResetsFailedAttempts() {
        existingUser.setFailedLoginAttempts(3);
        LoginRequest request = new LoginRequest("ada@example.com", "Password1");
        when(userRepository.findByEmailIgnoreCase("ada@example.com")).thenReturn(Optional.of(existingUser));
        when(passwordEncoder.matches("Password1", "hashed-password")).thenReturn(true);
        when(refreshTokenService.issue(eq(existingUser), any())).thenReturn("raw-refresh-token");
        when(jwtTokenProvider.generateAccessToken(any(), anyString(), anyString())).thenReturn("access-token");
        when(jwtTokenProvider.getAccessTokenTtlSeconds()).thenReturn(900L);

        authService.login(request, httpServletRequest);

        assertThat(existingUser.getFailedLoginAttempts()).isZero();
        verify(userRepository, atLeastOnce()).save(existingUser);
    }
}
