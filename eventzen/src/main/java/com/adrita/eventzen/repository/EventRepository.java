package com.adrita.eventzen.repository;

import com.adrita.eventzen.entity.Event;
import com.adrita.eventzen.entity.EventStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

public interface EventRepository extends JpaRepository<Event, Long> {

    List<Event> findByStatus(EventStatus status);

    Optional<Event> findByIdAndStatus(Long id, EventStatus status);

    List<Event> findByVenueIdAndStatus(Long venueId, EventStatus status);

    List<Event> findByEventDateGreaterThanEqualAndStatusOrderByEventDateAscStartTimeAsc(LocalDate eventDate,
                                                                                         EventStatus status);

    @Query(value = """
            SELECT CASE WHEN COUNT_BIG(e.id) > 0 THEN CAST(1 AS BIT) ELSE CAST(0 AS BIT) END
            FROM events e
            WHERE e.venue_id = :venueId
              AND e.event_date = :eventDate
              AND CAST(e.status AS VARCHAR(50)) = 'ACTIVE'
              AND (:excludeEventId IS NULL OR e.id <> :excludeEventId)
              AND CAST(e.start_time AS time) < CAST(:newEndTime AS time)
              AND CAST(e.end_time AS time) > CAST(:newStartTime AS time)
            """, nativeQuery = true)
    boolean existsOverlappingEvent(@Param("venueId") Long venueId,
                                   @Param("eventDate") LocalDate eventDate,
                                   @Param("newStartTime") LocalTime newStartTime,
                                   @Param("newEndTime") LocalTime newEndTime,
                                   @Param("excludeEventId") Long excludeEventId);

    @Query("""
            SELECT e FROM Event e
            JOIN e.venue v
            WHERE e.status = :status
              AND (:date IS NULL OR e.eventDate = :date)
              AND (
                    :location IS NULL
                    OR LOWER(v.city) LIKE LOWER(CONCAT('%', :location, '%'))
                    OR LOWER(v.state) LIKE LOWER(CONCAT('%', :location, '%'))
                    OR LOWER(v.country) LIKE LOWER(CONCAT('%', :location, '%'))
                  )
            ORDER BY e.eventDate ASC, e.startTime ASC
            """)
    List<Event> searchEvents(@Param("date") LocalDate date,
                             @Param("location") String location,
                             @Param("status") EventStatus status);
}
