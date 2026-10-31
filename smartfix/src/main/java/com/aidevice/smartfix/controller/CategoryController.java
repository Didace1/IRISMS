package com.aidevice.smartfix.controller;

import com.aidevice.smartfix.model.Category;
import com.aidevice.smartfix.repository.CategoryRepository;
import com.aidevice.smartfix.repository.InventoryItemRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    private final CategoryRepository categoryRepository;
    private final InventoryItemRepository inventoryItemRepository;

    public CategoryController(CategoryRepository categoryRepository,
                               InventoryItemRepository inventoryItemRepository) {
        this.categoryRepository = categoryRepository;
        this.inventoryItemRepository = inventoryItemRepository;
    }

    @GetMapping
    public List<Map<String, Object>> getAll() {
        return categoryRepository.findAll().stream().map(cat -> {
            long usageCount = inventoryItemRepository.countByCategory_Id(cat.getId());
            return Map.<String, Object>of(
                    "id", cat.getId(),
                    "name", cat.getName(),
                    "description", cat.getDescription() != null ? cat.getDescription() : "",
                    "createdAt", cat.getCreatedAt() != null ? cat.getCreatedAt().toString() : "",
                    "itemCount", usageCount
            );
        }).toList();
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String, String> body) {
        String name = body.getOrDefault("name", "").trim();
        if (name.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Category name is required"));
        }
        if (categoryRepository.findByNameIgnoreCase(name).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "Category already exists"));
        }
        Category cat = new Category();
        cat.setName(name);
        cat.setDescription(body.getOrDefault("description", "").trim());
        return ResponseEntity.ok(categoryRepository.save(cat));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody Map<String, String> body) {
        Category cat = categoryRepository.findById(id).orElse(null);
        if (cat == null) return ResponseEntity.notFound().build();
        String name = body.getOrDefault("name", "").trim();
        if (!name.isEmpty()) cat.setName(name);
        if (body.containsKey("description")) cat.setDescription(body.get("description").trim());
        return ResponseEntity.ok(categoryRepository.save(cat));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        if (!categoryRepository.existsById(id)) return ResponseEntity.notFound().build();
        categoryRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Category deleted"));
    }
}
