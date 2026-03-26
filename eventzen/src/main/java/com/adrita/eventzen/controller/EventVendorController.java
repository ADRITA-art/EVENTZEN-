package com.adrita.eventzen.controller;

import com.adrita.eventzen.dto.EventVendorAttachRequest;
import com.adrita.eventzen.dto.EventVendorResponse;
import com.adrita.eventzen.service.EventVendorService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/events")
public class EventVendorController {

    private final EventVendorService eventVendorService;

    public EventVendorController(EventVendorService eventVendorService) {
        this.eventVendorService = eventVendorService;
    }

    @PostMapping("/{eventId}/vendors")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<EventVendorResponse>> attachVendors(@PathVariable Long eventId,
                                                                   @Valid @RequestBody EventVendorAttachRequest request) {
        return ResponseEntity.ok(eventVendorService.attachVendors(eventId, request));
    }

    @GetMapping("/{eventId}/vendors")
    public ResponseEntity<List<EventVendorResponse>> getVendorsByEvent(@PathVariable Long eventId) {
        return ResponseEntity.ok(eventVendorService.getVendorsByEvent(eventId));
    }

    @DeleteMapping("/{eventId}/vendors/{vendorId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> removeVendorFromEvent(@PathVariable Long eventId,
                                                         @PathVariable Long vendorId) {
        eventVendorService.removeVendorFromEvent(eventId, vendorId);
        return ResponseEntity.ok("Vendor removed from event successfully");
    }
}
