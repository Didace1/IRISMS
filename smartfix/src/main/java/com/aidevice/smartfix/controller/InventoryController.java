package com.aidevice.smartfix.controller;

import com.aidevice.smartfix.dto.InventoryDtos;
import com.aidevice.smartfix.model.InventoryItem;
import com.aidevice.smartfix.service.InventoryService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/inventory")
public class InventoryController {
    private final InventoryService inventoryService;

    public InventoryController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    @GetMapping
    public List<InventoryItem> getAll() {
        return inventoryService.getAll();
    }

    @GetMapping("/analytics")
    public Map<String, Object> analytics(@RequestParam(defaultValue = "30") int periodDays) {
        return inventoryService.getAnalytics(periodDays);
    }

    @PostMapping
    public InventoryItem create(@RequestBody InventoryDtos.InventoryItemRequest request) {
        try {
            return inventoryService.create(request);
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage());
        } catch (org.springframework.dao.DataIntegrityViolationException ex) {
            // Handle unique constraint violations (e.g., duplicate SKU)
            String message = "Database constraint violation: ";
            if (ex.getMessage() != null && ex.getMessage().contains("sku")) {
                message += "Duplicate SKU detected. Please try again.";
            } else {
                message += ex.getMostSpecificCause().getMessage();
            }
            throw new ResponseStatusException(HttpStatus.CONFLICT, message);
        } catch (Exception ex) {
            // Log the full error for debugging
            ex.printStackTrace();
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, 
                "Failed to create inventory item: " + ex.getMessage());
        }
    }

    @PutMapping("/{id}")
    public InventoryItem update(@PathVariable Long id, @RequestBody InventoryDtos.InventoryItemRequest request) {
        try {
            return inventoryService.update(id, request);
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        inventoryService.delete(id);
    }
}
