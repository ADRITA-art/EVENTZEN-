package com.adrita.eventzen.service;

import com.adrita.eventzen.dto.BookingRequest;
import com.adrita.eventzen.dto.BookingResponse;
import com.adrita.eventzen.dto.BookingStatusUpdateRequest;
import com.adrita.eventzen.dto.EventBookingSummaryResponse;

import java.util.List;

public interface BookingService {

    BookingResponse createBooking(String userEmail, BookingRequest request);

    List<BookingResponse> getMyBookings(String userEmail);

    void cancelMyBooking(String userEmail, Long bookingId);

    List<BookingResponse> getAllBookings();

    List<BookingResponse> getBookingsByEvent(Long eventId);

    BookingResponse updateBookingStatus(Long bookingId, BookingStatusUpdateRequest request);

    EventBookingSummaryResponse getEventBookingSummary(Long eventId);
}
