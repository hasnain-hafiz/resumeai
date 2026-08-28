package com.resumeai.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.SQLRestriction;

/**
 * Catalog entry for a resume template. Deliberately holds only display
 * metadata - the actual fonts/colors/layout live in frontend code, keyed off
 * {@link #key}, so a template's visual design can be tuned without a
 * migration. This table is what a future Admin Dashboard feature manages,
 * and what a resume's {@code template_id} points at.
 */
@Entity
@Table(
    name = "resume_templates",
    uniqueConstraints = @UniqueConstraint(name = "uk_resume_templates_key", columnNames = "key"),
    indexes = @Index(name = "idx_resume_templates_active_sort", columnList = "is_active, sort_order")
)
@SQLRestriction("deleted_at IS NULL")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResumeTemplate extends BaseEntity {

    @Column(nullable = false, length = 60)
    private String key;

    @Column(nullable = false, length = 100)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private Category category;

    @Column(name = "is_ats_friendly", nullable = false)
    @Builder.Default
    private boolean atsFriendly = false;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean active = true;

    @Column(name = "sort_order", nullable = false)
    @Builder.Default
    private int sortOrder = 0;

    public enum Category {
        MODERN, MINIMAL, CORPORATE, HARVARD, STANFORD, EXECUTIVE,
        ATS_FRIENDLY, ACADEMIC, ELEGANT, COMPACT, STUDENT, CREATIVE,
        GOOGLE, APPLE, DEVELOPER, DARK
    }
}
