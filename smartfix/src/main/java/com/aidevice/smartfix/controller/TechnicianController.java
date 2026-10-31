package com.aidevice.smartfix.controller;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.aidevice.smartfix.model.RepairTask;
import com.aidevice.smartfix.model.User;
import com.aidevice.smartfix.repository.RepairTaskRepository;
import com.aidevice.smartfix.repository.UserRepository;

@RestController
@RequestMapping("/api/technicians")
public class TechnicianController {
    private final UserRepository userRepository;
    private final RepairTaskRepository repairTaskRepository;

    public TechnicianController(UserRepository userRepository,
                                 RepairTaskRepository repairTaskRepository) {
        this.userRepository = userRepository;
        this.repairTaskRepository = repairTaskRepository;
    }

    @GetMapping
    public List<User> list() {
        return userRepository.findAll().stream()
                .filter(user -> "technician".equalsIgnoreCase(user.getRole()))
                .toList();
    }

    @GetMapping("/workload")
    public List<Map<String, Object>> workload() {
        List<User> technicians = userRepository.findAll().stream()
                .filter(u -> "technician".equalsIgnoreCase(u.getRole()))
                .toList();

        return technicians.stream().map(tech -> {
            Map<String, Object> data = new LinkedHashMap<>();
            data.put("id", tech.getId());
            data.put("fullName", tech.getFullName());
            data.put("email", tech.getEmail());
            data.put("phone", tech.getPhone());
            data.put("specialization", tech.getSpecialization());
            data.put("certifications", tech.getCertifications());
            data.put("employeeId", tech.getEmployeeId());
            data.put("approved", tech.isApproved());

            List<RepairTask> tasks = repairTaskRepository.findByAssignedTechnicianId(tech.getId());
            long pending   = tasks.stream().filter(t -> List.of("PENDING","ASSIGNED").contains(t.getStatus())).count();
            long inProgress = tasks.stream().filter(t -> "IN_PROGRESS".equals(t.getStatus())).count();
            long completed  = tasks.stream().filter(t -> "COMPLETED".equals(t.getStatus())).count();
            long escalated  = tasks.stream().filter(t -> "ESCALATED".equals(t.getStatus())).count();

            data.put("pendingTasks",    pending);
            data.put("inProgressTasks", inProgress);
            data.put("completedTasks",  completed);
            data.put("escalatedTasks",  escalated);
            data.put("totalTasks",      tasks.size());
            data.put("completionRate",  tasks.isEmpty() ? 0 :
                    (int) Math.round((double) completed / tasks.size() * 100));
            data.put("status", (inProgress > 0 || pending > 0) ? "BUSY" : "AVAILABLE");
            return data;
        }).toList();
    }
}
