package com.adrita.eventzen.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public class BudgetSetRequest {

    @NotNull(message = "eventId is required")
    private Long eventId;

    @NotNull(message = "totalBudget is required")
    @DecimalMin(value = "0.00", inclusive = true, message = "totalBudget must be >= 0")
    private BigDecimal totalBudget;

    public BudgetSetRequest() {
    }

    public Long getEventId() {
        return eventId;
    }

    public void setEventId(Long eventId) {
        this.eventId = eventId;
    }

    public BigDecimal getTotalBudget() {
        return totalBudget;
    }

    public void setTotalBudget(BigDecimal totalBudget) {
        this.totalBudget = totalBudget;
    }
}
