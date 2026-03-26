package com.adrita.eventzen.dto;

import java.math.BigDecimal;

public class EventVendorResponse {

    private Long id;
    private Long vendorId;
    private String vendorName;
    private String serviceType;
    private String contactPerson;
    private String phone;
    private String email;
    private String purpose;
    private BigDecimal cost;

    public EventVendorResponse() {
    }

    public EventVendorResponse(Long id, Long vendorId, String vendorName, String serviceType,
                               String contactPerson, String phone, String email,
                               String purpose, BigDecimal cost) {
        this.id = id;
        this.vendorId = vendorId;
        this.vendorName = vendorName;
        this.serviceType = serviceType;
        this.contactPerson = contactPerson;
        this.phone = phone;
        this.email = email;
        this.purpose = purpose;
        this.cost = cost;
    }

    public Long getId() {
        return id;
    }

    public Long getVendorId() {
        return vendorId;
    }

    public String getVendorName() {
        return vendorName;
    }

    public String getServiceType() {
        return serviceType;
    }

    public String getContactPerson() {
        return contactPerson;
    }

    public String getPhone() {
        return phone;
    }

    public String getEmail() {
        return email;
    }

    public String getPurpose() {
        return purpose;
    }

    public BigDecimal getCost() {
        return cost;
    }
}
