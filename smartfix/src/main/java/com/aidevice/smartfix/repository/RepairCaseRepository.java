package com.aidevice.smartfix.repository;

import com.aidevice.smartfix.model.RepairCase;
import com.aidevice.smartfix.model.RepairTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface RepairCaseRepository extends JpaRepository<RepairCase, Long> {

    Optional<RepairCase> findByRepairTicket_Id(Long repairTicketId);
    
    Optional<RepairCase> findByRepairTicket(RepairTask repairTicket);

    List<RepairCase> findTop300ByRepairStatusIgnoreCaseOrderByRepairDateDesc(String repairStatus);

    List<RepairCase> findTop300ByRepairStatusIgnoreCaseAndDeviceTypeIgnoreCaseOrderByRepairDateDesc(
            String repairStatus, String deviceType);

    long countByRepairStatusIgnoreCase(String repairStatus);
    
    // New methods for AI Assistant
    
    List<RepairCase> findByDeviceTypeAndBrand(String deviceType, String brand);
    
    List<RepairCase> findByDeviceTypeAndBrandAndModelOrderByRepairDateDesc(
            String deviceType, String brand, String model);
    
    long countByDeviceType(String deviceType);
    
    long countByRepairStatus(String repairStatus);
    
    long countByReturnedAfterRepair(boolean returned);
    
    @Query("SELECT rc FROM RepairCase rc WHERE rc.deviceType = :deviceType " +
           "AND (:brand IS NULL OR rc.brand = :brand) " +
           "ORDER BY rc.repairDate DESC")
    List<RepairCase> findByDeviceTypeAndOptionalBrand(
            @Param("deviceType") String deviceType,
            @Param("brand") String brand);
}
