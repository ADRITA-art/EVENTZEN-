package com.adrita.eventzen.integration.budget;

import java.math.BigDecimal;

public class BudgetRequest {

    private Long eventId;
    private BigDecimal totalBudget;

    public BudgetRequest() {
    }

    public BudgetRequest(Long eventId, BigDecimal totalBudget) {
        this.eventId = eventId;
        this.totalBudget = totalBudget;
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
