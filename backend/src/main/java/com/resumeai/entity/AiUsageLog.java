package com.resumeai.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.SQLRestriction;

@Entity
@Table(
    name = "ai_usage_logs",
    indexes = @Index(name = "idx_ai_usage_logs_user_id_created_at", columnList = "user_id, created_at")
)
@SQLRestriction("deleted_at IS NULL")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiUsageLog extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private Feature feature;

    /** Which AI feature was invoked. Grows as the AI Features section of the app is built out. */
    public enum Feature {
        SUMMARY_GENERATOR,
        EXPERIENCE_WRITER,
        PROJECT_GENERATOR,
        SKILLS_GENERATOR,
        ATS_OPTIMIZER,
        RESUME_REVIEW,
        JOB_MATCHER,
        COVER_LETTER_GENERATOR,
        LINKEDIN_OPTIMIZER,
        INTERVIEW_COACH,
        CAREER_ROADMAP
    }
}
