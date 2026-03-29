package com.adrita.eventzen.controller;

import com.adrita.eventzen.dto.VendorRequest;
import com.adrita.eventzen.dto.VendorResponse;
import com.adrita.eventzen.entity.Role;
import com.adrita.eventzen.entity.User;
import com.adrita.eventzen.service.VendorService;
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
class VendorControllerTest {

    @Mock
    private VendorService vendorService;

    @InjectMocks
    private VendorController controller;

    @Test
    void createVendorShouldReturnCreatedVendor() {
        VendorRequest request = new VendorRequest();
        VendorResponse payload = new VendorResponse();
        when(vendorService.createVendor(request)).thenReturn(payload);

        ResponseEntity<VendorResponse> response = controller.createVendor(request);

        assertThat(response.getBody()).isEqualTo(payload);
    }

    @Test
    void getAllVendorsShouldUseAllForAdmin() {
        User admin = User.builder().role(Role.ADMIN).build();
        when(vendorService.getAllVendors()).thenReturn(List.of(new VendorResponse()));

        ResponseEntity<List<VendorResponse>> response = controller.getAllVendors(admin);

        assertThat(response.getBody()).hasSize(1);
        verify(vendorService).getAllVendors();
    }

    @Test
    void getAllVendorsShouldUseActiveForCustomer() {
        User customer = User.builder().role(Role.CUSTOMER).build();
        when(vendorService.getAllActiveVendors()).thenReturn(List.of(new VendorResponse()));

        ResponseEntity<List<VendorResponse>> response = controller.getAllVendors(customer);

        assertThat(response.getBody()).hasSize(1);
        verify(vendorService).getAllActiveVendors();
    }

    @Test
    void getVendorByIdShouldUseAdminPathForAdmin() {
        User admin = User.builder().role(Role.ADMIN).build();
        VendorResponse payload = new VendorResponse();
        when(vendorService.getVendorById(1L)).thenReturn(payload);

        ResponseEntity<VendorResponse> response = controller.getVendorById(1L, admin);

        assertThat(response.getBody()).isEqualTo(payload);
        verify(vendorService).getVendorById(1L);
    }

    @Test
    void getVendorByIdShouldUseActivePathForNonAdmin() {
        User customer = User.builder().role(Role.CUSTOMER).build();
        VendorResponse payload = new VendorResponse();
        when(vendorService.getActiveVendorById(1L)).thenReturn(payload);

        ResponseEntity<VendorResponse> response = controller.getVendorById(1L, customer);

        assertThat(response.getBody()).isEqualTo(payload);
        verify(vendorService).getActiveVendorById(1L);
    }

    @Test
    void updateVendorShouldReturnUpdated() {
        VendorRequest request = new VendorRequest();
        VendorResponse payload = new VendorResponse();
        when(vendorService.updateVendor(1L, request)).thenReturn(payload);

        ResponseEntity<VendorResponse> response = controller.updateVendor(1L, request);

        assertThat(response.getBody()).isEqualTo(payload);
    }

    @Test
    void deleteVendorShouldDelegateAndReturnMessage() {
        ResponseEntity<String> response = controller.deleteVendor(1L);

        verify(vendorService).deleteVendor(1L);
        assertThat(response.getBody()).isEqualTo("Vendor deleted successfully");
    }
}
