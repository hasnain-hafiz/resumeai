package com.resumeai.repository;

import com.resumeai.entity.Resume;
import com.resumeai.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ResumeRepository extends JpaRepository<Resume, UUID> {
    long countByUser(User user);
}
