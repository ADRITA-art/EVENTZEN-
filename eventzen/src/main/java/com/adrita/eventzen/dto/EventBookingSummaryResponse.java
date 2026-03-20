package com.adrita.eventzen.dto;

public class EventBookingSummaryResponse {

    private Long eventId;
    private Integer maxCapacity;
    private Integer totalBookedSeats;
    private Integer remainingSeats;

    public EventBookingSummaryResponse() {
    }

    public EventBookingSummaryResponse(Long eventId, Integer maxCapacity, Integer totalBookedSeats, Integer remainingSeats) {
        this.eventId = eventId;
        this.maxCapacity = maxCapacity;
        this.totalBookedSeats = totalBookedSeats;
        this.remainingSeats = remainingSeats;
    }

    public Long getEventId() {
        return eventId;
    }

    public Integer getMaxCapacity() {
        return maxCapacity;
    }

    public Integer getTotalBookedSeats() {
        return totalBookedSeats;
    }

    public Integer getRemainingSeats() {
        return remainingSeats;
    }
}
