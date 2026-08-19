package com.resumeai.service;

import com.resumeai.dto.request.resume.PublicationRequest;
import com.resumeai.dto.response.resume.PublicationResponse;
import com.resumeai.entity.Resume;
import com.resumeai.entity.ResumePublication;
import com.resumeai.exception.ResourceNotFoundException;
import com.resumeai.mapper.ResumeMapper;
import com.resumeai.repository.ResumePublicationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ResumePublicationService {

    private final ResumePublicationRepository publicationRepository;
    private final ResumeService resumeService;
    private final ResumeMapper resumeMapper;

    @Transactional
    public PublicationResponse add(UUID resumeId, UUID userId, PublicationRequest request) {
        Resume resume = resumeService.getOwnedResumeOrThrow(resumeId, userId);
        ResumePublication entity = apply(ResumePublication.builder().resume(resume).build(), request);
        return resumeMapper.toPublicationResponse(publicationRepository.save(entity));
    }

    @Transactional
    public PublicationResponse update(UUID resumeId, UUID publicationId, UUID userId, PublicationRequest request) {
        ResumePublication entity = getOwnedOrThrow(resumeId, publicationId, userId);
        return resumeMapper.toPublicationResponse(publicationRepository.save(apply(entity, request)));
    }

    @Transactional
    public void delete(UUID resumeId, UUID publicationId, UUID userId) {
        ResumePublication entity = getOwnedOrThrow(resumeId, publicationId, userId);
        entity.markDeleted();
        publicationRepository.save(entity);
    }

    private ResumePublication getOwnedOrThrow(UUID resumeId, UUID publicationId, UUID userId) {
        Resume resume = resumeService.getOwnedResumeOrThrow(resumeId, userId);
        ResumePublication entity = publicationRepository.findById(publicationId)
            .orElseThrow(() -> new ResourceNotFoundException("Publication not found"));
        if (!entity.getResume().getId().equals(resume.getId())) {
            throw new ResourceNotFoundException("Publication not found");
        }
        return entity;
    }

    private ResumePublication apply(ResumePublication entity, PublicationRequest request) {
        entity.setTitle(request.title());
        entity.setPublisher(request.publisher());
        entity.setPublishedDate(request.publishedDate());
        entity.setUrl(request.url());
        entity.setDescription(request.description());
        entity.setSortOrder(request.sortOrder());
        return entity;
    }
}
