package com.adrita.eventzen.service.impl;

import com.adrita.eventzen.dto.VenueRequest;
import com.adrita.eventzen.dto.VenueResponse;
import com.adrita.eventzen.entity.Venue;
import com.adrita.eventzen.entity.VenueType;
import com.adrita.eventzen.exception.ResourceNotFoundException;
import com.adrita.eventzen.repository.VenueRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class VenueServiceImplTest {

    @Mock
    private VenueRepository venueRepository;

    @InjectMocks
    private VenueServiceImpl venueService;

    private VenueRequest request() {
        VenueRequest request = new VenueRequest();
        request.setName("Hall A");
        request.setState("Karnataka");
        request.setCity("Bengaluru");
        request.setCountry("India");
        request.setType(VenueType.HALL);
        request.setCapacity(500);
        request.setPricePerHour(new BigDecimal("2000.00"));
        request.setIsActive(true);
        return request;
    }

    @Test
    void createVenueShouldPersistAndReturnResponse() {
        Venue saved = new Venue();
        saved.setId(1L);
        saved.setName("Hall A");
        saved.setType(VenueType.HALL);
        saved.setActive(true);

        when(venueRepository.save(org.mockito.ArgumentMatchers.any(Venue.class))).thenReturn(saved);

        VenueResponse response = venueService.createVenue(request());

        assertThat(response.getId()).isEqualTo(1L);
        assertThat(response.getName()).isEqualTo("Hall A");
    }

    @Test
    void updateVenueShouldUpdateOrThrow() {
        Venue venue = new Venue();
        venue.setId(2L);
        when(venueRepository.findById(2L)).thenReturn(Optional.of(venue));
        when(venueRepository.save(venue)).thenReturn(venue);

        VenueResponse response = venueService.updateVenue(2L, request());
        assertThat(response.getId()).isEqualTo(2L);

        when(venueRepository.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> venueService.updateVenue(99L, request()))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Venue not found with id: 99");
    }

    @Test
    void deleteVenueShouldDeleteFoundEntity() {
        Venue venue = new Venue();
        venue.setId(3L);
        when(venueRepository.findById(3L)).thenReturn(Optional.of(venue));

        venueService.deleteVenue(3L);

        verify(venueRepository).delete(venue);
    }

    @Test
    void getAllVenuesShouldMapOnlyActiveResults() {
        Venue venue = new Venue();
        venue.setId(11L);
        venue.setName("Active Hall");
        venue.setActive(true);
        venue.setType(VenueType.HALL);

        when(venueRepository.findByActiveTrue()).thenReturn(List.of(venue));

        List<VenueResponse> responses = venueService.getAllVenues();

        assertThat(responses).hasSize(1);
        assertThat(responses.get(0).getId()).isEqualTo(11L);
    }

    @Test
    void getVenueByIdShouldReturnOnlyWhenActive() {
        Venue active = new Venue();
        active.setId(12L);
        active.setName("A");
        active.setType(VenueType.HALL);
        active.setActive(true);

        when(venueRepository.findById(12L)).thenReturn(Optional.of(active));

        assertThat(venueService.getVenueById(12L).getId()).isEqualTo(12L);

        Venue inactive = new Venue();
        inactive.setId(13L);
        inactive.setActive(false);
        when(venueRepository.findById(13L)).thenReturn(Optional.of(inactive));

        assertThatThrownBy(() -> venueService.getVenueById(13L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Venue not found with id: 13");
    }

    @Test
    void searchVenuesShouldTrimLocationBeforeQuery() {
        Venue venue = new Venue();
        venue.setId(14L);
        venue.setName("Search Hall");
        venue.setType(VenueType.HALL);
        venue.setActive(true);

        when(venueRepository.searchActiveVenues("Bengaluru", 100)).thenReturn(List.of(venue));

        List<VenueResponse> responses = venueService.searchVenues("  Bengaluru  ", 100);

        assertThat(responses).hasSize(1);
        verify(venueRepository).searchActiveVenues("Bengaluru", 100);
    }
}
