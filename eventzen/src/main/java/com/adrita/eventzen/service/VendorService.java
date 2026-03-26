package com.adrita.eventzen.service;

import com.adrita.eventzen.dto.VendorRequest;
import com.adrita.eventzen.dto.VendorResponse;

import java.util.List;

public interface VendorService {

    VendorResponse createVendor(VendorRequest request);

    VendorResponse updateVendor(Long id, VendorRequest request);

    void deleteVendor(Long id);

    List<VendorResponse> getAllVendors();

    VendorResponse getVendorById(Long id);
}
