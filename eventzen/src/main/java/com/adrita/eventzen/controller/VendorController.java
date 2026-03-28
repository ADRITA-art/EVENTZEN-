package com.adrita.eventzen.controller;

import com.adrita.eventzen.dto.VendorRequest;
import com.adrita.eventzen.dto.VendorResponse;
import com.adrita.eventzen.entity.Role;
import com.adrita.eventzen.entity.User;
import com.adrita.eventzen.service.VendorService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/vendors")
public class VendorController {

    private final VendorService vendorService;

    public VendorController(VendorService vendorService) {
        this.vendorService = vendorService;
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<VendorResponse> createVendor(@Valid @RequestBody VendorRequest request) {
        return ResponseEntity.ok(vendorService.createVendor(request));
    }

    @GetMapping
    public ResponseEntity<List<VendorResponse>> getAllVendors(
            @AuthenticationPrincipal User user) {
        if (user.getRole() == Role.ADMIN) {
            return ResponseEntity.ok(vendorService.getAllVendors());
        }

        return ResponseEntity.ok(vendorService.getAllActiveVendors());
    }

    @GetMapping("/{id}")
    public ResponseEntity<VendorResponse> getVendorById(@PathVariable Long id,
                                                        @AuthenticationPrincipal User user) {
        if (user.getRole() == Role.ADMIN) {
            return ResponseEntity.ok(vendorService.getVendorById(id));
        }

        return ResponseEntity.ok(vendorService.getActiveVendorById(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<VendorResponse> updateVendor(@PathVariable Long id,
                                                       @Valid @RequestBody VendorRequest request) {
        return ResponseEntity.ok(vendorService.updateVendor(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> deleteVendor(@PathVariable Long id) {
        vendorService.deleteVendor(id);
        return ResponseEntity.ok("Vendor deleted successfully");
    }
}
