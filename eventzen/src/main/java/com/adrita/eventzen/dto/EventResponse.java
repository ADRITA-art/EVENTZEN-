package com.adrita.eventzen.dto;

import com.adrita.eventzen.entity.EventStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

public class EventResponse {

    private Long id;
    private String name;
    private String description;
    private LocalDate eventDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private Long venueId;
    private String venueName;
    private BigDecimal venueCost;
    private BigDecimal vendorCost;
    private BigDecimal totalCost;
    private BigDecimal ticketPrice;
    private Integer maxCapacity;
    private Integer ticketAvailable;
    private List<EventVendorResponse> vendors;
    private EventStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public EventResponse() {
    }

    public EventResponse(Long id, String name, String description, LocalDate eventDate,
                         LocalTime startTime, LocalTime endTime, Long venueId, String venueName,
                         BigDecimal venueCost, BigDecimal vendorCost, BigDecimal totalCost,
                         BigDecimal ticketPrice, Integer maxCapacity, Integer ticketAvailable,
                         List<EventVendorResponse> vendors, EventStatus status,
                         LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.eventDate = eventDate;
        this.startTime = startTime;
        this.endTime = endTime;
        this.venueId = venueId;
        this.venueName = venueName;
        this.venueCost = venueCost;
        this.vendorCost = vendorCost;
        this.totalCost = totalCost;
        this.ticketPrice = ticketPrice;
        this.maxCapacity = maxCapacity;
        this.ticketAvailable = ticketAvailable;
        this.vendors = vendors;
        this.status = status;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getDescription() {
        return description;
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

    public Long getVenueId() {
        return venueId;
    }

    public String getVenueName() {
        return venueName;
    }

    public BigDecimal getVenueCost() {
        return venueCost;
    }

    public BigDecimal getVendorCost() {
        return vendorCost;
    }

    public BigDecimal getTotalCost() {
        return totalCost;
    }

    public BigDecimal getTicketPrice() {
        return ticketPrice;
    }

    public Integer getMaxCapacity() {
        return maxCapacity;
    }

    public Integer getTicketAvailable() {
        return ticketAvailable;
    }

    public List<EventVendorResponse> getVendors() {
        return vendors;
    }

    public EventStatus getStatus() {
        return status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
