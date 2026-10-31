package com.aidevice.smartfix.repository;

import com.aidevice.smartfix.model.RepairCasePart;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface RepairCasePartRepository extends JpaRepository<RepairCasePart, Long> {

    @Query("SELECT p FROM RepairCasePart p WHERE p.repairCase.caseId IN :ids")
    List<RepairCasePart> findByRepairCaseIds(@Param("ids") List<Long> ids);
}
