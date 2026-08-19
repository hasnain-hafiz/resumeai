package com.resumeai.service;

import com.resumeai.dto.request.resume.ReferenceRequest;
import com.resumeai.dto.response.resume.ReferenceResponse;
import com.resumeai.entity.Resume;
import com.resumeai.entity.ResumeReference;
import com.resumeai.exception.ResourceNotFoundException;
import com.resumeai.mapper.ResumeMapper;
import com.resumeai.repository.ResumeReferenceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ResumeReferenceService {

    private final ResumeReferenceRepository referenceRepository;
    private final ResumeService resumeService;
    private final ResumeMapper resumeMapper;

    @Transactional
    public ReferenceResponse add(UUID resumeId, UUID userId, ReferenceRequest request) {
        Resume resume = resumeService.getOwnedResumeOrThrow(resumeId, userId);
        ResumeReference entity = apply(ResumeReference.builder().resume(resume).build(), request);
        return resumeMapper.toReferenceResponse(referenceRepository.save(entity));
    }

    @Transactional
    public ReferenceResponse update(UUID resumeId, UUID referenceId, UUID userId, ReferenceRequest request) {
        ResumeReference entity = getOwnedOrThrow(resumeId, referenceId, userId);
        return resumeMapper.toReferenceResponse(referenceRepository.save(apply(entity, request)));
    }

    @Transactional
    public void delete(UUID resumeId, UUID referenceId, UUID userId) {
        ResumeReference entity = getOwnedOrThrow(resumeId, referenceId, userId);
        entity.markDeleted();
        referenceRepository.save(entity);
    }

    private ResumeReference getOwnedOrThrow(UUID resumeId, UUID referenceId, UUID userId) {
        Resume resume = resumeService.getOwnedResumeOrThrow(resumeId, userId);
        ResumeReference entity = referenceRepository.findById(referenceId)
            .orElseThrow(() -> new ResourceNotFoundException("Reference not found"));
        if (!entity.getResume().getId().equals(resume.getId())) {
            throw new ResourceNotFoundException("Reference not found");
        }
        return entity;
    }

    private ResumeReference apply(ResumeReference entity, ReferenceRequest request) {
        entity.setName(request.name());
        entity.setRelationship(request.relationship());
        entity.setCompany(request.company());
        entity.setEmail(request.email());
        entity.setPhone(request.phone());
        entity.setSortOrder(request.sortOrder());
        return entity;
    }
}
