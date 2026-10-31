package com.aidevice.smartfix.controller;

import com.aidevice.smartfix.dto.AuthDtos;
import com.aidevice.smartfix.model.User;
import com.aidevice.smartfix.repository.UserRepository;
import com.aidevice.smartfix.service.EmailService;
import com.aidevice.smartfix.service.PasswordResetService;
import com.aidevice.smartfix.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;
    private final PasswordResetService passwordResetService;
    private final EmailService emailService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthController(UserService userService, PasswordResetService passwordResetService,
                          EmailService emailService, UserRepository userRepository,
                          PasswordEncoder passwordEncoder) {
        this.userService = userService;
        this.passwordResetService = passwordResetService;
        this.emailService = emailService;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/register")
    public AuthDtos.UserResponse register(@RequestBody AuthDtos.RegisterRequest request) {
        try {
            return userService.register(request);
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage());
        }
    }

    @PostMapping("/login")
    public AuthDtos.AuthResponse login(@RequestBody AuthDtos.LoginRequest request) {
        try {
            return userService.login(request);
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, ex.getMessage());
        }
    }

    @PostMapping("/verify-otp")
    public AuthDtos.AuthResponse verifyOtp(@RequestBody AuthDtos.OtpVerifyRequest request) {
        try {
            return userService.verifyOtp(request);
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, ex.getMessage());
        }
    }

    @GetMapping("/pending")
    public List<AuthDtos.PendingUserResponse> getPendingUsers() {
        return userService.getPendingUsers();
    }

    @PutMapping("/approve/{id}")
    public AuthDtos.UserResponse approveUser(@PathVariable Long id) {
        try {
            return userService.approveUser(id);
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, ex.getMessage());
        } catch (Exception ex) {
            // Log the full error for debugging
            System.err.println("Error approving user " + id + ": " + ex.getMessage());
            ex.printStackTrace();
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to approve user: " + ex.getMessage());
        }
    }

    @DeleteMapping("/reject/{id}")
    public ResponseEntity<Void> rejectUser(@PathVariable Long id) {
        userService.rejectUser(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(@RequestBody AuthDtos.ForgotPasswordRequest request) {
        Map<String, String> response = new HashMap<>();

        // Always return success to prevent email enumeration
        response.put("message", "If this email exists, a reset link has been sent.");

        Optional<User> userOpt = userRepository.findByEmail(request.email());
        if (userOpt.isEmpty()) {
            return ResponseEntity.ok(response);
        }

        String token = passwordResetService.generateToken(request.email());
        try {
            emailService.sendPasswordResetLink(request.email(), token);
        } catch (Exception e) {
            System.err.println("[RESET] Email send failed (" + e.getMessage() + "). Token: " + token);
            // Include the reset link in response when email fails (dev fallback)
            response.put("devResetLink", "/reset-password?token=" + token);
        }

        return ResponseEntity.ok(response);
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(@RequestBody AuthDtos.ResetPasswordRequest request) {
        Map<String, String> response = new HashMap<>();

        String email = passwordResetService.consume(request.token());
        if (email == null) {
            response.put("error", "Invalid or expired reset token. Please request a new reset link.");
            return ResponseEntity.badRequest().body(response);
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (request.newPassword() == null || request.newPassword().length() < 6) {
            response.put("error", "Password must be at least 6 characters long.");
            return ResponseEntity.badRequest().body(response);
        }

        user.setPassword(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);

        response.put("message", "Password has been reset successfully. You can now log in with your new password.");
        return ResponseEntity.ok(response);
    }
}
