package com.aidevice.smartfix.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "repair_parts")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RepairPart {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "repair_task_id", nullable = false)
    private RepairTask repairTask;

    @ManyToOne
    @JoinColumn(name = "item_id", nullable = false)
    private InventoryItem inventoryItem;

    @Column(nullable = false)
    private Integer quantityUsed;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void prePersist() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }
}
