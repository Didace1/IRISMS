package com.aidevice.smartfix.dto;

import java.math.BigDecimal;

public class InventoryDtos {
    public record InventoryItemRequest(
            String name,
            String category,
            Integer quantity,
            Integer reorderPoint,
            BigDecimal price,
            BigDecimal purchaseCost,
            String supplier,
            String lastStockedAt,
            String description,
            String brand,
            String model
    ) {}
}
