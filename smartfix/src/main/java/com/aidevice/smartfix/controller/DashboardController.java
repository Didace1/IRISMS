package com.aidevice.smartfix.controller;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.aidevice.smartfix.model.InventoryItem;
import com.aidevice.smartfix.model.RepairTask;
import com.aidevice.smartfix.model.Sale;
import com.aidevice.smartfix.model.User;
import com.aidevice.smartfix.repository.RepairTaskRepository;
import com.aidevice.smartfix.repository.UserRepository;
import com.aidevice.smartfix.service.InventoryService;
import com.aidevice.smartfix.service.SalesService;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {
    private final InventoryService inventoryService;
    private final SalesService salesService;
    private final UserRepository userRepository;
    private final RepairTaskRepository repairTaskRepository;

    public DashboardController(InventoryService inventoryService, SalesService salesService,
                                UserRepository userRepository, RepairTaskRepository repairTaskRepository) {
        this.inventoryService = inventoryService;
        this.salesService = salesService;
        this.userRepository = userRepository;
        this.repairTaskRepository = repairTaskRepository;
    }

    @GetMapping("/summary")
    public Map<String, Object> summary(Authentication authentication) {
        List<InventoryItem> items = inventoryService.getAll();
        List<Sale> sales = salesService.getAllSales();
        List<RepairTask> tasks = repairTaskRepository.findAll();
        LocalDate today = LocalDate.now();
        LocalDateTime weekStart = LocalDateTime.now().minusDays(7);

        int lowStock = (int) items.stream().filter(i -> i.getQuantity() != null && i.getReorderPoint() != null && i.getQuantity() <= i.getReorderPoint()).count();
        BigDecimal todayRevenue = sales.stream()
                .filter(s -> s.getCreatedAt() != null && s.getCreatedAt().toLocalDate().equals(today))
                .map(s -> s.getTotal() != null ? s.getTotal() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long pendingRepairs  = tasks.stream().filter(t -> List.of("PENDING","ASSIGNED").contains(t.getStatus())).count();
        long activeRepairs   = tasks.stream().filter(t -> "IN_PROGRESS".equals(t.getStatus())).count();
        long completedRepairs = tasks.stream().filter(t -> "COMPLETED".equals(t.getStatus())).count();

        Map<String, Object> data = new HashMap<>();
        data.put("inventoryItems",   items.size());
        data.put("lowStockItems",    lowStock);
        data.put("salesToday",       sales.stream().filter(s -> s.getCreatedAt() != null && s.getCreatedAt().toLocalDate().equals(today)).count());
        data.put("revenueToday",     todayRevenue);
        data.put("users",            userRepository.count());
        data.put("pendingRepairs",   pendingRepairs);
        data.put("activeRepairs",    activeRepairs);
        data.put("completedRepairs", completedRepairs);
        data.put("totalRepairs",     tasks.size());
        // Customer count is no longer tracked as a separate entity

        // Add technician-specific data if user is authenticated
        User currentUser = null;
        if (authentication != null && authentication.isAuthenticated() && !authentication.getName().equals("anonymousUser")) {
            String email = authentication.getName(); // email is used as username
            currentUser = userRepository.findByEmail(email).orElse(null);
        } else {
            try {
                org.springframework.web.context.request.ServletRequestAttributes attr = 
                    (org.springframework.web.context.request.ServletRequestAttributes) org.springframework.web.context.request.RequestContextHolder.currentRequestAttributes();
                String headerId = attr.getRequest().getHeader("X-User-Id");
                if (headerId != null && !headerId.isEmpty()) {
                    currentUser = userRepository.findById(Long.parseLong(headerId)).orElse(null);
                }
            } catch (Exception e) {
                // Ignore
            }
        }
        
        if (currentUser != null && "TECHNICIAN".equalsIgnoreCase(currentUser.getRole())) {
                List<RepairTask> myTasks = repairTaskRepository.findByAssignedTechnicianId(currentUser.getId());
                
                long myPendingTasks = myTasks.stream()
                        .filter(t -> List.of("PENDING", "ASSIGNED", "IN_PROGRESS").contains(t.getStatus()))
                        .count();
                
                long myCompletedToday = myTasks.stream()
                        .filter(t -> "COMPLETED".equals(t.getStatus()) && 
                                t.getCompletedAt() != null && 
                                t.getCompletedAt().toLocalDate().equals(today))
                        .count();
                
                long myWeeklyCompleted = myTasks.stream()
                        .filter(t -> "COMPLETED".equals(t.getStatus()) && 
                                t.getCompletedAt() != null && 
                                t.getCompletedAt().isAfter(weekStart))
                        .count();
                
                long myTotalCompleted = myTasks.stream()
                        .filter(t -> "COMPLETED".equals(t.getStatus()))
                        .count();
                
                int successRate = myTasks.isEmpty() ? 0 : 
                        (int) Math.round((double) myTotalCompleted / myTasks.size() * 100);
                
                // Calculate average repair time for completed tasks
                List<RepairTask> completedWithTime = myTasks.stream()
                        .filter(t -> "COMPLETED".equals(t.getStatus()) && 
                                t.getStartedAt() != null && 
                                t.getCompletedAt() != null)
                        .toList();
                
                long avgRepairTime = 0;
                if (!completedWithTime.isEmpty()) {
                    long totalMinutes = completedWithTime.stream()
                            .mapToLong(t -> ChronoUnit.MINUTES.between(t.getStartedAt(), t.getCompletedAt()))
                            .sum();
                    avgRepairTime = totalMinutes / completedWithTime.size();
                }
                
                data.put("myTasks", myPendingTasks);
                data.put("completedToday", myCompletedToday);
                data.put("weeklyCompleted", myWeeklyCompleted);
                data.put("successRate", successRate);
                data.put("avgRepairTime", avgRepairTime);
                
                // Find next task
                RepairTask nextTask = myTasks.stream()
                        .filter(t -> List.of("ASSIGNED", "IN_PROGRESS").contains(t.getStatus()))
                        .findFirst()
                        .orElse(null);
                
                if (nextTask != null) {
                    String taskDesc = String.format("%s - %s %s", 
                            nextTask.getDeviceType(), 
                            nextTask.getDeviceBrand(), 
                            nextTask.getDeviceModel());
                    data.put("nextTask", taskDesc);
                } else {
                    data.put("nextTask", "No pending tasks");
                }
            }

        return data;
    }
}
