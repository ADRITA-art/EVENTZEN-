package com.adrita.eventzen.controller;

import com.adrita.eventzen.dto.VenueRequest;
import com.adrita.eventzen.dto.VenueResponse;
import com.adrita.eventzen.service.VenueService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class VenueControllerTest {

    @Mock
    private VenueService venueService;

    @InjectMocks
    private VenueController controller;

    @Test
    void createVenueShouldReturnCreated() {
        VenueRequest request = new VenueRequest();
        VenueResponse payload = new VenueResponse();
        when(venueService.createVenue(request)).thenReturn(payload);

        ResponseEntity<VenueResponse> response = controller.createVenue(request);

        assertThat(response.getBody()).isEqualTo(payload);
    }

    @Test
    void updateVenueShouldReturnUpdated() {
        VenueRequest request = new VenueRequest();
        VenueResponse payload = new VenueResponse();
        when(venueService.updateVenue(2L, request)).thenReturn(payload);

        ResponseEntity<VenueResponse> response = controller.updateVenue(2L, request);

        assertThat(response.getBody()).isEqualTo(payload);
    }

    @Test
    void deleteVenueShouldDelegateAndReturnMessage() {
        ResponseEntity<String> response = controller.deleteVenue(3L);

        verify(venueService).deleteVenue(3L);
        assertThat(response.getBody()).isEqualTo("Venue deleted successfully");
    }

    @Test
    void getAllVenuesShouldReturnPayload() {
        when(venueService.getAllVenues()).thenReturn(List.of(new VenueResponse()));

        ResponseEntity<List<VenueResponse>> response = controller.getAllVenues();

        assertThat(response.getBody()).hasSize(1);
    }

    @Test
    void getVenueByIdShouldReturnPayload() {
        VenueResponse payload = new VenueResponse();
        when(venueService.getVenueById(7L)).thenReturn(payload);

        ResponseEntity<VenueResponse> response = controller.getVenueById(7L);

        assertThat(response.getBody()).isEqualTo(payload);
    }

    @Test
    void searchVenuesShouldDelegate() {
        when(venueService.searchVenues("Bengaluru", 200)).thenReturn(List.of(new VenueResponse()));

        ResponseEntity<List<VenueResponse>> response = controller.searchVenues("Bengaluru", 200);

        assertThat(response.getBody()).hasSize(1);
    }
}
