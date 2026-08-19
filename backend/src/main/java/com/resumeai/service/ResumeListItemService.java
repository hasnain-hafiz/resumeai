package com.resumeai.service;

import com.resumeai.dto.request.resume.ListItemRequest;
import com.resumeai.dto.response.resume.ListItemResponse;
import com.resumeai.entity.Resume;
import com.resumeai.entity.ResumeListItem;
import com.resumeai.exception.ResourceNotFoundException;
import com.resumeai.mapper.ResumeMapper;
import com.resumeai.repository.ResumeListItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
