package com.aidevice.smartfix.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "warranties")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Warranty {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String deviceType;
    private String deviceModel;
    private String serialNumber;

    @Column(nullable = false)
    private LocalDate purchaseDate;

    @Column(nullable = false)
    private LocalDate expiryDate;

    private Integer warrantyMonths;

    @Column(nullable = false)
    private String status; // ACTIVE, EXPIRED, CLAIMED

    @ManyToOne
    @JoinColumn(name = "sale_id")
    private Sale sale;

    private String customerRef;

    private String customerName;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void prePersist() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (status == null) status = "ACTIVE";
    }
}
