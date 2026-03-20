package com.adrita.eventzen.service.impl;

import com.adrita.eventzen.dto.BookingRequest;
import com.adrita.eventzen.dto.BookingResponse;
import com.adrita.eventzen.dto.BookingStatusUpdateRequest;
import com.adrita.eventzen.dto.EventBookingSummaryResponse;
import com.adrita.eventzen.entity.Booking;
import com.adrita.eventzen.entity.BookingStatus;
import com.adrita.eventzen.entity.Event;
import com.adrita.eventzen.entity.EventStatus;
import com.adrita.eventzen.entity.User;
import com.adrita.eventzen.exception.ResourceNotFoundException;
import com.adrita.eventzen.repository.BookingRepository;
import com.adrita.eventzen.repository.EventRepository;
import com.adrita.eventzen.repository.UserRepository;
import com.adrita.eventzen.service.BookingService;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class BookingServiceImpl implements BookingService {

    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final EventRepository eventRepository;

    public BookingServiceImpl(BookingRepository bookingRepository,
                              UserRepository userRepository,
                              EventRepository eventRepository) {
        this.bookingRepository = bookingRepository;
        this.userRepository = userRepository;
        this.eventRepository = eventRepository;
    }

    @Override
    public BookingResponse createBooking(String userEmail, BookingRequest request) {
        User user = getUserByEmail(userEmail);
        Event event = getActiveEvent(request.getEventId());

        validateEventBookable(event);
        ensureCapacityAvailable(event, request.getNumberOfSeats());

        if (event.getTicketPrice() == null) {
            throw new IllegalArgumentException("Event ticket price is not configured");
        }

        BigDecimal pricePerTicket = event.getTicketPrice().setScale(2, RoundingMode.HALF_UP);
        BigDecimal totalPrice = pricePerTicket
                .multiply(BigDecimal.valueOf(request.getNumberOfSeats()))
                .setScale(2, RoundingMode.HALF_UP);

        Booking booking = new Booking();
        booking.setUser(user);
        booking.setEvent(event);
        booking.setNumberOfSeats(request.getNumberOfSeats());
        booking.setPricePerTicket(pricePerTicket);
        booking.setTotalPrice(totalPrice);
        booking.setStatus(BookingStatus.CONFIRMED);

        Booking saved = bookingRepository.save(booking);
        return mapToResponse(saved);
    }

    @Override
    public List<BookingResponse> getMyBookings(String userEmail) {
        User user = getUserByEmail(userEmail);
        return bookingRepository.findByUserIdOrderByBookingTimeDesc(user.getId()).stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public void cancelMyBooking(String userEmail, Long bookingId) {
        User user = getUserByEmail(userEmail);

        Booking booking = bookingRepository.findByIdAndUserId(bookingId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + bookingId));

        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new IllegalArgumentException("Booking is already cancelled");
        }

        booking.setStatus(BookingStatus.CANCELLED);
        bookingRepository.save(booking);
    }

    @Override
    public List<BookingResponse> getAllBookings() {
        return bookingRepository.findAllByOrderByBookingTimeDesc().stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public List<BookingResponse> getBookingsByEvent(Long eventId) {
        eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with id: " + eventId));

        return bookingRepository.findByEventIdOrderByBookingTimeDesc(eventId).stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public BookingResponse updateBookingStatus(Long bookingId, BookingStatusUpdateRequest request) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + bookingId));

        BookingStatus newStatus = request.getStatus();

        if (newStatus == BookingStatus.CONFIRMED && booking.getStatus() != BookingStatus.CONFIRMED) {
            Event event = booking.getEvent();
            validateEventBookable(event);
            ensureCapacityAvailable(event, booking.getNumberOfSeats());
        }

        booking.setStatus(newStatus);
        Booking updated = bookingRepository.save(booking);
        return mapToResponse(updated);
    }

    @Override
    public EventBookingSummaryResponse getEventBookingSummary(Long eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with id: " + eventId));

        int maxCapacity = resolveCapacity(event);
        int totalBookedSeats = getConfirmedBookedSeats(eventId);
        int remainingSeats = Math.max(maxCapacity - totalBookedSeats, 0);

        return new EventBookingSummaryResponse(eventId, maxCapacity, totalBookedSeats, remainingSeats);
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private Event getActiveEvent(Long eventId) {
        return eventRepository.findByIdAndStatus(eventId, EventStatus.ACTIVE)
                .orElseThrow(() -> new ResourceNotFoundException("Active event not found with id: " + eventId));
    }

    private void validateEventBookable(Event event) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime eventEnd = LocalDateTime.of(event.getEventDate(), event.getEndTime());

        if (now.isAfter(eventEnd)) {
            throw new IllegalArgumentException("Cannot book an event that has already ended");
        }
    }

    private void ensureCapacityAvailable(Event event, int requestedSeats) {
        int maxCapacity = resolveCapacity(event);
        int currentlyBooked = getConfirmedBookedSeats(event.getId());

        if (currentlyBooked + requestedSeats > maxCapacity) {
            int remaining = Math.max(maxCapacity - currentlyBooked, 0);
            throw new IllegalArgumentException("Not enough seats available. Remaining seats: " + remaining);
        }
    }

    private int resolveCapacity(Event event) {
        if (event.getMaxCapacity() != null) {
            return event.getMaxCapacity();
        }

        if (event.getVenue() != null && event.getVenue().getCapacity() != null) {
            return event.getVenue().getCapacity();
        }

        throw new IllegalArgumentException("Event capacity is not configured");
    }

    private int getConfirmedBookedSeats(Long eventId) {
        Integer seats = bookingRepository.sumBookedSeatsByEventIdAndStatus(eventId, BookingStatus.CONFIRMED);
        return seats == null ? 0 : seats;
    }

    private BookingResponse mapToResponse(Booking booking) {
        Event event = booking.getEvent();
        User user = booking.getUser();

        return new BookingResponse(
                booking.getId(),
                user.getId(),
                user.getName(),
                event.getId(),
                event.getName(),
                event.getEventDate(),
                event.getStartTime(),
                event.getEndTime(),
                booking.getNumberOfSeats(),
                booking.getPricePerTicket(),
                booking.getTotalPrice(),
                booking.getBookingTime(),
                booking.getStatus(),
                booking.getCreatedAt(),
                booking.getUpdatedAt()
        );
    }
}
