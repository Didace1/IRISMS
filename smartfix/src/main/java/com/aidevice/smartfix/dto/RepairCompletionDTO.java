package com.aidevice.smartfix.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for capturing repair completion information
 * Manual technician workflow - no AI
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RepairCompletionDTO {
    
    // Required fields (simple and fast)
    private Long repairTaskId;
    private String repairAction; // What did you do? (e.g., "Replaced screen")
    private String repairResult; // What was the outcome? (e.g., "Working perfectly")
    private Boolean customerSatisfied; // true/false
    
    // Optional fields
    private String detailedNotes;
}
