package com.aidevice.smartfix.repository;

import com.aidevice.smartfix.model.InventoryItem;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface InventoryItemRepository extends JpaRepository<InventoryItem, Long> {
    Optional<InventoryItem> findBySku(String sku);
    
    // Search methods
    Page<InventoryItem> findByNameContainingIgnoreCase(String name, Pageable pageable);
    
    @Query("SELECT i FROM InventoryItem i WHERE LOWER(i.name) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR LOWER(i.description) LIKE LOWER(CONCAT('%', :searchTerm, '%'))")
    Page<InventoryItem> findBySearchTerm(@Param("searchTerm") String searchTerm, Pageable pageable);
    
    @Query("SELECT i FROM InventoryItem i JOIN i.category c WHERE LOWER(c.name) LIKE LOWER(CONCAT('%', :category, '%'))")
    Page<InventoryItem> findByCategoryNameContainingIgnoreCase(@Param("category") String category, Pageable pageable);
    
    // Low stock items
    @Query("SELECT i FROM InventoryItem i WHERE i.quantity <= i.reorderPoint")
    List<InventoryItem> findLowStockItems();

    @Query("SELECT DISTINCT i FROM InventoryItem i JOIN FETCH i.category")
    List<InventoryItem> findAllWithCategory();

    long countByCategory_Id(Long categoryId);
}
