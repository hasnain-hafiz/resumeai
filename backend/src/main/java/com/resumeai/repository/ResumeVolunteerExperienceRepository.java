package com.resumeai.repository;

import com.resumeai.entity.Resume;
import com.resumeai.entity.ResumeVolunteerExperience;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ResumeVolunteerExperienceRepository extends JpaRepository<ResumeVolunteerExperience, UUID> {
    List<ResumeVolunteerExperience> findByResumeOrderBySortOrderAsc(Resume resume);
}
