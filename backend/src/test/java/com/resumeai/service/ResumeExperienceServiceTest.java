package com.resumeai.service;

import com.resumeai.dto.request.resume.ExperienceRequest;
import com.resumeai.dto.request.resume.ReorderRequest;
import com.resumeai.dto.response.resume.ExperienceResponse;
import com.resumeai.entity.Resume;
import com.resumeai.entity.ResumeExperience;
import com.resumeai.entity.User;
import com.resumeai.exception.InvalidReorderException;
import com.resumeai.exception.ResourceNotFoundException;
import com.resumeai.mapper.ResumeMapper;
import com.resumeai.repository.ResumeExperienceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ResumeExperienceServiceTest {

    @Mock private ResumeExperienceRepository experienceRepository;
    @Mock private ResumeService resumeService;
    @Mock private ResumeMapper resumeMapper;

    @InjectMocks
    private ResumeExperienceService service;

    private User user;
    private Resume resume;

    @BeforeEach
    void setUp() {
        user = User.builder().fullName("Ada").email("ada@example.com").build();
        user.setId(UUID.randomUUID());
        resume = Resume.builder().user(user).title("Resume").build();
        resume.setId(UUID.randomUUID());
    }

    @Test
    void add_savesEntryScopedToOwnedResume() {
        when(resumeService.getOwnedResumeOrThrow(resume.getId(), user.getId())).thenReturn(resume);
        when(experienceRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(resumeMapper.toExperienceResponse(any())).thenReturn(
            new ExperienceResponse(UUID.randomUUID(), "Acme", "Engineer", null, null, null, null, false, null, null, 0)
        );

        ExperienceRequest request = new ExperienceRequest(
            "Acme", "Engineer", "Remote", ResumeExperience.EmploymentType.FULL_TIME,
            LocalDate.of(2022, 1, 1), null, true, "Built things", "Shipped things", 0
        );

        ExperienceResponse response = service.add(resume.getId(), user.getId(), request);

        assertThat(response.company()).isEqualTo("Acme");
        verify(experienceRepository).save(argThat(e -> e.getResume().equals(resume) && e.getCompany().equals("Acme")));
    }

    @Test
    void add_clearsEndDateWhenMarkedCurrent() {
        when(resumeService.getOwnedResumeOrThrow(resume.getId(), user.getId())).thenReturn(resume);
        when(experienceRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(resumeMapper.toExperienceResponse(any())).thenAnswer(inv -> null);

        ExperienceRequest request = new ExperienceRequest(
            "Acme", "Engineer", null, null, LocalDate.of(2022, 1, 1), LocalDate.of(2023, 1, 1), true, null, null, 0
        );

        service.add(resume.getId(), user.getId(), request);

        verify(experienceRepository).save(argThat(e -> e.isCurrent() && e.getEndDate() == null));
    }

    @Test
    void update_throwsWhenExperienceBelongsToADifferentResume() {
        Resume anotherResume = Resume.builder().user(user).title("Other").build();
        anotherResume.setId(UUID.randomUUID());

        ResumeExperience existing = ResumeExperience.builder().resume(anotherResume).company("Old Co").position("Dev").build();
        existing.setId(UUID.randomUUID());

        when(resumeService.getOwnedResumeOrThrow(resume.getId(), user.getId())).thenReturn(resume);
        when(experienceRepository.findById(existing.getId())).thenReturn(Optional.of(existing));

        ExperienceRequest request = new ExperienceRequest("New Co", "Dev", null, null, null, null, false, null, null, 0);

        assertThatThrownBy(() -> service.update(resume.getId(), existing.getId(), user.getId(), request))
            .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void reorder_assignsSortOrderByRequestedIndex() {
        ResumeExperience first = ResumeExperience.builder().resume(resume).company("A").position("Dev").sortOrder(0).build();
        first.setId(UUID.randomUUID());
        ResumeExperience second = ResumeExperience.builder().resume(resume).company("B").position("Dev").sortOrder(1).build();
        second.setId(UUID.randomUUID());

        when(resumeService.getOwnedResumeOrThrow(resume.getId(), user.getId())).thenReturn(resume);
        when(experienceRepository.findByResumeOrderBySortOrderAsc(resume)).thenReturn(List.of(first, second));

        service.reorder(resume.getId(), user.getId(), new ReorderRequest(List.of(second.getId(), first.getId())));

        assertThat(second.getSortOrder()).isZero();
        assertThat(first.getSortOrder()).isEqualTo(1);
        verify(experienceRepository).saveAll(List.of(second, first));
    }

    @Test
    void reorder_throwsWhenOrderedIdsDoNotMatchExistingEntries() {
        ResumeExperience existing = ResumeExperience.builder().resume(resume).company("A").position("Dev").build();
        existing.setId(UUID.randomUUID());

        when(resumeService.getOwnedResumeOrThrow(resume.getId(), user.getId())).thenReturn(resume);
        when(experienceRepository.findByResumeOrderBySortOrderAsc(resume)).thenReturn(List.of(existing));

        ReorderRequest request = new ReorderRequest(List.of(UUID.randomUUID()));

        assertThatThrownBy(() -> service.reorder(resume.getId(), user.getId(), request))
            .isInstanceOf(InvalidReorderException.class);
        verify(experienceRepository, never()).saveAll(any());
    }

    @Test
    void delete_softDeletesEntry() {
        ResumeExperience existing = ResumeExperience.builder().resume(resume).company("Acme").position("Dev").build();
        existing.setId(UUID.randomUUID());

        when(resumeService.getOwnedResumeOrThrow(resume.getId(), user.getId())).thenReturn(resume);
        when(experienceRepository.findById(existing.getId())).thenReturn(Optional.of(existing));

        service.delete(resume.getId(), existing.getId(), user.getId());

        assertThat(existing.isDeleted()).isTrue();
        verify(experienceRepository).save(existing);
    }
}
