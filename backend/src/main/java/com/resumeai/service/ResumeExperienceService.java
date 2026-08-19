package com.resumeai.service;

import com.resumeai.dto.request.resume.ExperienceRequest;
import com.resumeai.dto.response.resume.ExperienceResponse;
import com.resumeai.entity.Resume;
import com.resumeai.entity.ResumeExperience;
import com.resumeai.exception.ResourceNotFoundException;
import com.resumeai.mapper.ResumeMapper;
import com.resumeai.repository.ResumeExperienceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ResumeExperienceService {

    private final ResumeExperienceRepository experienceRepository;
    private final ResumeService resumeService;
    private final ResumeMapper resumeMapper;

    @Transactional
    public ExperienceResponse add(UUID resumeId, UUID userId, ExperienceRequest request) {
        Resume resume = resumeService.getOwnedResumeOrThrow(resumeId, userId);
        ResumeExperience entity = apply(ResumeExperience.builder().resume(resume).build(), request);
        return resumeMapper.toExperienceResponse(experienceRepository.save(entity));
    }

    @Transactional
    public ExperienceResponse update(UUID resumeId, UUID experienceId, UUID userId, ExperienceRequest request) {
        ResumeExperience entity = getOwnedOrThrow(resumeId, experienceId, userId);
        return resumeMapper.toExperienceResponse(experienceRepository.save(apply(entity, request)));
    }

    @Transactional
    public void delete(UUID resumeId, UUID experienceId, UUID userId) {
        ResumeExperience entity = getOwnedOrThrow(resumeId, experienceId, userId);
        entity.markDeleted();
        experienceRepository.save(entity);
    }

    private ResumeExperience getOwnedOrThrow(UUID resumeId, UUID experienceId, UUID userId) {
        Resume resume = resumeService.getOwnedResumeOrThrow(resumeId, userId);
        ResumeExperience entity = experienceRepository.findById(experienceId)
            .orElseThrow(() -> new ResourceNotFoundException("Experience entry not found"));
        if (!entity.getResume().getId().equals(resume.getId())) {
            throw new ResourceNotFoundException("Experience entry not found");
        }
        return entity;
    }

    private ResumeExperience apply(ResumeExperience entity, ExperienceRequest request) {
        entity.setCompany(request.company());
        entity.setPosition(request.position());
        entity.setLocation(request.location());
        entity.setEmploymentType(request.employmentType());
        entity.setStartDate(request.startDate());
        entity.setEndDate(request.current() ? null : request.endDate());
        entity.setCurrent(request.current());
        entity.setResponsibilities(request.responsibilities());
        entity.setAchievements(request.achievements());
        entity.setSortOrder(request.sortOrder());
        return entity;
    }
}
