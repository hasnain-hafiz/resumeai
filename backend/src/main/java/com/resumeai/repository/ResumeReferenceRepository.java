package com.resumeai.repository;

import com.resumeai.entity.Resume;
import com.resumeai.entity.ResumeReference;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ResumeReferenceRepository extends JpaRepository<ResumeReference, UUID> {
    List<ResumeReference> findByResumeOrderBySortOrderAsc(Resume resume);
}
