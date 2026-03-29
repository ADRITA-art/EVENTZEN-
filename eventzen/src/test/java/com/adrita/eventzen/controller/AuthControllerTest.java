package com.adrita.eventzen.controller;

import com.adrita.eventzen.dto.AuthResponse;
import com.adrita.eventzen.dto.ChangePasswordRequest;
import com.adrita.eventzen.dto.LoginRequest;
import com.adrita.eventzen.dto.RegisterRequest;
import com.adrita.eventzen.dto.UserProfileResponse;
import com.adrita.eventzen.entity.Role;
import com.adrita.eventzen.entity.User;
import com.adrita.eventzen.security.JwtService;
import com.adrita.eventzen.service.UserService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    @Mock
    private UserService userService;

    @Mock
    private JwtService jwtService;

    @InjectMocks
    private AuthController controller;

    @Test
    void registerShouldReturnSuccessMessage() {
        RegisterRequest request = new RegisterRequest();
        request.setName("A");
        request.setEmail("a@test.com");
        request.setPassword("secret123");
        request.setRole(Role.CUSTOMER);

        when(userService.register(request)).thenReturn("User registered successfully");

        ResponseEntity<String> response = controller.register(request);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isEqualTo("User registered successfully");
        verify(userService).register(request);
    }

    @Test
    void loginShouldGenerateTokenAndReturnRole() {
        LoginRequest request = new LoginRequest();
        request.setEmail("a@test.com");
        request.setPassword("secret123");

        User user = User.builder()
                .id(1L)
                .name("A")
                .email("a@test.com")
                .password("hash")
                .role(Role.ADMIN)
                .build();

        when(userService.login(request)).thenReturn(user);
        when(jwtService.generateToken("a@test.com")).thenReturn("jwt-token");

        ResponseEntity<AuthResponse> response = controller.login(request);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getToken()).isEqualTo("jwt-token");
        assertThat(response.getBody().getRole()).isEqualTo("ADMIN");
    }

    @Test
    void getProfileShouldReturnProfileByPrincipalEmail() {
        User principal = User.builder().email("a@test.com").build();
        UserProfileResponse profile = new UserProfileResponse(1L, "A", "a@test.com", "CUSTOMER");
        when(userService.getProfile("a@test.com")).thenReturn(profile);

        ResponseEntity<UserProfileResponse> response = controller.getProfile(principal);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isEqualTo(profile);
    }

    @Test
    void changePasswordShouldDelegateAndReturnMessage() {
        User principal = User.builder().email("a@test.com").build();
        ChangePasswordRequest request = new ChangePasswordRequest();
        request.setOldPassword("old");
        request.setNewPassword("new");

        ResponseEntity<String> response = controller.changePassword(principal, request);

        verify(userService).changePassword("a@test.com", request);
        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).isEqualTo("Password updated successfully");
    }
}
