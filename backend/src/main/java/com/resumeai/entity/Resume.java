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
 * Core resume aggregate root. Personal info, professional summary, and the
 * selected template live directly on this table; every other section
 * (experience, education, projects, ...) is a child entity referencing this
 * one by {@code resume_id} - see the other {@code Resume*} entities.
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

    // ---- Selected template (Feature 4) ----
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "template_id")
    private ResumeTemplate template;

    // ---- Section display order (Feature 6) ----
    /**
     * Comma-separated {@link SectionKey} names controlling the order the main
     * resume sections render in (Experience, Education, Projects, ...). Kept
     * as a raw delimited string rather than a normalized table since it's
     * always read/written as one complete ordering - see
     * {@link com.resumeai.util.SectionOrderCodec} for encode/decode/validate.
     */
    @Column(name = "section_order", nullable = false, length = 500)
    @Builder.Default
    private String sectionOrder = SectionKey.defaultOrderCsv();

    /** Every top-level resume section whose relative order a user can drag-and-drop rearrange. */
    public enum SectionKey {
        EXPERIENCE, EDUCATION, PROJECTS, SKILLS, CERTIFICATIONS,
        AWARDS, PUBLICATIONS, VOLUNTEER, REFERENCES, CUSTOM_SECTIONS;

        public static String defaultOrderCsv() {
            StringBuilder sb = new StringBuilder();
            for (SectionKey key : values()) {
                if (sb.length() > 0) sb.append(',');
                sb.append(key.name());
            }
            return sb.toString();
        }
    }
}
