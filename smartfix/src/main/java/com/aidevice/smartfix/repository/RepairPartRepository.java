package com.aidevice.smartfix.repository;

import com.aidevice.smartfix.model.RepairPart;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RepairPartRepository extends JpaRepository<RepairPart, Long> {
    List<RepairPart> findByRepairTaskId(Long repairTaskId);
    List<RepairPart> findByInventoryItemId(Long inventoryItemId);
}
