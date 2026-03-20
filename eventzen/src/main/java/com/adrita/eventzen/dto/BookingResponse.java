package com.adrita.eventzen.dto;

import com.adrita.eventzen.entity.BookingStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

public class BookingResponse {

    private Long id;
    private Long userId;
    private String userName;
    private Long eventId;
    private String eventName;
    private LocalDate eventDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private Integer numberOfSeats;
    private BigDecimal pricePerTicket;
    private BigDecimal totalPrice;
    private LocalDateTime bookingTime;
    private BookingStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public BookingResponse() {
    }

    public BookingResponse(Long id, Long userId, String userName, Long eventId, String eventName,
                           LocalDate eventDate, LocalTime startTime, LocalTime endTime,
                           Integer numberOfSeats, BigDecimal pricePerTicket, BigDecimal totalPrice,
                           LocalDateTime bookingTime, BookingStatus status,
                           LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.userId = userId;
        this.userName = userName;
        this.eventId = eventId;
        this.eventName = eventName;
        this.eventDate = eventDate;
        this.startTime = startTime;
        this.endTime = endTime;
        this.numberOfSeats = numberOfSeats;
        this.pricePerTicket = pricePerTicket;
        this.totalPrice = totalPrice;
        this.bookingTime = bookingTime;
        this.status = status;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public Long getId() {
        return id;
    }

    public Long getUserId() {
        return userId;
    }

    public String getUserName() {
        return userName;
    }

    public Long getEventId() {
        return eventId;
    }

    public String getEventName() {
        return eventName;
    }

    public LocalDate getEventDate() {
        return eventDate;
    }

    public LocalTime getStartTime() {
        return startTime;
    }

    public LocalTime getEndTime() {
        return endTime;
    }

    public Integer getNumberOfSeats() {
        return numberOfSeats;
    }

    public BigDecimal getPricePerTicket() {
        return pricePerTicket;
    }

    public BigDecimal getTotalPrice() {
        return totalPrice;
    }

    public LocalDateTime getBookingTime() {
        return bookingTime;
    }

    public BookingStatus getStatus() {
        return status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
