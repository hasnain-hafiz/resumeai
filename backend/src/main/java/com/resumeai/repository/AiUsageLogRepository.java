package com.resumeai.repository;

import com.resumeai.entity.AiUsageLog;
import com.resumeai.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.UUID;

public interface AiUsageLogRepository extends JpaRepository<AiUsageLog, UUID> {
    long countByUserAndCreatedAtAfter(User user, Instant since);
}
