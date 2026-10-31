package com.aidevice.smartfix.controller;

import com.aidevice.smartfix.dto.RepairTaskDtos.*;
import com.aidevice.smartfix.repository.UserRepository;
import com.aidevice.smartfix.service.RepairTaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller for Sales Rep-Driven Repair Task Workflow
 * Simplified workflow between Sales Rep and Technician only
 */
@RestController
@RequestMapping("/api/repair-tasks")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
public class RepairTaskController {

    private final RepairTaskService repairTaskService;
    private final UserRepository userRepository;

    /**
     * Get all repair tasks (for admin/dashboard views)
     * GET /api/repair-tasks
     */
    @GetMapping
    public ResponseEntity<List<RepairTaskResponse>> getAllTasks(
            @RequestParam(required = false) String status) {
        log.info("Fetching all repair tasks. Status filter: {}", status);
        List<RepairTaskResponse> tasks = repairTaskService.getAllTasks(status);
        return ResponseEntity.ok(tasks);
    }

    /**
     * Get a single repair task by ID
     * GET /api/repair-tasks/{taskId}
     */
    @GetMapping("/{taskId}")
    public ResponseEntity<RepairTaskResponse> getTaskById(@PathVariable Long taskId) {
        log.info("Fetching repair task {}", taskId);
        RepairTaskResponse task = repairTaskService.getTaskById(taskId);
        return ResponseEntity.ok(task);
    }

    /**
     * Sales Rep: Create and optionally assign a repair task
     * POST /api/repair-tasks
     */
    @PostMapping
    public ResponseEntity<TaskOperationResponse> createAndAssignTask(
            @Valid @RequestBody CreateAndAssignTaskDTO dto,
            Authentication authentication) {
        
        Long salesRepId = getUserIdFromAuth(authentication);
        log.info("Sales Rep {} creating and assigning repair task", salesRepId);
        
        TaskOperationResponse response = repairTaskService.createAndAssignTask(dto, salesRepId);
        return ResponseEntity.ok(response);
    }

    /**
     * Technician: Start a repair
     * PUT /api/repair-tasks/{taskId}/start
     */
    @PutMapping("/{taskId}/start")
    public ResponseEntity<TaskOperationResponse> startRepair(
            @PathVariable Long taskId,
            Authentication authentication) {
        
        Long technicianId = getUserIdFromAuth(authentication);
        log.info("Technician {} starting repair for task {}", technicianId, taskId);
        
        TaskOperationResponse response = repairTaskService.startRepair(taskId, technicianId);
        return ResponseEntity.ok(response);
    }

    /**
     * Technician: Complete a repair with action and result
     * PUT /api/repair-tasks/{taskId}/complete
     */
    @PutMapping("/{taskId}/complete")
    public ResponseEntity<TaskOperationResponse> completeRepair(
            @PathVariable Long taskId,
            @RequestBody(required = false) CompleteRepairDTO dto,
            Authentication authentication) {
        
        Long technicianId = getUserIdFromAuth(authentication);
        log.info("Technician {} completing repair for task {}", technicianId, taskId);
        
        TaskOperationResponse response = repairTaskService.completeRepair(taskId, dto, technicianId);
        return ResponseEntity.ok(response);
    }

    /**
     * Technician: Escalate task to Sales Rep (SIMPLE: just reason)
     * PUT /api/repair-tasks/{taskId}/escalate
     */
    @PutMapping("/{taskId}/escalate")
    public ResponseEntity<TaskOperationResponse> escalateTask(
            @PathVariable Long taskId,
            @RequestBody(required = false) EscalateTaskDTO dto,
            Authentication authentication) {
        
        Long technicianId = getUserIdFromAuth(authentication);
        log.info("Technician {} escalating task {} with reason: {}", technicianId, taskId, dto.getReason());
        
        TaskOperationResponse response = repairTaskService.escalateTask(taskId, dto, technicianId);
        return ResponseEntity.ok(response);
    }

    /**
     * Sales Rep: Record customer feedback and close task
     * POST /api/repair-tasks/{taskId}/feedback
     */
    @PostMapping("/{taskId}/feedback")
    public ResponseEntity<TaskOperationResponse> recordFeedback(
            @PathVariable Long taskId,
            @Valid @RequestBody RecordFeedbackDTO dto,
            Authentication authentication) {
        
        Long salesRepId = getUserIdFromAuth(authentication);
        log.info("Sales Rep {} recording feedback for task {}. Satisfied: {}", 
                 salesRepId, taskId, dto.getSatisfied());
        
        TaskOperationResponse response = repairTaskService.recordFeedback(taskId, dto, salesRepId);
        return ResponseEntity.ok(response);
    }

    /**
     * Sales Rep: Reassign task to different technician
     * PUT /api/repair-tasks/{taskId}/reassign
     */
    @PutMapping("/{taskId}/reassign")
    public ResponseEntity<TaskOperationResponse> reassignTask(
            @PathVariable Long taskId,
            @Valid @RequestBody ReassignTaskDTO dto,
            Authentication authentication) {
        
        Long salesRepId = getUserIdFromAuth(authentication);
        log.info("Sales Rep {} reassigning task {} to technician {}", 
                 salesRepId, taskId, dto.getNewTechnicianId());
        
        TaskOperationResponse response = repairTaskService.reassignTask(taskId, dto, salesRepId);
        return ResponseEntity.ok(response);
    }

    /**
     * Sales Rep: Get all my tasks (optionally filtered by status)
     * GET /api/repair-tasks/my-tasks?status=IN_PROGRESS
     */
    @GetMapping("/my-tasks")
    public ResponseEntity<List<RepairTaskResponse>> getMySalesRepTasks(
            @RequestParam(required = false) String status,
            Authentication authentication) {
        
        Long salesRepId = getUserIdFromAuth(authentication);
        log.info("Sales Rep {} fetching tasks. Status filter: {}", salesRepId, status);
        
        List<RepairTaskResponse> tasks = repairTaskService.getTasksBySalesRep(salesRepId, status);
        return ResponseEntity.ok(tasks);
    }

    /**
     * Technician: Get all my assigned tasks (optionally filtered by status)
     * GET /api/repair-tasks/my-assignments?status=ASSIGNED
     */
    @GetMapping("/my-assignments")
    public ResponseEntity<List<RepairTaskResponse>> getMyTechnicianTasks(
            @RequestParam(required = false) String status,
            Authentication authentication) {
        
        Long technicianId = getUserIdFromAuth(authentication);
        log.info("Technician {} fetching assigned tasks. Status filter: {}", technicianId, status);
        
        List<RepairTaskResponse> tasks = repairTaskService.getTasksByTechnician(technicianId, status);
        return ResponseEntity.ok(tasks);
    }

    /**
     * Extract user ID from authentication
     */
    private Long getUserIdFromAuth(Authentication authentication) {
        if (authentication != null && authentication.isAuthenticated() && !authentication.getName().equals("anonymousUser")) {
            String email = authentication.getName();
            com.aidevice.smartfix.model.User user = userRepository.findByEmail(email)
                    .orElse(null);
            if (user != null) return user.getId();
        }
        
        // Fallback to X-User-Id header since frontend does not send JWT yet
        try {
            org.springframework.web.context.request.ServletRequestAttributes attr = 
                (org.springframework.web.context.request.ServletRequestAttributes) org.springframework.web.context.request.RequestContextHolder.currentRequestAttributes();
            String headerId = attr.getRequest().getHeader("X-User-Id");
            if (headerId != null && !headerId.isEmpty()) {
                return Long.parseLong(headerId);
            }
        } catch (Exception e) {
            log.warn("Could not extract X-User-Id header", e);
        }
        
        // Absolute fallback for development to avoid 500 errors
        return userRepository.findAll().stream()
                .filter(u -> "sales".equalsIgnoreCase(u.getRole()))
                .findFirst()
                .map(com.aidevice.smartfix.model.User::getId)
                .orElse(1L);
    }
}
