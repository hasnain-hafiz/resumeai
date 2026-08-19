package com.resumeai.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLRestriction;

/**
 * Unified entity for every "labelled tag belonging to a resume" section:
 * technical/soft skills, tools, frameworks, databases, programming
 * languages, interests, and spoken languages. Differentiated by
 * {@link Section}; {@code proficiency} is only meaningful for
 * SPOKEN_LANGUAGE (and is left null for everything else).
 */
@Entity
@Table(name = "resume_list_items", indexes = @Index(name = "idx_resume_list_items_resume_id", columnList = "resume_id"))
@SQLRestriction("deleted_at IS NULL")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResumeListItem extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "resume_id", nullable = false)
    private Resume resume;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private Section section;

    @Column(nullable = false, length = 150)
    private String value;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private Proficiency proficiency;

    @Column(name = "sort_order", nullable = false)
    @Builder.Default
    private int sortOrder = 0;

    public enum Section {
        TECHNICAL_SKILL, SOFT_SKILL, TOOL, FRAMEWORK, DATABASE,
        PROGRAMMING_LANGUAGE, INTEREST, SPOKEN_LANGUAGE
    }

    public enum Proficiency {
        BASIC, CONVERSATIONAL, PROFESSIONAL, FLUENT, NATIVE
    }
}
