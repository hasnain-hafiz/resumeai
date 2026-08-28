import type { Resume } from "@/types/resume.types";

/**
 * A representative, fully-populated resume so the template gallery shows
 * real layouts with real content density, not empty placeholder boxes.
 * Never sent to the API - purely a client-side rendering fixture.
 */
export const SAMPLE_RESUME: Resume = {
  id: "sample",
  title: "Sample",
  fullName: "Jordan Avery",
  email: "jordan.avery@email.com",
  phone: "(555) 012-3456",
  address: "Austin, TX",
  linkedinUrl: "linkedin.com/in/jordanavery",
  githubUrl: "github.com/jordanavery",
  portfolioUrl: "jordanavery.dev",
  websiteUrl: null,
  photoUrl: null,
  summary:
    "<p>Product-minded software engineer with 6+ years building and scaling web applications. Focused on clean architecture, mentoring, and shipping things people actually use.</p>",
  template: null,
  experience: [
    {
      id: "e1", company: "Northwind Analytics", position: "Senior Software Engineer", location: "Austin, TX",
      employmentType: "FULL_TIME", startDate: "2022-03-01", endDate: null, current: true,
      responsibilities: "Lead a team of 4 engineers building the customer-facing analytics dashboard.",
      achievements: "Cut p95 dashboard load time from 4.1s to 900ms; grew active usage 38% quarter over quarter.",
      sortOrder: 0,
    },
    {
      id: "e2", company: "Brightline Co", position: "Software Engineer", location: "Remote",
      employmentType: "FULL_TIME", startDate: "2019-06-01", endDate: "2022-02-01", current: false,
      responsibilities: "Built and maintained the billing and subscriptions service.",
      achievements: "Migrated legacy billing to Stripe, reducing failed-payment churn by 12%.",
      sortOrder: 1,
    },
  ],
  education: [
    {
      id: "ed1", school: "University of Texas at Austin", degree: "B.S.", field: "Computer Science",
      cgpa: 3.7, startDate: "2015-08-01", endDate: "2019-05-01", sortOrder: 0,
    },
  ],
  projects: [
    {
      id: "p1", title: "Routewise", description: "Open-source route-planning library for delivery fleets.",
      technologies: "TypeScript, Node.js, PostGIS", githubUrl: "github.com/jordanavery/routewise", liveUrl: null,
      sortOrder: 0, images: [],
    },
  ],
  listItems: [
    { id: "s1", section: "TECHNICAL_SKILL", value: "System Design", proficiency: null, sortOrder: 0 },
    { id: "s2", section: "TECHNICAL_SKILL", value: "API Design", proficiency: null, sortOrder: 1 },
    { id: "s3", section: "PROGRAMMING_LANGUAGE", value: "TypeScript", proficiency: null, sortOrder: 0 },
    { id: "s4", section: "PROGRAMMING_LANGUAGE", value: "Python", proficiency: null, sortOrder: 1 },
    { id: "s5", section: "FRAMEWORK", value: "React", proficiency: null, sortOrder: 0 },
    { id: "s6", section: "DATABASE", value: "PostgreSQL", proficiency: null, sortOrder: 0 },
    { id: "s7", section: "SOFT_SKILL", value: "Mentoring", proficiency: null, sortOrder: 0 },
    { id: "s8", section: "SPOKEN_LANGUAGE", value: "English", proficiency: "NATIVE", sortOrder: 0 },
    { id: "s9", section: "SPOKEN_LANGUAGE", value: "Spanish", proficiency: "PROFESSIONAL", sortOrder: 1 },
  ],
  certifications: [
    { id: "c1", name: "AWS Certified Solutions Architect", issuer: "Amazon Web Services", issueDate: "2023-01-01", credentialUrl: null, sortOrder: 0 },
  ],
  awards: [],
  publications: [],
  volunteerExperience: [],
  references: [],
  customSections: [],
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
};
