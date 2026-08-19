package com.resumeai.repository;

import com.resumeai.entity.Resume;
import com.resumeai.entity.ResumeAward;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ResumeAwardRepository extends JpaRepository<ResumeAward, UUID> {
    List<ResumeAward> findByResumeOrderBySortOrderAsc(Resume resume);
}
