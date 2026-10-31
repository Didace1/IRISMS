package com.aidevice.smartfix.controller;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.aidevice.smartfix.model.InventoryItem;
import com.aidevice.smartfix.model.RepairTask;
import com.aidevice.smartfix.model.Sale;
import com.aidevice.smartfix.repository.RepairTaskRepository;
import com.aidevice.smartfix.repository.UserRepository;
import com.aidevice.smartfix.service.InventoryService;
import com.aidevice.smartfix.service.SalesService;

@RestController
@RequestMapping("/api/reports")
public class ReportsController {
    private final InventoryService inventoryService;
    private final SalesService salesService;
    private final UserRepository userRepository;
    private final RepairTaskRepository repairTaskRepository;

    public ReportsController(InventoryService inventoryService, SalesService salesService,
                              UserRepository userRepository, RepairTaskRepository repairTaskRepository) {
        this.inventoryService = inventoryService;
        this.salesService = salesService;
        this.userRepository = userRepository;
        this.repairTaskRepository = repairTaskRepository;
    }

    @GetMapping("/summary")
    public Map<String, Object> summary() {
        List<InventoryItem> inventory = inventoryService.getAll();
        List<Sale> sales = salesService.getAllSales();

        BigDecimal totalInventoryValue = inventory.stream()
                .map(item -> {
                    BigDecimal p = item.getPrice() != null ? item.getPrice() : BigDecimal.ZERO;
                    int q = item.getQuantity() != null ? item.getQuantity() : 0;
                    return p.multiply(BigDecimal.valueOf(q));
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, Long> categoryDistribution = new LinkedHashMap<>();
        for (InventoryItem item : inventory) {
            String categoryName = item.getCategory() != null ? item.getCategory().getName() : "Uncategorized";
            categoryDistribution.put(categoryName, categoryDistribution.getOrDefault(categoryName, 0L) + 1);
        }

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("totalUsers", userRepository.count());
        data.put("totalSalesCount", sales.size());
        data.put("totalRevenue", sales.stream().map(s -> s.getTotal() != null ? s.getTotal() : BigDecimal.ZERO).reduce(BigDecimal.ZERO, BigDecimal::add));
        data.put("inventoryCount", inventory.size());
        data.put("inventoryValue", totalInventoryValue);
        data.put("lowStockCount", inventory.stream().filter(i -> i.getQuantity() != null && i.getReorderPoint() != null && i.getQuantity() <= i.getReorderPoint()).count());
        data.put("categoryDistribution", categoryDistribution);
        return data;
    }

    @GetMapping("/activities")
    public List<Map<String, Object>> activities() {
        List<Map<String, Object>> activities = new ArrayList<>();

        List<Sale> sales = salesService.getAllSales();
        sales.stream()
                .sorted(Comparator.comparing(Sale::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
                .limit(5)
                .forEach(sale -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("id", "sale-" + sale.getId());
                    row.put("type", "sales");
                    row.put("title", "Sale completed for " + sale.getCustomerName());
                    row.put("customer", sale.getCustomerName());
                    row.put("timestamp", sale.getCreatedAt() != null ? sale.getCreatedAt().toString() : LocalDate.now().toString());
                    row.put("status", "completed");
                    activities.add(row);
                });

        inventoryService.getAll().stream()
                .filter(item -> item.getQuantity() != null && item.getReorderPoint() != null && item.getQuantity() <= item.getReorderPoint())
                .limit(3)
                .forEach(item -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("id", "stock-" + item.getId());
                    row.put("type", "inventory");
                    row.put("title", "Low stock alert: " + item.getName());
                    row.put("timestamp", LocalDate.now().toString());
                    row.put("status", "alert");
                    activities.add(row);
                });

        return activities;
    }

    @GetMapping("/sales-by-day")
    public List<Map<String, Object>> salesByDay() {
        List<Sale> sales = salesService.getAllSales();
        LocalDate today = LocalDate.now();
        List<Map<String, Object>> result = new ArrayList<>();

        for (int i = 6; i >= 0; i--) {
            LocalDate date = today.minusDays(i);
            String dayName = date.getDayOfWeek().getDisplayName(TextStyle.SHORT, Locale.ENGLISH);
            List<Sale> daySales = sales.stream()
                    .filter(s -> s.getCreatedAt() != null && s.getCreatedAt().toLocalDate().equals(date))
                    .toList();
            BigDecimal revenue = daySales.stream()
                    .map(s -> s.getTotal() != null ? s.getTotal() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            Map<String, Object> day = new LinkedHashMap<>();
            day.put("day", dayName);
            day.put("date", date.toString());
            day.put("count", daySales.size());
            day.put("revenue", revenue);
            result.add(day);
        }
        return result;
    }

    @GetMapping("/repair-analytics")
    public Map<String, Object> repairAnalytics() {
        List<RepairTask> tasks = repairTaskRepository.findAll();
        long pending    = tasks.stream().filter(t -> List.of("PENDING","ASSIGNED").contains(t.getStatus())).count();
        long inProgress = tasks.stream().filter(t -> "IN_PROGRESS".equals(t.getStatus())).count();
        long completed  = tasks.stream().filter(t -> "COMPLETED".equals(t.getStatus())).count();
        long escalated  = tasks.stream().filter(t -> "ESCALATED".equals(t.getStatus())).count();

        List<Map<String, Object>> statusChart = new ArrayList<>();
        statusChart.add(Map.of("name", "Pending",     "value", pending));
        statusChart.add(Map.of("name", "In Progress",  "value", inProgress));
        statusChart.add(Map.of("name", "Completed",    "value", completed));
        statusChart.add(Map.of("name", "Escalated",    "value", escalated));

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("total",               tasks.size());
        data.put("pending",             pending);
        data.put("inProgress",          inProgress);
        data.put("completed",           completed);
        data.put("escalated",           escalated);
        data.put("completionRate",      tasks.isEmpty() ? 0 :
                (int) Math.round((double) completed / tasks.size() * 100));
        data.put("statusDistribution",  statusChart);
        return data;
    }
}
