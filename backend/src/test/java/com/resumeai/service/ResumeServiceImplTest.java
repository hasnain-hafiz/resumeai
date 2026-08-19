package com.resumeai.service;

import com.resumeai.dto.request.resume.CreateResumeRequest;
import com.resumeai.dto.request.resume.UpdateResumeDetailsRequest;
import com.resumeai.dto.response.resume.ResumeResponse;
import com.resumeai.dto.response.resume.ResumeSummaryResponse;
import com.resumeai.entity.Resume;
import com.resumeai.entity.User;
import com.resumeai.exception.ResourceNotFoundException;
import com.resumeai.mapper.ResumeMapper;
import com.resumeai.repository.*;
import com.resumeai.service.impl.ResumeServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ResumeServiceImplTest {

    @Mock private ResumeRepository resumeRepository;
    @Mock private UserRepository userRepository;
    @Mock private ResumeExperienceRepository experienceRepository;
    @Mock private ResumeEducationRepository educationRepository;
    @Mock private ResumeProjectRepository projectRepository;
    @Mock private ResumeProjectImageRepository projectImageRepository;
    @Mock private ResumeListItemRepository listItemRepository;
    @Mock private ResumeCertificationRepository certificationRepository;
    @Mock private ResumeAwardRepository awardRepository;
    @Mock private ResumePublicationRepository publicationRepository;
    @Mock private ResumeVolunteerExperienceRepository volunteerExperienceRepository;
    @Mock private ResumeReferenceRepository referenceRepository;
    @Mock private ResumeCustomSectionRepository customSectionRepository;
    @Mock private ResumeCustomSectionItemRepository customSectionItemRepository;
    @Mock private ResumeMapper resumeMapper;
    @Mock private ActivityEventService activityEventService;

    @InjectMocks
    private ResumeServiceImpl resumeService;

    private User user;
    private Resume resume;

    @BeforeEach
    void setUp() {
        user = User.builder().fullName("Ada Lovelace").email("ada@example.com").build();
        user.setId(UUID.randomUUID());

        resume = Resume.builder().user(user).title("Software Engineer Resume").build();
        resume.setId(UUID.randomUUID());
    }

    @Test
    void createDefaultsTitleWhenBlank() {
        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
        when(resumeMapper.toSummaryResponse(any(Resume.class)))
            .thenAnswer(inv -> new ResumeSummaryResponse(resume.getId(), inv.<Resume>getArgument(0).getTitle(), null, null, null, null));

        ResumeSummaryResponse response = resumeService.create(user.getId(), new CreateResumeRequest("  "));

        assertThat(response.title()).isEqualTo("Untitled Resume");
        verify(activityEventService).record(eq(user), any(), anyString());
    }

    @Test
    void createSeedsPersonalInfoFromAccount() {
        user.setPhotoUrl("https://cdn.example.com/ada.jpg");
        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
        when(resumeMapper.toSummaryResponse(any(Resume.class))).thenAnswer(inv -> {
            Resume saved = inv.getArgument(0);
            return new ResumeSummaryResponse(saved.getId(), saved.getTitle(), saved.getFullName(), saved.getPhotoUrl(), null, null);
        });

        ResumeSummaryResponse response = resumeService.create(user.getId(), new CreateResumeRequest("My Resume"));

        assertThat(response.fullName()).isEqualTo("Ada Lovelace");
        assertThat(response.photoUrl()).isEqualTo("https://cdn.example.com/ada.jpg");
    }

    @Test
    void getOwnedResumeOrThrow_throwsWhenAnotherUsersResume() {
        UUID otherUserId = UUID.randomUUID();
        when(userRepository.findById(otherUserId)).thenReturn(Optional.of(user));
        when(resumeRepository.findByIdAndUser(resume.getId(), user)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> resumeService.getOwnedResumeOrThrow(resume.getId(), otherUserId))
            .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void listForUserReturnsSummariesInUpdatedOrder() {
        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
        when(resumeRepository.findByUserOrderByUpdatedAtDesc(user)).thenReturn(List.of(resume));
        when(resumeMapper.toSummaryResponse(resume))
            .thenReturn(new ResumeSummaryResponse(resume.getId(), resume.getTitle(), null, null, null, null));

        List<ResumeSummaryResponse> result = resumeService.listForUser(user.getId());

        assertThat(result).hasSize(1);
        assertThat(result.get(0).title()).isEqualTo("Software Engineer Resume");
    }

    @Test
    void getFullAssemblesEveryEmptySectionWithoutError() {
        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
        when(resumeRepository.findByIdAndUser(resume.getId(), user)).thenReturn(Optional.of(resume));
        stubEmptySections();

        ResumeResponse response = resumeService.getFull(resume.getId(), user.getId());

        assertThat(response.id()).isEqualTo(resume.getId());
        assertThat(response.experience()).isEmpty();
        assertThat(response.projects()).isEmpty();
        assertThat(response.customSections()).isEmpty();
    }

    @Test
    void deleteSoftDeletesResume() {
        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
        when(resumeRepository.findByIdAndUser(resume.getId(), user)).thenReturn(Optional.of(resume));

        resumeService.delete(resume.getId(), user.getId());

        assertThat(resume.isDeleted()).isTrue();
        verify(resumeRepository).save(resume);
    }

    @Test
    void updateDetailsAppliesEveryField() {
        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
        when(resumeRepository.findByIdAndUser(resume.getId(), user)).thenReturn(Optional.of(resume));
        stubEmptySections();

        var request = new UpdateResumeDetailsRequest(
            "Updated Title", "Ada Lovelace", "ada@updated.com", "555-0100", "123 Main St",
            "linkedin.com/ada", "github.com/ada", "ada.dev", "ada.dev/site", "photo.jpg", "<p>Summary</p>"
        );

        resumeService.updateDetails(resume.getId(), user.getId(), request);

        assertThat(resume.getTitle()).isEqualTo("Updated Title");
        assertThat(resume.getEmail()).isEqualTo("ada@updated.com");
        assertThat(resume.getSummary()).isEqualTo("<p>Summary</p>");
    }

    private void stubEmptySections() {
        when(experienceRepository.findByResumeOrderBySortOrderAsc(resume)).thenReturn(List.of());
        when(educationRepository.findByResumeOrderBySortOrderAsc(resume)).thenReturn(List.of());
        when(projectRepository.findByResumeOrderBySortOrderAsc(resume)).thenReturn(List.of());
        when(listItemRepository.findByResumeOrderBySectionAscSortOrderAsc(resume)).thenReturn(List.of());
        when(certificationRepository.findByResumeOrderBySortOrderAsc(resume)).thenReturn(List.of());
        when(awardRepository.findByResumeOrderBySortOrderAsc(resume)).thenReturn(List.of());
        when(publicationRepository.findByResumeOrderBySortOrderAsc(resume)).thenReturn(List.of());
        when(volunteerExperienceRepository.findByResumeOrderBySortOrderAsc(resume)).thenReturn(List.of());
        when(referenceRepository.findByResumeOrderBySortOrderAsc(resume)).thenReturn(List.of());
        when(customSectionRepository.findByResumeOrderBySortOrderAsc(resume)).thenReturn(List.of());
        when(resumeMapper.toExperienceResponseList(any())).thenReturn(List.of());
        when(resumeMapper.toEducationResponseList(any())).thenReturn(List.of());
        when(resumeMapper.toListItemResponseList(any())).thenReturn(List.of());
        when(resumeMapper.toCertificationResponseList(any())).thenReturn(List.of());
        when(resumeMapper.toAwardResponseList(any())).thenReturn(List.of());
        when(resumeMapper.toPublicationResponseList(any())).thenReturn(List.of());
        when(resumeMapper.toVolunteerExperienceResponseList(any())).thenReturn(List.of());
        when(resumeMapper.toReferenceResponseList(any())).thenReturn(List.of());
    }
}
