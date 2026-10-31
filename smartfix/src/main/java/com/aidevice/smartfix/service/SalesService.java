package com.aidevice.smartfix.service;

import com.aidevice.smartfix.dto.SalesDtos;
import com.aidevice.smartfix.model.InventoryItem;
import com.aidevice.smartfix.model.Sale;
import com.aidevice.smartfix.model.SaleItem;
import com.aidevice.smartfix.repository.InventoryItemRepository;
import com.aidevice.smartfix.repository.SaleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class SalesService {
    private final SaleRepository saleRepository;
    private final InventoryItemRepository inventoryRepository;

    public SalesService(SaleRepository saleRepository, InventoryItemRepository inventoryRepository) {
        this.saleRepository = saleRepository;
        this.inventoryRepository = inventoryRepository;
    }

    public List<Sale> getAllSales() {
        return saleRepository.findAll();
    }

    public List<SalesDtos.SaleSummaryResponse> getTodaySalesSummary() {
        LocalDate today = LocalDate.now();
        List<Sale> sales = saleRepository.findByCreatedAtBetween(today.atStartOfDay(), today.plusDays(1).atStartOfDay());
        return sales.stream().map(sale -> new SalesDtos.SaleSummaryResponse(
                sale.getId(),
                sale.getCustomerName(),
                sale.getItems().size(),
                sale.getTotal(),
                sale.getCreatedAt().toString()
        )).toList();
    }

    @Transactional
    public Sale checkout(SalesDtos.CheckoutRequest request) {
        if (request.cartItems() == null || request.cartItems().isEmpty()) {
            throw new IllegalArgumentException("Cart is empty");
        }

        boolean anonymousCustomer = Boolean.TRUE.equals(request.anonymousCustomer());
        String customerName = null;
        String customerEmail = null;
        String customerPhone = null;

        if (request.customerInfo() != null) {
            customerName = request.customerInfo().name();
            customerEmail = request.customerInfo().email();
            customerPhone = request.customerInfo().phone();
        }

        if (customerName == null || customerName.isBlank()) {
            if (!anonymousCustomer) {
                throw new IllegalArgumentException("Customer name is required unless anonymous customer mode is enabled");
            }

            String reference = request.customerRef();
            if (reference == null || reference.isBlank()) {
                reference = "WALKIN-" + System.currentTimeMillis();
            }

            String pickupCode = request.pickupCode();
            if (pickupCode == null || pickupCode.isBlank()) {
                pickupCode = String.valueOf((int) (Math.random() * 9000) + 1000);
            }

            customerName = "Anonymous " + reference;
            customerEmail = null;
            customerPhone = "Pickup Code: " + pickupCode;
        }

        Sale sale = new Sale();
        sale.setCustomerName(customerName);
        sale.setCustomerEmail(customerEmail);
        sale.setCustomerPhone(customerPhone);
        sale.setCreatedAt(LocalDateTime.now());
        sale.setTotal(BigDecimal.ZERO);

        BigDecimal total = BigDecimal.ZERO;
        for (SalesDtos.CartItemRequest cartItem : request.cartItems()) {
            InventoryItem item = inventoryRepository.findById(cartItem.id())
                    .orElseThrow(() -> new IllegalArgumentException("Product not found: " + cartItem.id()));
            if (cartItem.quantity() == null || cartItem.quantity() <= 0) {
                throw new IllegalArgumentException("Invalid quantity");
            }
            if (item.getQuantity() < cartItem.quantity()) {
                throw new IllegalArgumentException("Insufficient stock for " + item.getName());
            }

            item.setQuantity(item.getQuantity() - cartItem.quantity());
            inventoryRepository.save(item);

            SaleItem saleItem = new SaleItem();
            saleItem.setSale(sale);
            saleItem.setInventoryItem(item);
            saleItem.setQuantity(cartItem.quantity());
            saleItem.setUnitPrice(item.getPrice());
            sale.getItems().add(saleItem);

            total = total.add(item.getPrice().multiply(BigDecimal.valueOf(cartItem.quantity())));
        }

        sale.setTotal(total);
        return saleRepository.save(sale);
    }
}
