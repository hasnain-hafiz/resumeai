package com.resumeai.service;

import com.resumeai.dto.request.resume.ListItemRequest;
import com.resumeai.dto.request.resume.ReorderListItemsRequest;
import com.resumeai.dto.response.resume.ListItemResponse;
import com.resumeai.entity.Resume;
import com.resumeai.entity.ResumeListItem;
import com.resumeai.exception.ResourceNotFoundException;
import com.resumeai.mapper.ResumeMapper;
import com.resumeai.repository.ResumeListItemRepository;
import com.resumeai.util.ReorderSupport;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ResumeListItemService {

    private final ResumeListItemRepository listItemRepository;
    private final ResumeService resumeService;
    private final ResumeMapper resumeMapper;

    @Transactional
    public ListItemResponse add(UUID resumeId, UUID userId, ListItemRequest request) {
        Resume resume = resumeService.getOwnedResumeOrThrow(resumeId, userId);
        ResumeListItem entity = ResumeListItem.builder()
            .resume(resume)
            .section(request.section())
            .value(request.value())
            // Proficiency only makes sense for spoken languages - ignore it for every other section
            // rather than trusting the client to leave it null.
            .proficiency(request.section() == ResumeListItem.Section.SPOKEN_LANGUAGE ? request.proficiency() : null)
            .sortOrder(request.sortOrder())
            .build();
        return resumeMapper.toListItemResponse(listItemRepository.save(entity));
    }

    @Transactional
    public ListItemResponse update(UUID resumeId, UUID itemId, UUID userId, ListItemRequest request) {
        ResumeListItem entity = getOwnedOrThrow(resumeId, itemId, userId);
        entity.setSection(request.section());
        entity.setValue(request.value());
        entity.setProficiency(request.section() == ResumeListItem.Section.SPOKEN_LANGUAGE ? request.proficiency() : null);
        entity.setSortOrder(request.sortOrder());
        return resumeMapper.toListItemResponse(listItemRepository.save(entity));
    }

    /**
     * Scoped to one {@link ResumeListItem.Section} at a time (e.g. just
     * TECHNICAL_SKILL) since each group renders and drags independently in
     * the UI - {@code orderedIds} only needs to (and must) cover that one
     * group's items, not every list item on the resume.
     */
    @Transactional
    public void reorder(UUID resumeId, UUID userId, ReorderListItemsRequest request) {
        Resume resume = resumeService.getOwnedResumeOrThrow(resumeId, userId);
        List<ResumeListItem> existingInGroup = listItemRepository
            .findByResumeOrderBySectionAscSortOrderAsc(resume).stream()
            .filter(item -> item.getSection() == request.section())
            .toList();

        List<ResumeListItem> ordered = ReorderSupport.reorder(existingInGroup, request.orderedIds(), ResumeListItem::getId);

        for (int i = 0; i < ordered.size(); i++) {
            ordered.get(i).setSortOrder(i);
        }
        listItemRepository.saveAll(ordered);
    }

    @Transactional
    public void delete(UUID resumeId, UUID itemId, UUID userId) {
        ResumeListItem entity = getOwnedOrThrow(resumeId, itemId, userId);
        entity.markDeleted();
        listItemRepository.save(entity);
    }

    private ResumeListItem getOwnedOrThrow(UUID resumeId, UUID itemId, UUID userId) {
        Resume resume = resumeService.getOwnedResumeOrThrow(resumeId, userId);
        ResumeListItem entity = listItemRepository.findById(itemId)
            .orElseThrow(() -> new ResourceNotFoundException("List item not found"));
        if (!entity.getResume().getId().equals(resume.getId())) {
            throw new ResourceNotFoundException("List item not found");
        }
        return entity;
    }
}
