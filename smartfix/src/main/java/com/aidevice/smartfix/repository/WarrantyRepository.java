package com.aidevice.smartfix.repository;

import com.aidevice.smartfix.model.Warranty;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WarrantyRepository extends JpaRepository<Warranty, Long> {
    List<Warranty> findByStatus(String status);
    List<Warranty> findByCustomerRef(String customerRef);
    List<Warranty> findBySerialNumber(String serialNumber);
}
