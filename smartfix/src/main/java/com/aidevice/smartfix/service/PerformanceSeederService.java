package com.aidevice.smartfix.service;

import com.aidevice.smartfix.model.RepairCase;
import com.aidevice.smartfix.model.RepairTask;
import com.aidevice.smartfix.model.User;
import com.aidevice.smartfix.repository.RepairCaseRepository;
import com.aidevice.smartfix.repository.RepairTaskRepository;
import com.aidevice.smartfix.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Seeds demo repair case records so the performance dashboard shows real data.
 * Only call this once — it checks if data already exists before inserting.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PerformanceSeederService {

    private final RepairCaseRepository repairCaseRepository;
    private final RepairTaskRepository repairTaskRepository;
    private final UserRepository userRepository;

    private static final String[] DEVICE_TYPES  = {"Laptop", "Smartphone", "Desktop", "Smartwatch", "Tablet"};
    private static final String[] BRANDS        = {"Samsung", "Apple", "HP", "Dell", "Lenovo", "Huawei", "Asus"};
    private static final String[] MODELS        = {"Galaxy S21", "iPhone 13", "Pavilion 15", "XPS 13", "ThinkPad X1", "P30 Pro", "ZenBook"};
    private static final String[] STATUSES      = {"SUCCESS", "SUCCESS", "SUCCESS", "SUCCESS", "FAILED", "PARTIAL", "SUCCESS"};
    private static final String[] ACTIONS       = {
        "Replaced screen", "Battery replacement", "Motherboard repair",
        "Software reinstall", "Charging port fix", "RAM upgrade", "SSD replacement"
    };
    private static final String[] RESULTS       = {
        "Device fully operational", "Battery holds charge normally",
        "System boots correctly", "All apps working", "Charging at normal speed",
        "Performance improved", "Faster boot and response time"
    };

    @Transactional
    public Map<String, Object> seedDemoData() {
        // Skip if data already exists
        long existing = repairCaseRepository.count();
        if (existing > 0) {
            log.info("Demo data already exists ({} repair cases). Skipping seed.", existing);
            return Map.of(
                "status", "skipped",
                "message", "Demo data already exists. " + existing + " repair cases in database.",
                "count", existing
            );
        }

        // Get technicians
        List<User> technicians = userRepository.findAll().stream()
            .filter(u -> "technician".equalsIgnoreCase(u.getRole()) && u.isApproved())
            .toList();

        if (technicians.isEmpty()) {
            return Map.of("status", "error", "message", "No approved technicians found.");
        }

        // Get a sales rep for creating dummy tasks (pick the first sales or any user)
        User dummySalesRep = userRepository.findAll().stream()
            .filter(u -> "sales".equalsIgnoreCase(u.getRole()) && u.isApproved())
            .findFirst()
            .orElse(technicians.get(0)); // fallback to first technician if no sales user

        Random rng = new Random(42); // fixed seed for reproducibility
        int casesPerTech = Math.max(5, 60 / technicians.size()); // spread ~60 records
        int totalCasesNeeded = technicians.size() * casesPerTech;

        // Get existing tasks that DON'T already have a repair case
        Set<Long> usedTicketIds = repairCaseRepository.findAll().stream()
            .map(rc -> rc.getRepairTicket().getId())
            .collect(Collectors.toSet());

        List<RepairTask> availableTasks = repairTaskRepository.findAll().stream()
            .filter(t -> !usedTicketIds.contains(t.getId()))
            .collect(Collectors.toCollection(ArrayList::new));

        // If we don't have enough tasks, create dummy ones
        while (availableTasks.size() < totalCasesNeeded) {
            User tech = technicians.get(rng.nextInt(technicians.size()));
            RepairTask dummyTask = new RepairTask();
            dummyTask.setCustomerName("Demo Customer " + (availableTasks.size() + 1));
            dummyTask.setCustomerEmail("demo" + (availableTasks.size() + 1) + "@example.com");
            dummyTask.setCustomerPhone("+250780000" + String.format("%03d", availableTasks.size()));
            dummyTask.setDeviceType(DEVICE_TYPES[rng.nextInt(DEVICE_TYPES.length)]);
            dummyTask.setDeviceBrand(BRANDS[rng.nextInt(BRANDS.length)]);
            dummyTask.setDeviceModel(MODELS[rng.nextInt(MODELS.length)]);
            dummyTask.setRepairNote("Demo repair task for performance seeding");
            dummyTask.setCreatedBySalesRep(dummySalesRep);
            dummyTask.setAssignedTechnician(tech);
            dummyTask.setStatus("COMPLETED");
            dummyTask.setAssignedAt(LocalDateTime.now().minusDays(rng.nextInt(60)));
            dummyTask.setStartedAt(LocalDateTime.now().minusDays(rng.nextInt(59)));
            dummyTask.setCompletedAt(LocalDateTime.now().minusDays(rng.nextInt(30)));
            RepairTask saved = repairTaskRepository.save(dummyTask);
            availableTasks.add(saved);
        }

        // Shuffle and assign one task per case (respects unique constraint)
        Collections.shuffle(availableTasks, rng);
        List<RepairCase> cases = new ArrayList<>();
        int taskIndex = 0;

        for (User tech : technicians) {
            for (int i = 0; i < casesPerTech; i++) {
                String status    = STATUSES[rng.nextInt(STATUSES.length)];
                boolean returned = "FAILED".equals(status) || ("PARTIAL".equals(status) && rng.nextBoolean());
                int duration     = 30 + rng.nextInt(150); // 30–180 mins
                LocalDateTime repairDate = LocalDateTime.now().minusDays(rng.nextInt(60)).minusHours(rng.nextInt(8));
                RepairTask task = availableTasks.get(taskIndex++);

                RepairCase rc = RepairCase.builder()
                    .repairTicket(task)
                    .deviceType(DEVICE_TYPES[rng.nextInt(DEVICE_TYPES.length)])
                    .brand(BRANDS[rng.nextInt(BRANDS.length)])
                    .model(MODELS[rng.nextInt(MODELS.length)])
                    .repairAction(ACTIONS[rng.nextInt(ACTIONS.length)])
                    .repairResult(RESULTS[rng.nextInt(RESULTS.length)])
                    .repairStatus(status)
                    .returnedAfterRepair(returned)
                    .returnReason(returned ? "Customer returned: issue persisted" : null)
                    .repairDurationMinutes(duration)
                    .technicianNotes("Repair completed per standard procedure.")
                    .technician(tech)
                    .repairDate(repairDate)
                    .createdAt(repairDate)
                    .updatedAt(repairDate)
                    .editCount(0)
                    .build();

                cases.add(rc);
            }
        }

        repairCaseRepository.saveAll(cases);
        log.info("Seeded {} demo repair cases for {} technicians.", cases.size(), technicians.size());

        return Map.of(
            "status", "success",
            "message", "Successfully seeded " + cases.size() + " repair cases for " + technicians.size() + " technicians.",
            "totalCases", cases.size(),
            "techniciansSeeded", technicians.size()
        );
    }

    @Transactional
    public Map<String, Object> clearDemoData() {
        long count = repairCaseRepository.count();
        repairCaseRepository.deleteAll();
        log.info("🗑️ Cleared {} repair cases.", count);
        return Map.of("status", "success", "message", "Cleared " + count + " repair cases.", "deleted", count);
    }
}
