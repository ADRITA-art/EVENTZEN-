package com.adrita.eventzen.repository;

import com.adrita.eventzen.entity.EventVendor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface EventVendorRepository extends JpaRepository<EventVendor, Long> {

    @Query("""
            SELECT ev FROM EventVendor ev
            JOIN FETCH ev.vendor
            WHERE ev.event.id = :eventId
            ORDER BY ev.id ASC
            """)
    List<EventVendor> findAllByEventIdWithVendor(@Param("eventId") Long eventId);

    Optional<EventVendor> findByEvent_IdAndVendor_Id(Long eventId, Long vendorId);

    boolean existsByEvent_IdAndVendor_Id(Long eventId, Long vendorId);

    @Query("""
            SELECT COALESCE(SUM(ev.cost), 0)
            FROM EventVendor ev
            WHERE ev.event.id = :eventId
            """)
    BigDecimal sumCostByEventId(@Param("eventId") Long eventId);
}
