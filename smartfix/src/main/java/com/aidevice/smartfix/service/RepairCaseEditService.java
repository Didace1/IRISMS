package com.aidevice.smartfix.service;

import com.aidevice.smartfix.dto.RepairCaseEditDTO;
import com.aidevice.smartfix.model.RepairCase;
import com.aidevice.smartfix.repository.RepairCaseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service for editing/correcting repair cases
 * Allows admins to fix technician mistakes
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RepairCaseEditService {

    private final RepairCaseRepository repairCaseRepository;

    /**
     * Edit/correct a repair case
     * Only admins should be able to do this
     */
    @Transactional
    public RepairCase editRepairCase(RepairCaseEditDTO dto) {
        log.info("Editing repair case #{} by admin #{}", dto.getCaseId(), dto.getEditedByAdminId());

        RepairCase repairCase = repairCaseRepository.findById(dto.getCaseId())
                .orElseThrow(() -> new RuntimeException("Repair case not found"));

        // Update editable fields
        if (dto.getDeviceType() != null) {
            repairCase.setDeviceType(dto.getDeviceType());
        }
        if (dto.getBrand() != null) {
            repairCase.setBrand(dto.getBrand());
        }
        if (dto.getModel() != null) {
            repairCase.setModel(dto.getModel());
        }
        if (dto.getRepairAction() != null) {
            repairCase.setRepairAction(dto.getRepairAction());
        }
        if (dto.getRepairResult() != null) {
            repairCase.setRepairResult(dto.getRepairResult());
        }
        if (dto.getRepairStatus() != null) {
            repairCase.setRepairStatus(dto.getRepairStatus());
        }
        if (dto.getReturnedAfterRepair() != null) {
            repairCase.setReturnedAfterRepair(dto.getReturnedAfterRepair());
        }
        if (dto.getRepairDurationMinutes() != null) {
            repairCase.setRepairDurationMinutes(dto.getRepairDurationMinutes());
        }
        if (dto.getTechnicianNotes() != null) {
            repairCase.setTechnicianNotes(dto.getTechnicianNotes());
        }

        // Track edit metadata
        repairCase.setEditedByAdminId(dto.getEditedByAdminId());
        repairCase.setEditReason(dto.getEditReason());
        
        // Increment edit count
        Integer currentCount = repairCase.getEditCount();
        repairCase.setEditCount(currentCount != null ? currentCount + 1 : 1);

        RepairCase saved = repairCaseRepository.save(repairCase);
        
        log.info("Repair case #{} edited successfully. Edit count: {}", 
                saved.getCaseId(), saved.getEditCount());
        
        return saved;
    }

    /**
     * Get repair case for editing
     */
    @Transactional(readOnly = true)
    public RepairCase getRepairCaseForEdit(Long caseId) {
        return repairCaseRepository.findById(caseId)
                .orElseThrow(() -> new RuntimeException("Repair case not found"));
    }

    /**
     * Delete a repair case (if completely wrong)
     */
    @Transactional
    public void deleteRepairCase(Long caseId, Long adminId, String deleteReason) {
        log.warn("Deleting repair case #{} by admin #{}. Reason: {}", 
                caseId, adminId, deleteReason);
        
        RepairCase repairCase = repairCaseRepository.findById(caseId)
                .orElseThrow(() -> new RuntimeException("Repair case not found"));
        
        repairCaseRepository.delete(repairCase);
        
        log.info("Repair case #{} deleted successfully", caseId);
    }
}
