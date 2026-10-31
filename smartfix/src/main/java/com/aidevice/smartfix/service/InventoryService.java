package com.aidevice.smartfix.service;

import com.aidevice.smartfix.dto.InventoryDtos;
import com.aidevice.smartfix.model.Category;
import com.aidevice.smartfix.model.InventoryItem;
import com.aidevice.smartfix.model.Sale;
import com.aidevice.smartfix.model.SaleItem;
import com.aidevice.smartfix.repository.CategoryRepository;
import com.aidevice.smartfix.repository.InventoryItemRepository;
import com.aidevice.smartfix.repository.SaleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.time.LocalDateTime;
import java.time.LocalDate;
import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class InventoryService {
    private final InventoryItemRepository inventoryRepository;
    private final CategoryRepository categoryRepository;
    private final SaleRepository saleRepository;
    


    public InventoryService(
            InventoryItemRepository inventoryRepository,
            CategoryRepository categoryRepository,
            SaleRepository saleRepository
    ) {
        this.inventoryRepository = inventoryRepository;
        this.categoryRepository = categoryRepository;
        this.saleRepository = saleRepository;
    }

    public List<InventoryItem> getAll() {
        return inventoryRepository.findAllWithCategory();
    }

    public Map<String, Object> getAnalytics(int periodDays) {
        List<InventoryItem> items = inventoryRepository.findAllWithCategory();
        LocalDate end = LocalDate.now();
        LocalDate start = end.minusDays(Math.max(1, periodDays) - 1L);
        List<Sale> salesInRange = saleRepository.findByCreatedAtBetween(start.atStartOfDay(), end.plusDays(1).atStartOfDay());

        Map<String, Integer> stockTrend = new LinkedHashMap<>();
        Map<String, Integer> stockInTrend = new LinkedHashMap<>();
        Map<String, Integer> stockOutTrend = new LinkedHashMap<>();
        Map<String, BigDecimal> valueTrend = new LinkedHashMap<>();
        for (LocalDate day = start; !day.isAfter(end); day = day.plusDays(1)) {
            String key = day.toString();
            stockTrend.put(key, 0);
            stockInTrend.put(key, 0);
            stockOutTrend.put(key, 0);
            valueTrend.put(key, BigDecimal.ZERO);
        }

        for (InventoryItem item : items) {
            if (item.getLastStockedAt() != null) {
                LocalDate stockDate = item.getLastStockedAt().toLocalDate();
                if (!stockDate.isBefore(start) && !stockDate.isAfter(end)) {
                    String key = stockDate.toString();
                    int quantity = Math.max(0, item.getQuantity() == null ? 0 : item.getQuantity());
                    stockTrend.put(key, stockTrend.getOrDefault(key, 0) + quantity);
                    stockInTrend.put(key, stockInTrend.getOrDefault(key, 0) + quantity);

                    BigDecimal unitCost = item.getPurchaseCost() != null ? item.getPurchaseCost() : item.getPrice();
                    BigDecimal inValue = (unitCost == null ? BigDecimal.ZERO : unitCost).multiply(BigDecimal.valueOf(quantity));
                    valueTrend.put(key, valueTrend.getOrDefault(key, BigDecimal.ZERO).add(inValue));
                }
            }
        }

        for (Sale sale : salesInRange) {
            if (sale.getCreatedAt() == null) continue;
            String key = sale.getCreatedAt().toLocalDate().toString();
            int soldUnits = 0;
            BigDecimal soldValue = BigDecimal.ZERO;
            if (sale.getItems() != null) {
                for (SaleItem item : sale.getItems()) {
                    int qty = item.getQuantity() == null ? 0 : item.getQuantity();
                    soldUnits += qty;
                    BigDecimal unitPrice = item.getUnitPrice() == null ? BigDecimal.ZERO : item.getUnitPrice();
                    soldValue = soldValue.add(unitPrice.multiply(BigDecimal.valueOf(qty)));
                }
            }
            stockOutTrend.put(key, stockOutTrend.getOrDefault(key, 0) + soldUnits);
            valueTrend.put(key, valueTrend.getOrDefault(key, BigDecimal.ZERO).subtract(soldValue));
        }

        Map<String, Integer> categoryCounts = new LinkedHashMap<>();
        Map<String, BigDecimal> categoryValue = new LinkedHashMap<>();
        for (InventoryItem item : items) {
            String categoryName = (item.getCategory() == null) ? "Uncategorized" : item.getCategory().getName();
            categoryCounts.put(categoryName, categoryCounts.getOrDefault(categoryName, 0) + 1);
            BigDecimal unitCost = item.getPurchaseCost() != null ? item.getPurchaseCost() : item.getPrice();
            BigDecimal value = (unitCost == null ? BigDecimal.ZERO : unitCost).multiply(BigDecimal.valueOf(item.getQuantity() == null ? 0 : item.getQuantity()));
            categoryValue.put(categoryName, categoryValue.getOrDefault(categoryName, BigDecimal.ZERO).add(value));
        }

        long lowStockCount = items.stream()
                .filter(i -> i.getQuantity() != null && i.getReorderPoint() != null && i.getQuantity() <= i.getReorderPoint())
                .count();

        var lowStockTop = items.stream()
                .filter(i -> i.getQuantity() != null && i.getReorderPoint() != null && i.getQuantity() <= i.getReorderPoint())
                .sorted((a, b) -> Integer.compare(a.getQuantity(), b.getQuantity()))
                .limit(5)
                .map(i -> Map.<String, Object>of(
                        "name", i.getName(),
                        "category", i.getCategory() != null ? i.getCategory().getName() : "Uncategorized",
                        "quantity", i.getQuantity(),
                        "reorderPoint", i.getReorderPoint()
                ))
                .collect(Collectors.toList());

        return Map.of(
                "periodDays", periodDays,
                "stockTrend", stockTrend.entrySet().stream()
                        .map(e -> Map.of("date", e.getKey(), "stock", e.getValue()))
                        .toList(),
                "stockFlowTrend", stockTrend.keySet().stream()
                        .map(date -> Map.<String, Object>of(
                                "date", date,
                                "stockIn", stockInTrend.getOrDefault(date, 0),
                                "stockOut", stockOutTrend.getOrDefault(date, 0)
                        ))
                        .toList(),
                "valueTrend", valueTrend.entrySet().stream()
                        .map(e -> Map.<String, Object>of("date", e.getKey(), "netValueChange", e.getValue()))
                        .toList(),
                "categoryDistribution", categoryCounts.entrySet().stream()
                        .map(e -> Map.of("name", e.getKey(), "value", e.getValue()))
                        .toList(),
                "categoryValue", categoryValue.entrySet().stream()
                        .map(e -> Map.of("name", e.getKey(), "value", e.getValue()))
                        .toList(),
                "lowStockCount", lowStockCount,
                "lowStockTop", lowStockTop
        );
    }

    @Transactional
    public InventoryItem create(InventoryDtos.InventoryItemRequest request) {
        // Log the incoming request for debugging
        System.out.println("Creating inventory item with category: '" + request.category() + "'");
        
        // Validate and ensure category exists
        Category resolvedCategory = ensureCategoryExists(request.category());
        System.out.println("Category resolved: " + (resolvedCategory != null ? resolvedCategory.getName() + " (ID: " + resolvedCategory.getId() + ")" : "NULL"));
        
        if (resolvedCategory == null || resolvedCategory.getId() == null) {
            throw new IllegalArgumentException("Category cannot be null and must have an ID");
        }
        
        // Refresh the category to ensure it's attached to the current session
        final Category category = categoryRepository.findById(resolvedCategory.getId())
                .orElseThrow(() -> new IllegalArgumentException("Category not found with ID: " + resolvedCategory.getId()));
        
        InventoryItem item = new InventoryItem();
        item.setName(request.name());
        item.setCategory(category);  // Set the managed category
        item.setQuantity(request.quantity() == null ? 0 : request.quantity());
        item.setReorderPoint(request.reorderPoint() == null ? 3 : request.reorderPoint());
        item.setPrice(request.price());
        item.setPurchaseCost(request.purchaseCost() == null ? BigDecimal.ZERO : request.purchaseCost());
        item.setSupplier(request.supplier() == null ? "" : request.supplier());
        item.setSku(generateSku(request.category()));
        if (request.description() != null) {
            item.setDescription(request.description());
        }
        if (request.brand() != null) {
            item.setBrand(request.brand());
        }
        if (request.model() != null) {
            item.setModel(request.model());
        }
        
        // Set last stocked date
        if (request.lastStockedAt() != null && !request.lastStockedAt().isBlank()) {
            try {
                LocalDate date = LocalDate.parse(request.lastStockedAt());
                item.setLastStockedAt(date.atStartOfDay());
            } catch (Exception e) {
                item.setLastStockedAt(LocalDateTime.now());
            }
        } else {
            item.setLastStockedAt(LocalDateTime.now());
        }
        
        // Verify category is set before saving
        if (item.getCategory() == null || item.getCategory().getId() == null) {
            throw new IllegalStateException("Category must be set with valid ID before saving inventory item");
        }
        
        System.out.println("About to save item with category ID: " + item.getCategory().getId());
        
        // Save the item first to get an ID
        InventoryItem savedItem = inventoryRepository.save(item);
        
        return savedItem;
    }
    
    @Transactional
    public InventoryItem update(Long id, InventoryDtos.InventoryItemRequest request) {
        InventoryItem item = inventoryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Inventory item not found"));
        
        Category category = ensureCategoryExists(request.category());
        int oldQuantity = item.getQuantity() == null ? 0 : item.getQuantity();
        
        item.setName(request.name());
        item.setCategory(category);
        item.setQuantity(request.quantity());
        item.setReorderPoint(request.reorderPoint());
        item.setPrice(request.price());
        item.setPurchaseCost(request.purchaseCost() == null ? item.getPurchaseCost() : request.purchaseCost());
        
        if (request.supplier() != null) {
            item.setSupplier(request.supplier());
        }
        if (request.description() != null) {
            item.setDescription(request.description());
        }
        if (request.brand() != null) {
            item.setBrand(request.brand());
        }
        if (request.model() != null) {
            item.setModel(request.model());
        }
        
        // Update lastStockedAt when an explicit date is provided or when quantity increased
        if (request.lastStockedAt() != null && !request.lastStockedAt().isBlank()) {
            try {
                LocalDate date = LocalDate.parse(request.lastStockedAt());
                item.setLastStockedAt(date.atStartOfDay());
            } catch (Exception e) {
                item.setLastStockedAt(LocalDateTime.now());
            }
        } else if (request.quantity() != null && request.quantity() > oldQuantity) {
            item.setLastStockedAt(LocalDateTime.now());
        }
        
        return inventoryRepository.save(item);
    }

    @Transactional
    public void delete(Long id) {
        inventoryRepository.deleteById(id);
    }

    private String generateSku(String categoryName) {
        String base = (categoryName == null || categoryName.isBlank()) ? "GEN" : categoryName.substring(0, Math.min(3, categoryName.length())).toUpperCase();
        
        // Use timestamp + random number to ensure uniqueness
        long timestamp = System.currentTimeMillis() % 100000; // Last 5 digits of timestamp
        int random = (int) (Math.random() * 1000); // Random 3-digit number
        
        String sku = base + "-" + timestamp + "-" + random;
        
        // Double-check for uniqueness (very unlikely to collide, but just in case)
        int attempt = 0;
        while (inventoryRepository.findBySku(sku).isPresent() && attempt < 10) {
            random = (int) (Math.random() * 1000);
            sku = base + "-" + timestamp + "-" + random;
            attempt++;
        }
        
        System.out.println("Generated SKU: " + sku);
        return sku;
    }

    private Category ensureCategoryExists(String categoryName) {
        if (categoryName == null || categoryName.isBlank()) {
            // Return a default category or create one
            return categoryRepository.findByNameIgnoreCase("General").orElseGet(() -> {
                Category category = new Category();
                category.setName("General");
                category.setDescription("Default category");
                return categoryRepository.save(category);
            });
        }
        
        return categoryRepository.findByNameIgnoreCase(categoryName).orElseGet(() -> {
            Category category = new Category();
            category.setName(categoryName.trim());
            category.setDescription("Auto-created from inventory item");
            return categoryRepository.save(category);
        });
    }
}
