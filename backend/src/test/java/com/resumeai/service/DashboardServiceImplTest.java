package com.resumeai.service;

import com.resumeai.dto.response.DashboardResponse;
import com.resumeai.entity.ActivityEvent;
import com.resumeai.entity.User;
import com.resumeai.exception.ResourceNotFoundException;
import com.resumeai.repository.AiUsageLogRepository;
import com.resumeai.repository.AtsAnalysisRepository;
import com.resumeai.repository.CoverLetterRepository;
import com.resumeai.repository.ResumeRepository;
import com.resumeai.repository.UserRepository;
import com.resumeai.service.impl.DashboardServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DashboardServiceImplTest {

    @Mock private UserRepository userRepository;
    @Mock private ResumeRepository resumeRepository;
    @Mock private CoverLetterRepository coverLetterRepository;
    @Mock private AtsAnalysisRepository atsAnalysisRepository;
    @Mock private AiUsageLogRepository aiUsageLogRepository;
    @Mock private ActivityEventService activityEventService;

    @InjectMocks
    private DashboardServiceImpl dashboardService;

    private User user;

    @BeforeEach
    void setUp() {
        user = User.builder()
            .fullName("Ada Lovelace")
            .email("ada@example.com")
            .emailVerified(true)
            .build();
        user.setId(UUID.randomUUID());
        ReflectionTestUtils.setField(dashboardService, "freeMonthlyAiQuota", 50L);
    }

    @Test
    void throwsWhenUserDoesNotExist() {
        UUID missingId = UUID.randomUUID();
        when(userRepository.findById(missingId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> dashboardService.getDashboard(missingId, 10))
            .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void profileCompletionIsFullWhenVerifiedWithPhotoAndResume() {
        user.setPhotoUrl("https://cdn.example.com/photo.jpg");
        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
        when(resumeRepository.countByUser(user)).thenReturn(2L);
        when(coverLetterRepository.countByUser(user)).thenReturn(0L);
        when(atsAnalysisRepository.countByUser(user)).thenReturn(0L);
        when(aiUsageLogRepository.countByUserAndCreatedAtAfter(any(), any())).thenReturn(0L);
        when(activityEventService.recent(any(), anyInt())).thenReturn(List.of());

        DashboardResponse response = dashboardService.getDashboard(user.getId(), 10);

        assertThat(response.profileCompletion().percentage()).isEqualTo(100);
        assertThat(response.profileCompletion().missingSteps()).isEmpty();
        assertThat(response.resumeCount()).isEqualTo(2L);
    }

    @Test
    void profileCompletionListsMissingStepsWhenIncomplete() {
        user.setEmailVerified(false);
        user.setPhotoUrl(null);
        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
        when(resumeRepository.countByUser(user)).thenReturn(0L);
        when(coverLetterRepository.countByUser(user)).thenReturn(0L);
        when(atsAnalysisRepository.countByUser(user)).thenReturn(0L);
        when(aiUsageLogRepository.countByUserAndCreatedAtAfter(any(), any())).thenReturn(0L);
        when(activityEventService.recent(any(), anyInt())).thenReturn(List.of());

        DashboardResponse response = dashboardService.getDashboard(user.getId(), 10);

        assertThat(response.profileCompletion().percentage()).isZero();
        assertThat(response.profileCompletion().missingSteps())
            .containsExactly("Verify your email address", "Add a profile photo", "Create your first resume");
    }

    @Test
    void aiUsageReflectsQuotaAndRemaining() {
        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
        when(resumeRepository.countByUser(user)).thenReturn(0L);
        when(coverLetterRepository.countByUser(user)).thenReturn(0L);
        when(atsAnalysisRepository.countByUser(user)).thenReturn(0L);
        when(aiUsageLogRepository.countByUserAndCreatedAtAfter(any(), any())).thenReturn(12L);
        when(activityEventService.recent(any(), anyInt())).thenReturn(List.of());

        DashboardResponse response = dashboardService.getDashboard(user.getId(), 10);

        assertThat(response.aiUsage().used()).isEqualTo(12L);
        assertThat(response.aiUsage().monthlyLimit()).isEqualTo(50L);
        assertThat(response.aiUsage().remaining()).isEqualTo(38L);
    }

    @Test
    void mapsActivityEventsToActivityItems() {
        ActivityEvent event = ActivityEvent.builder()
            .user(user)
            .type(ActivityEvent.Type.ACCOUNT_CREATED)
            .title("Account created")
            .build();

        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
        when(resumeRepository.countByUser(user)).thenReturn(0L);
        when(coverLetterRepository.countByUser(user)).thenReturn(0L);
        when(atsAnalysisRepository.countByUser(user)).thenReturn(0L);
        when(aiUsageLogRepository.countByUserAndCreatedAtAfter(any(), any())).thenReturn(0L);
        when(activityEventService.recent(user, 5)).thenReturn(List.of(event));

        DashboardResponse response = dashboardService.getDashboard(user.getId(), 5);

        assertThat(response.recentActivity()).hasSize(1);
        assertThat(response.recentActivity().get(0).type()).isEqualTo("ACCOUNT_CREATED");
        assertThat(response.recentActivity().get(0).title()).isEqualTo("Account created");
    }
}
