package com.mnp.profile.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.mnp.profile.dto.request.UserSkillRequest;
import com.mnp.profile.dto.response.UserSkillResponse;
import com.mnp.profile.entity.UserSkill;
import com.mnp.profile.enums.ProficiencyLevel;
import com.mnp.profile.enums.SkillType;
import com.mnp.profile.exception.AppException;
import com.mnp.profile.exception.ErrorCode;
import com.mnp.profile.mapper.UserSkillMapper;
import com.mnp.profile.repository.UserSkillRepository;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class UserSkillService {
    @Autowired
    private UserSkillRepository userSkillRepository;

    @Autowired
    private UserSkillMapper userSkillMapper;

    public UserSkillResponse createSkill(UserSkillRequest request) {
        UserSkill skill = userSkillMapper.toUserSkill(request);
        skill = userSkillRepository.save(skill);
        return userSkillMapper.toUserSkillResponse(skill);
    }

    public UserSkillResponse updateSkill(String skillId, UserSkillRequest request) {
        UserSkill skill =
                userSkillRepository.findById(skillId).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        skill.setSkillName(request.getSkillName());
        skill.setSkillType(request.getSkillType());
        skill.setProficiencyLevel(request.getProficiencyLevel());
        skill.setYearsOfExperience(request.getYearsOfExperience());
        skill.setLastUsed(request.getLastUsed());

        skill = userSkillRepository.save(skill);
        return userSkillMapper.toUserSkillResponse(skill);
    }

    public void deleteSkill(String skillId) {
        if (!userSkillRepository.existsById(skillId)) {
            throw new AppException(ErrorCode.USER_NOT_EXISTED);
        }
        userSkillRepository.deleteById(skillId);
    }

    public UserSkillResponse getSkill(String skillId) {
        UserSkill skill =
                userSkillRepository.findById(skillId).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        return userSkillMapper.toUserSkillResponse(skill);
    }

    public List<UserSkillResponse> getAllSkills() {
        List<UserSkill> skills = userSkillRepository.findAll();
        return userSkillMapper.toUserSkillResponseList(skills);
    }

    public List<UserSkillResponse> searchSkillsByName(String skillName) {
        List<UserSkill> skills = userSkillRepository.findBySkillNameContainingIgnoreCase(skillName);
        return userSkillMapper.toUserSkillResponseList(skills);
    }

    public List<UserSkillResponse> getSkillsByType(SkillType skillType) {
        List<UserSkill> skills = userSkillRepository.findBySkillType(skillType);
        return userSkillMapper.toUserSkillResponseList(skills);
    }

    public List<UserSkillResponse> getSkillsByProficiencyLevel(ProficiencyLevel proficiencyLevel) {
        List<UserSkill> skills = userSkillRepository.findByProficiencyLevel(proficiencyLevel);
        return userSkillMapper.toUserSkillResponseList(skills);
    }
}
