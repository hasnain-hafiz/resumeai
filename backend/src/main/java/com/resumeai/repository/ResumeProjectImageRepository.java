package com.resumeai.repository;

import com.resumeai.entity.ResumeProject;
import com.resumeai.entity.ResumeProjectImage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ResumeProjectImageRepository extends JpaRepository<ResumeProjectImage, UUID> {
    List<ResumeProjectImage> findByProjectOrderBySortOrderAsc(ResumeProject project);
}
