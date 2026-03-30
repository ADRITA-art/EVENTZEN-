package com.adrita.eventzen.controller;

import com.adrita.eventzen.dto.VenueRequest;
import com.adrita.eventzen.dto.VenueResponse;
import com.adrita.eventzen.service.VenueService;
import com.adrita.eventzen.util.PaginationUtils;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/venues")
public class VenueController {

    private final VenueService venueService;

    public VenueController(VenueService venueService) {
        this.venueService = venueService;
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<VenueResponse> createVenue(@Valid @RequestBody VenueRequest request) {
        return ResponseEntity.ok(venueService.createVenue(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<VenueResponse> updateVenue(@PathVariable Long id,
                                                     @Valid @RequestBody VenueRequest request) {
        return ResponseEntity.ok(venueService.updateVenue(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> deleteVenue(@PathVariable Long id) {
        venueService.deleteVenue(id);
        return ResponseEntity.ok("Venue deleted successfully");
    }

    @GetMapping
    public ResponseEntity<?> getAllVenues(@RequestParam(required = false) Integer page,
                                          @RequestParam(required = false) Integer size) {
        List<VenueResponse> venues = venueService.getAllVenues();
        if (page == null && size == null) {
            return ResponseEntity.ok(venues);
        }
        return ResponseEntity.ok(PaginationUtils.paginate(venues, page, size));
    }

    public ResponseEntity<List<VenueResponse>> getAllVenues() {
        return ResponseEntity.ok(venueService.getAllVenues());
    }

    @GetMapping("/{id}")
    public ResponseEntity<VenueResponse> getVenueById(@PathVariable Long id) {
        return ResponseEntity.ok(venueService.getVenueById(id));
    }

    @GetMapping("/search")
    public ResponseEntity<?> searchVenues(
            @RequestParam(required = false) String location,
            @RequestParam(required = false) Integer capacity,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        List<VenueResponse> venues = venueService.searchVenues(location, capacity);
        if (page == null && size == null) {
            return ResponseEntity.ok(venues);
        }
        return ResponseEntity.ok(PaginationUtils.paginate(venues, page, size));
    }

    public ResponseEntity<List<VenueResponse>> searchVenues(String location, Integer capacity) {
        return ResponseEntity.ok(venueService.searchVenues(location, capacity));
    }
}
