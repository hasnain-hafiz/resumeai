package com.resumeai.repository;

import com.resumeai.entity.Resume;
import com.resumeai.entity.ResumeProject;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ResumeProjectRepository extends JpaRepository<ResumeProject, UUID> {
    List<ResumeProject> findByResumeOrderBySortOrderAsc(Resume resume);
}
