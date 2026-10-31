package com.aidevice.smartfix.service;

import com.aidevice.smartfix.dto.RepairCompletionDTO;
import com.aidevice.smartfix.model.RepairCase;
import com.aidevice.smartfix.model.RepairTask;
import com.aidevice.smartfix.repository.RepairCaseRepository;
import com.aidevice.smartfix.repository.RepairTaskRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

/**
 * Service for handling repair completion
 * Creates RepairCase for AI learning and tracks performance
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RepairCompletionService {

    private final RepairTaskRepository repairTaskRepository;
    private final RepairCaseRepository repairCaseRepository;

    @Transactional
    public RepairCase completeRepair(RepairCompletionDTO dto) {
        log.info("Completing repair task #{}", dto.getRepairTaskId());

        // 1. Get the repair task
        RepairTask task = repairTaskRepository.findById(dto.getRepairTaskId())
                .orElseThrow(() -> new RuntimeException("Repair task not found"));

        // 2. Update task status
        task.setStatus("COMPLETED");
        task.setCompletedAt(LocalDateTime.now());
        repairTaskRepository.save(task);

        // 3. Calculate repair duration
        Integer durationMinutes = null;
        if (task.getStartedAt() != null && task.getCompletedAt() != null) {
            durationMinutes = (int) ChronoUnit.MINUTES.between(
                    task.getStartedAt(), 
                    task.getCompletedAt()
            );
        }

        // 4. Create RepairCase for manual repair tracking (no AI)
        RepairCase repairCase = RepairCase.builder()
                .repairTicket(task)
                .deviceType(task.getDeviceType())
                .brand(extractBrand(task.getDeviceModel()))
                .model(task.getDeviceModel())
                .repairAction(dto.getRepairAction() != null ? dto.getRepairAction() : "Repair completed")
                .repairResult(dto.getRepairResult() != null ? dto.getRepairResult() : "Successful")
                .repairStatus("COMPLETED")
                .returnedAfterRepair(!dto.getCustomerSatisfied())
                .repairDurationMinutes(durationMinutes)
                .technicianNotes(dto.getDetailedNotes())
                .technician(task.getAssignedTechnician())
                .repairDate(LocalDateTime.now())
                .build();

        repairCase = repairCaseRepository.save(repairCase);
        
        log.info("Repair case #{} created for performance tracking", repairCase.getCaseId());
        
        return repairCase;
    }

    private String extractBrand(String deviceModel) {
        if (deviceModel == null) return "Unknown";
        
        // Simple brand extraction - first word
        String[] parts = deviceModel.split("\\s+");
        return parts.length > 0 ? parts[0] : "Unknown";
    }
}
