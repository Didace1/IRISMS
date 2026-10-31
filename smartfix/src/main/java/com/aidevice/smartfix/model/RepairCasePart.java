package com.aidevice.smartfix.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "repair_case_parts")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RepairCasePart {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "case_id", nullable = false)
    private RepairCase repairCase;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inventory_item_id")
    private InventoryItem inventoryItem;

    @Column(name = "part_name", nullable = false, length = 255)
    private String partName;

    @Column(nullable = false)
    @Builder.Default
    private Integer quantity = 1;

    @Column(name = "was_replacement", nullable = false)
    @Builder.Default
    private boolean wasReplacement = true;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void prePersist() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (quantity == null) quantity = 1;
    }
}
