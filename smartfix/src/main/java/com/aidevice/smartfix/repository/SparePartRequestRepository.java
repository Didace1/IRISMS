package com.aidevice.smartfix.repository;

import com.aidevice.smartfix.model.SparePartRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SparePartRequestRepository extends JpaRepository<SparePartRequest, Long> {
    
    List<SparePartRequest> findByStatus(String status);
    
    List<SparePartRequest> findByRequestedBy(String requestedBy);
    
    List<SparePartRequest> findByPriority(String priority);
    
    @Query("SELECT s FROM SparePartRequest s WHERE s.status = 'PENDING' ORDER BY s.priority DESC, s.createdAt ASC")
    List<SparePartRequest> findPendingRequestsByPriority();
    
    @Query("SELECT s FROM SparePartRequest s WHERE s.status IN ('APPROVED', 'ORDERED') ORDER BY s.expectedDelivery ASC")
    List<SparePartRequest> findActiveRequests();
}