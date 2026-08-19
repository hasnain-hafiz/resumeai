package com.resumeai.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.SQLRestriction;

@Entity
@Table(name = "resume_references", indexes = @Index(name = "idx_resume_references_resume_id", columnList = "resume_id"))
@SQLRestriction("deleted_at IS NULL")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResumeReference extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "resume_id", nullable = false)
    private Resume resume;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(length = 150)
    private String relationship;

    @Column(length = 200)
    private String company;

    @Column(length = 180)
    private String email;

    @Column(length = 40)
    private String phone;

    @Column(name = "sort_order", nullable = false)
    @Builder.Default
    private int sortOrder = 0;
}
