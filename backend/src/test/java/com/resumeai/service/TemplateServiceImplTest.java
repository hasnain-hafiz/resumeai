package com.resumeai.service;

import com.resumeai.dto.response.resume.TemplateResponse;
import com.resumeai.entity.ResumeTemplate;
import com.resumeai.mapper.ResumeMapper;
import com.resumeai.repository.ResumeTemplateRepository;
import com.resumeai.service.impl.TemplateServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TemplateServiceImplTest {

    @Mock private ResumeTemplateRepository templateRepository;
    @Mock private ResumeMapper resumeMapper;

    @InjectMocks
    private TemplateServiceImpl templateService;

    @Test
    void listActiveReturnsCatalogInSortOrder() {
        ResumeTemplate modern = ResumeTemplate.builder()
            .key("modern").name("Modern").category(ResumeTemplate.Category.MODERN).atsFriendly(true).sortOrder(1).build();
        modern.setId(UUID.randomUUID());

        when(templateRepository.findByActiveTrueOrderBySortOrderAsc()).thenReturn(List.of(modern));
        when(resumeMapper.toTemplateResponseList(List.of(modern))).thenReturn(
            List.of(new TemplateResponse(modern.getId(), "modern", "Modern", ResumeTemplate.Category.MODERN, true))
        );

        List<TemplateResponse> result = templateService.listActive();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).key()).isEqualTo("modern");
        assertThat(result.get(0).atsFriendly()).isTrue();
    }
}
