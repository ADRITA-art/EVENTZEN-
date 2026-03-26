package com.adrita.eventzen.service;

import com.adrita.eventzen.dto.EventVendorAttachRequest;
import com.adrita.eventzen.dto.EventVendorResponse;

import java.util.List;

public interface EventVendorService {

    List<EventVendorResponse> attachVendors(Long eventId, EventVendorAttachRequest request);

    List<EventVendorResponse> getVendorsByEvent(Long eventId);

    void removeVendorFromEvent(Long eventId, Long vendorId);
}
