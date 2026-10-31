package com.aidevice.smartfix.controller;

import com.aidevice.smartfix.model.InventoryItem;
import com.aidevice.smartfix.model.RepairPart;
import com.aidevice.smartfix.model.RepairTask;
import com.aidevice.smartfix.repository.InventoryItemRepository;
import com.aidevice.smartfix.repository.RepairPartRepository;
import com.aidevice.smartfix.repository.RepairTaskRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/repair-parts")
public class RepairPartController {
    private final RepairPartRepository repairPartRepository;
    private final RepairTaskRepository repairTaskRepository;
    private final InventoryItemRepository inventoryItemRepository;

    public RepairPartController(RepairPartRepository repairPartRepository,
                                 RepairTaskRepository repairTaskRepository,
                                 InventoryItemRepository inventoryItemRepository) {
        this.repairPartRepository = repairPartRepository;
        this.repairTaskRepository = repairTaskRepository;
        this.inventoryItemRepository = inventoryItemRepository;
    }

    @GetMapping
    public List<RepairPart> getAll() {
        return repairPartRepository.findAll();
    }

    @GetMapping("/repair/{repairTaskId}")
    public List<RepairPart> getByRepairTask(@PathVariable Long repairTaskId) {
        return repairPartRepository.findByRepairTaskId(repairTaskId);
    }

    @PostMapping
    @Transactional
    public RepairPart create(@RequestBody Map<String, Object> body) {
        Object repairTaskId = body.get("repairTaskId");
        Object itemId = body.get("itemId");
        Object qty = body.get("quantityUsed");

        if (repairTaskId == null || itemId == null || qty == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "repairTaskId, itemId, and quantityUsed are required");
        }

        int quantityUsed = Integer.parseInt(qty.toString());

        RepairTask task = repairTaskRepository.findById(Long.valueOf(repairTaskId.toString()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Repair task not found"));

        InventoryItem item = inventoryItemRepository.findById(Long.valueOf(itemId.toString()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Inventory item not found"));

        if (item.getQuantity() < quantityUsed) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Insufficient stock for " + item.getName());
        }

        item.setQuantity(item.getQuantity() - quantityUsed);
        inventoryItemRepository.save(item);

        RepairPart part = new RepairPart();
        part.setRepairTask(task);
        part.setInventoryItem(item);
        part.setQuantityUsed(quantityUsed);
        part.setCreatedAt(LocalDateTime.now());

        return repairPartRepository.save(part);
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> delete(@PathVariable Long id) {
        RepairPart part = repairPartRepository.findById(id).orElse(null);
        if (part == null) return ResponseEntity.notFound().build();

        InventoryItem item = part.getInventoryItem();
        item.setQuantity(item.getQuantity() + part.getQuantityUsed());
        inventoryItemRepository.save(item);

        repairPartRepository.delete(part);
        return ResponseEntity.ok(Map.of("message", "Repair part removed and stock restored"));
    }
}
