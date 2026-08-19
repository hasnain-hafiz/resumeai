package com.resumeai.repository;

import com.resumeai.entity.Resume;
import com.resumeai.entity.ResumePublication;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ResumePublicationRepository extends JpaRepository<ResumePublication, UUID> {
    List<ResumePublication> findByResumeOrderBySortOrderAsc(Resume resume);
}
