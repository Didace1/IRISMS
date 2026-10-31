package com.aidevice.smartfix.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductRequestStatDTO {
    private String productName;
    private String brand;
    private Long requestCount;
    private LocalDateTime firstRequest;
    private LocalDateTime lastRequest;
}
