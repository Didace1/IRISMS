package com.aidevice.smartfix.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * DTOs for Sales Rep-Driven Repair Task Workflow
 * Simplified workflow between Sales Rep and Technician only
 */
public class RepairTaskDtos {

    /**
     * DTO for Sales Rep to create and assign a repair task
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateAndAssignTaskDTO {
        private String customerName;
        private String customerEmail;
        private String customerPhone;
        private String deviceType;
        
        private String deviceBrand;
        private String deviceModel;
        
        private String repairNote;
        
        private Long technicianId;
    }

    /**
     * DTO for Technician to complete a repair
     * Simple: just action and result
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CompleteRepairDTO {
        private String repairAction;
        
        private String repairResult;
        
        private Integer repairDurationMinutes; // Optional
    }

    /**
     * DTO for Technician to escalate a task to Sales Rep
     * SUPER SIMPLE: just one field - the reason
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class EscalateTaskDTO {
        @NotBlank(message = "Escalation reason is required")
        private String reason;
    }

    /**
     * DTO for Sales Rep to record customer feedback
     * SIMPLE: satisfied yes/no + optional comments
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RecordFeedbackDTO {
        @NotNull(message = "Customer satisfaction status is required")
        private Boolean satisfied;
        
        private String comments; // Optional
    }

    /**
     * DTO for Sales Rep to reassign a task to different technician
     * SIMPLE: new technician + optional reason
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ReassignTaskDTO {
        @NotNull(message = "New technician ID is required")
        private Long newTechnicianId;
        
        private String reason; // Optional
    }

    /**
     * Response DTO for repair task details
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RepairTaskResponse {
        private Long id;
        private String customerName;
        private String customerEmail;
        private String customerPhone;
        private String deviceType;
        private String deviceBrand;
        private String deviceModel;
        private String repairNote;
        private String status;
        
        // Sales Rep info
        private Long createdBySalesRepId;
        private String createdBySalesRepName;
        
        // Technician info
        private Long assignedTechnicianId;
        private String assignedTechnicianName;
        
        // Timestamps
        private LocalDateTime createdAt;
        private LocalDateTime assignedAt;
        private LocalDateTime startedAt;
        private LocalDateTime completedAt;
        
        // Work details (when completed)
        private String repairAction;
        private String repairResult;
        private Integer repairDurationMinutes;
        
        // Escalation info
        private Boolean isEscalated;
        private String escalationNote;
        private LocalDateTime escalatedAt;
        
        // Feedback (when closed)
        private Boolean customerSatisfied;
        private String customerFeedback;
    }

    /**
     * Simple response for create/update operations
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TaskOperationResponse {
        private Long taskId;
        private String status;
        private String message;
        private Boolean success;
    }
}
