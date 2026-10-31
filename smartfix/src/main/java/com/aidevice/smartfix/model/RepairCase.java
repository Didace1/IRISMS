package com.aidevice.smartfix.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(
        name = "repair_cases",
        uniqueConstraints = @UniqueConstraint(name = "uk_repair_cases_ticket", columnNames = "repair_ticket_id"),
        indexes = {
                @Index(name = "idx_repair_cases_status", columnList = "repair_status"),
                @Index(name = "idx_repair_cases_repair_date", columnList = "repair_date"),
                @Index(name = "idx_repair_cases_device_type", columnList = "device_type"),
                @Index(name = "idx_repair_cases_brand", columnList = "brand"),
                @Index(name = "idx_repair_cases_returned", columnList = "returned_after_repair")
        }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RepairCase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "case_id")
    private Long caseId;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "repair_ticket_id", nullable = false)
    private RepairTask repairTicket;

    @Column(nullable = false, length = 100)
    private String deviceType;

    @Column(length = 100)
    private String brand;

    @Column(length = 200)
    private String model;

    // Manual technician entries - NO AI fields
    @Column(name = "repair_action", columnDefinition = "TEXT")
    private String repairAction; // What the technician did

    @Column(name = "repair_result", columnDefinition = "TEXT")
    private String repairResult; // Outcome of the repair

    @Column(name = "repair_status", nullable = false, length = 32)
    private String repairStatus;

    @Column(name = "returned_after_repair", nullable = false)
    private boolean returnedAfterRepair;

    @Column(name = "return_reason", columnDefinition = "TEXT")
    private String returnReason;

    @Column(name = "repair_duration_minutes")
    private Integer repairDurationMinutes;

    @Column(name = "technician_notes", columnDefinition = "TEXT")
    private String technicianNotes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "technician_id")
    private User technician;

    @Column(name = "repair_date", nullable = false)
    private LocalDateTime repairDate;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    
    @Column(name = "edited_by_admin_id")
    private Long editedByAdminId;
    
    @Column(name = "edit_reason", columnDefinition = "TEXT")
    private String editReason;
    
    @Column(name = "edit_count")
    private Integer editCount;

    @OneToMany(mappedBy = "repairCase", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<RepairCasePart> parts = new ArrayList<>();

    @PrePersist
    void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) createdAt = now;
        if (updatedAt == null) updatedAt = now;
        if (repairDate == null) repairDate = now;
        if (repairStatus == null) repairStatus = "COMPLETED";
        if (editCount == null) editCount = 0;
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
