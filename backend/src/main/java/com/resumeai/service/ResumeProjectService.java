package com.resumeai.service;

import com.resumeai.dto.request.resume.ProjectImageRequest;
import com.resumeai.dto.request.resume.ProjectRequest;
import com.resumeai.dto.request.resume.ReorderRequest;
import com.resumeai.dto.response.resume.ProjectResponse;
import com.resumeai.entity.Resume;
import com.resumeai.entity.ResumeProject;
import com.resumeai.entity.ResumeProjectImage;
import com.resumeai.exception.ResourceNotFoundException;
import com.resumeai.mapper.ResumeMapper;
import com.resumeai.repository.ResumeProjectImageRepository;
import com.resumeai.repository.ResumeProjectRepository;
import com.resumeai.util.ReorderSupport;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ResumeProjectService {

    private final ResumeProjectRepository projectRepository;
    private final ResumeProjectImageRepository imageRepository;
    private final ResumeService resumeService;
    private final ResumeMapper resumeMapper;

    @Transactional
    public ProjectResponse add(UUID resumeId, UUID userId, ProjectRequest request) {
        Resume resume = resumeService.getOwnedResumeOrThrow(resumeId, userId);
        ResumeProject entity = apply(ResumeProject.builder().resume(resume).build(), request);
        projectRepository.save(entity);
        return toResponse(entity);
    }

    @Transactional
    public ProjectResponse update(UUID resumeId, UUID projectId, UUID userId, ProjectRequest request) {
        ResumeProject entity = getOwnedOrThrow(resumeId, projectId, userId);
        projectRepository.save(apply(entity, request));
        return toResponse(entity);
    }

    @Transactional
    public void delete(UUID resumeId, UUID projectId, UUID userId) {
        ResumeProject entity = getOwnedOrThrow(resumeId, projectId, userId);
        entity.markDeleted(); // images are left as-is; they're only ever surfaced through this (now-deleted) project
        projectRepository.save(entity);
    }

    @Transactional
    public void reorder(UUID resumeId, UUID userId, ReorderRequest request) {
        Resume resume = resumeService.getOwnedResumeOrThrow(resumeId, userId);
        List<ResumeProject> existing = projectRepository.findByResumeOrderBySortOrderAsc(resume);
        List<ResumeProject> ordered = ReorderSupport.reorder(existing, request.orderedIds(), ResumeProject::getId);

        for (int i = 0; i < ordered.size(); i++) {
            ordered.get(i).setSortOrder(i);
        }
        projectRepository.saveAll(ordered);
    }

    @Transactional
    public ProjectResponse addImage(UUID resumeId, UUID projectId, UUID userId, ProjectImageRequest request) {
        ResumeProject project = getOwnedOrThrow(resumeId, projectId, userId);
        ResumeProjectImage image = ResumeProjectImage.builder()
            .project(project)
            .url(request.url())
            .sortOrder(request.sortOrder())
            .build();
        imageRepository.save(image);
        return toResponse(project);
    }

    @Transactional
    public ProjectResponse deleteImage(UUID resumeId, UUID projectId, UUID imageId, UUID userId) {
        ResumeProject project = getOwnedOrThrow(resumeId, projectId, userId);
        ResumeProjectImage image = imageRepository.findById(imageId)
            .orElseThrow(() -> new ResourceNotFoundException("Project image not found"));
        if (!image.getProject().getId().equals(project.getId())) {
            throw new ResourceNotFoundException("Project image not found");
        }
        image.markDeleted();
        imageRepository.save(image);
        return toResponse(project);
    }

    private ProjectResponse toResponse(ResumeProject project) {
        return resumeMapper.toProjectResponse(
            project,
            resumeMapper.toProjectImageResponseList(imageRepository.findByProjectOrderBySortOrderAsc(project))
        );
    }

    private ResumeProject getOwnedOrThrow(UUID resumeId, UUID projectId, UUID userId) {
        Resume resume = resumeService.getOwnedResumeOrThrow(resumeId, userId);
        ResumeProject entity = projectRepository.findById(projectId)
            .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
        if (!entity.getResume().getId().equals(resume.getId())) {
            throw new ResourceNotFoundException("Project not found");
        }
        return entity;
    }

    private ResumeProject apply(ResumeProject entity, ProjectRequest request) {
        entity.setTitle(request.title());
        entity.setDescription(request.description());
        entity.setTechnologies(request.technologies());
        entity.setGithubUrl(request.githubUrl());
        entity.setLiveUrl(request.liveUrl());
        entity.setSortOrder(request.sortOrder());
        return entity;
    }
}
