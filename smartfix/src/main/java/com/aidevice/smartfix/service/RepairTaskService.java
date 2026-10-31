package com.aidevice.smartfix.service;

import com.aidevice.smartfix.dto.RepairTaskDtos.*;
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
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for Sales Rep-Driven Repair Task Workflow
 * Handles workflow between Sales Rep and Technician only (no Admin involvement)
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RepairTaskService {

    private final RepairTaskRepository repairTaskRepository;
    private final UserRepository userRepository;
    private final RepairCaseRepository repairCaseRepository;
    private final NotificationService notificationService;

    /**
     * Sales Rep creates and assigns a repair task to a technician
     */
    @Transactional
    public TaskOperationResponse createAndAssignTask(CreateAndAssignTaskDTO dto, Long salesRepId) {
        log.info("Sales Rep {} creating repair task", salesRepId);

        // Get Sales Rep
        User salesRep = userRepository.findById(salesRepId)
                .orElseThrow(() -> new RuntimeException("Sales Rep not found"));

        // Create repair task
        RepairTask task = new RepairTask();
        task.setCustomerName(dto.getCustomerName());
        task.setCustomerEmail(dto.getCustomerEmail());
        task.setCustomerPhone(dto.getCustomerPhone());
        task.setDeviceType(dto.getDeviceType());
        task.setDeviceBrand(dto.getDeviceBrand());
        task.setDeviceModel(dto.getDeviceModel());
        task.setRepairNote(dto.getRepairNote());
        task.setCreatedBySalesRep(salesRep);

        String message = "Task created";
        if (dto.getTechnicianId() != null) {
            // Get Technician
            User technician = userRepository.findById(dto.getTechnicianId())
                    .orElseThrow(() -> new RuntimeException("Technician not found"));

            if (!"technician".equalsIgnoreCase(technician.getRole())) {
                throw new RuntimeException("Selected user is not a technician");
            }

            task.setAssignedTechnician(technician);
            task.setStatus("ASSIGNED");
            task.setAssignedAt(LocalDateTime.now());
            message = "Task created and assigned to " + technician.getFullName();
            
            notificationService.sendNotificationToUser(
                technician.getId(),
                "task-assigned",
                "New Repair Task",
                "You have been assigned a new repair task for a " + task.getDeviceModel(),
                "/repair-tasks",
                "View Task",
                "high"
            );
        } else {
            task.setStatus("PENDING");
        }

        RepairTask savedTask = repairTaskRepository.save(task);

        log.info(message);

        return TaskOperationResponse.builder()
                .taskId(savedTask.getId())
                .status(task.getStatus())
                .message(message)
                .success(true)
                .build();
    }

    /**
     * Technician starts a repair
     */
    @Transactional
    public TaskOperationResponse startRepair(Long taskId, Long technicianId) {
        log.info("Technician {} starting repair for task {}", technicianId, taskId);

        RepairTask task = repairTaskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        // Validate technician
        if (task.getAssignedTechnician() == null || !task.getAssignedTechnician().getId().equals(technicianId)) {
            throw new RuntimeException("Task not assigned to this technician");
        }

        if (!"ASSIGNED".equals(task.getStatus())) {
            throw new RuntimeException("Task cannot be started. Current status: " + task.getStatus());
        }

        task.setStatus("IN_PROGRESS");
        task.setStartedAt(LocalDateTime.now());
        repairTaskRepository.save(task);

        if (task.getCreatedBySalesRep() != null) {
            notificationService.sendNotificationToUser(
                task.getCreatedBySalesRep().getId(),
                "task-started",
                "Task In Progress",
                "Technician " + task.getAssignedTechnician().getFullName() + " has started working on " + task.getDeviceModel(),
                "/dashboard",
                "View Status",
                "low"
            );
        }
        
        log.info("Task {} started by technician {}", taskId, technicianId);

        return TaskOperationResponse.builder()
                .taskId(taskId)
                .status("IN_PROGRESS")
                .message("Repair started successfully")
                .success(true)
                .build();
    }

    /**
     * Technician completes a repair with action and result
     */
    @Transactional
    public TaskOperationResponse completeRepair(Long taskId, CompleteRepairDTO dto, Long technicianId) {
        log.info("Technician {} completing repair for task {}", technicianId, taskId);

        RepairTask task = repairTaskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        // Validate technician
        if (task.getAssignedTechnician() == null || !task.getAssignedTechnician().getId().equals(technicianId)) {
            throw new RuntimeException("Task not assigned to this technician");
        }

        if (!"IN_PROGRESS".equals(task.getStatus())) {
            throw new RuntimeException("Task is not in progress. Current status: " + task.getStatus());
        }

        task.setStatus("COMPLETED");
        task.setCompletedAt(LocalDateTime.now());
        if (dto != null) {
            task.setRepairAction(dto.getRepairAction());
            task.setRepairResult(dto.getRepairResult());
            task.setRepairDurationMinutes(dto.getRepairDurationMinutes());
        }
        repairTaskRepository.save(task);

        if (task.getCreatedBySalesRep() != null) {
            notificationService.sendNotificationToUser(
                task.getCreatedBySalesRep().getId(),
                "task-completed",
                "Repair Completed",
                "Technician " + task.getAssignedTechnician().getFullName() + " has completed repair on " + task.getDeviceModel(),
                "/dashboard",
                "Review & Close",
                "high"
            );
        }
        
        log.info("Task {} completed by technician {}", taskId, technicianId);

        return TaskOperationResponse.builder()
                .taskId(taskId)
                .status("COMPLETED")
                .message("Repair completed successfully")
                .success(true)
                .build();
    }

    /**
     * Technician escalates task to Sales Rep (SIMPLE: just reason)
     */
    @Transactional
    public TaskOperationResponse escalateTask(Long taskId, EscalateTaskDTO dto, Long technicianId) {
        log.info("Technician {} escalating task {}", technicianId, taskId);

        RepairTask task = repairTaskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        // Validate technician
        if (task.getAssignedTechnician() == null || !task.getAssignedTechnician().getId().equals(technicianId)) {
            throw new RuntimeException("Task not assigned to this technician");
        }

        if (!"IN_PROGRESS".equals(task.getStatus())) {
            throw new RuntimeException("Task must be in progress to escalate. Current status: " + task.getStatus());
        }

        task.setStatus("ESCALATED");
        task.setIsEscalated(true);
        task.setEscalationNote(dto != null ? dto.getReason() : "Escalated by technician");
        task.setEscalatedAt(LocalDateTime.now());
        repairTaskRepository.save(task);

        if (task.getCreatedBySalesRep() != null) {
            notificationService.sendNotificationToUser(
                task.getCreatedBySalesRep().getId(),
                "task-escalated",
                "Task Escalated",
                "Task for " + task.getDeviceModel() + " was escalated. Reason: " + task.getEscalationNote(),
                "/dashboard",
                "Review Escalation",
                "high"
            );
        }
        
        log.info("Task {} escalated with reason: {}", taskId, task.getEscalationNote());

        return TaskOperationResponse.builder()
                .taskId(taskId)
                .status("ESCALATED")
                .message("Task escalated to Sales Rep")
                .success(true)
                .build();
    }

    /**
     * Sales Rep records customer feedback and closes task
     * Automatically creates RepairCase for performance tracking
     */
    @Transactional
    public TaskOperationResponse recordFeedback(Long taskId, RecordFeedbackDTO dto, Long salesRepId) {
        log.info("Sales Rep {} recording feedback for task {}", salesRepId, taskId);

        RepairTask task = repairTaskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        // Validate Sales Rep owns this task
        if (!task.getCreatedBySalesRep().getId().equals(salesRepId)) {
            throw new RuntimeException("Task not created by this Sales Rep");
        }

        if (!"COMPLETED".equals(task.getStatus()) && !"ESCALATED".equals(task.getStatus())) {
            throw new RuntimeException("Task must be completed or escalated before closing. Current status: " + task.getStatus());
        }

        // Update task with feedback
        task.setStatus("CLOSED");
        task.setCustomerSatisfied(dto.getSatisfied());
        task.setCustomerFeedback(dto.getComments());
        repairTaskRepository.save(task);

        // Auto-create RepairCase for performance tracking
        createRepairCaseFromTask(task);

        log.info("Task {} closed with feedback. Customer satisfied: {}", taskId, dto.getSatisfied());

        return TaskOperationResponse.builder()
                .taskId(taskId)
                .status("CLOSED")
                .message("Feedback recorded and task closed. RepairCase created for performance tracking.")
                .success(true)
                .build();
    }

    /**
     * Sales Rep reassigns task to different technician
     */
    @Transactional
    public TaskOperationResponse reassignTask(Long taskId, ReassignTaskDTO dto, Long salesRepId) {
        log.info("Sales Rep {} reassigning task {} to technician {}", salesRepId, taskId, dto.getNewTechnicianId());

        RepairTask task = repairTaskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        // Validate Sales Rep owns this task
        if (!task.getCreatedBySalesRep().getId().equals(salesRepId)) {
            throw new RuntimeException("Task not created by this Sales Rep");
        }

        // Get new technician
        User newTechnician = userRepository.findById(dto.getNewTechnicianId())
                .orElseThrow(() -> new RuntimeException("Technician not found"));

        if (!"technician".equalsIgnoreCase(newTechnician.getRole())) {
            throw new RuntimeException("Selected user is not a technician");
        }

        // Update task
        task.setAssignedTechnician(newTechnician);
        task.setStatus("ASSIGNED");
        task.setAssignedAt(LocalDateTime.now());
        
        // Clear escalation if task was escalated
        if (Boolean.TRUE.equals(task.getIsEscalated())) {
            task.setIsEscalated(false);
            // Keep escalationNote for history
        }

        // Clear previous work details for fresh start
        task.setStartedAt(null);
        task.setCompletedAt(null);
        task.setRepairAction(null);
        task.setRepairResult(null);
        
        repairTaskRepository.save(task);

        notificationService.sendNotificationToUser(
            newTechnician.getId(),
            "task-assigned",
            "Reassigned Task",
            "You have been reassigned a repair task for " + task.getDeviceModel(),
            "/repair-tasks",
            "View Task",
            "high"
        );
        
        log.info("Task {} reassigned to technician {}", taskId, newTechnician.getFullName());

        return TaskOperationResponse.builder()
                .taskId(taskId)
                .status("ASSIGNED")
                .message("Task reassigned to " + newTechnician.getFullName())
                .success(true)
                .build();
    }

    /**
     * Get all repair tasks (optionally filtered by status)
     */
    @Transactional(readOnly = true)
    public List<RepairTaskResponse> getAllTasks(String status) {
        List<RepairTask> tasks;
        if (status != null && !status.isEmpty()) {
            tasks = repairTaskRepository.findByStatus(status);
        } else {
            tasks = repairTaskRepository.findAll();
        }
        return tasks.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    /**
     * Get a single repair task by ID
     */
    @Transactional(readOnly = true)
    public RepairTaskResponse getTaskById(Long id) {
        RepairTask task = repairTaskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found with id: " + id));
        return mapToResponse(task);
    }

    /**
     * Get tasks created by a Sales Rep (optionally filtered by status)
     */
    @Transactional(readOnly = true)
    public List<RepairTaskResponse> getTasksBySalesRep(Long salesRepId, String status) {
        User salesRep = userRepository.findById(salesRepId)
                .orElseThrow(() -> new RuntimeException("Sales Rep not found"));

        List<RepairTask> tasks;
        if (status != null && !status.isEmpty()) {
            tasks = repairTaskRepository.findByCreatedBySalesRepAndStatusOrderByCreatedAtDesc(salesRep, status);
        } else {
            tasks = repairTaskRepository.findByCreatedBySalesRepOrderByCreatedAtDesc(salesRep);
        }

        return tasks.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    /**
     * Get tasks assigned to a Technician (optionally filtered by status)
     */
    @Transactional(readOnly = true)
    public List<RepairTaskResponse> getTasksByTechnician(Long technicianId, String status) {
        User technician = userRepository.findById(technicianId)
                .orElseThrow(() -> new RuntimeException("Technician not found"));

        List<RepairTask> tasks;
        if (status != null && !status.isEmpty()) {
            tasks = repairTaskRepository.findByAssignedTechnicianAndStatusOrderByCreatedAtDesc(technician, status);
        } else {
            tasks = repairTaskRepository.findByAssignedTechnicianOrderByCreatedAtDesc(technician);
        }

        return tasks.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    /**
     * Auto-create RepairCase from completed task for performance tracking
     */
    private void createRepairCaseFromTask(RepairTask task) {
        RepairCase repairCase = RepairCase.builder()
                .repairTicket(task)
                .deviceType(task.getDeviceType())
                .brand(task.getDeviceBrand())
                .model(task.getDeviceModel())
                .repairAction(task.getRepairAction())
                .repairResult(task.getRepairResult())
                .repairStatus(Boolean.TRUE.equals(task.getCustomerSatisfied()) ? "SUCCESS" : "FAILED")
                .returnedAfterRepair(!Boolean.TRUE.equals(task.getCustomerSatisfied()))
                .repairDurationMinutes(task.getRepairDurationMinutes())
                .technician(task.getAssignedTechnician())
                .repairDate(task.getCompletedAt())
                .technicianNotes(task.getCustomerFeedback())
                .build();

        repairCaseRepository.save(repairCase);
        log.info("RepairCase created for task {} for performance tracking", task.getId());
    }

    /**
     * Map RepairTask to Response DTO
     */
    private RepairTaskResponse mapToResponse(RepairTask task) {
        return RepairTaskResponse.builder()
                .id(task.getId())
                .customerName(task.getCustomerName())
                .customerEmail(task.getCustomerEmail())
                .customerPhone(task.getCustomerPhone())
                .deviceType(task.getDeviceType())
                .deviceBrand(task.getDeviceBrand())
                .deviceModel(task.getDeviceModel())
                .repairNote(task.getRepairNote())
                .status(task.getStatus())
                .createdBySalesRepId(task.getCreatedBySalesRep() != null ? task.getCreatedBySalesRep().getId() : null)
                .createdBySalesRepName(task.getCreatedBySalesRep() != null ? task.getCreatedBySalesRep().getFullName() : null)
                .assignedTechnicianId(task.getAssignedTechnician() != null ? task.getAssignedTechnician().getId() : null)
                .assignedTechnicianName(task.getAssignedTechnician() != null ? task.getAssignedTechnician().getFullName() : null)
                .createdAt(task.getCreatedAt())
                .assignedAt(task.getAssignedAt())
                .startedAt(task.getStartedAt())
                .completedAt(task.getCompletedAt())
                .repairAction(task.getRepairAction())
                .repairResult(task.getRepairResult())
                .repairDurationMinutes(task.getRepairDurationMinutes())
                .isEscalated(task.getIsEscalated())
                .escalationNote(task.getEscalationNote())
                .escalatedAt(task.getEscalatedAt())
                .customerSatisfied(task.getCustomerSatisfied())
                .customerFeedback(task.getCustomerFeedback())
                .build();
    }
}
