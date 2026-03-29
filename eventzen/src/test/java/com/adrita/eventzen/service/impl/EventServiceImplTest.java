package com.adrita.eventzen.service.impl;

import com.adrita.eventzen.dto.EventRequest;
import com.adrita.eventzen.dto.EventResponse;
import com.adrita.eventzen.entity.BookingStatus;
import com.adrita.eventzen.entity.Event;
import com.adrita.eventzen.entity.EventStatus;
import com.adrita.eventzen.entity.Venue;
import com.adrita.eventzen.entity.VenueType;
import com.adrita.eventzen.exception.DuplicateResourceException;
import com.adrita.eventzen.exception.ResourceNotFoundException;
import com.adrita.eventzen.integration.budget.BudgetClient;
import com.adrita.eventzen.repository.BookingRepository;
import com.adrita.eventzen.repository.EventRepository;
import com.adrita.eventzen.repository.EventVendorRepository;
import com.adrita.eventzen.repository.VenueRepository;
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
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EventServiceImplTest {

    @Mock
    private EventRepository eventRepository;

    @Mock
    private VenueRepository venueRepository;

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private EventVendorRepository eventVendorRepository;

    @Mock
    private BudgetClient budgetClient;

    @InjectMocks
    private EventServiceImpl eventService;

    private EventRequest validRequest;
    private Venue venue;

    @BeforeEach
    void setUp() {
        venue = new Venue();
        venue.setId(5L);
        venue.setName("Main Hall");
        venue.setType(VenueType.HALL);
        venue.setCapacity(500);
        venue.setPricePerHour(new BigDecimal("1000.00"));

        validRequest = new EventRequest();
        validRequest.setName("Spring Fest");
        validRequest.setDescription("Community festival");
        validRequest.setEventDate(LocalDate.now().plusDays(10));
        validRequest.setStartTime(LocalTime.of(10, 0));
        validRequest.setEndTime(LocalTime.of(13, 0));
        validRequest.setVenueId(5L);
        validRequest.setTicketPrice(new BigDecimal("99.00"));
        validRequest.setMaxCapacity(300);

        when(eventVendorRepository.findAllByEventIdWithVendor(any())).thenReturn(List.of());
    }

    @Test
    void createEventShouldPersistAndSyncEstimatedCost() {
        when(venueRepository.findById(5L)).thenReturn(Optional.of(venue));
        when(eventRepository.existsOverlappingEvent(any(), any(), any(), any(), any())).thenReturn(false);
        when(eventRepository.save(any(Event.class))).thenAnswer(invocation -> {
            Event e = invocation.getArgument(0);
            e.setId(101L);
            e.setCreatedAt(LocalDateTime.now());
            e.setUpdatedAt(LocalDateTime.now());
            return e;
        });

        EventResponse response = eventService.createEvent(validRequest);

        assertThat(response.getId()).isEqualTo(101L);
        assertThat(response.getTotalCost()).isEqualByComparingTo("3000.00");
        assertThat(response.getStatus()).isEqualTo(EventStatus.ACTIVE);
        verify(budgetClient).upsertEstimatedCostForEvent(101L, new BigDecimal("3000.00"));
    }

    @Test
    void createEventShouldFailWhenTimingIsInvalid() {
        validRequest.setStartTime(LocalTime.of(14, 0));
        validRequest.setEndTime(LocalTime.of(10, 0));

        assertThatThrownBy(() -> eventService.createEvent(validRequest))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("startTime must be before endTime");
    }

    @Test
    void createEventShouldFailWhenVenueMissing() {
        when(venueRepository.findById(5L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> eventService.createEvent(validRequest))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Venue not found with id: 5");
    }

    @Test
    void createEventShouldFailWhenOverlapExists() {
        when(venueRepository.findById(5L)).thenReturn(Optional.of(venue));
        when(eventRepository.existsOverlappingEvent(any(), any(), any(), any(), any())).thenReturn(true);

        assertThatThrownBy(() -> eventService.createEvent(validRequest))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("Another active event already exists");
    }

    @Test
    void updateEventShouldRespectConfirmedSeatsAndSyncEstimatedCost() {
        Event existing = new Event();
        existing.setId(201L);
        existing.setStatus(EventStatus.ACTIVE);
        existing.setVenue(venue);

        when(eventRepository.findById(201L)).thenReturn(Optional.of(existing));
        when(venueRepository.findById(5L)).thenReturn(Optional.of(venue));
        when(eventRepository.existsOverlappingEvent(any(), any(), any(), any(), any())).thenReturn(false);
        when(bookingRepository.sumBookedSeatsByEventIdAndStatus(201L, BookingStatus.CONFIRMED)).thenReturn(120);
        when(eventRepository.save(any(Event.class))).thenAnswer(invocation -> invocation.getArgument(0));

        validRequest.setMaxCapacity(150);

        EventResponse response = eventService.updateEvent(201L, validRequest);

        assertThat(response.getTicketAvailable()).isEqualTo(30);
        verify(budgetClient).upsertEstimatedCostForEvent(201L, new BigDecimal("3000.00"));
    }

    @Test
    void updateEventShouldFailWhenCapacityLowerThanConfirmedSeats() {
        Event existing = new Event();
        existing.setId(201L);
        existing.setStatus(EventStatus.ACTIVE);
        existing.setVenue(venue);

        when(eventRepository.findById(201L)).thenReturn(Optional.of(existing));
        when(venueRepository.findById(5L)).thenReturn(Optional.of(venue));
        when(eventRepository.existsOverlappingEvent(any(), any(), any(), any(), any())).thenReturn(false);
        when(bookingRepository.sumBookedSeatsByEventIdAndStatus(201L, BookingStatus.CONFIRMED)).thenReturn(200);

        validRequest.setMaxCapacity(100);

        assertThatThrownBy(() -> eventService.updateEvent(201L, validRequest))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("maxCapacity cannot be less than already confirmed seats");
    }

    @Test
    void cancelEventShouldSetStatusCancelled() {
        Event event = new Event();
        event.setId(301L);
        event.setStatus(EventStatus.ACTIVE);

        when(eventRepository.findById(301L)).thenReturn(Optional.of(event));

        eventService.cancelEvent(301L);

        assertThat(event.getStatus()).isEqualTo(EventStatus.CANCELLED);
        verify(eventRepository).save(event);
    }

    @Test
    void getAllEventsShouldMapVisibleStatuses() {
        Event event = new Event();
        event.setId(1L);
        event.setName("Visible Event");
        event.setVenue(venue);
        event.setVenueCost(new BigDecimal("100.00"));
        event.setTicketPrice(new BigDecimal("10.00"));
        event.setMaxCapacity(100);
        event.setTicketAvailable(90);
        event.setStatus(EventStatus.ACTIVE);

        when(eventRepository.findByStatusIn(any())).thenReturn(List.of(event));

        List<EventResponse> responses = eventService.getAllEvents();

        assertThat(responses).hasSize(1);
        assertThat(responses.get(0).getVenueName()).isEqualTo("Main Hall");
    }

    @Test
    void getEventByIdShouldThrowWhenNotVisibleOrMissing() {
        when(eventRepository.findByIdAndStatusIn(eq(99L), any())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> eventService.getEventById(99L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Event not found with id: 99");
    }

    @Test
    void getEventsByVenueShouldReturnMappedResults() {
        Event event = new Event();
        event.setId(2L);
        event.setName("Venue Event");
        event.setVenue(venue);
        event.setVenueCost(new BigDecimal("100.00"));
        event.setTicketPrice(new BigDecimal("10.00"));
        event.setMaxCapacity(100);
        event.setTicketAvailable(90);
        event.setStatus(EventStatus.ACTIVE);

        when(eventRepository.findByVenueIdAndStatusIn(eq(5L), any())).thenReturn(List.of(event));

        List<EventResponse> responses = eventService.getEventsByVenue(5L);

        assertThat(responses).hasSize(1);
        assertThat(responses.get(0).getId()).isEqualTo(2L);
    }

    @Test
    void searchEventsShouldTrimLocationAndReturnResults() {
        Event event = new Event();
        event.setId(3L);
        event.setName("Search Event");
        event.setVenue(venue);
        event.setVenueCost(new BigDecimal("100.00"));
        event.setTicketPrice(new BigDecimal("10.00"));
        event.setMaxCapacity(100);
        event.setTicketAvailable(90);
        event.setStatus(EventStatus.ACTIVE);

        when(eventRepository.searchEvents(eq(validRequest.getEventDate()), eq("Bengaluru"), any()))
                .thenReturn(List.of(event));

        List<EventResponse> responses = eventService.searchEvents(validRequest.getEventDate(), "  Bengaluru  ");

        assertThat(responses).hasSize(1);
        verify(eventRepository).searchEvents(eq(validRequest.getEventDate()), eq("Bengaluru"), any());
    }

    @Test
    void getUpcomingEventsShouldReturnSortedMappedResults() {
        Event event = new Event();
        event.setId(4L);
        event.setName("Upcoming Event");
        event.setVenue(venue);
        event.setVenueCost(new BigDecimal("100.00"));
        event.setTicketPrice(new BigDecimal("10.00"));
        event.setMaxCapacity(100);
        event.setTicketAvailable(90);
        event.setStatus(EventStatus.ACTIVE);

        when(eventRepository.findByEventDateGreaterThanEqualAndStatusInOrderByEventDateAscStartTimeAsc(any(), any()))
                .thenReturn(List.of(event));

        List<EventResponse> responses = eventService.getUpcomingEvents();

        assertThat(responses).hasSize(1);
    }

    @Test
    void createEventShouldFailWhenVenuePricePerHourMissing() {
        venue.setPricePerHour(null);
        when(venueRepository.findById(5L)).thenReturn(Optional.of(venue));
        when(eventRepository.existsOverlappingEvent(any(), any(), any(), any(), any())).thenReturn(false);

        assertThatThrownBy(() -> eventService.createEvent(validRequest))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("pricePerHour configured");
        verify(eventRepository, never()).save(any());
    }
}
