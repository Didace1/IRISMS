package com.aidevice.smartfix.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "customer_product_requests")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CustomerProductRequest {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String productName;

    @Column
    private String brand;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "category_id")
    private Category category;

    @Column(nullable = false)
    private LocalDateTime requestDate;

    @PrePersist
    void prePersist() {
        if (requestDate == null) {
            requestDate = LocalDateTime.now();
        }
    }
}
