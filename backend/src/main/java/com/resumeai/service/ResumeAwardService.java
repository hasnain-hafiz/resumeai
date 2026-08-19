package com.resumeai.service;

import com.resumeai.dto.request.resume.AwardRequest;
import com.resumeai.dto.response.resume.AwardResponse;
import com.resumeai.entity.Resume;
import com.resumeai.entity.ResumeAward;
import com.resumeai.exception.ResourceNotFoundException;
import com.resumeai.mapper.ResumeMapper;
import com.resumeai.repository.ResumeAwardRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ResumeAwardService {

    private final ResumeAwardRepository awardRepository;
    private final ResumeService resumeService;
    private final ResumeMapper resumeMapper;

    @Transactional
    public AwardResponse add(UUID resumeId, UUID userId, AwardRequest request) {
        Resume resume = resumeService.getOwnedResumeOrThrow(resumeId, userId);
        ResumeAward entity = apply(ResumeAward.builder().resume(resume).build(), request);
        return resumeMapper.toAwardResponse(awardRepository.save(entity));
    }

    @Transactional
    public AwardResponse update(UUID resumeId, UUID awardId, UUID userId, AwardRequest request) {
        ResumeAward entity = getOwnedOrThrow(resumeId, awardId, userId);
        return resumeMapper.toAwardResponse(awardRepository.save(apply(entity, request)));
    }

    @Transactional
    public void delete(UUID resumeId, UUID awardId, UUID userId) {
        ResumeAward entity = getOwnedOrThrow(resumeId, awardId, userId);
        entity.markDeleted();
        awardRepository.save(entity);
    }

    private ResumeAward getOwnedOrThrow(UUID resumeId, UUID awardId, UUID userId) {
        Resume resume = resumeService.getOwnedResumeOrThrow(resumeId, userId);
        ResumeAward entity = awardRepository.findById(awardId)
            .orElseThrow(() -> new ResourceNotFoundException("Award not found"));
        if (!entity.getResume().getId().equals(resume.getId())) {
            throw new ResourceNotFoundException("Award not found");
        }
        return entity;
    }

    private ResumeAward apply(ResumeAward entity, AwardRequest request) {
        entity.setTitle(request.title());
        entity.setIssuer(request.issuer());
        entity.setAwardedDate(request.awardedDate());
        entity.setDescription(request.description());
        entity.setSortOrder(request.sortOrder());
        return entity;
    }
}
