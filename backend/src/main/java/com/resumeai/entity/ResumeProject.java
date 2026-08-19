package com.resumeai.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLRestriction;

@Entity
@Table(name = "resume_projects", indexes = @Index(name = "idx_resume_projects_resume_id", columnList = "resume_id"))
@SQLRestriction("deleted_at IS NULL")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResumeProject extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "resume_id", nullable = false)
    private Resume resume;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    /** Comma-separated tags, e.g. "React, Node.js, PostgreSQL". Kept as a simple string until tag-level filtering is needed. */
    @Column(length = 1000)
    private String technologies;

    @Column(name = "github_url", length = 255)
    private String githubUrl;

    @Column(name = "live_url", length = 255)
    private String liveUrl;

    @Column(name = "sort_order", nullable = false)
    @Builder.Default
    private int sortOrder = 0;
}
