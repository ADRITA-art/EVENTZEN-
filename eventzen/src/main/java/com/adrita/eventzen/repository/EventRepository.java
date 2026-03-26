package com.adrita.eventzen.repository;

import com.adrita.eventzen.entity.Event;
import com.adrita.eventzen.entity.EventStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface EventRepository extends JpaRepository<Event, Long> {

    List<Event> findByStatus(EventStatus status);

    Optional<Event> findByIdAndStatus(Long id, EventStatus status);

    List<Event> findByVenueIdAndStatus(Long venueId, EventStatus status);

    List<Event> findByEventDateGreaterThanEqualAndStatusOrderByEventDateAscStartTimeAsc(LocalDate eventDate,
                                                                                         EventStatus status);

    List<Event> findByStatusIn(Collection<EventStatus> statuses);

    Optional<Event> findByIdAndStatusIn(Long id, Collection<EventStatus> statuses);

    List<Event> findByVenueIdAndStatusIn(Long venueId, Collection<EventStatus> statuses);

    List<Event> findByEventDateGreaterThanEqualAndStatusInOrderByEventDateAscStartTimeAsc(LocalDate eventDate,
                                                Collection<EventStatus> statuses);

    @Query("""
            SELECT CASE WHEN COUNT(e) > 0 THEN true ELSE false END
            FROM Event e
            WHERE e.venue.id = :venueId
              AND e.eventDate = :eventDate
              AND e.status = com.adrita.eventzen.entity.EventStatus.ACTIVE
              AND (:excludeEventId IS NULL OR e.id <> :excludeEventId)
              AND e.startTime < :newEndTime
              AND e.endTime > :newStartTime
            """)
    boolean existsOverlappingEvent(@Param("venueId") Long venueId,
                                   @Param("eventDate") LocalDate eventDate,
                                   @Param("newStartTime") LocalTime newStartTime,
                                   @Param("newEndTime") LocalTime newEndTime,
                                   @Param("excludeEventId") Long excludeEventId);

    @Query("""
            SELECT e FROM Event e
            JOIN e.venue v
          WHERE e.status IN :statuses
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
                             @Param("statuses") Collection<EventStatus> statuses);
}
