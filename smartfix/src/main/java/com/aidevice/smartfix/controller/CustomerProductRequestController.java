package com.aidevice.smartfix.controller;

import com.aidevice.smartfix.dto.CustomerProductRequestDTO;
import com.aidevice.smartfix.dto.ProductRequestStatDTO;
import com.aidevice.smartfix.model.CustomerProductRequest;
import com.aidevice.smartfix.service.CustomerProductRequestService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/customer-requests")
@CrossOrigin(origins = "*")
public class CustomerProductRequestController {

    @Autowired
    private CustomerProductRequestService requestService;

    /**
     * Record a new customer product request
     * POST /api/customer-requests/record
     */
    @PostMapping("/record")
    public ResponseEntity<Map<String, Object>> recordRequest(@RequestBody CustomerProductRequestDTO dto) {
        try {
            CustomerProductRequest request = requestService.recordRequest(dto);
            
            // Get current request count for this product
            Long requestCount = requestService.getRequestCount(dto.getProductName());
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Customer request recorded successfully");
            response.put("request", request);
            response.put("totalRequests", requestCount);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Failed to record request: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * Get all customer product requests
     * GET /api/customer-requests/all
     */
    @GetMapping("/all")
    public ResponseEntity<List<CustomerProductRequest>> getAllRequests() {
        List<CustomerProductRequest> requests = requestService.getAllRequests();
        return ResponseEntity.ok(requests);
    }

    /**
     * Get products requested above threshold (default 5)
     * GET /api/customer-requests/top-requested?threshold=5
     */
    @GetMapping("/top-requested")
    public ResponseEntity<List<ProductRequestStatDTO>> getTopRequestedProducts(
            @RequestParam(defaultValue = "5") int threshold) {
        List<ProductRequestStatDTO> topProducts = requestService.getTopRequestedProducts(threshold);
        return ResponseEntity.ok(topProducts);
    }

    /**
     * Get all product request statistics
     * GET /api/customer-requests/statistics
     */
    @GetMapping("/statistics")
    public ResponseEntity<Map<String, Object>> getStatistics() {
        List<ProductRequestStatDTO> stats = requestService.getRequestStatistics();
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("totalProducts", stats.size());
        response.put("statistics", stats);
        
        return ResponseEntity.ok(response);
    }

    /**
     * Get request count for a specific product
     * GET /api/customer-requests/count?productName=iPhone 15
     */
    @GetMapping("/count")
    public ResponseEntity<Map<String, Object>> getRequestCount(@RequestParam String productName) {
        Long count = requestService.getRequestCount(productName);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("productName", productName);
        response.put("requestCount", count);
        
        return ResponseEntity.ok(response);
    }
}
