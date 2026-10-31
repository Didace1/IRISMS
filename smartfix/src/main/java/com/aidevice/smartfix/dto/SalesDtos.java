package com.aidevice.smartfix.dto;

import java.math.BigDecimal;
import java.util.List;

public class SalesDtos {
    public record CartItemRequest(
            Long id,
            Integer quantity
    ) {}

    public record CustomerInfoRequest(
            String name,
            String email,
            String phone
    ) {}

    public record CheckoutRequest(
            CustomerInfoRequest customerInfo,
            List<CartItemRequest> cartItems,
            Boolean anonymousCustomer,
            String customerRef,
            String pickupCode
    ) {}

    public record SaleSummaryResponse(
            Long id,
            String customer,
            Integer items,
            BigDecimal total,
            String date
    ) {}
}
