package com.adrita.eventzen.service.impl;

import com.adrita.eventzen.dto.EventVendorAttachRequest;
import com.adrita.eventzen.dto.EventVendorItemRequest;
import com.adrita.eventzen.dto.EventVendorResponse;
import com.adrita.eventzen.entity.Event;
import com.adrita.eventzen.entity.EventVendor;
import com.adrita.eventzen.entity.Vendor;
import com.adrita.eventzen.exception.DuplicateResourceException;
import com.adrita.eventzen.exception.ResourceNotFoundException;
import com.adrita.eventzen.repository.EventRepository;
import com.adrita.eventzen.repository.EventVendorRepository;
import com.adrita.eventzen.repository.VendorRepository;
import com.adrita.eventzen.service.EventVendorService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class EventVendorServiceImpl implements EventVendorService {

    private final EventRepository eventRepository;
    private final VendorRepository vendorRepository;
    private final EventVendorRepository eventVendorRepository;

    public EventVendorServiceImpl(EventRepository eventRepository,
                                  VendorRepository vendorRepository,
                                  EventVendorRepository eventVendorRepository) {
        this.eventRepository = eventRepository;
        this.vendorRepository = vendorRepository;
        this.eventVendorRepository = eventVendorRepository;
    }

    @Override
    @Transactional
    public List<EventVendorResponse> attachVendors(Long eventId, EventVendorAttachRequest request) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with id: " + eventId));

        Set<Long> payloadVendorIds = new HashSet<>();
        for (EventVendorItemRequest item : request.getVendors()) {
            if (!payloadVendorIds.add(item.getVendorId())) {
                throw new DuplicateResourceException("Duplicate vendor in request: " + item.getVendorId());
            }

            Vendor vendor = vendorRepository.findById(item.getVendorId())
                    .orElseThrow(() -> new ResourceNotFoundException("Vendor not found with id: " + item.getVendorId()));

            if (eventVendorRepository.existsByEvent_IdAndVendor_Id(eventId, item.getVendorId())) {
                throw new DuplicateResourceException("Vendor already attached to this event: " + item.getVendorId());
            }

            EventVendor mapping = new EventVendor();
            mapping.setEvent(event);
            mapping.setVendor(vendor);
            mapping.setPurpose(item.getPurpose());
            mapping.setCost(item.getCost());
            eventVendorRepository.save(mapping);
        }

        return eventVendorRepository.findAllByEventIdWithVendor(eventId).stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public List<EventVendorResponse> getVendorsByEvent(Long eventId) {
        eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with id: " + eventId));

        return eventVendorRepository.findAllByEventIdWithVendor(eventId).stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    @Transactional
    public void removeVendorFromEvent(Long eventId, Long vendorId) {
        eventRepository.findById(eventId)
                .orElseThrow(() -> new ResourceNotFoundException("Event not found with id: " + eventId));

        EventVendor mapping = eventVendorRepository.findByEvent_IdAndVendor_Id(eventId, vendorId)
                .orElseThrow(() -> new ResourceNotFoundException("Vendor mapping not found for eventId " + eventId + " and vendorId " + vendorId));

        eventVendorRepository.delete(mapping);
    }

    private EventVendorResponse mapToResponse(EventVendor mapping) {
        Vendor vendor = mapping.getVendor();
        return new EventVendorResponse(
                mapping.getId(),
                vendor.getId(),
                vendor.getName(),
                vendor.getServiceType(),
                vendor.getContactPerson(),
                vendor.getPhone(),
                vendor.getEmail(),
                mapping.getPurpose(),
                mapping.getCost()
        );
    }
}
