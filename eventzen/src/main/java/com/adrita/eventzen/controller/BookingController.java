package com.adrita.eventzen.controller;

import com.adrita.eventzen.dto.BookingRequest;
import com.adrita.eventzen.dto.BookingResponse;
import com.adrita.eventzen.dto.BookingStatusUpdateRequest;
import com.adrita.eventzen.dto.EventBookingSummaryResponse;
import com.adrita.eventzen.service.BookingService;
import com.adrita.eventzen.util.PaginationUtils;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/bookings")
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @PostMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<BookingResponse> createBooking(
            @AuthenticationPrincipal com.adrita.eventzen.entity.User user,
            @Valid @RequestBody BookingRequest request) {
        return ResponseEntity.ok(bookingService.createBooking(user.getEmail(), request));
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<?> getMyBookings(
            @AuthenticationPrincipal com.adrita.eventzen.entity.User user,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        List<BookingResponse> bookings = bookingService.getMyBookings(user.getEmail());
        if (page == null && size == null) {
            return ResponseEntity.ok(bookings);
        }
        return ResponseEntity.ok(PaginationUtils.paginate(bookings, page, size));
    }

    public ResponseEntity<List<BookingResponse>> getMyBookings(@AuthenticationPrincipal com.adrita.eventzen.entity.User user) {
        return ResponseEntity.ok(bookingService.getMyBookings(user.getEmail()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<String> cancelMyBooking(
            @AuthenticationPrincipal com.adrita.eventzen.entity.User user,
            @PathVariable Long id) {
        bookingService.cancelMyBooking(user.getEmail(), id);
        return ResponseEntity.ok("Booking cancelled successfully");
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAllBookings(@RequestParam(required = false) Integer page,
                                            @RequestParam(required = false) Integer size) {
        List<BookingResponse> bookings = bookingService.getAllBookings();
        if (page == null && size == null) {
            return ResponseEntity.ok(bookings);
        }
        return ResponseEntity.ok(PaginationUtils.paginate(bookings, page, size));
    }

    public ResponseEntity<List<BookingResponse>> getAllBookings() {
        return ResponseEntity.ok(bookingService.getAllBookings());
    }

    @GetMapping("/event/{eventId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getBookingsByEvent(@PathVariable Long eventId,
                                                @RequestParam(required = false) Integer page,
                                                @RequestParam(required = false) Integer size) {
        List<BookingResponse> bookings = bookingService.getBookingsByEvent(eventId);
        if (page == null && size == null) {
            return ResponseEntity.ok(bookings);
        }
        return ResponseEntity.ok(PaginationUtils.paginate(bookings, page, size));
    }

    public ResponseEntity<List<BookingResponse>> getBookingsByEvent(Long eventId) {
        return ResponseEntity.ok(bookingService.getBookingsByEvent(eventId));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BookingResponse> updateBookingStatus(@PathVariable Long id,
                                                               @Valid @RequestBody BookingStatusUpdateRequest request) {
        return ResponseEntity.ok(bookingService.updateBookingStatus(id, request));
    }

    @GetMapping("/event/{eventId}/summary")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<EventBookingSummaryResponse> getEventBookingSummary(@PathVariable Long eventId) {
        return ResponseEntity.ok(bookingService.getEventBookingSummary(eventId));
    }
}
