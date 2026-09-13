package com.resumeai.ai;

/**
 * Career stage used to tailor AI-generated resume content. Shared vocabulary across AI features
 * that need to adjust tone/scope by seniority (Summary Generator today; Experience Writer, Cover
 * Letter Generator, and others can reuse it later).
 */
public enum CareerLevel {
    STUDENT,
    FRESHER,
    JUNIOR,
    MID_LEVEL,
    SENIOR,
    ARCHITECT
}
