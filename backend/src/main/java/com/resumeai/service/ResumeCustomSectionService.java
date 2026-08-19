package com.resumeai.service;

import com.resumeai.dto.request.resume.CustomSectionItemRequest;
import com.resumeai.dto.request.resume.CustomSectionRequest;
import com.resumeai.dto.response.resume.CustomSectionResponse;
import com.resumeai.entity.Resume;
import com.resumeai.entity.ResumeCustomSection;
import com.resumeai.entity.ResumeCustomSectionItem;
import com.resumeai.exception.ResourceNotFoundException;
import com.resumeai.mapper.ResumeMapper;
import com.resumeai.repository.ResumeCustomSectionItemRepository;
import com.resumeai.repository.ResumeCustomSectionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ResumeCustomSectionService {

    private final ResumeCustomSectionRepository sectionRepository;
    private final ResumeCustomSectionItemRepository itemRepository;
    private final ResumeService resumeService;
    private final ResumeMapper resumeMapper;

    @Transactional
    public CustomSectionResponse addSection(UUID resumeId, UUID userId, CustomSectionRequest request) {
        Resume resume = resumeService.getOwnedResumeOrThrow(resumeId, userId);
        ResumeCustomSection entity = ResumeCustomSection.builder()
            .resume(resume).title(request.title()).sortOrder(request.sortOrder()).build();
        sectionRepository.save(entity);
        return toResponse(entity);
    }

    @Transactional
    public CustomSectionResponse updateSection(UUID resumeId, UUID sectionId, UUID userId, CustomSectionRequest request) {
        ResumeCustomSection entity = getOwnedSectionOrThrow(resumeId, sectionId, userId);
        entity.setTitle(request.title());
        entity.setSortOrder(request.sortOrder());
        sectionRepository.save(entity);
        return toResponse(entity);
    }

    @Transactional
    public void deleteSection(UUID resumeId, UUID sectionId, UUID userId) {
        ResumeCustomSection entity = getOwnedSectionOrThrow(resumeId, sectionId, userId);
        entity.markDeleted();
        sectionRepository.save(entity);
    }

    @Transactional
    public CustomSectionResponse addItem(UUID resumeId, UUID sectionId, UUID userId, CustomSectionItemRequest request) {
        ResumeCustomSection section = getOwnedSectionOrThrow(resumeId, sectionId, userId);
        itemRepository.save(applyItem(ResumeCustomSectionItem.builder().customSection(section).build(), request));
        return toResponse(section);
    }

    @Transactional
    public CustomSectionResponse updateItem(UUID resumeId, UUID sectionId, UUID itemId, UUID userId, CustomSectionItemRequest request) {
        ResumeCustomSection section = getOwnedSectionOrThrow(resumeId, sectionId, userId);
        ResumeCustomSectionItem item = getOwnedItemOrThrow(section, itemId);
        itemRepository.save(applyItem(item, request));
        return toResponse(section);
    }

    @Transactional
    public CustomSectionResponse deleteItem(UUID resumeId, UUID sectionId, UUID itemId, UUID userId) {
        ResumeCustomSection section = getOwnedSectionOrThrow(resumeId, sectionId, userId);
        ResumeCustomSectionItem item = getOwnedItemOrThrow(section, itemId);
        item.markDeleted();
        itemRepository.save(item);
        return toResponse(section);
    }

    private CustomSectionResponse toResponse(ResumeCustomSection section) {
        return resumeMapper.toCustomSectionResponse(
            section,
            resumeMapper.toCustomSectionItemResponseList(itemRepository.findByCustomSectionOrderBySortOrderAsc(section))
        );
    }

    private ResumeCustomSection getOwnedSectionOrThrow(UUID resumeId, UUID sectionId, UUID userId) {
        Resume resume = resumeService.getOwnedResumeOrThrow(resumeId, userId);
        ResumeCustomSection section = sectionRepository.findById(sectionId)
            .orElseThrow(() -> new ResourceNotFoundException("Custom section not found"));
        if (!section.getResume().getId().equals(resume.getId())) {
            throw new ResourceNotFoundException("Custom section not found");
        }
        return section;
    }

    private ResumeCustomSectionItem getOwnedItemOrThrow(ResumeCustomSection section, UUID itemId) {
        ResumeCustomSectionItem item = itemRepository.findById(itemId)
            .orElseThrow(() -> new ResourceNotFoundException("Custom section item not found"));
        if (!item.getCustomSection().getId().equals(section.getId())) {
            throw new ResourceNotFoundException("Custom section item not found");
        }
        return item;
    }

    private ResumeCustomSectionItem applyItem(ResumeCustomSectionItem item, CustomSectionItemRequest request) {
        item.setHeading(request.heading());
        item.setSubheading(request.subheading());
        item.setDescription(request.description());
        item.setStartDate(request.startDate());
        item.setEndDate(request.endDate());
        item.setSortOrder(request.sortOrder());
        return item;
    }
}
