package com.resumeai.service.impl;

import com.resumeai.dto.response.resume.TemplateResponse;
import com.resumeai.mapper.ResumeMapper;
import com.resumeai.repository.ResumeTemplateRepository;
import com.resumeai.service.TemplateService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TemplateServiceImpl implements TemplateService {

    private final ResumeTemplateRepository templateRepository;
    private final ResumeMapper resumeMapper;

    @Override
    @Transactional(readOnly = true)
    public List<TemplateResponse> listActive() {
        return resumeMapper.toTemplateResponseList(templateRepository.findByActiveTrueOrderBySortOrderAsc());
    }
}
