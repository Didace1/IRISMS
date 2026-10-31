package com.aidevice.smartfix.repository;

import com.aidevice.smartfix.model.CustomerProductRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;

@Repository
public interface CustomerProductRequestRepository extends JpaRepository<CustomerProductRequest, Long> {
    
    // Find all requests for a specific product name (case-insensitive)
    List<CustomerProductRequest> findByProductNameContainingIgnoreCase(String productName);
    
    // Count requests by product name (case-insensitive)
    Long countByProductNameIgnoreCase(String productName);
    
    // Get all requests ordered by date (most recent first)
    List<CustomerProductRequest> findAllByOrderByRequestDateDesc();
    
    // Custom query to get product request counts
    @Query("SELECT r.productName, r.brand, COUNT(r) as requestCount, MIN(r.requestDate) as firstRequest, MAX(r.requestDate) as lastRequest " +
           "FROM CustomerProductRequest r " +
           "GROUP BY r.productName, r.brand " +
           "HAVING COUNT(r) >= :threshold " +
           "ORDER BY COUNT(r) DESC")
    List<Object[]> findTopRequestedProducts(int threshold);
    
    // Get all product request statistics
    @Query("SELECT r.productName, r.brand, COUNT(r) as requestCount, MIN(r.requestDate) as firstRequest, MAX(r.requestDate) as lastRequest " +
           "FROM CustomerProductRequest r " +
           "GROUP BY r.productName, r.brand " +
           "ORDER BY COUNT(r) DESC")
    List<Object[]> getRequestStatistics();
}
