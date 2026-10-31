package com.aidevice.smartfix.repository;

import com.aidevice.smartfix.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Optional<User> findByPhone(String phone);
    Optional<User> findByFullName(String fullName);
    List<User> findByRoleIgnoreCase(String role);
    List<User> findByApprovedFalse();
    
    @Query("SELECT COUNT(rt) FROM RepairTask rt WHERE rt.assignedTechnician.id = :userId")
    long countAssignedRepairTasks(@Param("userId") Long userId);
}