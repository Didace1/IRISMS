package com.aidevice.smartfix.repository;

import com.aidevice.smartfix.model.RepairTask;
import com.aidevice.smartfix.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface RepairTaskRepository extends JpaRepository<RepairTask, Long> {
    List<RepairTask> findByStatus(String status);
    List<RepairTask> findByAssignedTechnicianId(Long technicianId);

    @Query("""
            SELECT DISTINCT t FROM RepairTask t
            LEFT JOIN FETCH t.assignedTechnician
            WHERE t.id = :id
            """)
    Optional<RepairTask> findWithAssociationsById(@Param("id") Long id);

    // New methods for Sales Rep-driven workflow
    List<RepairTask> findByCreatedBySalesRepOrderByCreatedAtDesc(User salesRep);
    List<RepairTask> findByCreatedBySalesRepAndStatusOrderByCreatedAtDesc(User salesRep, String status);
    List<RepairTask> findByAssignedTechnicianOrderByCreatedAtDesc(User technician);
    List<RepairTask> findByAssignedTechnicianAndStatusOrderByCreatedAtDesc(User technician, String status);
}
