package com.resumeai.mapper;

import com.resumeai.dto.response.resume.*;
import com.resumeai.entity.*;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface ResumeMapper {

    ResumeSummaryResponse toSummaryResponse(Resume resume);

    ExperienceResponse toExperienceResponse(ResumeExperience entity);
    List<ExperienceResponse> toExperienceResponseList(List<ResumeExperience> entities);

    EducationResponse toEducationResponse(ResumeEducation entity);
    List<EducationResponse> toEducationResponseList(List<ResumeEducation> entities);

    ProjectImageResponse toProjectImageResponse(ResumeProjectImage entity);
    List<ProjectImageResponse> toProjectImageResponseList(List<ResumeProjectImage> entities);

    @Mapping(target = "images", source = "images")
    ProjectResponse toProjectResponse(ResumeProject entity, List<ProjectImageResponse> images);

    ListItemResponse toListItemResponse(ResumeListItem entity);
    List<ListItemResponse> toListItemResponseList(List<ResumeListItem> entities);

    CertificationResponse toCertificationResponse(ResumeCertification entity);
    List<CertificationResponse> toCertificationResponseList(List<ResumeCertification> entities);

    AwardResponse toAwardResponse(ResumeAward entity);
    List<AwardResponse> toAwardResponseList(List<ResumeAward> entities);

    PublicationResponse toPublicationResponse(ResumePublication entity);
    List<PublicationResponse> toPublicationResponseList(List<ResumePublication> entities);

    VolunteerExperienceResponse toVolunteerExperienceResponse(ResumeVolunteerExperience entity);
    List<VolunteerExperienceResponse> toVolunteerExperienceResponseList(List<ResumeVolunteerExperience> entities);

    ReferenceResponse toReferenceResponse(ResumeReference entity);
    List<ReferenceResponse> toReferenceResponseList(List<ResumeReference> entities);

    CustomSectionItemResponse toCustomSectionItemResponse(ResumeCustomSectionItem entity);
    List<CustomSectionItemResponse> toCustomSectionItemResponseList(List<ResumeCustomSectionItem> entities);

    @Mapping(target = "items", source = "items")
    CustomSectionResponse toCustomSectionResponse(ResumeCustomSection entity, List<CustomSectionItemResponse> items);
}
