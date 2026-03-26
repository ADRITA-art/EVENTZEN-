package com.adrita.eventzen.repository;

import com.adrita.eventzen.entity.Vendor;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface VendorRepository extends JpaRepository<Vendor, Long> {

    List<Vendor> findByActiveTrue();
}
