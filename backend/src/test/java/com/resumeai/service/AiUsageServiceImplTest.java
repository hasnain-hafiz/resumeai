package com.resumeai.service;

import com.resumeai.entity.AiUsageLog;
import com.resumeai.entity.User;
import com.resumeai.exception.AiQuotaExceededException;
import com.resumeai.repository.AiUsageLogRepository;
import com.resumeai.service.impl.AiUsageServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AiUsageServiceImplTest {

    @Mock private AiUsageLogRepository aiUsageLogRepository;

    @InjectMocks
    private AiUsageServiceImpl aiUsageService;

    private User user;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(aiUsageService, "freeMonthlyAiQuota", 5L);
        user = User.builder().fullName("Ada Lovelace").email("ada@example.com").build();
        user.setId(UUID.randomUUID());
    }

    @Test
    void enforceQuota_allowsWhenUnderLimit() {
        when(aiUsageLogRepository.countByUserAndCreatedAtAfter(eq(user), any(Instant.class))).thenReturn(4L);

        aiUsageService.enforceQuota(user); // should not throw
    }

    @Test
    void enforceQuota_throwsWhenAtLimit() {
        when(aiUsageLogRepository.countByUserAndCreatedAtAfter(eq(user), any(Instant.class))).thenReturn(5L);

        assertThatThrownBy(() -> aiUsageService.enforceQuota(user))
            .isInstanceOf(AiQuotaExceededException.class);
    }

    @Test
    void recordUsage_savesLogForFeature() {
        aiUsageService.recordUsage(user, AiUsageLog.Feature.SUMMARY_GENERATOR);

        ArgumentCaptor<AiUsageLog> captor = ArgumentCaptor.forClass(AiUsageLog.class);
        verify(aiUsageLogRepository).save(captor.capture());
        assertThat(captor.getValue().getUser()).isEqualTo(user);
        assertThat(captor.getValue().getFeature()).isEqualTo(AiUsageLog.Feature.SUMMARY_GENERATOR);
    }

    @Test
    void remainingQuota_computesDifferenceAndNeverGoesNegative() {
        when(aiUsageLogRepository.countByUserAndCreatedAtAfter(eq(user), any(Instant.class))).thenReturn(7L);

        assertThat(aiUsageService.remainingQuota(user)).isZero();
    }
}
