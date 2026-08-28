package com.resumeai.service.impl;

import com.resumeai.dto.request.resume.CreateResumeRequest;
import com.resumeai.dto.request.resume.SelectTemplateRequest;
import com.resumeai.dto.request.resume.UpdateResumeDetailsRequest;
import com.resumeai.dto.response.resume.*;
import com.resumeai.entity.*;
import com.resumeai.exception.ResourceNotFoundException;
import com.resumeai.mapper.ResumeMapper;
import com.resumeai.repository.*;
import com.resumeai.service.ActivityEventService;
import com.resumeai.service.ResumeService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ResumeServiceImpl implements ResumeService {

    private final ResumeRepository resumeRepository;
    private final UserRepository userRepository;
    private final ResumeExperienceRepository experienceRepository;
    private final ResumeEducationRepository educationRepository;
    private final ResumeProjectRepository projectRepository;
    private final ResumeProjectImageRepository projectImageRepository;
    private final ResumeListItemRepository listItemRepository;
    private final ResumeCertificationRepository certificationRepository;
    private final ResumeAwardRepository awardRepository;
    private final ResumePublicationRepository publicationRepository;
    private final ResumeVolunteerExperienceRepository volunteerExperienceRepository;
    private final ResumeReferenceRepository referenceRepository;
    private final ResumeCustomSectionRepository customSectionRepository;
    private final ResumeCustomSectionItemRepository customSectionItemRepository;
    private final ResumeTemplateRepository resumeTemplateRepository;
    private final ResumeMapper resumeMapper;
    private final ActivityEventService activityEventService;

    @Override
    @Transactional
    public ResumeSummaryResponse create(UUID userId, CreateResumeRequest request) {
        User user = getUserOrThrow(userId);

        String title = (request.title() == null || request.title().isBlank()) ? "Untitled Resume" : request.title();

        Resume resume = Resume.builder()
            .user(user)
            .title(title)
            // Seed personal info from the account so the form isn't empty on first open.
            .fullName(user.getFullName())
            .email(user.getEmail())
            .photoUrl(user.getPhotoUrl())
            .build();
        resumeRepository.save(resume);

        activityEventService.record(user, ActivityEvent.Type.RESUME_CREATED, "Created \"" + title + "\"");

        return resumeMapper.toSummaryResponse(resume);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ResumeSummaryResponse> listForUser(UUID userId) {
        User user = getUserOrThrow(userId);
        return resumeRepository.findByUserOrderByUpdatedAtDesc(user).stream()
            .map(resumeMapper::toSummaryResponse)
            .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ResumeResponse getFull(UUID resumeId, UUID userId) {
        Resume resume = getOwnedResumeOrThrow(resumeId, userId);
        return assembleResponse(resume);
    }

    @Override
    @Transactional
    public ResumeResponse updateDetails(UUID resumeId, UUID userId, UpdateResumeDetailsRequest request) {
        Resume resume = getOwnedResumeOrThrow(resumeId, userId);

        resume.setTitle(request.title());
        resume.setFullName(request.fullName());
        resume.setEmail(request.email());
        resume.setPhone(request.phone());
        resume.setAddress(request.address());
        resume.setLinkedinUrl(request.linkedinUrl());
        resume.setGithubUrl(request.githubUrl());
        resume.setPortfolioUrl(request.portfolioUrl());
        resume.setWebsiteUrl(request.websiteUrl());
        resume.setPhotoUrl(request.photoUrl());
        resume.setSummary(request.summary());
        resumeRepository.save(resume);

        return assembleResponse(resume);
    }

    @Override
    @Transactional
    public ResumeResponse selectTemplate(UUID resumeId, UUID userId, SelectTemplateRequest request) {
        Resume resume = getOwnedResumeOrThrow(resumeId, userId);

        if (request.templateId() == null) {
            resume.setTemplate(null);
        } else {
            ResumeTemplate template = resumeTemplateRepository.findById(request.templateId())
                .orElseThrow(() -> new ResourceNotFoundException("Template not found"));
            resume.setTemplate(template);
        }
        resumeRepository.save(resume);

        return assembleResponse(resume);
    }

    @Override
    @Transactional
    public void delete(UUID resumeId, UUID userId) {
        Resume resume = getOwnedResumeOrThrow(resumeId, userId);
        resume.markDeleted(); // soft delete; child rows remain but become invisible via cascading queries on resume
        resumeRepository.save(resume);
    }

    @Override
    @Transactional(readOnly = true)
    public Resume getOwnedResumeOrThrow(UUID resumeId, UUID userId) {
        User user = getUserOrThrow(userId);
        return resumeRepository.findByIdAndUser(resumeId, user)
            .orElseThrow(() -> new ResourceNotFoundException("Resume not found"));
    }

    private User getUserOrThrow(UUID userId) {
        return userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private ResumeResponse assembleResponse(Resume resume) {
        List<ProjectResponse> projects = projectRepository.findByResumeOrderBySortOrderAsc(resume).stream()
            .map(project -> resumeMapper.toProjectResponse(
                project,
                resumeMapper.toProjectImageResponseList(projectImageRepository.findByProjectOrderBySortOrderAsc(project))
            ))
            .toList();

        List<CustomSectionResponse> customSections = customSectionRepository.findByResumeOrderBySortOrderAsc(resume).stream()
            .map(section -> resumeMapper.toCustomSectionResponse(
                section,
                resumeMapper.toCustomSectionItemResponseList(customSectionItemRepository.findByCustomSectionOrderBySortOrderAsc(section))
            ))
            .toList();

        return new ResumeResponse(
            resume.getId(),
            resume.getTitle(),
            resume.getFullName(),
            resume.getEmail(),
            resume.getPhone(),
            resume.getAddress(),
            resume.getLinkedinUrl(),
            resume.getGithubUrl(),
            resume.getPortfolioUrl(),
            resume.getWebsiteUrl(),
            resume.getPhotoUrl(),
            resume.getSummary(),
            resumeMapper.toTemplateResponse(resume.getTemplate()),
            resumeMapper.toExperienceResponseList(experienceRepository.findByResumeOrderBySortOrderAsc(resume)),
            resumeMapper.toEducationResponseList(educationRepository.findByResumeOrderBySortOrderAsc(resume)),
            projects,
            resumeMapper.toListItemResponseList(listItemRepository.findByResumeOrderBySectionAscSortOrderAsc(resume)),
            resumeMapper.toCertificationResponseList(certificationRepository.findByResumeOrderBySortOrderAsc(resume)),
            resumeMapper.toAwardResponseList(awardRepository.findByResumeOrderBySortOrderAsc(resume)),
            resumeMapper.toPublicationResponseList(publicationRepository.findByResumeOrderBySortOrderAsc(resume)),
            resumeMapper.toVolunteerExperienceResponseList(volunteerExperienceRepository.findByResumeOrderBySortOrderAsc(resume)),
            resumeMapper.toReferenceResponseList(referenceRepository.findByResumeOrderBySortOrderAsc(resume)),
            customSections,
            resume.getCreatedAt(),
            resume.getUpdatedAt()
        );
    }
}
