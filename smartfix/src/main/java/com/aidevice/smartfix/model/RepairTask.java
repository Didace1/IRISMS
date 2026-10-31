package com.aidevice.smartfix.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "repair_tasks")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RepairTask {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String customerName;
    private String customerEmail;
    private String customerPhone;
    private String customerRef;

    // Device info stored directly (no foreign key to devices table)
    private String deviceType;
    private String deviceBrand;
    private String deviceModel;

    @Column(columnDefinition = "TEXT")
    private String repairNote;

    @Column(columnDefinition = "TEXT")
    private String escalationNote;

    // Sales Rep Ownership
    @ManyToOne
    @JoinColumn(name = "created_by_sales_rep_id")
    private User createdBySalesRep;

    @ManyToOne
    @JoinColumn(name = "technician_id")
    private User assignedTechnician;

    @Column(nullable = false)
    private String status; // PENDING, ASSIGNED, IN_PROGRESS, COMPLETED, ESCALATED, CLOSED

    // Timestamps
    @Column(nullable = false)
    private LocalDateTime createdAt;

    private LocalDateTime assignedAt;
    
    private LocalDateTime startedAt;
    
    private LocalDateTime completedAt;

    // Technician Work Details
    @Column(columnDefinition = "TEXT")
    private String repairAction;
    
    @Column(columnDefinition = "TEXT")
    private String repairResult;
    
    private Integer repairDurationMinutes;

    // Customer Feedback (recorded by Sales Rep)
    private Boolean customerSatisfied;
    
    @Column(columnDefinition = "TEXT")
    private String customerFeedback;

    // Simple Escalation (Sales Rep <-> Technician)
    private LocalDateTime escalatedAt;
    
    private Boolean isEscalated = false;

    @PrePersist
    void prePersist() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (status == null) status = "PENDING";
        if (isEscalated == null) isEscalated = false;
    }
}
