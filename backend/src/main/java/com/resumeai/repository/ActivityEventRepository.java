package com.resumeai.repository;

import com.resumeai.entity.ActivityEvent;
import com.resumeai.entity.User;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ActivityEventRepository extends JpaRepository<ActivityEvent, UUID> {
    List<ActivityEvent> findByUserOrderByCreatedAtDesc(User user, Pageable pageable);
}
