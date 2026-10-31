package com.aidevice.smartfix.controller;

import com.aidevice.smartfix.model.Notification;
import com.aidevice.smartfix.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<List<Notification>> getNotifications(
            @RequestParam(required = false) String role,
            @RequestParam(required = false) Long userId) {
        
        if (userId != null) {
            return ResponseEntity.ok(notificationService.getNotificationsForUser(userId));
        }
        return ResponseEntity.ok(Collections.emptyList());
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(
            @RequestParam(required = false) String role,
            @RequestParam(required = false) Long userId) {
        
        if (userId != null) {
            long count = notificationService.getUnreadCount(userId);
            return ResponseEntity.ok(Map.of("count", count));
        }
        return ResponseEntity.ok(Map.of("count", 0L));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable Long id) {
        notificationService.markAsRead(id);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/mark-all-read")
    public ResponseEntity<Void> markAllAsRead(
            @RequestParam(required = false) String role,
            @RequestParam(required = false) Long userId) {
        
        if (userId != null) {
            notificationService.markAllAsRead(userId);
        }
        return ResponseEntity.ok().build();
    }

    @PutMapping("/clear-all")
    public ResponseEntity<Void> clearAll(
            @RequestParam(required = false) String role,
            @RequestParam(required = false) Long userId) {
        
        if (userId != null) {
            notificationService.clearAll(userId);
        }
        return ResponseEntity.ok().build();
    }
}
