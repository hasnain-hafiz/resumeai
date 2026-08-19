package com.resumeai.repository;

import com.resumeai.entity.Resume;
import com.resumeai.entity.ResumeExperience;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ResumeExperienceRepository extends JpaRepository<ResumeExperience, UUID> {
    List<ResumeExperience> findByResumeOrderBySortOrderAsc(Resume resume);
}
