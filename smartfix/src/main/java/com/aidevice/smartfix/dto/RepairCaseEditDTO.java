package com.aidevice.smartfix.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for editing/correcting repair cases
 * Allows admins to fix technician entries
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RepairCaseEditDTO {
    
    private Long caseId;
    
    // Editable fields (manual entries, no AI)
    private String deviceType;
    private String brand;
    private String model;
    private String repairAction; // What the technician did
    private String repairResult; // Outcome of the repair
    private String repairStatus; // COMPLETED, etc.
    private Boolean returnedAfterRepair;
    private Integer repairDurationMinutes;
    private String technicianNotes;
    
    // Edit metadata
    private Long editedByAdminId;
    private String editReason;
}
