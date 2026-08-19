package com.resumeai.service;

import com.resumeai.dto.request.resume.CertificationRequest;
import com.resumeai.dto.response.resume.CertificationResponse;
import com.resumeai.entity.Resume;
import com.resumeai.entity.ResumeCertification;
import com.resumeai.exception.ResourceNotFoundException;
import com.resumeai.mapper.ResumeMapper;
import com.resumeai.repository.ResumeCertificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ResumeCertificationService {

    private final ResumeCertificationRepository certificationRepository;
    private final ResumeService resumeService;
    private final ResumeMapper resumeMapper;

    @Transactional
    public CertificationResponse add(UUID resumeId, UUID userId, CertificationRequest request) {
        Resume resume = resumeService.getOwnedResumeOrThrow(resumeId, userId);
        ResumeCertification entity = apply(ResumeCertification.builder().resume(resume).build(), request);
        return resumeMapper.toCertificationResponse(certificationRepository.save(entity));
    }

    @Transactional
    public CertificationResponse update(UUID resumeId, UUID certificationId, UUID userId, CertificationRequest request) {
        ResumeCertification entity = getOwnedOrThrow(resumeId, certificationId, userId);
        return resumeMapper.toCertificationResponse(certificationRepository.save(apply(entity, request)));
    }

    @Transactional
    public void delete(UUID resumeId, UUID certificationId, UUID userId) {
        ResumeCertification entity = getOwnedOrThrow(resumeId, certificationId, userId);
        entity.markDeleted();
        certificationRepository.save(entity);
    }

    private ResumeCertification getOwnedOrThrow(UUID resumeId, UUID certificationId, UUID userId) {
        Resume resume = resumeService.getOwnedResumeOrThrow(resumeId, userId);
        ResumeCertification entity = certificationRepository.findById(certificationId)
            .orElseThrow(() -> new ResourceNotFoundException("Certification not found"));
        if (!entity.getResume().getId().equals(resume.getId())) {
            throw new ResourceNotFoundException("Certification not found");
        }
        return entity;
    }

    private ResumeCertification apply(ResumeCertification entity, CertificationRequest request) {
        entity.setName(request.name());
        entity.setIssuer(request.issuer());
        entity.setIssueDate(request.issueDate());
        entity.setCredentialUrl(request.credentialUrl());
        entity.setSortOrder(request.sortOrder());
        return entity;
    }
}
