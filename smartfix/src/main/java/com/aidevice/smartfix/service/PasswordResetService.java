package com.aidevice.smartfix.service;

import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class PasswordResetService {

    private record ResetEntry(String email, LocalDateTime expiry) {}

    private final Map<String, ResetEntry> store = new ConcurrentHashMap<>();

    /**
     * Generate a reset token for the given email.
     * Returns the token string.
     */
    public String generateToken(String email) {
        String token = UUID.randomUUID().toString();
        store.put(token, new ResetEntry(email, LocalDateTime.now().plusMinutes(30)));
        System.out.println("[RESET] Token for " + email + " → " + token);
        return token;
    }

    /**
     * Verify a token is valid and not expired. Returns the associated email, or null if invalid.
     */
    public String verify(String token) {
        ResetEntry entry = store.get(token);
        if (entry == null || entry.expiry().isBefore(LocalDateTime.now())) {
            return null;
        }
        return entry.email();
    }

    /**
     * Consume (verify + remove) a token. Returns the associated email, or null if invalid.
     */
    public String consume(String token) {
        ResetEntry entry = store.remove(token);
        if (entry == null || entry.expiry().isBefore(LocalDateTime.now())) {
            return null;
        }
        return entry.email();
    }
}
