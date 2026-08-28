package com.resumeai.repository;

import com.resumeai.entity.ResumeTemplate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ResumeTemplateRepository extends JpaRepository<ResumeTemplate, UUID> {
    List<ResumeTemplate> findByActiveTrueOrderBySortOrderAsc();
}
