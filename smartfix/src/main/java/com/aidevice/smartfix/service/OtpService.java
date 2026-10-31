package com.aidevice.smartfix.service;

import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class OtpService {

    private record OtpEntry(String code, LocalDateTime expiry) {}

    private final Map<String, OtpEntry> store = new ConcurrentHashMap<>();
    private final Random random = new Random();

    public String generate(String email) {
        String code = String.format("%06d", random.nextInt(1_000_000));
        store.put(email.toLowerCase(), new OtpEntry(code, LocalDateTime.now().plusMinutes(5)));
        System.out.println("[OTP] Code for " + email + " → " + code);
        return code;
    }

    public boolean verify(String email, String code) {
        OtpEntry entry = store.get(email.toLowerCase());
        if (entry == null) return false;
        if (LocalDateTime.now().isAfter(entry.expiry())) {
            store.remove(email.toLowerCase());
            return false;
        }
        if (!entry.code().equals(code)) return false;
        store.remove(email.toLowerCase());
        return true;
    }
}
