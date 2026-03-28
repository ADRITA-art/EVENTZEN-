package com.adrita.eventzen.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public class ExpenseCreateRequest {

    @NotNull(message = "eventId is required")
    private Long eventId;

    @NotNull(message = "amount is required")
    @DecimalMin(value = "0.01", inclusive = true, message = "amount must be > 0")
    private BigDecimal amount;

    @NotBlank(message = "description is required")
    private String description;

    private String category;

    public ExpenseCreateRequest() {
    }

    public Long getEventId() {
        return eventId;
    }

    public void setEventId(Long eventId) {
        this.eventId = eventId;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }
}
