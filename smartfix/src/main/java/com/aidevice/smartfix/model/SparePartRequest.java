package com.aidevice.smartfix.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "spare_part_requests")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SparePartRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String partName;

    @Column(nullable = false)
    private String deviceType;

    private String deviceModel;

    @Column(nullable = false)
    private Integer quantity;

    @Column(nullable = false)
    private String priority; // LOW, MEDIUM, HIGH, URGENT

    @Column(nullable = false)
    private String status; // PENDING, APPROVED, ORDERED, RECEIVED, REJECTED

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String justification;

    private String requestedBy;

    private String approvedBy;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    private LocalDateTime approvedAt;

    private LocalDateTime expectedDelivery;

    private Double estimatedCost;

    private String supplier;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (status == null) {
            status = "PENDING";
        }
        if (priority == null) {
            priority = "MEDIUM";
        }
    }
}