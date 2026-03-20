package com.adrita.eventzen.dto;

import com.adrita.eventzen.entity.VenueType;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public class VenueRequest {

    @NotBlank(message = "Name is required")
    private String name;

    private String state;

    private String city;

    private String country;

    private String pincode;

    private String address;

    @NotNull(message = "Type is required")
    private VenueType type;

    @NotNull(message = "Capacity is required")
    @Min(value = 1, message = "Capacity must be at least 1")
    private Integer capacity;

    @Size(max = 500, message = "Description can be at most 500 characters")
    private String description;

    @Size(max = 500, message = "Amenities can be at most 500 characters")
    private String amenities;

    @NotNull(message = "Price per hour is required")
    @DecimalMin(value = "0.00", inclusive = true, message = "Price must be >= 0")
    private BigDecimal pricePerHour;

    @DecimalMin(value = "0.0", inclusive = true, message = "Rating must be >= 0")
    @DecimalMax(value = "5.0", inclusive = true, message = "Rating must be <= 5")
    private BigDecimal rating;

    @Size(max = 500, message = "Image URL can be at most 500 characters")
    private String imageUrl;

    private Boolean isActive;

    public VenueRequest() {
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getState() {
        return state;
    }

    public void setState(String state) {
        this.state = state;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getCountry() {
        return country;
    }

    public void setCountry(String country) {
        this.country = country;
    }

    public String getPincode() {
        return pincode;
    }

    public void setPincode(String pincode) {
        this.pincode = pincode;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public VenueType getType() {
        return type;
    }

    public void setType(VenueType type) {
        this.type = type;
    }

    public Integer getCapacity() {
        return capacity;
    }

    public void setCapacity(Integer capacity) {
        this.capacity = capacity;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getAmenities() {
        return amenities;
    }

    public void setAmenities(String amenities) {
        this.amenities = amenities;
    }

    public BigDecimal getPricePerHour() {
        return pricePerHour;
    }

    public void setPricePerHour(BigDecimal pricePerHour) {
        this.pricePerHour = pricePerHour;
    }

    public BigDecimal getRating() {
        return rating;
    }

    public void setRating(BigDecimal rating) {
        this.rating = rating;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean active) {
        isActive = active;
    }
}
