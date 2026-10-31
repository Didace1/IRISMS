package com.aidevice.smartfix.service;

import com.aidevice.smartfix.dto.TechnicianPerformanceDTO.*;
import com.aidevice.smartfix.model.RepairCase;
import com.aidevice.smartfix.model.User;
import com.aidevice.smartfix.repository.RepairCaseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for calculating technician performance metrics
 * Supports Phase 3: Performance Dashboard
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TechnicianPerformanceService {

    private final RepairCaseRepository repairCaseRepository;

    /**
     * Get complete performance dashboard
     */
    @Transactional(readOnly = true)
    public PerformanceDashboard getPerformanceDashboard() {
        log.info("Generating performance dashboard");

        List<RepairCase> allCases = repairCaseRepository.findAll();
        
        OverallStats overallStats = calculateOverallStats(allCases);
        List<TechnicianStats> leaderboard = calculateTechnicianLeaderboard(allCases);
        List<RepairTrend> trends = calculateRepairTrends(allCases, 30); // Last 30 days
        List<DeviceTypeStats> deviceStats = calculateDeviceTypeStats(allCases);

        return PerformanceDashboard.builder()
                .overallStats(overallStats)
                .technicianLeaderboard(leaderboard)
                .repairTrends(trends)
                .deviceTypeStats(deviceStats)
                .generatedAt(LocalDateTime.now())
                .build();
    }

    /**
     * Get detailed performance for a specific technician
     */
    @Transactional(readOnly = true)
    public TechnicianDetailedPerformance getTechnicianPerformance(Long technicianId) {
        log.info("Getting detailed performance for technician {}", technicianId);

        List<RepairCase> allCases = repairCaseRepository.findAll();
        List<RepairCase> technicianCases = allCases.stream()
                .filter(rc -> rc.getTechnician() != null && rc.getTechnician().getId().equals(technicianId))
                .collect(Collectors.toList());

        TechnicianStats stats = calculateTechnicianStats(technicianId, technicianCases, allCases);
        List<RepairTrend> personalTrends = calculateRepairTrends(technicianCases, 30);
        List<DeviceTypeStats> deviceBreakdown = calculateDeviceTypeStats(technicianCases);
        List<RecentRepair> recentRepairs = getRecentRepairs(technicianCases, 10);

        return TechnicianDetailedPerformance.builder()
                .stats(stats)
                .personalTrends(personalTrends)
                .deviceTypeBreakdown(deviceBreakdown)
                .recentRepairs(recentRepairs)
                .build();
    }

    /**
     * Calculate overall statistics
     */
    private OverallStats calculateOverallStats(List<RepairCase> allCases) {
        if (allCases.isEmpty()) {
            return OverallStats.builder()
                    .totalTechnicians(0)
                    .totalRepairsCompleted(0)
                    .overallSuccessRate(0.0)
                    .overallCustomerSatisfactionRate(0.0)
                    .averageRepairTimeMinutes(0)
                    .totalRepairTimeHours(0)
                    .repairsCompletedToday(0)
                    .repairsCompletedThisWeek(0)
                    .repairsCompletedThisMonth(0)
                    .returnRate(0.0)
                    .build();
        }

        LocalDate today = LocalDate.now();
        LocalDate weekAgo = today.minusDays(7);
        LocalDate monthAgo = today.minusDays(30);

        int totalRepairs = allCases.size();
        long successfulRepairs = allCases.stream()
                .filter(rc -> "SUCCESS".equalsIgnoreCase(rc.getRepairStatus()))
                .count();
        
        long returnedRepairs = allCases.stream()
                .filter(RepairCase::isReturnedAfterRepair)
                .count();

        int totalRepairTime = allCases.stream()
                .filter(rc -> rc.getRepairDurationMinutes() != null)
                .mapToInt(RepairCase::getRepairDurationMinutes)
                .sum();

        int avgRepairTime = allCases.stream()
                .filter(rc -> rc.getRepairDurationMinutes() != null)
                .mapToInt(RepairCase::getRepairDurationMinutes)
                .average()
                .orElse(0.0) > 0 ? (int) allCases.stream()
                .filter(rc -> rc.getRepairDurationMinutes() != null)
                .mapToInt(RepairCase::getRepairDurationMinutes)
                .average()
                .orElse(0.0) : 0;

        long repairsToday = allCases.stream()
                .filter(rc -> rc.getRepairDate() != null && rc.getRepairDate().toLocalDate().equals(today))
                .count();

        long repairsThisWeek = allCases.stream()
                .filter(rc -> rc.getRepairDate() != null && !rc.getRepairDate().toLocalDate().isBefore(weekAgo))
                .count();

        long repairsThisMonth = allCases.stream()
                .filter(rc -> rc.getRepairDate() != null && !rc.getRepairDate().toLocalDate().isBefore(monthAgo))
                .count();

        Set<Long> uniqueTechnicians = allCases.stream()
                .filter(rc -> rc.getTechnician() != null)
                .map(rc -> rc.getTechnician().getId())
                .collect(Collectors.toSet());

        double successRate = (successfulRepairs * 100.0) / totalRepairs;
        double returnRate = (returnedRepairs * 100.0) / totalRepairs;
        double satisfactionRate = ((totalRepairs - returnedRepairs) * 100.0) / totalRepairs;

        return OverallStats.builder()
                .totalTechnicians(uniqueTechnicians.size())
                .totalRepairsCompleted(totalRepairs)
                .overallSuccessRate(Math.round(successRate * 100.0) / 100.0)
                .overallCustomerSatisfactionRate(Math.round(satisfactionRate * 100.0) / 100.0)
                .averageRepairTimeMinutes(avgRepairTime)
                .totalRepairTimeHours(totalRepairTime / 60)
                .repairsCompletedToday((int) repairsToday)
                .repairsCompletedThisWeek((int) repairsThisWeek)
                .repairsCompletedThisMonth((int) repairsThisMonth)
                .returnRate(Math.round(returnRate * 100.0) / 100.0)
                .build();
    }

    /**
     * Calculate technician leaderboard
     */
    private List<TechnicianStats> calculateTechnicianLeaderboard(List<RepairCase> allCases) {
        Map<Long, List<RepairCase>> casesByTechnician = allCases.stream()
                .filter(rc -> rc.getTechnician() != null)
                .collect(Collectors.groupingBy(rc -> rc.getTechnician().getId()));

        List<TechnicianStats> leaderboard = casesByTechnician.entrySet().stream()
                .map(entry -> calculateTechnicianStats(entry.getKey(), entry.getValue(), allCases))
                .sorted(Comparator.comparingDouble(TechnicianStats::getSuccessRate).reversed()
                        .thenComparingInt(TechnicianStats::getTotalRepairs).reversed())
                .collect(Collectors.toList());

        // Assign ranks
        for (int i = 0; i < leaderboard.size(); i++) {
            leaderboard.get(i).setRank(i + 1);
        }

        return leaderboard;
    }

    /**
     * Calculate stats for a single technician
     */
    private TechnicianStats calculateTechnicianStats(Long technicianId, List<RepairCase> technicianCases, List<RepairCase> allCases) {
        if (technicianCases.isEmpty()) {
            return TechnicianStats.builder()
                    .technicianId(technicianId)
                    .technicianName("Unknown")
                    .totalRepairs(0)
                    .successRate(0.0)
                    .build();
        }

        User technician = technicianCases.get(0).getTechnician();
        String technicianName = technician != null ? technician.getFullName() : "Unknown";

        int totalRepairs = technicianCases.size();
        int successfulRepairs = (int) technicianCases.stream()
                .filter(rc -> "SUCCESS".equalsIgnoreCase(rc.getRepairStatus()))
                .count();
        int failedRepairs = (int) technicianCases.stream()
                .filter(rc -> "FAILED".equalsIgnoreCase(rc.getRepairStatus()))
                .count();
        int partialRepairs = (int) technicianCases.stream()
                .filter(rc -> "PARTIAL".equalsIgnoreCase(rc.getRepairStatus()))
                .count();

        int returnedRepairs = (int) technicianCases.stream()
                .filter(RepairCase::isReturnedAfterRepair)
                .count();
        int satisfiedCustomers = totalRepairs - returnedRepairs;

        int totalRepairTime = technicianCases.stream()
                .filter(rc -> rc.getRepairDurationMinutes() != null)
                .mapToInt(RepairCase::getRepairDurationMinutes)
                .sum();

        int avgRepairTime = technicianCases.stream()
                .filter(rc -> rc.getRepairDurationMinutes() != null)
                .mapToInt(RepairCase::getRepairDurationMinutes)
                .average()
                .orElse(0.0) > 0 ? (int) technicianCases.stream()
                .filter(rc -> rc.getRepairDurationMinutes() != null)
                .mapToInt(RepairCase::getRepairDurationMinutes)
                .average()
                .orElse(0.0) : 0;

        LocalDate weekAgo = LocalDate.now().minusDays(7);
        LocalDate monthAgo = LocalDate.now().minusDays(30);

        int repairsThisWeek = (int) technicianCases.stream()
                .filter(rc -> rc.getRepairDate() != null && !rc.getRepairDate().toLocalDate().isBefore(weekAgo))
                .count();

        int repairsThisMonth = (int) technicianCases.stream()
                .filter(rc -> rc.getRepairDate() != null && !rc.getRepairDate().toLocalDate().isBefore(monthAgo))
                .count();

        double successRate = (successfulRepairs * 100.0) / totalRepairs;
        double satisfactionRate = (satisfiedCustomers * 100.0) / totalRepairs;
        double returnRate = (returnedRepairs * 100.0) / totalRepairs;

        String performanceLevel = determinePerformanceLevel(successRate, satisfactionRate);

        return TechnicianStats.builder()
                .technicianId(technicianId)
                .technicianName(technicianName)
                .totalRepairs(totalRepairs)
                .successfulRepairs(successfulRepairs)
                .failedRepairs(failedRepairs)
                .partialRepairs(partialRepairs)
                .successRate(Math.round(successRate * 100.0) / 100.0)
                .customerSatisfiedCount(satisfiedCustomers)
                .customerUnsatisfiedCount(returnedRepairs)
                .customerSatisfactionRate(Math.round(satisfactionRate * 100.0) / 100.0)
                .averageRepairTimeMinutes(avgRepairTime)
                .totalRepairTimeMinutes(totalRepairTime)
                .returnedRepairs(returnedRepairs)
                .returnRate(Math.round(returnRate * 100.0) / 100.0)
                .repairsThisWeek(repairsThisWeek)
                .repairsThisMonth(repairsThisMonth)
                .performanceLevel(performanceLevel)
                .build();
    }

    /**
     * Determine performance level
     */
    private String determinePerformanceLevel(double successRate, double satisfactionRate) {
        double avgScore = (successRate + satisfactionRate) / 2;
        
        if (avgScore >= 90) return "EXCELLENT";
        if (avgScore >= 75) return "GOOD";
        if (avgScore >= 60) return "AVERAGE";
        return "NEEDS_IMPROVEMENT";
    }

    /**
     * Calculate repair trends over time
     */
    private List<RepairTrend> calculateRepairTrends(List<RepairCase> cases, int days) {
        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusDays(days - 1);

        Map<LocalDate, List<RepairCase>> casesByDate = cases.stream()
                .filter(rc -> rc.getRepairDate() != null)
                .filter(rc -> !rc.getRepairDate().toLocalDate().isBefore(startDate))
                .collect(Collectors.groupingBy(rc -> rc.getRepairDate().toLocalDate()));

        List<RepairTrend> trends = new ArrayList<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");

        for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
            List<RepairCase> dayCases = casesByDate.getOrDefault(date, Collections.emptyList());
            
            int total = dayCases.size();
            int successful = (int) dayCases.stream()
                    .filter(rc -> "SUCCESS".equalsIgnoreCase(rc.getRepairStatus()))
                    .count();
            int failed = (int) dayCases.stream()
                    .filter(rc -> "FAILED".equalsIgnoreCase(rc.getRepairStatus()))
                    .count();

            double successRate = total > 0 ? (successful * 100.0) / total : 0.0;

            trends.add(RepairTrend.builder()
                    .date(date.format(formatter))
                    .totalRepairs(total)
                    .successfulRepairs(successful)
                    .failedRepairs(failed)
                    .successRate(Math.round(successRate * 100.0) / 100.0)
                    .build());
        }

        return trends;
    }

    /**
     * Calculate device type statistics
     */
    private List<DeviceTypeStats> calculateDeviceTypeStats(List<RepairCase> cases) {
        Map<String, List<RepairCase>> casesByDevice = cases.stream()
                .collect(Collectors.groupingBy(RepairCase::getDeviceType));

        return casesByDevice.entrySet().stream()
                .map(entry -> {
                    String deviceType = entry.getKey();
                    List<RepairCase> deviceCases = entry.getValue();

                    int total = deviceCases.size();
                    int successful = (int) deviceCases.stream()
                            .filter(rc -> "SUCCESS".equalsIgnoreCase(rc.getRepairStatus()))
                            .count();

                    int avgTime = deviceCases.stream()
                            .filter(rc -> rc.getRepairDurationMinutes() != null)
                            .mapToInt(RepairCase::getRepairDurationMinutes)
                            .average()
                            .orElse(0.0) > 0 ? (int) deviceCases.stream()
                            .filter(rc -> rc.getRepairDurationMinutes() != null)
                            .mapToInt(RepairCase::getRepairDurationMinutes)
                            .average()
                            .orElse(0.0) : 0;

                    double successRate = (successful * 100.0) / total;

                    return DeviceTypeStats.builder()
                            .deviceType(deviceType)
                            .totalRepairs(total)
                            .successfulRepairs(successful)
                            .successRate(Math.round(successRate * 100.0) / 100.0)
                            .averageRepairTimeMinutes(avgTime)
                            .build();
                })
                .sorted(Comparator.comparingInt(DeviceTypeStats::getTotalRepairs).reversed())
                .collect(Collectors.toList());
    }

    /**
     * Get recent repairs
     */
    private List<RecentRepair> getRecentRepairs(List<RepairCase> cases, int limit) {
        return cases.stream()
                .sorted(Comparator.comparing(RepairCase::getRepairDate).reversed())
                .limit(limit)
                .map(rc -> RecentRepair.builder()
                        .caseId(rc.getCaseId())
                        .deviceType(rc.getDeviceType())
                        .brand(rc.getBrand())
                        .model(rc.getModel())
                        .repairStatus(rc.getRepairStatus())
                        .customerSatisfied(!rc.isReturnedAfterRepair())
                        .repairDurationMinutes(rc.getRepairDurationMinutes())
                        .repairDate(rc.getRepairDate())
                        .solutionSummary(rc.getRepairAction()) // Changed from getSolutionSummary to getRepairAction
                        .build())
                .collect(Collectors.toList());
    }
}
