package com.resumeai.security;

import com.resumeai.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        return userRepository.findByEmailIgnoreCase(email)
            .map(UserPrincipal::new)
            .orElseThrow(() -> new UsernameNotFoundException("No account found for email: " + email));
    }

    /** Used by the JWT filter, which authenticates on user id (the token subject), not email. */
    public UserDetails loadUserById(UUID id) {
        return userRepository.findById(id)
            .map(UserPrincipal::new)
            .orElseThrow(() -> new UsernameNotFoundException("No account found for id: " + id));
    }
}
