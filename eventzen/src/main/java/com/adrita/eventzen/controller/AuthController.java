package com.adrita.eventzen.controller;

import com.adrita.eventzen.dto.AuthResponse;
import com.adrita.eventzen.dto.ChangePasswordRequest;
import com.adrita.eventzen.dto.LoginRequest;
import com.adrita.eventzen.dto.RegisterRequest;
import com.adrita.eventzen.dto.UserProfileResponse;
import com.adrita.eventzen.security.JwtService;
import com.adrita.eventzen.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final UserService userService;
    private final JwtService jwtService;

    // Explicit constructor instead of @RequiredArgsConstructor
    public AuthController(UserService userService, JwtService jwtService) {
        this.userService = userService;
        this.jwtService = jwtService;
    }

    @PostMapping("/register")
    public ResponseEntity<String> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(userService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        com.adrita.eventzen.entity.User user = userService.login(request);
        String token = jwtService.generateToken(user.getEmail());
        return ResponseEntity.ok(new AuthResponse(token, user.getRole().name()));
    }

    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse> getProfile(
            @AuthenticationPrincipal com.adrita.eventzen.entity.User user) {
        return ResponseEntity.ok(userService.getProfile(user.getEmail()));
    }

    @PutMapping("/change-password")
    public ResponseEntity<String> changePassword(
            @AuthenticationPrincipal com.adrita.eventzen.entity.User user,
            @Valid @RequestBody ChangePasswordRequest request) {
        userService.changePassword(user.getEmail(), request);
        return ResponseEntity.ok("Password updated successfully");
    }
}