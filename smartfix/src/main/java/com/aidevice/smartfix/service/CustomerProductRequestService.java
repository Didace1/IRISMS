package com.aidevice.smartfix.service;

import com.aidevice.smartfix.dto.CustomerProductRequestDTO;
import com.aidevice.smartfix.dto.ProductRequestStatDTO;
import com.aidevice.smartfix.model.Category;
import com.aidevice.smartfix.model.CustomerProductRequest;
import com.aidevice.smartfix.repository.CategoryRepository;
import com.aidevice.smartfix.repository.CustomerProductRequestRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class CustomerProductRequestService {

    @Autowired
    private CustomerProductRequestRepository requestRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    /**
     * Record a new customer product request
     */
    @Transactional
    public CustomerProductRequest recordRequest(CustomerProductRequestDTO dto) {
        CustomerProductRequest request = new CustomerProductRequest();
        request.setProductName(dto.getProductName());
        request.setBrand(dto.getBrand());
        
        // Set category if provided
        if (dto.getCategoryId() != null) {
            Category category = categoryRepository.findById(dto.getCategoryId())
                    .orElse(null);
            request.setCategory(category);
        }
        
        request.setRequestDate(LocalDateTime.now());
        
        return requestRepository.save(request);
    }

    /**
     * Get all customer product requests
     */
    public List<CustomerProductRequest> getAllRequests() {
        return requestRepository.findAllByOrderByRequestDateDesc();
    }

    /**
     * Get products that have been requested above a certain threshold
     */
    public List<ProductRequestStatDTO> getTopRequestedProducts(int threshold) {
        List<Object[]> results = requestRepository.findTopRequestedProducts(threshold);
        return mapToStatDTOs(results);
    }

    /**
     * Get all product request statistics
     */
    public List<ProductRequestStatDTO> getRequestStatistics() {
        List<Object[]> results = requestRepository.getRequestStatistics();
        return mapToStatDTOs(results);
    }

    /**
     * Get request count for a specific product
     */
    public Long getRequestCount(String productName) {
        return requestRepository.countByProductNameIgnoreCase(productName);
    }

    /**
     * Helper method to map query results to DTOs
     */
    private List<ProductRequestStatDTO> mapToStatDTOs(List<Object[]> results) {
        List<ProductRequestStatDTO> stats = new ArrayList<>();
        for (Object[] result : results) {
            ProductRequestStatDTO stat = new ProductRequestStatDTO();
            stat.setProductName((String) result[0]);
            stat.setBrand((String) result[1]);
            stat.setRequestCount(((Number) result[2]).longValue());
            stat.setFirstRequest((LocalDateTime) result[3]);
            stat.setLastRequest((LocalDateTime) result[4]);
            stats.add(stat);
        }
        return stats;
    }
}
