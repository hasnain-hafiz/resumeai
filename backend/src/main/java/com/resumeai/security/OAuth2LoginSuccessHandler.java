package com.resumeai.security;

import com.resumeai.entity.User;
import com.resumeai.repository.UserRepository;
import com.resumeai.service.RefreshTokenService;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;

/**
 * Google login flow:
 *  1. Frontend redirects the browser to /oauth2/authorization/google
 *  2. Spring Security handles the Google handshake
 *  3. This handler runs on success: find-or-create the local User row,
 *     issue our own access + refresh tokens (never expose Google's tokens
 *     to the frontend), then redirect back to the SPA with the tokens.
 *
 * The SPA reads the tokens from the URL fragment (not query string, so they
 * are never sent to our server logs or any analytics) and stores them via
 * the auth store, exactly like the password login flow.
 */
@Component
@RequiredArgsConstructor
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {

    private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final RefreshTokenService refreshTokenService;

    @Value("${app.frontend.oauth-redirect-url}")
    private String frontendRedirectUrl;

    @Override
    public void onAuthenticationSuccess(
        HttpServletRequest request, HttpServletResponse response, Authentication authentication
    ) throws IOException, ServletException {

        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");
        String picture = oAuth2User.getAttribute("picture");
        String googleSub = oAuth2User.getAttribute("sub");

        User user = userRepository.findByEmailIgnoreCase(email)
            .map(existing -> linkGoogleIfNeeded(existing, googleSub, picture))
            .orElseGet(() -> provisionNewGoogleUser(email, name, picture, googleSub));

        String accessToken = jwtTokenProvider.generateAccessToken(user.getId(), user.getEmail(), user.getRole().name());
        String refreshToken = refreshTokenService.issue(user, request);

        String redirectUrl = UriComponentsBuilder.fromUriString(frontendRedirectUrl)
            .fragment("accessToken=" + accessToken + "&refreshToken=" + refreshToken)
            .build()
            .toUriString();

        response.sendRedirect(redirectUrl);
    }

    private User linkGoogleIfNeeded(User existing, String googleSub, String picture) {
        if (existing.getProvider() == User.AuthProvider.LOCAL) {
            existing.setProvider(User.AuthProvider.GOOGLE);
            existing.setProviderId(googleSub);
        }
        if (existing.getPhotoUrl() == null) {
            existing.setPhotoUrl(picture);
        }
        existing.setEmailVerified(true);
        return userRepository.save(existing);
    }

    private User provisionNewGoogleUser(String email, String name, String picture, String googleSub) {
        User user = User.builder()
            .fullName(name != null ? name : email)
            .email(email)
            .provider(User.AuthProvider.GOOGLE)
            .providerId(googleSub)
            .photoUrl(picture)
            .emailVerified(true)
            .build();
        return userRepository.save(user);
    }
}
