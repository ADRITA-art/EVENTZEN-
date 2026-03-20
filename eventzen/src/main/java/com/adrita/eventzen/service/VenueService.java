package com.adrita.eventzen.service;

import com.adrita.eventzen.dto.VenueRequest;
import com.adrita.eventzen.dto.VenueResponse;

import java.util.List;

public interface VenueService {

    VenueResponse createVenue(VenueRequest request);

    VenueResponse updateVenue(Long id, VenueRequest request);

    void deleteVenue(Long id);

    List<VenueResponse> getAllVenues();

    VenueResponse getVenueById(Long id);

    List<VenueResponse> searchVenues(String location, Integer capacity);
}
