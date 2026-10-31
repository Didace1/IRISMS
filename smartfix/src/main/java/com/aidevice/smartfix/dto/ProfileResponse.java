package com.aidevice.smartfix.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProfileResponse {
    private Long id;
    private String fullName;
    private String email;
    private String phone;
    private String employeeId;
    private String role;
    private String specialization;
    private String certifications;
    private boolean approved;
}
