package com.adrita.eventzen.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public class EventVendorItemRequest {

    @NotNull(message = "Vendor ID is required")
    private Long vendorId;

    @Size(max = 500, message = "Purpose can be at most 500 characters")
    private String purpose;

    @NotNull(message = "Cost is required")
    @DecimalMin(value = "0.00", inclusive = true, message = "Cost must be >= 0")
    private BigDecimal cost;

    public EventVendorItemRequest() {
    }

    public Long getVendorId() {
        return vendorId;
    }

    public void setVendorId(Long vendorId) {
        this.vendorId = vendorId;
    }

    public String getPurpose() {
        return purpose;
    }

    public void setPurpose(String purpose) {
        this.purpose = purpose;
    }

    public BigDecimal getCost() {
        return cost;
    }

    public void setCost(BigDecimal cost) {
        this.cost = cost;
    }
}
