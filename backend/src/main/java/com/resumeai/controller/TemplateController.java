package com.resumeai.controller;

import com.resumeai.dto.response.resume.TemplateResponse;
import com.resumeai.service.TemplateService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Public (no auth required) - browsing the template catalog doesn't expose
 * any user data, and letting logged-out visitors preview templates is good
 * for a future marketing/landing page.
 */
@RestController
@RequestMapping("/api/v1/templates")
@RequiredArgsConstructor
@Tag(name = "Templates", description = "Browse the resume template catalog")
public class TemplateController {

    private final TemplateService templateService;

    @GetMapping
    @Operation(summary = "List active resume templates in catalog order")
    public ResponseEntity<List<TemplateResponse>> list() {
        return ResponseEntity.ok(templateService.listActive());
    }
}
