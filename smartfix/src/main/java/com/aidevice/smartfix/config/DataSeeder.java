package com.aidevice.smartfix.config;

import com.aidevice.smartfix.model.User;
import com.aidevice.smartfix.repository.CategoryRepository;
import com.aidevice.smartfix.repository.InventoryItemRepository;
import com.aidevice.smartfix.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataSeeder {

    @Bean
    @Order(1)
    CommandLineRunner seedUsers(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            InventoryItemRepository inventoryItemRepository,
            CategoryRepository categoryRepository
    ) {
        return args -> {
            seedUser(userRepository, passwordEncoder, "John Administrator", "admin@corex.com", "Admin123", "admin", "ADMIN001");
            seedUser(userRepository, passwordEncoder, "Sarah Technician", "technician@corexltd.com", "tech123", "technician", "TECH001");
            seedUser(userRepository, passwordEncoder, "Mike Manager", "manager@corexltd.com", "manager123", "manager", "MGR001");
            seedUser(userRepository, passwordEncoder, "Lisa Inventory", "inventory@corexltd.com", "inv123", "inventory", "INV001");
            seedUser(userRepository, passwordEncoder, "David Sales", "sales@corexltd.com", "sales123", "sales", "SALES001");
            cleanupHardcodedCategories(categoryRepository);
            seedInventory(inventoryItemRepository);
        };
    }

    private void seedUser(UserRepository repo, PasswordEncoder encoder, String fullName, String email, String rawPassword, String role, String employeeId) {
        if (repo.findByEmail(email).isPresent()) return;
        User user = new User();
        user.setFullName(fullName);
        user.setEmail(email);
        user.setPassword(encoder.encode(rawPassword));
        user.setRole(role);
        user.setEmployeeId(employeeId);
        user.setPhone(null);
        user.setSpecialization(null);
        user.setCertifications(null);
        user.setApproved(true);
        repo.save(user);
    }

    private void seedInventory(InventoryItemRepository repo) {
        // Inventory items removed - will be added by users through the UI
        // No mock data seeded
    }

    private void cleanupHardcodedCategories(CategoryRepository categoryRepository) {
        // Remove hardcoded categories that may have been seeded in previous versions
        String[] hardcodedCategories = {"Batteries", "Storage", "Screens", "Memory", "Accessories", "Cooling"};
        
        System.out.println("🧹 Starting cleanup of hardcoded categories...");
        
        for (String categoryName : hardcodedCategories) {
            categoryRepository.findByNameIgnoreCase(categoryName).ifPresent(category -> {
                try {
                    categoryRepository.delete(category);
                    System.out.println("✅ Removed hardcoded category: " + categoryName);
                } catch (Exception e) {
                    System.out.println("⚠️ Could not remove category '" + categoryName + "' (may be in use): " + e.getMessage());
                }
            });
        }
        
        // Also delete any categories that match exactly (case sensitive)
        for (String categoryName : hardcodedCategories) {
            categoryRepository.findByName(categoryName).ifPresent(category -> {
                try {
                    categoryRepository.delete(category);
                    System.out.println("✅ Removed hardcoded category (exact match): " + categoryName);
                } catch (Exception e) {
                    System.out.println("⚠️ Could not remove category '" + categoryName + "' (may be in use): " + e.getMessage());
                }
            });
        }
        
        System.out.println("🧹 Cleanup completed. Remaining categories in database:");
        categoryRepository.findAll().forEach(cat -> 
            System.out.println("📂 Category: " + cat.getName())
        );
    }
}
