package com.adrita.eventzen.service.impl;

import com.adrita.eventzen.dto.VendorRequest;
import com.adrita.eventzen.dto.VendorResponse;
import com.adrita.eventzen.entity.Vendor;
import com.adrita.eventzen.exception.ResourceNotFoundException;
import com.adrita.eventzen.repository.VendorRepository;
import com.adrita.eventzen.service.VendorService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class VendorServiceImpl implements VendorService {

    private final VendorRepository vendorRepository;

    public VendorServiceImpl(VendorRepository vendorRepository) {
        this.vendorRepository = vendorRepository;
    }

    @Override
    public VendorResponse createVendor(VendorRequest request) {
        Vendor vendor = new Vendor();
        applyRequest(vendor, request);
        Vendor saved = vendorRepository.save(vendor);
        return mapToResponse(saved);
    }

    @Override
    public VendorResponse updateVendor(Long id, VendorRequest request) {
        Vendor vendor = vendorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vendor not found with id: " + id));

        applyRequest(vendor, request);
        Vendor updated = vendorRepository.save(vendor);
        return mapToResponse(updated);
    }

    @Override
    public void deleteVendor(Long id) {
        Vendor vendor = vendorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vendor not found with id: " + id));

        vendor.setActive(false);
        vendorRepository.save(vendor);
    }

    @Override
    public List<VendorResponse> getAllVendors() {
        return vendorRepository.findAll().stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public List<VendorResponse> getAllActiveVendors() {
        return vendorRepository.findByActiveTrue().stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public VendorResponse getVendorById(Long id) {
        Vendor vendor = vendorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vendor not found with id: " + id));

        return mapToResponse(vendor);
    }

    @Override
    public VendorResponse getActiveVendorById(Long id) {
        Vendor vendor = vendorRepository.findByIdAndActiveTrue(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vendor not found with id: " + id));

        return mapToResponse(vendor);
    }

    private void applyRequest(Vendor vendor, VendorRequest request) {
        vendor.setName(request.getName());
        vendor.setServiceType(request.getServiceType());
        vendor.setContactPerson(request.getContactPerson());
        vendor.setPhone(request.getPhone());
        vendor.setEmail(request.getEmail());
        vendor.setPrice(request.getPrice());

        if (request.getIsActive() != null) {
            vendor.setActive(request.getIsActive());
        }
    }

    private VendorResponse mapToResponse(Vendor vendor) {
        return new VendorResponse(
                vendor.getId(),
                vendor.getName(),
                vendor.getServiceType(),
                vendor.getContactPerson(),
                vendor.getPhone(),
                vendor.getEmail(),
                vendor.getPrice(),
                vendor.getActive(),
                vendor.getCreatedAt(),
                vendor.getUpdatedAt()
        );
    }
}
