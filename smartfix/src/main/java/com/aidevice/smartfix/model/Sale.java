package com.aidevice.smartfix.model;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "sales")
@Data
@NoArgsConstructor
@AllArgsConstructor
@NamedEntityGraph(
    name = "Sale.items",
    attributeNodes = @NamedAttributeNode("items")
)
@NamedEntityGraph(
    name = "Sale.withDetails",
    attributeNodes = @NamedAttributeNode(value = "items", subgraph = "sale-items-subgraph"),
    subgraphs = {
        @NamedSubgraph(
            name = "sale-items-subgraph",
            attributeNodes = @NamedAttributeNode(value = "inventoryItem", subgraph = "inventory-subgraph")
        ),
        @NamedSubgraph(
            name = "inventory-subgraph",
            attributeNodes = @NamedAttributeNode("category")
        )
    }
)
public class Sale {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String customerName;

    private String customerEmail;
    private String customerPhone;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal total;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "sale", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<SaleItem> items = new ArrayList<>();
}
