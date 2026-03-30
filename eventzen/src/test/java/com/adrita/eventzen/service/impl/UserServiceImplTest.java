package com.adrita.eventzen.service.impl;

import com.adrita.eventzen.dto.ChangePasswordRequest;
import com.adrita.eventzen.dto.LoginRequest;
import com.adrita.eventzen.dto.RegisterRequest;
import com.adrita.eventzen.dto.UpdateProfileRequest;
import com.adrita.eventzen.dto.UserProfileResponse;
import com.adrita.eventzen.entity.Booking;
import com.adrita.eventzen.entity.BookingStatus;
import com.adrita.eventzen.entity.Event;
import com.adrita.eventzen.entity.EventStatus;
import com.adrita.eventzen.entity.Role;
import com.adrita.eventzen.entity.User;
import com.adrita.eventzen.exception.BadCredentialsException;
import com.adrita.eventzen.exception.DuplicateResourceException;
import com.adrita.eventzen.exception.ResourceNotFoundException;
import com.adrita.eventzen.integration.budget.BudgetClient;
import com.adrita.eventzen.repository.BookingRepository;
import com.adrita.eventzen.repository.EventRepository;
import com.adrita.eventzen.repository.UserRepository;
import com.adrita.eventzen.security.PasswordSecurityService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceImplTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordSecurityService passwordSecurityService;

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private EventRepository eventRepository;

    @Mock
    private BudgetClient budgetClient;

    @InjectMocks
    private UserServiceImpl userService;

    @Test
    void registerShouldCreateUserWhenEmailIsUnique() {
        RegisterRequest request = new RegisterRequest();
        request.setName("Alice");
        request.setEmail("alice@test.com");
        request.setPassword("secret123");
        request.setRole(Role.CUSTOMER);

        when(userRepository.existsByEmail("alice@test.com")).thenReturn(false);
        when(passwordSecurityService.hash("secret123")).thenReturn("hashed");

        String result = userService.register(request);

        assertThat(result).isEqualTo("User registered successfully");
        verify(userRepository).save(any(User.class));
    }

    @Test
    void registerShouldThrowWhenEmailAlreadyExists() {
        RegisterRequest request = new RegisterRequest();
        request.setEmail("alice@test.com");

        when(userRepository.existsByEmail("alice@test.com")).thenReturn(true);

        assertThatThrownBy(() -> userService.register(request))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("Email already registered");
    }

    @Test
    void loginShouldReturnUserWhenPasswordMatches() {
        LoginRequest request = new LoginRequest();
        request.setEmail("alice@test.com");
        request.setPassword("secret123");

        User user = User.builder().id(1L).email("alice@test.com").password("hash").role(Role.CUSTOMER).build();
        when(userRepository.findByEmail("alice@test.com")).thenReturn(Optional.of(user));
        when(passwordSecurityService.matches("secret123", "hash")).thenReturn(true);

        User result = userService.login(request);

        assertThat(result).isEqualTo(user);
    }

    @Test
    void loginShouldMigrateLegacyPasswordAndReturnUser() {
        LoginRequest request = new LoginRequest();
        request.setEmail("alice@test.com");
        request.setPassword("old-pass");

        User user = User.builder().id(1L).email("alice@test.com").password("legacy-hash").role(Role.CUSTOMER).build();
        when(userRepository.findByEmail("alice@test.com")).thenReturn(Optional.of(user));
        when(passwordSecurityService.matches("old-pass", "legacy-hash")).thenReturn(false);
        when(passwordSecurityService.matchesLegacy("old-pass", "legacy-hash")).thenReturn(true);
        when(passwordSecurityService.hash("old-pass")).thenReturn("new-hash");

        User result = userService.login(request);

        assertThat(result).isEqualTo(user);
        verify(userRepository).save(user);
        assertThat(user.getPassword()).isEqualTo("new-hash");
    }

    @Test
    void loginShouldThrowForInvalidPassword() {
        LoginRequest request = new LoginRequest();
        request.setEmail("alice@test.com");
        request.setPassword("wrong");

        User user = User.builder().id(1L).email("alice@test.com").password("hash").role(Role.CUSTOMER).build();
        when(userRepository.findByEmail("alice@test.com")).thenReturn(Optional.of(user));
        when(passwordSecurityService.matches("wrong", "hash")).thenReturn(false);
        when(passwordSecurityService.matchesLegacy("wrong", "hash")).thenReturn(false);

        assertThatThrownBy(() -> userService.login(request))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessageContaining("Invalid email or password");
    }

    @Test
    void getProfileShouldReturnMappedResponse() {
        User user = User.builder().id(1L).name("Alice").email("alice@test.com").role(Role.CUSTOMER).build();
        when(userRepository.findByEmail("alice@test.com")).thenReturn(Optional.of(user));

        UserProfileResponse response = userService.getProfile("alice@test.com");

        assertThat(response.getEmail()).isEqualTo("alice@test.com");
        assertThat(response.getRole()).isEqualTo("CUSTOMER");
    }

    @Test
    void getAllUsersShouldReturnMappedProfiles() {
        User a = User.builder().id(1L).name("A").email("a@test.com").role(Role.ADMIN).build();
        User b = User.builder().id(2L).name("B").email("b@test.com").role(Role.CUSTOMER).build();
        when(userRepository.findAll()).thenReturn(List.of(a, b));

        List<UserProfileResponse> responses = userService.getAllUsers();

        assertThat(responses).hasSize(2);
        assertThat(responses.get(0).getRole()).isEqualTo("ADMIN");
    }

    @Test
    void changePasswordShouldValidateOldPasswordAndSaveNewHash() {
        ChangePasswordRequest request = new ChangePasswordRequest();
        request.setOldPassword("old");
        request.setNewPassword("new");

        User user = User.builder().id(1L).email("alice@test.com").password("hash-old").role(Role.CUSTOMER).build();
        when(userRepository.findByEmail("alice@test.com")).thenReturn(Optional.of(user));
        when(passwordSecurityService.matches("old", "hash-old")).thenReturn(true);
        when(passwordSecurityService.hash("new")).thenReturn("hash-new");

        userService.changePassword("alice@test.com", request);

        assertThat(user.getPassword()).isEqualTo("hash-new");
        verify(userRepository).save(user);
    }

    @Test
    void updateProfileShouldUpdateNameAndReturnResponse() {
        UpdateProfileRequest request = new UpdateProfileRequest();
        request.setName("Updated");

        User user = User.builder().id(1L).name("Alice").email("alice@test.com").role(Role.CUSTOMER).build();
        when(userRepository.findByEmail("alice@test.com")).thenReturn(Optional.of(user));
        when(userRepository.save(user)).thenReturn(user);

        UserProfileResponse response = userService.updateProfile("alice@test.com", request);

        assertThat(user.getName()).isEqualTo("Updated");
        assertThat(response.getName()).isEqualTo("Updated");
    }

    @Test
    void getUserByIdShouldReturnUserOrThrow() {
        User user = User.builder().id(3L).name("Alice").email("alice@test.com").role(Role.ADMIN).build();
        when(userRepository.findById(3L)).thenReturn(Optional.of(user));

        UserProfileResponse response = userService.getUserById(3L);
        assertThat(response.getId()).isEqualTo(3L);

        when(userRepository.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> userService.getUserById(99L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("User not found with id: 99");
    }

    @Test
    void deleteUserByIdShouldDeleteFoundUser() {
        User user = User.builder().id(4L).email("x@test.com").role(Role.CUSTOMER).build();
        Event event = new Event();
        event.setId(10L);
        event.setTicketAvailable(10);
        event.setMaxCapacity(12);
        event.setStatus(EventStatus.ACTIVE);

        Booking booking = new Booking();
        booking.setUser(user);
        booking.setEvent(event);
        booking.setNumberOfSeats(2);
        booking.setStatus(BookingStatus.CONFIRMED);

        when(userRepository.findById(4L)).thenReturn(Optional.of(user));
        when(bookingRepository.findByUserIdOrderByBookingTimeDesc(4L)).thenReturn(List.of(booking));
        when(eventRepository.findAllById(any())).thenReturn(List.of(event));
        when(bookingRepository.sumTotalPriceByEventIdAndStatus(10L, BookingStatus.CONFIRMED)).thenReturn(BigDecimal.ZERO);

        userService.deleteUserById(4L);

        assertThat(event.getTicketAvailable()).isEqualTo(12);
        assertThat(event.getStatus()).isEqualTo(EventStatus.ACTIVE);
        verify(eventRepository).save(event);
        verify(bookingRepository).deleteByUserId(4L);
        verify(budgetClient).syncRevenueForEvent(eq(10L), eq(BigDecimal.ZERO));
        verify(userRepository).delete(user);
    }
}
