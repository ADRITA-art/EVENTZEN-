package com.adrita.eventzen.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class VendorResponse {

    private Long id;
    private String name;
    private String serviceType;
    private String contactPerson;
    private String phone;
    private String email;
    private BigDecimal price;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public VendorResponse() {
    }

    public VendorResponse(Long id, String name, String serviceType, String contactPerson,
                          String phone, String email, BigDecimal price, Boolean isActive,
                          LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.name = name;
        this.serviceType = serviceType;
        this.contactPerson = contactPerson;
        this.phone = phone;
        this.email = email;
        this.price = price;
        this.isActive = isActive;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
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

    public BigDecimal getPrice() {
        return price;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
}
