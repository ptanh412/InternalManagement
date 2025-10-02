package com.mnp.identity.mapper;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;

import com.mnp.identity.dto.interservice.InterServiceProfileCreationRequest;
import com.mnp.identity.dto.interservice.InterServiceUserSkillRequest;
import com.mnp.identity.dto.request.UserSkillRequest;
import com.mnp.identity.enums.AvailabilityStatus;

@Component
public class InterServiceMapper {

    public InterServiceProfileCreationRequest toInterServiceRequest(
            String userId,
            String avatar,
            java.time.LocalDate dob,
            String city,
            List<UserSkillRequest> skills,
            AvailabilityStatus availabilityStatus) {

        return InterServiceProfileCreationRequest.builder()
                .userId(userId)
                .avatar(avatar)
                .dob(dob)
                .city(city)
                .skills(mapSkills(skills))
                .availabilityStatus(availabilityStatus != null ? availabilityStatus.name() : null)
                .build();
    }

    private List<InterServiceUserSkillRequest> mapSkills(List<UserSkillRequest> skills) {
        if (skills == null) {
            return null;
        }

        return skills.stream().map(this::mapUserSkill).collect(Collectors.toList());
    }

    private InterServiceUserSkillRequest mapUserSkill(UserSkillRequest skill) {
        if (skill == null) {
            return null;
        }

        return InterServiceUserSkillRequest.builder()
                .skillName(skill.getSkillName())
                .skillType(skill.getSkillType() != null ? skill.getSkillType().name() : null)
                .proficiencyLevel(
                        skill.getProficiencyLevel() != null
                                ? skill.getProficiencyLevel().name()
                                : null)
                .yearsOfExperience(skill.getYearsOfExperience())
                .lastUsed(skill.getLastUsed())
                .build();
    }
}
