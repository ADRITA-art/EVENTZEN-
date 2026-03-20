package com.adrita.eventzen.service.impl;

import com.adrita.eventzen.dto.VenueRequest;
import com.adrita.eventzen.dto.VenueResponse;
import com.adrita.eventzen.entity.Venue;
import com.adrita.eventzen.exception.ResourceNotFoundException;
import com.adrita.eventzen.repository.VenueRepository;
import com.adrita.eventzen.service.VenueService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class VenueServiceImpl implements VenueService {

    private final VenueRepository venueRepository;

    public VenueServiceImpl(VenueRepository venueRepository) {
        this.venueRepository = venueRepository;
    }

    @Override
    public VenueResponse createVenue(VenueRequest request) {
        Venue venue = new Venue();
        applyRequestToVenue(venue, request);
        Venue saved = venueRepository.save(venue);
        return mapToResponse(saved);
    }

    @Override
    public VenueResponse updateVenue(Long id, VenueRequest request) {
        Venue venue = venueRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Venue not found with id: " + id));

        applyRequestToVenue(venue, request);
        Venue updated = venueRepository.save(venue);
        return mapToResponse(updated);
    }

    @Override
    public void deleteVenue(Long id) {
        Venue venue = venueRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Venue not found with id: " + id));

        venueRepository.delete(venue);
    }

    @Override
    public List<VenueResponse> getAllVenues() {
        return venueRepository.findByActiveTrue().stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public VenueResponse getVenueById(Long id) {
        Venue venue = venueRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Venue not found with id: " + id));

        if (!Boolean.TRUE.equals(venue.getActive())) {
            throw new ResourceNotFoundException("Venue not found with id: " + id);
        }

        return mapToResponse(venue);
    }

    @Override
    public List<VenueResponse> searchVenues(String location, Integer capacity) {
        String normalizedLocation = (location == null || location.trim().isEmpty())
                ? null
                : location.trim();

        return venueRepository.searchActiveVenues(normalizedLocation, capacity).stream()
                .map(this::mapToResponse)
                .toList();
    }

    private void applyRequestToVenue(Venue venue, VenueRequest request) {
        venue.setName(request.getName());
        venue.setState(request.getState());
        venue.setCity(request.getCity());
        venue.setCountry(request.getCountry());
        venue.setPincode(request.getPincode());
        venue.setAddress(request.getAddress());
        venue.setType(request.getType());
        venue.setCapacity(request.getCapacity());
        venue.setDescription(request.getDescription());
        venue.setAmenities(request.getAmenities());
        venue.setPricePerHour(request.getPricePerHour());
        venue.setRating(request.getRating());
        venue.setImageUrl(request.getImageUrl());

        if (request.getIsActive() != null) {
            venue.setActive(request.getIsActive());
        }
    }

    private VenueResponse mapToResponse(Venue venue) {
        return new VenueResponse(
                venue.getId(),
                venue.getName(),
                venue.getState(),
                venue.getCity(),
                venue.getCountry(),
                venue.getPincode(),
                venue.getAddress(),
                venue.getType(),
                venue.getCapacity(),
                venue.getDescription(),
                venue.getAmenities(),
                venue.getPricePerHour(),
                venue.getRating(),
                venue.getImageUrl(),
                venue.getActive(),
                venue.getCreatedAt(),
                venue.getUpdatedAt()
        );
    }
}
