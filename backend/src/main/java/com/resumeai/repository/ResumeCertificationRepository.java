package com.resumeai.repository;

import com.resumeai.entity.Resume;
import com.resumeai.entity.ResumeCertification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ResumeCertificationRepository extends JpaRepository<ResumeCertification, UUID> {
    List<ResumeCertification> findByResumeOrderBySortOrderAsc(Resume resume);
}
