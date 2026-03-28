package com.adrita.eventzen.service.impl;

import com.adrita.eventzen.dto.EventRequest;
import com.adrita.eventzen.dto.EventResponse;
import com.adrita.eventzen.dto.EventVendorResponse;
import com.adrita.eventzen.entity.Event;
import com.adrita.eventzen.entity.EventStatus;
import com.adrita.eventzen.entity.EventVendor;
import com.adrita.eventzen.entity.Venue;
import com.adrita.eventzen.exception.DuplicateResourceException;
import com.adrita.eventzen.exception.ResourceNotFoundException;
import com.adrita.eventzen.integration.budget.BudgetClient;
import com.adrita.eventzen.repository.BookingRepository;
import com.adrita.eventzen.repository.EventRepository;
import com.adrita.eventzen.repository.EventVendorRepository;
import com.adrita.eventzen.repository.VenueRepository;
import com.adrita.eventzen.service.EventService;
import com.adrita.eventzen.entity.BookingStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDate;
import java.util.EnumSet;
import java.util.List;

@Service
public class EventServiceImpl implements EventService {

    private final EventRepository eventRepository;
    private final VenueRepository venueRepository;
    private final BookingRepository bookingRepository;
    private final EventVendorRepository eventVendorRepository;
    private final BudgetClient budgetClient;
    private static final EnumSet<EventStatus> VISIBLE_STATUSES = EnumSet.of(EventStatus.ACTIVE, EventStatus.SOLD_OUT);

    public EventServiceImpl(EventRepository eventRepository,
                            VenueRepository venueRepository,
                            BookingRepository bookingRepository,
                            EventVendorRepository eventVendorRepository,
                            BudgetClient budgetClient) {
        this.eventRepository = eventRepository;
        this.venueRepository = venueRepository;
        this.bookingRepository = bookingRepository;
        this.eventVendorRepository = eventVendorRepository;
        this.budgetClient = budgetClient;
    }

    @Override
    @Transactional
    public EventResponse createEvent(EventRequest request) {
        validateEventTiming(request);

        Venue venue = venueRepository.findById(request.getVenueId())
                .orElseThrow(() -> new ResourceNotFoundException("Venue not found with id: " + request.getVenueId()));

        validateCapacityAgainstVenue(request, venue);

        checkVenueOverlap(request, null);

        Event event = new Event();
        applyRequestToEvent(event, request, venue);

        Event saved = eventRepository.save(event);
        EventResponse response = mapToResponse(saved);

        // Keep budget-service in sync when planning estimates change.
        budgetClient.upsertEstimatedCostForEvent(saved.getId(), response.getTotalCost());
        return response;
    }

    @Override
    @Transactional
    public EventResponse updateEvent(Long id, EventRequest request) {
        validateEventTiming(request);

        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with id: " + id));

        Venue venue = venueRepository.findById(request.getVenueId())
                .orElseThrow(() -> new ResourceNotFoundException("Venue not found with id: " + request.getVenueId()));

        validateCapacityAgainstVenue(request, venue);

        checkVenueOverlap(request, id);

        int confirmedBookedSeats = getConfirmedBookedSeats(event.getId());
        applyRequestToEvent(event, request, venue, confirmedBookedSeats);
        Event updated = eventRepository.save(event);
        EventResponse response = mapToResponse(updated);

        // Update planning estimate in budget-service when event costs change.
        budgetClient.upsertEstimatedCostForEvent(updated.getId(), response.getTotalCost());
        return response;
    }

    @Override
    public void cancelEvent(Long id) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with id: " + id));

        event.setStatus(EventStatus.CANCELLED);
        eventRepository.save(event);
    }

    @Override
    public List<EventResponse> getAllEvents() {
        return eventRepository.findByStatusIn(VISIBLE_STATUSES).stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public EventResponse getEventById(Long id) {
        Event event = eventRepository.findByIdAndStatusIn(id, VISIBLE_STATUSES)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with id: " + id));

        return mapToResponse(event);
    }

    @Override
    public List<EventResponse> getEventsByVenue(Long venueId) {
        return eventRepository.findByVenueIdAndStatusIn(venueId, VISIBLE_STATUSES).stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public List<EventResponse> searchEvents(LocalDate date, String location) {
        String normalizedLocation = (location == null || location.trim().isEmpty())
                ? null
                : location.trim();

        return eventRepository.searchEvents(date, normalizedLocation, VISIBLE_STATUSES).stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public List<EventResponse> getUpcomingEvents() {
        return eventRepository
                .findByEventDateGreaterThanEqualAndStatusInOrderByEventDateAscStartTimeAsc(LocalDate.now(), VISIBLE_STATUSES)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    private void validateCapacityAgainstVenue(EventRequest request, Venue venue) {
        if (request.getMaxCapacity() == null) {
            throw new IllegalArgumentException("maxCapacity is required");
        }

        if (venue.getCapacity() != null && request.getMaxCapacity() > venue.getCapacity()) {
            throw new IllegalArgumentException("Event maxCapacity cannot exceed venue capacity");
        }
    }

    private void validateEventTiming(EventRequest request) {
        if (!request.getStartTime().isBefore(request.getEndTime())) {
            throw new IllegalArgumentException("startTime must be before endTime");
        }
    }

    private void checkVenueOverlap(EventRequest request, Long excludeEventId) {
        boolean hasOverlap = eventRepository.existsOverlappingEvent(
                request.getVenueId(),
                request.getEventDate(),
                request.getStartTime(),
                request.getEndTime(),
                excludeEventId
        );

        if (hasOverlap) {
            throw new DuplicateResourceException("Another active event already exists at this venue for the selected time range");
        }
    }

    private void applyRequestToEvent(Event event, EventRequest request, Venue venue) {
        applyRequestToEvent(event, request, venue, 0);
    }

    private void applyRequestToEvent(Event event, EventRequest request, Venue venue, int confirmedBookedSeats) {
        if (confirmedBookedSeats > request.getMaxCapacity()) {
            throw new IllegalArgumentException("maxCapacity cannot be less than already confirmed seats");
        }

        event.setName(request.getName());
        event.setDescription(request.getDescription());
        event.setEventDate(request.getEventDate());
        event.setStartTime(request.getStartTime());
        event.setEndTime(request.getEndTime());
        event.setVenue(venue);
        event.setVenueCost(calculateVenueCost(venue, request));
        event.setTicketPrice(request.getTicketPrice());
        event.setMaxCapacity(request.getMaxCapacity());

        int ticketAvailable = Math.max(request.getMaxCapacity() - confirmedBookedSeats, 0);
        event.setTicketAvailable(ticketAvailable);

        if (event.getStatus() != EventStatus.CANCELLED && event.getStatus() != EventStatus.COMPLETED) {
            event.setStatus(ticketAvailable == 0 ? EventStatus.SOLD_OUT : EventStatus.ACTIVE);
        }

        if (event.getStatus() == null) {
            event.setStatus(EventStatus.ACTIVE);
        }
    }

    private int getConfirmedBookedSeats(Long eventId) {
        Integer seats = bookingRepository.sumBookedSeatsByEventIdAndStatus(eventId, BookingStatus.CONFIRMED);
        return seats == null ? 0 : seats;
    }

    private BigDecimal calculateVenueCost(Venue venue, EventRequest request) {
        if (venue.getPricePerHour() == null) {
            throw new IllegalArgumentException("Selected venue does not have pricePerHour configured");
        }

        long minutes = Duration.between(request.getStartTime(), request.getEndTime()).toMinutes();
        BigDecimal hours = BigDecimal.valueOf(minutes)
                .divide(BigDecimal.valueOf(60), 4, RoundingMode.HALF_UP);

        return venue.getPricePerHour()
                .multiply(hours)
                .setScale(2, RoundingMode.HALF_UP);
    }

    private EventResponse mapToResponse(Event event) {
        List<EventVendorResponse> vendors = eventVendorRepository.findAllByEventIdWithVendor(event.getId()).stream()
            .map(this::mapVendorToResponse)
            .toList();

        BigDecimal vendorCost = vendors.stream()
            .map(EventVendorResponse::getCost)
            .reduce(BigDecimal.ZERO, BigDecimal::add)
            .setScale(2, RoundingMode.HALF_UP);

        BigDecimal venueCost = event.getVenueCost() == null
            ? BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP)
            : event.getVenueCost().setScale(2, RoundingMode.HALF_UP);

        BigDecimal totalCost = venueCost.add(vendorCost).setScale(2, RoundingMode.HALF_UP);

        return new EventResponse(
                event.getId(),
                event.getName(),
                event.getDescription(),
                event.getEventDate(),
                event.getStartTime(),
                event.getEndTime(),
                event.getVenue().getId(),
                event.getVenue().getName(),
            venueCost,
            vendorCost,
            totalCost,
                event.getTicketPrice(),
                event.getMaxCapacity(),
                event.getTicketAvailable(),
            vendors,
                event.getStatus(),
                event.getCreatedAt(),
                event.getUpdatedAt()
        );
    }

        private EventVendorResponse mapVendorToResponse(EventVendor mapping) {
        return new EventVendorResponse(
            mapping.getId(),
            mapping.getVendor().getId(),
            mapping.getVendor().getName(),
            mapping.getVendor().getServiceType(),
            mapping.getVendor().getContactPerson(),
            mapping.getVendor().getPhone(),
            mapping.getVendor().getEmail(),
            mapping.getPurpose(),
            mapping.getCost()
        );
        }
}
