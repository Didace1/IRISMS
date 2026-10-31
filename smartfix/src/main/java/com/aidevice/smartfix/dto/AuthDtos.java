package com.aidevice.smartfix.dto;

public class AuthDtos {
    public record RegisterRequest(
            String fullName,
            String email,
            String phone,
            String employeeId,
            String role,
            String password,
            String specialization,
            String certifications
    ) {}

    public record PendingUserResponse(
            Long id,
            String fullName,
            String email,
            String phone,
            String role
    ) {}

    public record LoginRequest(
            String email,
            String password,
            Boolean rememberMe
    ) {}

    public record UserResponse(
            Long id,
            String fullName,
            String email,
            String phone,
            String employeeId,
            String role,
            String specialization,
            String certifications,
            boolean approved
    ) {}

    public record OtpVerifyRequest(
            String email,
            String otp
    ) {}

    public record AuthResponse(
            String token,
            Boolean requiresMfa,
            UserResponse user,
            String devOtp
    ) {}

    public record ForgotPasswordRequest(
            String email
    ) {}

    public record ResetPasswordRequest(
            String token,
            String newPassword
    ) {}
}
