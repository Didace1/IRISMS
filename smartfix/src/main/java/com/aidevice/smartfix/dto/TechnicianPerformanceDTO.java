package com.aidevice.smartfix.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTOs for Technician Performance Dashboard
 */
public class TechnicianPerformanceDTO {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TechnicianStats {
        private Long technicianId;
        private String technicianName;
        private Integer totalRepairs;
        private Integer successfulRepairs;
        private Integer failedRepairs;
        private Integer partialRepairs;
        private Double successRate;
        private Integer customerSatisfiedCount;
        private Integer customerUnsatisfiedCount;
        private Double customerSatisfactionRate;
        private Integer averageRepairTimeMinutes;
        private Integer totalRepairTimeMinutes;
        private Integer returnedRepairs;
        private Double returnRate;
        private Integer repairsThisWeek;
        private Integer repairsThisMonth;
        private String performanceLevel; // EXCELLENT, GOOD, AVERAGE, NEEDS_IMPROVEMENT
        private Integer rank; // Leaderboard position
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OverallStats {
        private Integer totalTechnicians;
        private Integer totalRepairsCompleted;
        private Double overallSuccessRate;
        private Double overallCustomerSatisfactionRate;
        private Integer averageRepairTimeMinutes;
        private Integer totalRepairTimeHours;
        private Integer repairsCompletedToday;
        private Integer repairsCompletedThisWeek;
        private Integer repairsCompletedThisMonth;
        private Double returnRate;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RepairTrend {
        private String date; // YYYY-MM-DD
        private Integer totalRepairs;
        private Integer successfulRepairs;
        private Integer failedRepairs;
        private Double successRate;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DeviceTypeStats {
        private String deviceType;
        private Integer totalRepairs;
        private Integer successfulRepairs;
        private Double successRate;
        private Integer averageRepairTimeMinutes;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PerformanceDashboard {
        private OverallStats overallStats;
        private List<TechnicianStats> technicianLeaderboard;
        private List<RepairTrend> repairTrends;
        private List<DeviceTypeStats> deviceTypeStats;
        private LocalDateTime generatedAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TechnicianDetailedPerformance {
        private TechnicianStats stats;
        private List<RepairTrend> personalTrends;
        private List<DeviceTypeStats> deviceTypeBreakdown;
        private List<RecentRepair> recentRepairs;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecentRepair {
        private Long caseId;
        private String deviceType;
        private String brand;
        private String model;
        private String repairStatus;
        private Boolean customerSatisfied;
        private Integer repairDurationMinutes;
        private LocalDateTime repairDate;
        private String solutionSummary;
    }
}
