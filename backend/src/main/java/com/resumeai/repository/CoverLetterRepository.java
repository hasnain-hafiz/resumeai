package com.resumeai.repository;

import com.resumeai.entity.CoverLetter;
import com.resumeai.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface CoverLetterRepository extends JpaRepository<CoverLetter, UUID> {
    long countByUser(User user);
}
