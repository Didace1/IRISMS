package com.aidevice.smartfix.service;

import com.aidevice.smartfix.dto.PasswordChangeRequest;
import com.aidevice.smartfix.dto.ProfileResponse;
import com.aidevice.smartfix.dto.ProfileUpdateRequest;
import com.aidevice.smartfix.model.User;
import com.aidevice.smartfix.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public ProfileResponse getUserProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        return mapToProfileResponse(user);
    }

    @Transactional
    public ProfileResponse updateProfile(Long userId, ProfileUpdateRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Update allowed fields
        if (request.getFullName() != null && !request.getFullName().trim().isEmpty()) {
            user.setFullName(request.getFullName().trim());
        }
        
        if (request.getPhone() != null && !request.getPhone().trim().isEmpty()) {
            // Check if phone is already taken by another user
            userRepository.findByPhone(request.getPhone().trim())
                    .ifPresent(existingUser -> {
                        if (!existingUser.getId().equals(userId)) {
                            throw new RuntimeException("Phone number already in use");
                        }
                    });
            user.setPhone(request.getPhone().trim());
        }
        
        if (request.getSpecialization() != null) {
            user.setSpecialization(request.getSpecialization().trim());
        }
        
        if (request.getCertifications() != null) {
            user.setCertifications(request.getCertifications().trim());
        }

        User updatedUser = userRepository.save(user);
        return mapToProfileResponse(updatedUser);
    }

    @Transactional
    public void changePassword(Long userId, PasswordChangeRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Verify current password
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new RuntimeException("Current password is incorrect");
        }

        // Validate new password
        if (request.getNewPassword() == null || request.getNewPassword().length() < 6) {
            throw new RuntimeException("New password must be at least 6 characters long");
        }

        // Update password
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    private ProfileResponse mapToProfileResponse(User user) {
        return new ProfileResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getPhone(),
                user.getEmployeeId(),
                user.getRole(),
                user.getSpecialization(),
                user.getCertifications(),
                user.isApproved()
        );
    }
}
