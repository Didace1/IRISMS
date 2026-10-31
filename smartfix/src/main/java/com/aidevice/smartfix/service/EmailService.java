package com.aidevice.smartfix.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromAddress;

    @Value("${app.name:SmartFix}")
    private String appName;

    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendOtp(String to, String otp) {
        SimpleMailMessage message = new SimpleMailMessage();

        // IMPORTANT: some SMTP servers ignore setFrom → still safe to include
        message.setFrom(fromAddress);
        message.setTo(to);
        message.setSubject(appName + " — Login Verification Code");

        message.setText(
                "Hello,\n\n" +
                "Your one-time verification code for " + appName + " is:\n\n" +
                "        " + otp + "\n\n" +
                "This code expires in 5 minutes.\n" +
                "Do not share it with anyone.\n\n" +
                "If you did not request this, please ignore this email.\n\n" +
                "— " + appName + " Security Team"
        );

        mailSender.send(message);
    }

    public void sendPasswordResetLink(String to, String token) {
        String resetLink = frontendUrl + "/reset-password?token=" + token;

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromAddress);
        message.setTo(to);
        message.setSubject(appName + " — Password Reset Request");

        message.setText(
                "Hello,\n\n" +
                "We received a request to reset your password for " + appName + ".\n\n" +
                "Click the link below to reset your password:\n\n" +
                "        " + resetLink + "\n\n" +
                "This link expires in 30 minutes.\n" +
                "If you did not request a password reset, please ignore this email.\n\n" +
                "— " + appName + " Security Team"
        );

        mailSender.send(message);
    }
}