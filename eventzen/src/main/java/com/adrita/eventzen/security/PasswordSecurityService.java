package com.adrita.eventzen.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class PasswordSecurityService {

    private final PasswordEncoder passwordEncoder;
    private final String passwordSalt;

    public PasswordSecurityService(PasswordEncoder passwordEncoder,
                                   @Value("${auth.password.salt:dev-static-salt-change-me}") String passwordSalt) {
        this.passwordEncoder = passwordEncoder;
        this.passwordSalt = passwordSalt;
    }

    public String hash(String rawPassword) {
        return passwordEncoder.encode(applySalt(rawPassword));
    }

    public boolean matches(String rawPassword, String encodedPassword) {
        return passwordEncoder.matches(applySalt(rawPassword), encodedPassword);
    }

    public boolean matchesLegacy(String rawPassword, String encodedPassword) {
        // Supports seamless migration for users created before env-salt was introduced.
        return passwordEncoder.matches(rawPassword, encodedPassword);
    }

    private String applySalt(String rawPassword) {
        return rawPassword + "{" + passwordSalt + "}";
    }
}
