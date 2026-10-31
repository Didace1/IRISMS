package com.aidevice.smartfix.controller;

import com.aidevice.smartfix.dto.SalesDtos;
import com.aidevice.smartfix.model.InventoryItem;
import com.aidevice.smartfix.model.Sale;
import com.aidevice.smartfix.service.InventoryService;
import com.aidevice.smartfix.service.SalesService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/sales")
public class SalesController {
    private final SalesService salesService;
    private final InventoryService inventoryService;

    public SalesController(SalesService salesService, InventoryService inventoryService) {
        this.salesService = salesService;
        this.inventoryService = inventoryService;
    }

    @GetMapping("/products")
    public List<InventoryItem> getProducts() {
        return inventoryService.getAll();
    }

    @GetMapping
    public List<Sale> getSales() {
        return salesService.getAllSales();
    }

    @GetMapping("/today")
    public List<SalesDtos.SaleSummaryResponse> getTodaySales() {
        return salesService.getTodaySalesSummary();
    }

    @PostMapping("/checkout")
    public Sale checkout(@RequestBody SalesDtos.CheckoutRequest request) {
        try {
            return salesService.checkout(request);
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage());
        }
    }
}
