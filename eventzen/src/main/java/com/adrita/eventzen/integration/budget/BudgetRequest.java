package com.adrita.eventzen.integration.budget;

import java.math.BigDecimal;

public class BudgetRequest {

    private Long eventId;
    private BigDecimal estimatedCost;
    private BigDecimal totalBudget;
    private BigDecimal revenue;

    public BudgetRequest() {
    }

    public BudgetRequest(Long eventId, BigDecimal estimatedCost, BigDecimal totalBudget, BigDecimal revenue) {
        this.eventId = eventId;
        this.estimatedCost = estimatedCost;
        this.totalBudget = totalBudget;
        this.revenue = revenue;
    }

    public Long getEventId() {
        return eventId;
    }

    public void setEventId(Long eventId) {
        this.eventId = eventId;
    }

    public BigDecimal getEstimatedCost() {
        return estimatedCost;
    }

    public void setEstimatedCost(BigDecimal estimatedCost) {
        this.estimatedCost = estimatedCost;
    }

    public BigDecimal getTotalBudget() {
        return totalBudget;
    }

    public void setTotalBudget(BigDecimal totalBudget) {
        this.totalBudget = totalBudget;
    }

    public BigDecimal getRevenue() {
        return revenue;
    }

    public void setRevenue(BigDecimal revenue) {
        this.revenue = revenue;
    }
}
