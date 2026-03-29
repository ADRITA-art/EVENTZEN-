package com.adrita.eventzen.controller;

import com.adrita.eventzen.dto.UpdateProfileRequest;
import com.adrita.eventzen.dto.UserProfileResponse;
import com.adrita.eventzen.entity.Role;
import com.adrita.eventzen.entity.User;
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
class UserControllerTest {

    @Mock
    private UserService userService;

    @InjectMocks
    private UserController controller;

    @Test
    void updateMyProfileShouldUsePrincipalEmail() {
        User principal = User.builder().email("user@test.com").role(Role.CUSTOMER).build();
        UpdateProfileRequest request = new UpdateProfileRequest();
        request.setName("Updated");
        UserProfileResponse payload = new UserProfileResponse(1L, "Updated", "user@test.com", "CUSTOMER");

        when(userService.updateProfile("user@test.com", request)).thenReturn(payload);

        ResponseEntity<UserProfileResponse> response = controller.updateMyProfile(principal, request);

        assertThat(response.getBody()).isEqualTo(payload);
    }

    @Test
    void getUserByIdShouldReturnProfile() {
        UserProfileResponse payload = new UserProfileResponse(2L, "Name", "x@test.com", "CUSTOMER");
        when(userService.getUserById(2L)).thenReturn(payload);

        ResponseEntity<UserProfileResponse> response = controller.getUserById(2L);

        assertThat(response.getBody()).isEqualTo(payload);
    }

    @Test
    void deleteUserShouldDelegateAndReturnMessage() {
        ResponseEntity<String> response = controller.deleteUser(3L);

        verify(userService).deleteUserById(3L);
        assertThat(response.getBody()).isEqualTo("User deleted successfully");
    }
}
