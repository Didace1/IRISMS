package com.aidevice.smartfix.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CustomerProductRequestDTO {
    private String productName;
    private String brand;
    private Long categoryId;
}
