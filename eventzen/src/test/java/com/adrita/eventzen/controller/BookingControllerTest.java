package com.adrita.eventzen.controller;

import com.adrita.eventzen.dto.BookingRequest;
import com.adrita.eventzen.dto.BookingResponse;
import com.adrita.eventzen.dto.BookingStatusUpdateRequest;
import com.adrita.eventzen.dto.EventBookingSummaryResponse;
import com.adrita.eventzen.entity.BookingStatus;
import com.adrita.eventzen.entity.Role;
import com.adrita.eventzen.entity.User;
import com.adrita.eventzen.service.BookingService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BookingControllerTest {

    @Mock
    private BookingService bookingService;

    @InjectMocks
    private BookingController controller;

    private User customer() {
        return User.builder().id(10L).name("C").email("c@test.com").role(Role.CUSTOMER).build();
    }

    @Test
    void createBookingShouldDelegateByPrincipalEmail() {
        BookingRequest request = new BookingRequest();
        request.setEventId(5L);
        request.setNumberOfSeats(2);
        BookingResponse responsePayload = new BookingResponse();

        when(bookingService.createBooking("c@test.com", request)).thenReturn(responsePayload);

        ResponseEntity<BookingResponse> response = controller.createBooking(customer(), request);

        assertThat(response.getBody()).isEqualTo(responsePayload);
        verify(bookingService).createBooking("c@test.com", request);
    }

    @Test
    void getMyBookingsShouldReturnServiceResults() {
        List<BookingResponse> payload = List.of(new BookingResponse());
        when(bookingService.getMyBookings("c@test.com")).thenReturn(payload);

        ResponseEntity<List<BookingResponse>> response = controller.getMyBookings(customer());

        assertThat(response.getBody()).hasSize(1);
    }

    @Test
    void cancelMyBookingShouldDelegateAndReturnMessage() {
        ResponseEntity<String> response = controller.cancelMyBooking(customer(), 44L);

        verify(bookingService).cancelMyBooking("c@test.com", 44L);
        assertThat(response.getBody()).isEqualTo("Booking cancelled successfully");
    }

    @Test
    void getAllBookingsShouldReturnPayload() {
        when(bookingService.getAllBookings()).thenReturn(List.of(new BookingResponse()));

        ResponseEntity<List<BookingResponse>> response = controller.getAllBookings();

        assertThat(response.getBody()).hasSize(1);
    }

    @Test
    void getBookingsByEventShouldReturnPayload() {
        when(bookingService.getBookingsByEvent(7L)).thenReturn(List.of(new BookingResponse()));

        ResponseEntity<List<BookingResponse>> response = controller.getBookingsByEvent(7L);

        assertThat(response.getBody()).hasSize(1);
    }

    @Test
    void updateBookingStatusShouldDelegate() {
        BookingStatusUpdateRequest request = new BookingStatusUpdateRequest();
        request.setStatus(BookingStatus.CANCELLED);
        BookingResponse payload = new BookingResponse();
        when(bookingService.updateBookingStatus(3L, request)).thenReturn(payload);

        ResponseEntity<BookingResponse> response = controller.updateBookingStatus(3L, request);

        assertThat(response.getBody()).isEqualTo(payload);
    }

    @Test
    void getEventBookingSummaryShouldReturnPayload() {
        EventBookingSummaryResponse payload = new EventBookingSummaryResponse(1L, 100, 10, 90);
        when(bookingService.getEventBookingSummary(1L)).thenReturn(payload);

        ResponseEntity<EventBookingSummaryResponse> response = controller.getEventBookingSummary(1L);

        assertThat(response.getBody()).isEqualTo(payload);
    }
}
