package com.aidevice.smartfix.dto;

import lombok.Data;

@Data
public class ProfileUpdateRequest {
    private String fullName;
    private String phone;
    private String specialization;
    private String certifications;
}
