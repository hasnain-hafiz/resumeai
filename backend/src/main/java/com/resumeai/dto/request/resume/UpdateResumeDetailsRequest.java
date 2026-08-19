package com.resumeai.dto.request.resume;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Covers the resume's title + personal information + summary - the fields edited together as one "profile" form. */
public record UpdateResumeDetailsRequest(
    @NotBlank(message = "Title is required") @Size(max = 200) String title,
    @Size(max = 120) String fullName,
    @Email(message = "Enter a valid email address") @Size(max = 180) String email,
    @Size(max = 40) String phone,
    @Size(max = 255) String address,
    @Size(max = 255) String linkedinUrl,
    @Size(max = 255) String githubUrl,
    @Size(max = 255) String portfolioUrl,
    @Size(max = 255) String websiteUrl,
    @Size(max = 500) String photoUrl,
    String summary
) {}
