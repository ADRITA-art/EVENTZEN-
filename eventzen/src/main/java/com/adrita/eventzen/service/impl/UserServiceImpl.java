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
import com.adrita.eventzen.entity.User;
import com.adrita.eventzen.exception.BadCredentialsException;
import com.adrita.eventzen.exception.DuplicateResourceException;
import com.adrita.eventzen.exception.ResourceNotFoundException;
import com.adrita.eventzen.integration.budget.BudgetClient;
import com.adrita.eventzen.repository.BookingRepository;
import com.adrita.eventzen.repository.EventRepository;
import com.adrita.eventzen.repository.UserRepository;
import com.adrita.eventzen.security.PasswordSecurityService;
import com.adrita.eventzen.service.UserService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordSecurityService passwordSecurityService;
    private final BookingRepository bookingRepository;
    private final EventRepository eventRepository;
    private final BudgetClient budgetClient;

    public UserServiceImpl(UserRepository userRepository,
                           PasswordSecurityService passwordSecurityService,
                           BookingRepository bookingRepository,
                           EventRepository eventRepository,
                           BudgetClient budgetClient) {
        this.userRepository = userRepository;
        this.passwordSecurityService = passwordSecurityService;
        this.bookingRepository = bookingRepository;
        this.eventRepository = eventRepository;
        this.budgetClient = budgetClient;
    }

    @Override
    public String register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Email already registered: " + request.getEmail());
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
            .password(passwordSecurityService.hash(request.getPassword()))
                .role(request.getRole())
                .build();

        userRepository.save(user);
        return "User registered successfully";
    }

    @Override
    public User login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "No account found with email: " + request.getEmail()));

        if (!verifyPasswordWithMigration(user, request.getPassword())) {
            throw new BadCredentialsException("Invalid email or password");
        }

        return user;
    }

    @Override
    public UserProfileResponse getProfile(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        return new UserProfileResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole().name()
        );
    }

    @Override
    public List<UserProfileResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(user -> new UserProfileResponse(
                        user.getId(),
                        user.getName(),
                        user.getEmail(),
                        user.getRole().name()
                ))
                .toList();
    }

    @Override
    public void changePassword(String email, ChangePasswordRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!verifyPasswordWithMigration(user, request.getOldPassword())) {
            throw new BadCredentialsException("Old password is incorrect");
        }

        user.setPassword(passwordSecurityService.hash(request.getNewPassword()));
        userRepository.save(user);
    }

    @Override
    public UserProfileResponse updateProfile(String email, UpdateProfileRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        user.setName(request.getName());
        User updated = userRepository.save(user);

        return new UserProfileResponse(
                updated.getId(),
                updated.getName(),
                updated.getEmail(),
                updated.getRole().name()
        );
    }

    @Override
    public UserProfileResponse getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        return new UserProfileResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole().name()
        );
    }

    @Override
    @Transactional
    public void deleteUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));

        List<Booking> userBookings = bookingRepository.findByUserIdOrderByBookingTimeDesc(id);

        Map<Long, Integer> confirmedSeatsToReleaseByEvent = new HashMap<>();
        Set<Long> affectedEventIds = new HashSet<>();

        for (Booking booking : userBookings) {
            Long eventId = booking.getEvent().getId();
            affectedEventIds.add(eventId);

            if (booking.getStatus() == BookingStatus.CONFIRMED) {
                confirmedSeatsToReleaseByEvent.merge(eventId, booking.getNumberOfSeats(), Integer::sum);
            }
        }

        if (!confirmedSeatsToReleaseByEvent.isEmpty()) {
            List<Event> affectedEvents = eventRepository.findAllById(confirmedSeatsToReleaseByEvent.keySet());
            for (Event event : affectedEvents) {
                int seatsToRelease = confirmedSeatsToReleaseByEvent.getOrDefault(event.getId(), 0);
                int currentAvailable = event.getTicketAvailable() == null ? 0 : event.getTicketAvailable();
                int maxCapacity = resolveMaxCapacity(event);
                int updatedAvailable = Math.min(currentAvailable + seatsToRelease, maxCapacity);

                event.setTicketAvailable(updatedAvailable);
                if (event.getStatus() != EventStatus.CANCELLED && event.getStatus() != EventStatus.COMPLETED) {
                    event.setStatus(updatedAvailable == 0 ? EventStatus.SOLD_OUT : EventStatus.ACTIVE);
                }
                eventRepository.save(event);
            }
        }

        bookingRepository.deleteByUserId(id);

        for (Long eventId : affectedEventIds) {
            BigDecimal revenue = bookingRepository.sumTotalPriceByEventIdAndStatus(eventId, BookingStatus.CONFIRMED);
            budgetClient.syncRevenueForEvent(eventId, revenue == null ? BigDecimal.ZERO : revenue);
        }

        userRepository.delete(user);
    }

    private int resolveMaxCapacity(Event event) {
        if (event.getMaxCapacity() != null) {
            return event.getMaxCapacity();
        }

        if (event.getVenue() != null && event.getVenue().getCapacity() != null) {
            return event.getVenue().getCapacity();
        }

        return Integer.MAX_VALUE;
    }

    private boolean verifyPasswordWithMigration(User user, String rawPassword) {
        if (passwordSecurityService.matches(rawPassword, user.getPassword())) {
            return true;
        }

        if (passwordSecurityService.matchesLegacy(rawPassword, user.getPassword())) {
            user.setPassword(passwordSecurityService.hash(rawPassword));
            userRepository.save(user);
            return true;
        }

        return false;
    }
}