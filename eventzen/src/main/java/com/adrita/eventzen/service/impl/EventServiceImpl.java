package com.adrita.eventzen.service.impl;

import com.adrita.eventzen.dto.EventRequest;
import com.adrita.eventzen.dto.EventResponse;
import com.adrita.eventzen.entity.Event;
import com.adrita.eventzen.entity.EventStatus;
import com.adrita.eventzen.entity.Venue;
import com.adrita.eventzen.exception.DuplicateResourceException;
import com.adrita.eventzen.exception.ResourceNotFoundException;
import com.adrita.eventzen.repository.EventRepository;
import com.adrita.eventzen.repository.VenueRepository;
import com.adrita.eventzen.service.EventService;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDate;
import java.util.List;

@Service
public class EventServiceImpl implements EventService {

    private final EventRepository eventRepository;
    private final VenueRepository venueRepository;

    public EventServiceImpl(EventRepository eventRepository, VenueRepository venueRepository) {
        this.eventRepository = eventRepository;
        this.venueRepository = venueRepository;
    }

    @Override
    public EventResponse createEvent(EventRequest request) {
        validateEventTiming(request);

        Venue venue = venueRepository.findById(request.getVenueId())
                .orElseThrow(() -> new ResourceNotFoundException("Venue not found with id: " + request.getVenueId()));

        checkVenueOverlap(request, null);

        Event event = new Event();
        applyRequestToEvent(event, request, venue);

        Event saved = eventRepository.save(event);
        return mapToResponse(saved);
    }

    @Override
    public EventResponse updateEvent(Long id, EventRequest request) {
        validateEventTiming(request);

        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with id: " + id));

        Venue venue = venueRepository.findById(request.getVenueId())
                .orElseThrow(() -> new ResourceNotFoundException("Venue not found with id: " + request.getVenueId()));

        checkVenueOverlap(request, id);

        applyRequestToEvent(event, request, venue);
        Event updated = eventRepository.save(event);
        return mapToResponse(updated);
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
        return eventRepository.findByStatus(EventStatus.ACTIVE).stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public EventResponse getEventById(Long id) {
        Event event = eventRepository.findByIdAndStatus(id, EventStatus.ACTIVE)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with id: " + id));

        return mapToResponse(event);
    }

    @Override
    public List<EventResponse> getEventsByVenue(Long venueId) {
        return eventRepository.findByVenueIdAndStatus(venueId, EventStatus.ACTIVE).stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public List<EventResponse> searchEvents(LocalDate date, String location) {
        String normalizedLocation = (location == null || location.trim().isEmpty())
                ? null
                : location.trim();

        return eventRepository.searchEvents(date, normalizedLocation, EventStatus.ACTIVE).stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public List<EventResponse> getUpcomingEvents() {
        return eventRepository
                .findByEventDateGreaterThanEqualAndStatusOrderByEventDateAscStartTimeAsc(LocalDate.now(), EventStatus.ACTIVE)
                .stream()
                .map(this::mapToResponse)
                .toList();
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
        event.setName(request.getName());
        event.setDescription(request.getDescription());
        event.setEventDate(request.getEventDate());
        event.setStartTime(request.getStartTime());
        event.setEndTime(request.getEndTime());
        event.setVenue(venue);
        event.setVenueCost(calculateVenueCost(venue, request));
        event.setTicketPrice(request.getTicketPrice());
        event.setMaxCapacity(request.getMaxCapacity());

        if (event.getStatus() == null) {
            event.setStatus(EventStatus.ACTIVE);
        }
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
        return new EventResponse(
                event.getId(),
                event.getName(),
                event.getDescription(),
                event.getEventDate(),
                event.getStartTime(),
                event.getEndTime(),
                event.getVenue().getId(),
                event.getVenue().getName(),
                event.getVenueCost(),
                event.getTicketPrice(),
                event.getMaxCapacity(),
                event.getStatus(),
                event.getCreatedAt(),
                event.getUpdatedAt()
        );
    }
}
