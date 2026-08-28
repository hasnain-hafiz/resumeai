package com.resumeai.service;

import com.resumeai.dto.response.resume.TemplateResponse;

import java.util.List;

public interface TemplateService {
    /** Active templates, in catalog display order. */
    List<TemplateResponse> listActive();
}
