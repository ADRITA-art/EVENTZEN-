package com.adrita.eventzen.service.impl;

import com.adrita.eventzen.dto.BookingRequest;
import com.adrita.eventzen.dto.BookingResponse;
import com.adrita.eventzen.dto.BookingStatusUpdateRequest;
import com.adrita.eventzen.dto.EventBookingSummaryResponse;
import com.adrita.eventzen.entity.Booking;
import com.adrita.eventzen.entity.BookingStatus;
import com.adrita.eventzen.entity.Event;
import com.adrita.eventzen.entity.EventStatus;
import com.adrita.eventzen.entity.Role;
import com.adrita.eventzen.entity.User;
import com.adrita.eventzen.entity.Venue;
import com.adrita.eventzen.exception.ResourceNotFoundException;
import com.adrita.eventzen.integration.budget.BudgetClient;
import com.adrita.eventzen.repository.BookingRepository;
import com.adrita.eventzen.repository.EventRepository;
import com.adrita.eventzen.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BookingServiceImplTest {

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private EventRepository eventRepository;

    @Mock
    private BudgetClient budgetClient;

    @InjectMocks
    private BookingServiceImpl bookingService;

    private User user;
    private Event event;

    @BeforeEach
    void setUp() {
        user = User.builder()
                .id(1L)
                .name("Alice")
                .email("alice@test.com")
                .password("hash")
                .role(Role.CUSTOMER)
                .build();

        Venue venue = new Venue();
        venue.setId(100L);
        venue.setCapacity(500);

        event = new Event();
        event.setId(10L);
        event.setName("Concert");
        event.setVenue(venue);
        event.setEventDate(LocalDate.now().plusDays(2));
        event.setStartTime(LocalTime.of(18, 0));
        event.setEndTime(LocalTime.of(21, 0));
        event.setTicketPrice(new BigDecimal("250.00"));
        event.setTicketAvailable(100);
        event.setMaxCapacity(100);
        event.setStatus(EventStatus.ACTIVE);
    }

    @Test
    void createBookingShouldCreateAndSyncRevenue() {
        BookingRequest request = new BookingRequest();
        request.setEventId(10L);
        request.setNumberOfSeats(2);

        when(userRepository.findByEmail("alice@test.com")).thenReturn(Optional.of(user));
        when(eventRepository.findById(10L)).thenReturn(Optional.of(event));
        when(bookingRepository.sumBookedSeatsByEventIdAndStatus(10L, BookingStatus.CONFIRMED)).thenReturn(5);
        when(bookingRepository.save(any(Booking.class))).thenAnswer(invocation -> {
            Booking booking = invocation.getArgument(0);
            booking.setId(99L);
            booking.setBookingTime(LocalDateTime.now());
            booking.setCreatedAt(LocalDateTime.now());
            booking.setUpdatedAt(LocalDateTime.now());
            return booking;
        });
        when(bookingRepository.sumTotalPriceByEventIdAndStatus(10L, BookingStatus.CONFIRMED))
                .thenReturn(new BigDecimal("500.00"));

        BookingResponse response = bookingService.createBooking("alice@test.com", request);

        assertThat(response.getId()).isEqualTo(99L);
        assertThat(response.getTotalPrice()).isEqualByComparingTo("500.00");
        assertThat(event.getTicketAvailable()).isEqualTo(98);
        verify(eventRepository).save(event);
        verify(budgetClient).syncRevenueForEvent(10L, new BigDecimal("500.00"));
    }

    @Test
    void createBookingShouldThrowWhenNotEnoughSeats() {
        BookingRequest request = new BookingRequest();
        request.setEventId(10L);
        request.setNumberOfSeats(200);

        when(userRepository.findByEmail("alice@test.com")).thenReturn(Optional.of(user));
        when(eventRepository.findById(10L)).thenReturn(Optional.of(event));
        when(bookingRepository.sumBookedSeatsByEventIdAndStatus(10L, BookingStatus.CONFIRMED)).thenReturn(10);

        assertThatThrownBy(() -> bookingService.createBooking("alice@test.com", request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Not enough seats available");
    }

    @Test
    void createBookingShouldThrowWhenEventHasEnded() {
        BookingRequest request = new BookingRequest();
        request.setEventId(10L);
        request.setNumberOfSeats(1);

        event.setEventDate(LocalDate.now().minusDays(1));
        event.setEndTime(LocalTime.of(10, 0));

        when(userRepository.findByEmail("alice@test.com")).thenReturn(Optional.of(user));
        when(eventRepository.findById(10L)).thenReturn(Optional.of(event));

        assertThatThrownBy(() -> bookingService.createBooking("alice@test.com", request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("already ended");
    }

    @Test
    void getMyBookingsShouldReturnMappedResponses() {
        Booking booking = new Booking();
        booking.setId(1L);
        booking.setUser(user);
        booking.setEvent(event);
        booking.setNumberOfSeats(2);
        booking.setPricePerTicket(new BigDecimal("100.00"));
        booking.setTotalPrice(new BigDecimal("200.00"));
        booking.setStatus(BookingStatus.CONFIRMED);

        when(userRepository.findByEmail("alice@test.com")).thenReturn(Optional.of(user));
        when(bookingRepository.findByUserIdOrderByBookingTimeDesc(1L)).thenReturn(List.of(booking));

        List<BookingResponse> responses = bookingService.getMyBookings("alice@test.com");

        assertThat(responses).hasSize(1);
        assertThat(responses.get(0).getEventName()).isEqualTo("Concert");
    }

    @Test
    void cancelMyBookingShouldCancelAndSyncRevenue() {
        Booking booking = new Booking();
        booking.setId(4L);
        booking.setUser(user);
        booking.setEvent(event);
        booking.setNumberOfSeats(3);
        booking.setStatus(BookingStatus.CONFIRMED);

        when(userRepository.findByEmail("alice@test.com")).thenReturn(Optional.of(user));
        when(bookingRepository.findByIdAndUserId(4L, 1L)).thenReturn(Optional.of(booking));
        when(bookingRepository.sumTotalPriceByEventIdAndStatus(10L, BookingStatus.CONFIRMED))
                .thenReturn(new BigDecimal("250.00"));

        bookingService.cancelMyBooking("alice@test.com", 4L);

        assertThat(booking.getStatus()).isEqualTo(BookingStatus.CANCELLED);
        assertThat(event.getTicketAvailable()).isEqualTo(103);
        verify(bookingRepository).save(booking);
        verify(budgetClient).syncRevenueForEvent(10L, new BigDecimal("250.00"));
    }

    @Test
    void cancelMyBookingShouldRejectAlreadyCancelled() {
        Booking booking = new Booking();
        booking.setId(4L);
        booking.setUser(user);
        booking.setEvent(event);
        booking.setNumberOfSeats(3);
        booking.setStatus(BookingStatus.CANCELLED);

        when(userRepository.findByEmail("alice@test.com")).thenReturn(Optional.of(user));
        when(bookingRepository.findByIdAndUserId(4L, 1L)).thenReturn(Optional.of(booking));

        assertThatThrownBy(() -> bookingService.cancelMyBooking("alice@test.com", 4L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("already cancelled");
    }

    @Test
    void getAllBookingsShouldMapResults() {
        Booking booking = new Booking();
        booking.setId(2L);
        booking.setUser(user);
        booking.setEvent(event);
        booking.setNumberOfSeats(1);
        booking.setPricePerTicket(new BigDecimal("10.00"));
        booking.setTotalPrice(new BigDecimal("10.00"));
        booking.setStatus(BookingStatus.CONFIRMED);

        when(bookingRepository.findAllByOrderByBookingTimeDesc()).thenReturn(List.of(booking));

        assertThat(bookingService.getAllBookings()).hasSize(1);
    }

    @Test
    void getBookingsByEventShouldThrowWhenEventMissing() {
        when(eventRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> bookingService.getBookingsByEvent(999L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Event not found with id: 999");
    }

    @Test
    void updateBookingStatusShouldHandleConfirmAndCancelTransitions() {
        Booking booking = new Booking();
        booking.setId(6L);
        booking.setUser(user);
        booking.setEvent(event);
        booking.setNumberOfSeats(2);
        booking.setStatus(BookingStatus.CANCELLED);

        BookingStatusUpdateRequest confirmReq = new BookingStatusUpdateRequest();
        confirmReq.setStatus(BookingStatus.CONFIRMED);

        when(bookingRepository.findById(6L)).thenReturn(Optional.of(booking));
        when(bookingRepository.sumBookedSeatsByEventIdAndStatus(10L, BookingStatus.CONFIRMED)).thenReturn(1);
        when(bookingRepository.save(booking)).thenReturn(booking);
        when(bookingRepository.sumTotalPriceByEventIdAndStatus(10L, BookingStatus.CONFIRMED))
                .thenReturn(new BigDecimal("100.00"));

        BookingResponse confirmed = bookingService.updateBookingStatus(6L, confirmReq);
        assertThat(confirmed.getStatus()).isEqualTo(BookingStatus.CONFIRMED);

        BookingStatusUpdateRequest cancelReq = new BookingStatusUpdateRequest();
        cancelReq.setStatus(BookingStatus.CANCELLED);
        bookingService.updateBookingStatus(6L, cancelReq);
        assertThat(booking.getStatus()).isEqualTo(BookingStatus.CANCELLED);
    }

    @Test
    void getEventBookingSummaryShouldReturnComputedValues() {
        when(eventRepository.findById(10L)).thenReturn(Optional.of(event));
        when(bookingRepository.sumBookedSeatsByEventIdAndStatus(10L, BookingStatus.CONFIRMED)).thenReturn(40);

        EventBookingSummaryResponse summary = bookingService.getEventBookingSummary(10L);

        assertThat(summary.getMaxCapacity()).isEqualTo(100);
        assertThat(summary.getTotalBookedSeats()).isEqualTo(40);
        assertThat(summary.getRemainingSeats()).isEqualTo(60);
    }
}
