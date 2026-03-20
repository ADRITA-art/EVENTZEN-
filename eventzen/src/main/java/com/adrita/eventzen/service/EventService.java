package com.adrita.eventzen.service;

import com.adrita.eventzen.dto.EventRequest;
import com.adrita.eventzen.dto.EventResponse;

import java.time.LocalDate;
import java.util.List;

public interface EventService {

    EventResponse createEvent(EventRequest request);

    EventResponse updateEvent(Long id, EventRequest request);

    void cancelEvent(Long id);

    List<EventResponse> getAllEvents();

    EventResponse getEventById(Long id);

    List<EventResponse> getEventsByVenue(Long venueId);

    List<EventResponse> searchEvents(LocalDate date, String location);

    List<EventResponse> getUpcomingEvents();
}
