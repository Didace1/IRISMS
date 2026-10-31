package com.aidevice.smartfix.controller;

import com.aidevice.smartfix.dto.TechnicianPerformanceDTO.*;
import com.aidevice.smartfix.service.PerformanceSeederService;
import com.aidevice.smartfix.service.TechnicianPerformanceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * REST Controller for Technician Performance Dashboard
 * Phase 3: Performance Tracking and Analytics
 */
@RestController
@RequestMapping("/api/performance")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
public class PerformanceController {

    private final TechnicianPerformanceService performanceService;
    private final PerformanceSeederService seederService;

    /**
     * Get complete performance dashboard
     * GET /api/performance/dashboard
     */
    @GetMapping("/dashboard")
    public ResponseEntity<PerformanceDashboard> getPerformanceDashboard() {
        log.info("Fetching performance dashboard");
        PerformanceDashboard dashboard = performanceService.getPerformanceDashboard();
        return ResponseEntity.ok(dashboard);
    }

    /**
     * Get detailed performance for a specific technician
     * GET /api/performance/technician/{id}
     */
    @GetMapping("/technician/{id}")
    public ResponseEntity<TechnicianDetailedPerformance> getTechnicianPerformance(@PathVariable Long id) {
        log.info("Fetching performance for technician {}", id);
        TechnicianDetailedPerformance performance = performanceService.getTechnicianPerformance(id);
        return ResponseEntity.ok(performance);
    }

    /**
     * Seed demo repair case data (admin/dev only)
     * POST /api/performance/seed-demo-data
     */
    @PostMapping("/seed-demo-data")
    public ResponseEntity<Map<String, Object>> seedDemoData() {
        log.info("Seeding demo performance data");
        return ResponseEntity.ok(seederService.seedDemoData());
    }

    /**
     * Clear all repair case data (admin/dev only)
     * DELETE /api/performance/clear-demo-data
     */
    @DeleteMapping("/clear-demo-data")
    public ResponseEntity<Map<String, Object>> clearDemoData() {
        log.info("Clearing demo performance data");
        return ResponseEntity.ok(seederService.clearDemoData());
    }
}
