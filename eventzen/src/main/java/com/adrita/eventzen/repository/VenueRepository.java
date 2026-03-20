package com.adrita.eventzen.repository;

import com.adrita.eventzen.entity.Venue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface VenueRepository extends JpaRepository<Venue, Long> {

    List<Venue> findByActiveTrue();

    @Query("""
            SELECT v FROM Venue v
            WHERE v.active = true
            AND (:capacity IS NULL OR v.capacity >= :capacity)
            AND (
                :location IS NULL
                OR LOWER(v.city) LIKE LOWER(CONCAT('%', :location, '%'))
                OR LOWER(v.state) LIKE LOWER(CONCAT('%', :location, '%'))
                OR LOWER(v.country) LIKE LOWER(CONCAT('%', :location, '%'))
            )
            """)
    List<Venue> searchActiveVenues(@Param("location") String location,
                                   @Param("capacity") Integer capacity);
}
