package com.adrita.eventzen.controller;

import com.adrita.eventzen.dto.EventRequest;
import com.adrita.eventzen.dto.EventResponse;
import com.adrita.eventzen.service.EventService;
import com.adrita.eventzen.util.PaginationUtils;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/events")
public class EventController {

    private final EventService eventService;

    public EventController(EventService eventService) {
        this.eventService = eventService;
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<EventResponse> createEvent(@Valid @RequestBody EventRequest request) {
        return ResponseEntity.ok(eventService.createEvent(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<EventResponse> updateEvent(@PathVariable Long id,
                                                     @Valid @RequestBody EventRequest request) {
        return ResponseEntity.ok(eventService.updateEvent(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> cancelEvent(@PathVariable Long id) {
        eventService.cancelEvent(id);
        return ResponseEntity.ok("Event cancelled successfully");
    }

    @GetMapping
    public ResponseEntity<?> getAllEvents(@RequestParam(required = false) Integer page,
                                          @RequestParam(required = false) Integer size) {
        List<EventResponse> events = eventService.getAllEvents();
        if (page == null && size == null) {
            return ResponseEntity.ok(events);
        }
        return ResponseEntity.ok(PaginationUtils.paginate(events, page, size));
    }

    @GetMapping("/{id}")
    public ResponseEntity<EventResponse> getEventById(@PathVariable Long id) {
        return ResponseEntity.ok(eventService.getEventById(id));
    }

    @GetMapping("/venue/{venueId}")
    public ResponseEntity<?> getEventsByVenue(@PathVariable Long venueId,
                                              @RequestParam(required = false) Integer page,
                                              @RequestParam(required = false) Integer size) {
        List<EventResponse> events = eventService.getEventsByVenue(venueId);
        if (page == null && size == null) {
            return ResponseEntity.ok(events);
        }
        return ResponseEntity.ok(PaginationUtils.paginate(events, page, size));
    }

    @GetMapping("/search")
    public ResponseEntity<?> searchEvents(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        List<EventResponse> events = eventService.searchEvents(date, location);
        if (page == null && size == null) {
            return ResponseEntity.ok(events);
        }
        return ResponseEntity.ok(PaginationUtils.paginate(events, page, size));
    }

    @GetMapping("/upcoming")
    public ResponseEntity<?> getUpcomingEvents(@RequestParam(required = false) Integer page,
                                               @RequestParam(required = false) Integer size) {
        List<EventResponse> events = eventService.getUpcomingEvents();
        if (page == null && size == null) {
            return ResponseEntity.ok(events);
        }
        return ResponseEntity.ok(PaginationUtils.paginate(events, page, size));
    }
}
