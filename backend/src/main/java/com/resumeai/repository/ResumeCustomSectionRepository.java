package com.resumeai.repository;

import com.resumeai.entity.Resume;
import com.resumeai.entity.ResumeCustomSection;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ResumeCustomSectionRepository extends JpaRepository<ResumeCustomSection, UUID> {
    List<ResumeCustomSection> findByResumeOrderBySortOrderAsc(Resume resume);
}
