package com.resumeai.repository;

import com.resumeai.entity.AtsAnalysis;
import com.resumeai.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface AtsAnalysisRepository extends JpaRepository<AtsAnalysis, UUID> {
    long countByUser(User user);
}
