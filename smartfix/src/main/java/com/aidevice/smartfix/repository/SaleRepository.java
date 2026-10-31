package com.aidevice.smartfix.repository;

import com.aidevice.smartfix.model.Sale;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface SaleRepository extends JpaRepository<Sale, Long> {
    
    @EntityGraph(value = "Sale.withDetails", type = EntityGraph.EntityGraphType.LOAD)
    List<Sale> findAll();
    
    @EntityGraph(value = "Sale.withDetails", type = EntityGraph.EntityGraphType.LOAD)
    List<Sale> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end);
}
