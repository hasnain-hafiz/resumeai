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

/**
 * Append-only feed: any feature records a row here when something
 * dashboard-worthy happens (a resume was created, an AI feature was used,
 * etc.) via {@link com.resumeai.service.ActivityEventService}. The Dashboard
 * simply reads the most recent rows for the current user - it doesn't need
 * to know which feature produced them.
 */
@Entity
@Table(
    name = "activity_events",
    indexes = @Index(name = "idx_activity_events_user_id_created_at", columnList = "user_id, created_at")
)
@SQLRestriction("deleted_at IS NULL")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActivityEvent extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private Type type;

    @Column(nullable = false)
    private String title;

    public enum Type {
        ACCOUNT_CREATED,
        PROFILE_UPDATED,
        RESUME_CREATED,
        COVER_LETTER_CREATED,
        ATS_ANALYSIS_RUN,
        AI_FEATURE_USED
    }
}
