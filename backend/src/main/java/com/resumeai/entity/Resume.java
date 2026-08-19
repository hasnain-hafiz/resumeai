package com.resumeai.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
 * Deliberately minimal for now - just enough for the Dashboard to count and
 * list resumes. The Resume Builder feature will add columns for template,
 * sections, content (likely JSONB) etc. via its own migration, not redefine
 * this table.
 */
@Entity
@Table(name = "resumes", indexes = @Index(name = "idx_resumes_user_id", columnList = "user_id"))
@SQLRestriction("deleted_at IS NULL")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Resume extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 200)
    @Builder.Default
    private String title = "Untitled Resume";

    // ---- Personal information ----
    @Column(name = "full_name", length = 120)
    private String fullName;

    @Column(length = 180)
    private String email;

    @Column(length = 40)
    private String phone;

    @Column(length = 255)
    private String address;

    @Column(name = "linkedin_url", length = 255)
    private String linkedinUrl;

    @Column(name = "github_url", length = 255)
    private String githubUrl;

    @Column(name = "portfolio_url", length = 255)
    private String portfolioUrl;

    @Column(name = "website_url", length = 255)
    private String websiteUrl;

    @Column(name = "photo_url", length = 500)
    private String photoUrl;

    // ---- Professional summary (rich text, stored as HTML) ----
    @Column(columnDefinition = "TEXT")
    private String summary;
}
