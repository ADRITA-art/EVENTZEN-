package com.adrita.eventzen.service.impl;

import com.adrita.eventzen.dto.VendorRequest;
import com.adrita.eventzen.dto.VendorResponse;
import com.adrita.eventzen.entity.Vendor;
import com.adrita.eventzen.exception.ResourceNotFoundException;
import com.adrita.eventzen.repository.VendorRepository;
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
class VendorServiceImplTest {

    @Mock
    private VendorRepository vendorRepository;

    @InjectMocks
    private VendorServiceImpl vendorService;

    private VendorRequest request() {
        VendorRequest request = new VendorRequest();
        request.setName("Vendor A");
        request.setServiceType("Catering");
        request.setContactPerson("John");
        request.setPhone("9999999999");
        request.setEmail("vendor@test.com");
        request.setPrice(new BigDecimal("1500.00"));
        request.setIsActive(true);
        return request;
    }

    @Test
    void createVendorShouldPersistAndReturnResponse() {
        Vendor saved = new Vendor();
        saved.setId(1L);
        saved.setName("Vendor A");
        saved.setServiceType("Catering");
        saved.setContactPerson("John");
        saved.setPhone("9999999999");
        saved.setEmail("vendor@test.com");
        saved.setPrice(new BigDecimal("1500.00"));
        saved.setActive(true);

        when(vendorRepository.save(org.mockito.ArgumentMatchers.any(Vendor.class))).thenReturn(saved);

        VendorResponse response = vendorService.createVendor(request());

        assertThat(response.getId()).isEqualTo(1L);
        assertThat(response.getName()).isEqualTo("Vendor A");
    }

    @Test
    void updateVendorShouldUpdateOrThrow() {
        Vendor vendor = new Vendor();
        vendor.setId(2L);
        when(vendorRepository.findById(2L)).thenReturn(Optional.of(vendor));
        when(vendorRepository.save(vendor)).thenReturn(vendor);

        VendorResponse response = vendorService.updateVendor(2L, request());
        assertThat(response.getId()).isEqualTo(2L);

        when(vendorRepository.findById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> vendorService.updateVendor(99L, request()))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Vendor not found with id: 99");
    }

    @Test
    void deleteVendorShouldSoftDelete() {
        Vendor vendor = new Vendor();
        vendor.setId(3L);
        vendor.setActive(true);
        when(vendorRepository.findById(3L)).thenReturn(Optional.of(vendor));

        vendorService.deleteVendor(3L);

        assertThat(vendor.getActive()).isFalse();
        verify(vendorRepository).save(vendor);
    }

    @Test
    void getAllAndActiveAndByIdShouldMap() {
        Vendor vendor = new Vendor();
        vendor.setId(10L);
        vendor.setName("V");
        vendor.setServiceType("S");
        vendor.setContactPerson("P");
        vendor.setPhone("1");
        vendor.setEmail("v@test.com");
        vendor.setPrice(new BigDecimal("1.00"));
        vendor.setActive(true);

        when(vendorRepository.findAll()).thenReturn(List.of(vendor));
        when(vendorRepository.findByActiveTrue()).thenReturn(List.of(vendor));
        when(vendorRepository.findById(10L)).thenReturn(Optional.of(vendor));
        when(vendorRepository.findByIdAndActiveTrue(10L)).thenReturn(Optional.of(vendor));

        assertThat(vendorService.getAllVendors()).hasSize(1);
        assertThat(vendorService.getAllActiveVendors()).hasSize(1);
        assertThat(vendorService.getVendorById(10L).getId()).isEqualTo(10L);
        assertThat(vendorService.getActiveVendorById(10L).getId()).isEqualTo(10L);
    }
}
