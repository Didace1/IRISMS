package com.aidevice.smartfix;

import com.aidevice.smartfix.SmartfixApplication;
import com.aidevice.smartfix.model.User;
import com.aidevice.smartfix.repository.UserRepository;
import org.springframework.boot.SpringApplication;
import org.springframework.context.ApplicationContext;
import org.springframework.security.crypto.password.PasswordEncoder;

public class TestReset {
    public static void main(String[] args) {
        ApplicationContext ctx = SpringApplication.run(SmartfixApplication.class, args);
        UserRepository repo = ctx.getBean(UserRepository.class);
        PasswordEncoder encoder = ctx.getBean(PasswordEncoder.class);
        
        System.out.println("========== TESTING PASSWORD RESET ==========");
        User user = repo.findByEmail("technician@smartfix.com").orElse(null);
        if (user == null) {
            System.out.println("User not found!");
            System.exit(0);
        }
        System.out.println("Old password hash: " + user.getPassword());
        
        // Simulate reset
        String plainNew = "NewPass123!";
        String encodedNew = encoder.encode(plainNew);
        System.out.println("New password hash: " + encodedNew);
        
        user.setPassword(encodedNew);
        repo.save(user);
        System.out.println("User saved!");
        
        // Simulate login
        User fetchedUser = repo.findByEmail("technician@smartfix.com").get();
        System.out.println("Fetched password hash: " + fetchedUser.getPassword());
        
        boolean matches = encoder.matches(plainNew, fetchedUser.getPassword());
        System.out.println("Matches? " + matches);
        
        System.exit(0);
    }
}
