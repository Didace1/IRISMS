package com.aidevice.smartfix.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "inventory_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class InventoryItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @ManyToOne(fetch = FetchType.EAGER, cascade = CascadeType.MERGE)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @Column(nullable = false)
    private Integer quantity;

    @Column(nullable = false)
    private Integer reorderPoint;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    // Purchase cost per unit (kept hidden from sales UI)
    @Column(precision = 10, scale = 2)
    private BigDecimal purchaseCost;

    @Column
    private String supplier;

    @Column(unique = true)
    private String sku;

    @Column
    private String serialNumber;

    @Column
    private String description;

    @Column
    private String brand;

    @Column
    private String model;

    @Column
    private String imageUrl;

    @Column
    private LocalDateTime createdAt;

    @Column
    private LocalDateTime updatedAt;

    @Column
    private LocalDateTime lastStockedAt;

    @PrePersist
    void prePersist() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (updatedAt == null) updatedAt = LocalDateTime.now();
        if (lastStockedAt == null) lastStockedAt = LocalDateTime.now();
        // Don't set purchaseCost to ZERO - let it remain null if not provided
        // This allows the service layer to handle the default value properly
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
