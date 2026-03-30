package com.adrita.eventzen.repository;

import com.adrita.eventzen.entity.Booking;
import com.adrita.eventzen.entity.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface BookingRepository extends JpaRepository<Booking, Long> {

    List<Booking> findByUserIdOrderByBookingTimeDesc(Long userId);

    Optional<Booking> findByIdAndUserId(Long id, Long userId);

    List<Booking> findByEventIdOrderByBookingTimeDesc(Long eventId);

    List<Booking> findAllByOrderByBookingTimeDesc();

    @Modifying
    @Query("DELETE FROM Booking b WHERE b.user.id = :userId")
    void deleteByUserId(@Param("userId") Long userId);

    @Query("""
            SELECT COALESCE(SUM(b.numberOfSeats), 0)
            FROM Booking b
            WHERE b.event.id = :eventId
              AND b.status = :status
            """)
    Integer sumBookedSeatsByEventIdAndStatus(@Param("eventId") Long eventId,
                                             @Param("status") BookingStatus status);

    @Query("""
            SELECT COALESCE(SUM(b.totalPrice), 0)
            FROM Booking b
            WHERE b.event.id = :eventId
              AND b.status = :status
            """)
    java.math.BigDecimal sumTotalPriceByEventIdAndStatus(@Param("eventId") Long eventId,
                                                          @Param("status") BookingStatus status);
}
