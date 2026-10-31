package com.aidevice.smartfix.service;

import com.aidevice.smartfix.model.Notification;
import com.aidevice.smartfix.model.User;
import com.aidevice.smartfix.repository.NotificationRepository;
import com.aidevice.smartfix.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public List<Notification> getNotificationsForUser(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    public void markAsRead(Long notificationId) {
        notificationRepository.findById(notificationId).ifPresent(notification -> {
            notification.setRead(true);
            notificationRepository.save(notification);
        });
    }

    public void markAllAsRead(Long userId) {
        List<Notification> unread = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream().filter(n -> !n.isRead()).toList();
        for (Notification n : unread) {
            n.setRead(true);
        }
        notificationRepository.saveAll(unread);
    }

    public void clearAll(Long userId) {
        notificationRepository.deleteByUserId(userId);
    }

    // Helper to send a notification to a specific user ID
    public void sendNotificationToUser(Long userId, String type, String title, String detail, String actionPath, String actionLabel, String priority) {
        Notification notification = new Notification();
        notification.setUserId(userId);
        notification.setType(type);
        notification.setTitle(title);
        notification.setDetail(detail);
        notification.setActionPath(actionPath);
        notification.setActionLabel(actionLabel);
        notification.setPriority(priority != null ? priority : "medium");
        notification.setCreatedAt(LocalDateTime.now());
        notification.setRead(false);
        notificationRepository.save(notification);
    }

    // Helper to send a notification to a user found by their full name
    public void sendNotificationToFullName(String fullName, String type, String title, String detail, String actionPath, String actionLabel, String priority) {
        userRepository.findByFullName(fullName).ifPresent(user -> {
            sendNotificationToUser(user.getId(), type, title, detail, actionPath, actionLabel, priority);
        });
    }

    // Helper to send a notification to all users in a specific role
    public void sendNotificationToRole(String role, String type, String title, String detail, String actionPath, String actionLabel, String priority) {
        List<User> users = userRepository.findByRoleIgnoreCase(role);
        for (User user : users) {
            sendNotificationToUser(user.getId(), type, title, detail, actionPath, actionLabel, priority);
        }
    }
}
