package com.resumeai.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLRestriction;

@Entity
@Table(name = "resume_project_images", indexes = @Index(name = "idx_resume_project_images_project_id", columnList = "project_id"))
@SQLRestriction("deleted_at IS NULL")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResumeProjectImage extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    private ResumeProject project;

    /** URL of an already-uploaded image - file upload itself belongs to the Storage/Cloudinary feature. */
    @Column(nullable = false, length = 1000)
    private String url;

    @Column(name = "sort_order", nullable = false)
    @Builder.Default
    private int sortOrder = 0;
}
