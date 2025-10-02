package com.mnp.profile.mapper;

import java.util.List;

import org.mapstruct.Mapper;

import com.mnp.profile.dto.request.UserSkillRequest;
import com.mnp.profile.dto.response.UserSkillResponse;
import com.mnp.profile.entity.UserSkill;

@Mapper(componentModel = "spring")
public interface UserSkillMapper {
    UserSkill toUserSkill(UserSkillRequest request);

    UserSkillResponse toUserSkillResponse(UserSkill entity);

    List<UserSkill> toUserSkillList(List<UserSkillRequest> requests);

    List<UserSkillResponse> toUserSkillResponseList(List<UserSkill> entities);
}
