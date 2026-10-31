package com.aidevice.smartfix.controller;

import com.aidevice.smartfix.model.SparePartRequest;
import com.aidevice.smartfix.repository.SparePartRequestRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import com.aidevice.smartfix.service.NotificationService;

@RestController
@RequestMapping("/api/spare-part-requests")
public class SparePartRequestController {

    private final SparePartRequestRepository sparePartRequestRepository;
    private final NotificationService notificationService;

    public SparePartRequestController(SparePartRequestRepository sparePartRequestRepository, NotificationService notificationService) {
        this.sparePartRequestRepository = sparePartRequestRepository;
        this.notificationService = notificationService;
    }

    @GetMapping
    public List<SparePartRequest> getAllRequests() {
        return sparePartRequestRepository.findAll();
    }

    @GetMapping("/pending")
    public List<SparePartRequest> getPendingRequests() {
        return sparePartRequestRepository.findPendingRequestsByPriority();
    }

    @GetMapping("/active")
    public List<SparePartRequest> getActiveRequests() {
        return sparePartRequestRepository.findActiveRequests();
    }

    @GetMapping("/{id}")
    public ResponseEntity<SparePartRequest> getRequestById(@PathVariable Long id) {
        Optional<SparePartRequest> request = sparePartRequestRepository.findById(id);
        return request.map(ResponseEntity::ok)
                     .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<SparePartRequest> createRequest(@RequestBody SparePartRequest request) {
        try {
            // Validate required fields
            if (request.getPartName() == null || request.getPartName().trim().isEmpty()) {
                return ResponseEntity.badRequest().build();
            }
            if (request.getDeviceType() == null || request.getDeviceType().trim().isEmpty()) {
                return ResponseEntity.badRequest().build();
            }
            if (request.getQuantity() == null || request.getQuantity() <= 0) {
                return ResponseEntity.badRequest().build();
            }

            // Set defaults
            if (request.getStatus() == null) {
                request.setStatus("PENDING");
            }
            if (request.getPriority() == null) {
                request.setPriority("MEDIUM");
            }
            if (request.getRequestedBy() == null) {
                request.setRequestedBy("System User");
            }

            SparePartRequest savedRequest = sparePartRequestRepository.save(request);
            
            if (savedRequest.getSupplier() != null) {
                notificationService.sendNotificationToFullName(
                    savedRequest.getSupplier(),
                    "part-requested",
                    "New Part Request",
                    "Technician " + savedRequest.getRequestedBy() + " has requested " + savedRequest.getQuantity() + "x " + savedRequest.getPartName(),
                    "/spare-part-requests",
                    "Review Request",
                    "high"
                );
            }
            
            return ResponseEntity.status(HttpStatus.CREATED).body(savedRequest);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<SparePartRequest> updateRequest(@PathVariable Long id, @RequestBody SparePartRequest updatedRequest) {
        Optional<SparePartRequest> existingRequest = sparePartRequestRepository.findById(id);
        
        if (existingRequest.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        SparePartRequest request = existingRequest.get();
        
        // Update fields
        if (updatedRequest.getPartName() != null) {
            request.setPartName(updatedRequest.getPartName());
        }
        if (updatedRequest.getDeviceType() != null) {
            request.setDeviceType(updatedRequest.getDeviceType());
        }
        if (updatedRequest.getDeviceModel() != null) {
            request.setDeviceModel(updatedRequest.getDeviceModel());
        }
        if (updatedRequest.getQuantity() != null) {
            request.setQuantity(updatedRequest.getQuantity());
        }
        if (updatedRequest.getPriority() != null) {
            request.setPriority(updatedRequest.getPriority());
        }
        if (updatedRequest.getDescription() != null) {
            request.setDescription(updatedRequest.getDescription());
        }
        if (updatedRequest.getJustification() != null) {
            request.setJustification(updatedRequest.getJustification());
        }
        if (updatedRequest.getEstimatedCost() != null) {
            request.setEstimatedCost(updatedRequest.getEstimatedCost());
        }
        if (updatedRequest.getSupplier() != null) {
            request.setSupplier(updatedRequest.getSupplier());
        }
        if (updatedRequest.getNotes() != null) {
            request.setNotes(updatedRequest.getNotes());
        }
        if (updatedRequest.getExpectedDelivery() != null) {
            request.setExpectedDelivery(updatedRequest.getExpectedDelivery());
        }

        SparePartRequest savedRequest = sparePartRequestRepository.save(request);
        return ResponseEntity.ok(savedRequest);
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<SparePartRequest> approveRequest(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Optional<SparePartRequest> existingRequest = sparePartRequestRepository.findById(id);
        
        if (existingRequest.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        SparePartRequest request = existingRequest.get();
        request.setStatus("APPROVED");
        request.setApprovedAt(LocalDateTime.now());
        
        if (body.containsKey("approvedBy")) {
            request.setApprovedBy((String) body.get("approvedBy"));
        }
        if (body.containsKey("estimatedCost")) {
            request.setEstimatedCost(Double.valueOf(body.get("estimatedCost").toString()));
        }
        if (body.containsKey("supplier")) {
            request.setSupplier((String) body.get("supplier"));
        }
        if (body.containsKey("expectedDelivery")) {
            request.setExpectedDelivery(LocalDateTime.parse((String) body.get("expectedDelivery")));
        }
        if (body.containsKey("notes")) {
            request.setNotes((String) body.get("notes"));
        }

        SparePartRequest savedRequest = sparePartRequestRepository.save(request);

        if (savedRequest.getRequestedBy() != null) {
            notificationService.sendNotificationToFullName(
                savedRequest.getRequestedBy(),
                "part-approved",
                "Part Request Approved",
                "Your request for " + savedRequest.getQuantity() + "x " + savedRequest.getPartName() + " has been approved.",
                "/request-parts",
                "View Request",
                "high"
            );
        }

        return ResponseEntity.ok(savedRequest);
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<SparePartRequest> rejectRequest(@PathVariable Long id, @RequestBody Map<String, String> body) {
        Optional<SparePartRequest> existingRequest = sparePartRequestRepository.findById(id);
        
        if (existingRequest.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        SparePartRequest request = existingRequest.get();
        request.setStatus("REJECTED");
        
        if (body.containsKey("rejectionReason")) {
            request.setNotes(body.get("rejectionReason"));
        }
        if (body.containsKey("rejectedBy")) {
            request.setApprovedBy(body.get("rejectedBy"));
        }

        SparePartRequest savedRequest = sparePartRequestRepository.save(request);

        if (savedRequest.getRequestedBy() != null) {
            notificationService.sendNotificationToFullName(
                savedRequest.getRequestedBy(),
                "part-rejected",
                "Part Request Rejected",
                "Your request for " + savedRequest.getQuantity() + "x " + savedRequest.getPartName() + " was rejected. Reason: " + savedRequest.getNotes(),
                "/request-parts",
                "View Details",
                "high"
            );
        }

        return ResponseEntity.ok(savedRequest);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<SparePartRequest> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        Optional<SparePartRequest> existingRequest = sparePartRequestRepository.findById(id);
        
        if (existingRequest.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        String newStatus = body.get("status");
        if (newStatus == null || newStatus.trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        SparePartRequest request = existingRequest.get();
        request.setStatus(newStatus.toUpperCase());

        SparePartRequest savedRequest = sparePartRequestRepository.save(request);

        if (savedRequest.getRequestedBy() != null) {
            notificationService.sendNotificationToFullName(
                savedRequest.getRequestedBy(),
                "part-status",
                "Part Status Updated",
                "Your request for " + savedRequest.getPartName() + " is now " + savedRequest.getStatus() + ".",
                "/request-parts",
                "View Request",
                "medium"
            );
        }

        return ResponseEntity.ok(savedRequest);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRequest(@PathVariable Long id) {
        if (!sparePartRequestRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }

        sparePartRequestRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}