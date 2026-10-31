package com.aidevice.smartfix.repository;

import com.aidevice.smartfix.model.Category;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CategoryRepository extends JpaRepository<Category, Long> {
    Optional<Category> findByNameIgnoreCase(String name);
    Optional<Category> findByName(String name);
}
