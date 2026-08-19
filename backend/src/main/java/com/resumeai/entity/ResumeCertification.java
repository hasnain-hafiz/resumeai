package com.resumeai.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDate;

@Entity
@Table(name = "resume_certifications", indexes = @Index(name = "idx_resume_certifications_resume_id", columnList = "resume_id"))
@SQLRestriction("deleted_at IS NULL")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResumeCertification extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "resume_id", nullable = false)
    private Resume resume;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(length = 200)
    private String issuer;

    @Column(name = "issue_date")
    private LocalDate issueDate;

    @Column(name = "credential_url", length = 500)
    private String credentialUrl;

    @Column(name = "sort_order", nullable = false)
    @Builder.Default
    private int sortOrder = 0;
}
