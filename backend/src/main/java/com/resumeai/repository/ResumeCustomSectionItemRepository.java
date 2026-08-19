package com.resumeai.repository;

import com.resumeai.entity.ResumeCustomSection;
import com.resumeai.entity.ResumeCustomSectionItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ResumeCustomSectionItemRepository extends JpaRepository<ResumeCustomSectionItem, UUID> {
    List<ResumeCustomSectionItem> findByCustomSectionOrderBySortOrderAsc(ResumeCustomSection customSection);
}
