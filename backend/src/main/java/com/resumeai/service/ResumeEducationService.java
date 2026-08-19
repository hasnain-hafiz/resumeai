package com.resumeai.service;

import com.resumeai.dto.request.resume.EducationRequest;
import com.resumeai.dto.response.resume.EducationResponse;
import com.resumeai.entity.Resume;
import com.resumeai.entity.ResumeEducation;
import com.resumeai.exception.ResourceNotFoundException;
import com.resumeai.mapper.ResumeMapper;
import com.resumeai.repository.ResumeEducationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ResumeEducationService {

    private final ResumeEducationRepository educationRepository;
    private final ResumeService resumeService;
    private final ResumeMapper resumeMapper;

    @Transactional
    public EducationResponse add(UUID resumeId, UUID userId, EducationRequest request) {
        Resume resume = resumeService.getOwnedResumeOrThrow(resumeId, userId);
        ResumeEducation entity = apply(ResumeEducation.builder().resume(resume).build(), request);
        return resumeMapper.toEducationResponse(educationRepository.save(entity));
    }

    @Transactional
    public EducationResponse update(UUID resumeId, UUID educationId, UUID userId, EducationRequest request) {
        ResumeEducation entity = getOwnedOrThrow(resumeId, educationId, userId);
        return resumeMapper.toEducationResponse(educationRepository.save(apply(entity, request)));
    }

    @Transactional
    public void delete(UUID resumeId, UUID educationId, UUID userId) {
        ResumeEducation entity = getOwnedOrThrow(resumeId, educationId, userId);
        entity.markDeleted();
        educationRepository.save(entity);
    }

    private ResumeEducation getOwnedOrThrow(UUID resumeId, UUID educationId, UUID userId) {
        Resume resume = resumeService.getOwnedResumeOrThrow(resumeId, userId);
        ResumeEducation entity = educationRepository.findById(educationId)
            .orElseThrow(() -> new ResourceNotFoundException("Education entry not found"));
        if (!entity.getResume().getId().equals(resume.getId())) {
            throw new ResourceNotFoundException("Education entry not found");
        }
        return entity;
    }

    private ResumeEducation apply(ResumeEducation entity, EducationRequest request) {
        entity.setSchool(request.school());
        entity.setDegree(request.degree());
        entity.setField(request.field());
        entity.setCgpa(request.cgpa());
        entity.setStartDate(request.startDate());
        entity.setEndDate(request.endDate());
        entity.setSortOrder(request.sortOrder());
        return entity;
    }
}
