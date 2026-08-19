package com.resumeai.repository;

import com.resumeai.entity.Resume;
import com.resumeai.entity.ResumeListItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ResumeListItemRepository extends JpaRepository<ResumeListItem, UUID> {
    List<ResumeListItem> findByResumeOrderBySectionAscSortOrderAsc(Resume resume);
}
