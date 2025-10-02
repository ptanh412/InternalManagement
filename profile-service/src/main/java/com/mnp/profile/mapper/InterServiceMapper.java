package com.mnp.profile.mapper;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;

import com.mnp.profile.dto.interservice.InterServiceProfileCreationRequest;
import com.mnp.profile.dto.interservice.InterServiceUserSkillRequest;
import com.mnp.profile.dto.request.ProfileCreationRequest;
import com.mnp.profile.dto.request.UserSkillRequest;
import com.mnp.profile.enums.AvailabilityStatus;
import com.mnp.profile.enums.ProficiencyLevel;
import com.mnp.profile.enums.SkillType;

import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
public class InterServiceMapper {

    public ProfileCreationRequest toProfileCreationRequest(InterServiceProfileCreationRequest interServiceRequest) {
        if (interServiceRequest == null) {
            return null;
        }

        return ProfileCreationRequest.builder()
                .userId(interServiceRequest.getUserId())
                .avatar(interServiceRequest.getAvatar())
                .dob(interServiceRequest.getDob())
                .city(interServiceRequest.getCity())
                .skills(mapSkills(interServiceRequest.getSkills()))
                .availabilityStatus(mapAvailabilityStatus(interServiceRequest.getAvailabilityStatus()))
                .build();
    }

    private List<UserSkillRequest> mapSkills(List<InterServiceUserSkillRequest> interServiceSkills) {
        if (interServiceSkills == null) {
            return null;
        }

        return interServiceSkills.stream().map(this::mapUserSkill).collect(Collectors.toList());
    }

    private UserSkillRequest mapUserSkill(InterServiceUserSkillRequest interServiceSkill) {
        if (interServiceSkill == null) {
            return null;
        }

        return UserSkillRequest.builder()
                .skillName(interServiceSkill.getSkillName())
                .skillType(mapSkillType(interServiceSkill.getSkillType()))
                .proficiencyLevel(mapProficiencyLevel(interServiceSkill.getProficiencyLevel()))
                .yearsOfExperience(interServiceSkill.getYearsOfExperience())
                .lastUsed(interServiceSkill.getLastUsed())
                .build();
    }

    private SkillType mapSkillType(String skillType) {
        if (skillType == null) {
            return null;
        }

        try {
            return SkillType.valueOf(skillType.toUpperCase());
        } catch (IllegalArgumentException e) {
            log.warn("Unknown skill type: {}, defaulting to TOOL", skillType);
            return SkillType.TOOL;
        }
    }

    private ProficiencyLevel mapProficiencyLevel(String proficiencyLevel) {
        if (proficiencyLevel == null) {
            return null;
        }

        try {
            return ProficiencyLevel.valueOf(proficiencyLevel.toUpperCase());
        } catch (IllegalArgumentException e) {
            log.warn("Unknown proficiency level: {}, defaulting to BEGINNER", proficiencyLevel);
            return ProficiencyLevel.BEGINNER;
        }
    }

    private AvailabilityStatus mapAvailabilityStatus(String availabilityStatus) {
        if (availabilityStatus == null) {
            return AvailabilityStatus.AVAILABLE;
        }

        try {
            return AvailabilityStatus.valueOf(availabilityStatus.toUpperCase());
        } catch (IllegalArgumentException e) {
            log.warn("Unknown availability status: {}, defaulting to AVAILABLE", availabilityStatus);
            return AvailabilityStatus.AVAILABLE;
        }
    }
}
