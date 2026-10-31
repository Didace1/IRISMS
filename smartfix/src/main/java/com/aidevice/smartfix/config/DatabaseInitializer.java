package com.aidevice.smartfix.config;

import com.aidevice.smartfix.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class DatabaseInitializer implements CommandLineRunner {

    private final UserRepository userRepository;

    public DatabaseInitializer(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        try {
            // Ensure admin users are approved
            userRepository.findByEmail("admin@corex.com").ifPresent(user -> {
                if (!user.isApproved()) {
                    user.setApproved(true);
                    userRepository.save(user);
                    System.out.println("✅ Admin user admin@corex.com has been approved");
                }
            });

            userRepository.findByEmail("admin@corexltd.com").ifPresent(user -> {
                if (!user.isApproved()) {
                    user.setApproved(true);
                    userRepository.save(user);
                    System.out.println("✅ Admin user admin@corexltd.com has been approved");
                }
            });

            System.out.println("✅ Database initialization completed successfully");
        } catch (Exception e) {
            System.err.println("❌ Error during database initialization: " + e.getMessage());
            e.printStackTrace();
        }
    }
}