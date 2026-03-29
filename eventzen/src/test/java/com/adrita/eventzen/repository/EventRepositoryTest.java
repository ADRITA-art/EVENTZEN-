package com.adrita.eventzen.repository;

import com.adrita.eventzen.entity.Event;
import com.adrita.eventzen.entity.EventStatus;
import com.adrita.eventzen.entity.Venue;
import com.adrita.eventzen.entity.VenueType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.EnumSet;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class EventRepositoryTest {

    @Autowired
    private EventRepository eventRepository;

    @Autowired
    private VenueRepository venueRepository;

    private Venue venue;

    @BeforeEach
    void setUp() {
        eventRepository.deleteAll();
        venueRepository.deleteAll();

        venue = new Venue();
        venue.setName("Repository Hall");
        venue.setType(VenueType.HALL);
        venue.setCity("Bengaluru");
        venue.setState("Karnataka");
        venue.setCountry("India");
        venue.setCapacity(500);
        venue.setPricePerHour(new BigDecimal("1000.00"));
        venue = venueRepository.save(venue);
    }

    @Test
    void existsOverlappingEventShouldDetectConflict() {
        Event event = new Event();
        event.setName("Morning Session");
        event.setEventDate(LocalDate.of(2026, 10, 20));
        event.setStartTime(LocalTime.of(10, 0));
        event.setEndTime(LocalTime.of(12, 0));
        event.setVenue(venue);
        event.setTicketPrice(new BigDecimal("100.00"));
        event.setMaxCapacity(100);
        event.setTicketAvailable(100);
        event.setStatus(EventStatus.ACTIVE);
        eventRepository.save(event);

        boolean overlap = eventRepository.existsOverlappingEvent(
                venue.getId(),
                LocalDate.of(2026, 10, 20),
                LocalTime.of(11, 0),
                LocalTime.of(13, 0),
                null
        );

        assertThat(overlap).isTrue();
    }

    @Test
    void existsOverlappingEventShouldIgnoreExcludedEventId() {
        Event event = new Event();
        event.setName("Morning Session");
        event.setEventDate(LocalDate.of(2026, 10, 20));
        event.setStartTime(LocalTime.of(10, 0));
        event.setEndTime(LocalTime.of(12, 0));
        event.setVenue(venue);
        event.setTicketPrice(new BigDecimal("100.00"));
        event.setMaxCapacity(100);
        event.setTicketAvailable(100);
        event.setStatus(EventStatus.ACTIVE);
        Event saved = eventRepository.save(event);

        boolean overlap = eventRepository.existsOverlappingEvent(
                venue.getId(),
                LocalDate.of(2026, 10, 20),
                LocalTime.of(11, 0),
                LocalTime.of(13, 0),
                saved.getId()
        );

        assertThat(overlap).isFalse();
    }

    @Test
    void searchEventsShouldFilterByLocationAndStatus() {
        Event active = new Event();
        active.setName("Active Event");
        active.setEventDate(LocalDate.of(2026, 11, 5));
        active.setStartTime(LocalTime.of(9, 0));
        active.setEndTime(LocalTime.of(10, 0));
        active.setVenue(venue);
        active.setTicketPrice(new BigDecimal("100.00"));
        active.setMaxCapacity(100);
        active.setTicketAvailable(100);
        active.setStatus(EventStatus.ACTIVE);
        eventRepository.save(active);

        Event cancelled = new Event();
        cancelled.setName("Cancelled Event");
        cancelled.setEventDate(LocalDate.of(2026, 11, 5));
        cancelled.setStartTime(LocalTime.of(11, 0));
        cancelled.setEndTime(LocalTime.of(12, 0));
        cancelled.setVenue(venue);
        cancelled.setTicketPrice(new BigDecimal("100.00"));
        cancelled.setMaxCapacity(100);
        cancelled.setTicketAvailable(100);
        cancelled.setStatus(EventStatus.CANCELLED);
        eventRepository.save(cancelled);

        List<Event> result = eventRepository.searchEvents(
                LocalDate.of(2026, 11, 5),
                "benga",
                EnumSet.of(EventStatus.ACTIVE, EventStatus.SOLD_OUT)
        );

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getName()).isEqualTo("Active Event");
    }
}
