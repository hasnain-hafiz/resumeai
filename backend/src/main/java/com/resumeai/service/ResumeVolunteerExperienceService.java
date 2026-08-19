package com.resumeai.service;

import com.resumeai.dto.request.resume.VolunteerExperienceRequest;
import com.resumeai.dto.response.resume.VolunteerExperienceResponse;
import com.resumeai.entity.Resume;
import com.resumeai.entity.ResumeVolunteerExperience;
import com.resumeai.exception.ResourceNotFoundException;
import com.resumeai.mapper.ResumeMapper;
import com.resumeai.repository.ResumeVolunteerExperienceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ResumeVolunteerExperienceService {

    private final ResumeVolunteerExperienceRepository volunteerExperienceRepository;
    private final ResumeService resumeService;
    private final ResumeMapper resumeMapper;

    @Transactional
    public VolunteerExperienceResponse add(UUID resumeId, UUID userId, VolunteerExperienceRequest request) {
        Resume resume = resumeService.getOwnedResumeOrThrow(resumeId, userId);
        ResumeVolunteerExperience entity = apply(ResumeVolunteerExperience.builder().resume(resume).build(), request);
        return resumeMapper.toVolunteerExperienceResponse(volunteerExperienceRepository.save(entity));
    }

    @Transactional
    public VolunteerExperienceResponse update(UUID resumeId, UUID entryId, UUID userId, VolunteerExperienceRequest request) {
        ResumeVolunteerExperience entity = getOwnedOrThrow(resumeId, entryId, userId);
        return resumeMapper.toVolunteerExperienceResponse(volunteerExperienceRepository.save(apply(entity, request)));
    }

    @Transactional
    public void delete(UUID resumeId, UUID entryId, UUID userId) {
        ResumeVolunteerExperience entity = getOwnedOrThrow(resumeId, entryId, userId);
        entity.markDeleted();
        volunteerExperienceRepository.save(entity);
    }

    private ResumeVolunteerExperience getOwnedOrThrow(UUID resumeId, UUID entryId, UUID userId) {
        Resume resume = resumeService.getOwnedResumeOrThrow(resumeId, userId);
        ResumeVolunteerExperience entity = volunteerExperienceRepository.findById(entryId)
            .orElseThrow(() -> new ResourceNotFoundException("Volunteer experience entry not found"));
        if (!entity.getResume().getId().equals(resume.getId())) {
            throw new ResourceNotFoundException("Volunteer experience entry not found");
        }
        return entity;
    }

    private ResumeVolunteerExperience apply(ResumeVolunteerExperience entity, VolunteerExperienceRequest request) {
        entity.setOrganization(request.organization());
        entity.setRole(request.role());
        entity.setStartDate(request.startDate());
        entity.setEndDate(request.endDate());
        entity.setDescription(request.description());
        entity.setSortOrder(request.sortOrder());
        return entity;
    }
}
