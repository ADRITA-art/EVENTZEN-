package com.adrita.eventzen.dto;

import com.adrita.eventzen.entity.VenueType;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class VenueResponse {

    private Long id;
    private String name;
    private String state;
    private String city;
    private String country;
    private String pincode;
    private String address;
    private VenueType type;
    private Integer capacity;
    private String description;
    private String amenities;
    private BigDecimal pricePerHour;
    private BigDecimal rating;
    private String imageUrl;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public VenueResponse() {
    }

    public VenueResponse(Long id, String name, String state, String city, String country,
                         String pincode, String address, VenueType type, Integer capacity,
                         String description, String amenities, BigDecimal pricePerHour,
                         BigDecimal rating, String imageUrl, Boolean isActive,
                         LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.name = name;
        this.state = state;
        this.city = city;
        this.country = country;
        this.pincode = pincode;
        this.address = address;
        this.type = type;
        this.capacity = capacity;
        this.description = description;
        this.amenities = amenities;
        this.pricePerHour = pricePerHour;
        this.rating = rating;
        this.imageUrl = imageUrl;
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

    public String getState() {
        return state;
    }

    public String getCity() {
        return city;
    }

    public String getCountry() {
        return country;
    }

    public String getPincode() {
        return pincode;
    }

    public String getAddress() {
        return address;
    }

    public VenueType getType() {
        return type;
    }

    public Integer getCapacity() {
        return capacity;
    }

    public String getDescription() {
        return description;
    }

    public String getAmenities() {
        return amenities;
    }

    public BigDecimal getPricePerHour() {
        return pricePerHour;
    }

    public BigDecimal getRating() {
        return rating;
    }

    public String getImageUrl() {
        return imageUrl;
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
