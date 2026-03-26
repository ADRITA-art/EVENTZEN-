package com.adrita.eventzen.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public class EventVendorAttachRequest {

    @NotEmpty(message = "Vendors list is required")
    private List<@Valid EventVendorItemRequest> vendors;

    public EventVendorAttachRequest() {
    }

    public List<EventVendorItemRequest> getVendors() {
        return vendors;
    }

    public void setVendors(List<EventVendorItemRequest> vendors) {
        this.vendors = vendors;
    }
}
