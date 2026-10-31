package com.aidevice.smartfix.controller;

import com.aidevice.smartfix.dto.PasswordChangeRequest;
import com.aidevice.smartfix.dto.ProfileResponse;
import com.aidevice.smartfix.dto.ProfileUpdateRequest;
import com.aidevice.smartfix.service.ProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ProfileController {

    private final ProfileService profileService;

    @GetMapping
    public ResponseEntity<ProfileResponse> getProfile(@RequestParam Long userId) {
        try {
            ProfileResponse profile = profileService.getUserProfile(userId);
            return ResponseEntity.ok(profile);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping
    public ResponseEntity<?> updateProfile(
            @RequestParam Long userId,
            @RequestBody ProfileUpdateRequest request) {
        try {
            ProfileResponse updatedProfile = profileService.updateProfile(userId, request);
            return ResponseEntity.ok(updatedProfile);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(
            @RequestParam Long userId,
            @RequestBody PasswordChangeRequest request) {
        try {
            profileService.changePassword(userId, request);
            Map<String, String> response = new HashMap<>();
            response.put("message", "Password changed successfully");
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
}
