package com.mnp.profile.controller;

import java.util.List;

import org.springframework.web.bind.annotation.*;

import com.mnp.profile.dto.ApiResponse;
import com.mnp.profile.dto.request.UserSkillRequest;
import com.mnp.profile.dto.response.UserSkillResponse;
import com.mnp.profile.enums.ProficiencyLevel;
import com.mnp.profile.enums.SkillType;
import com.mnp.profile.service.UserSkillService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/skills")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class UserSkillController {

    UserSkillService userSkillService;

    @PostMapping
    public ApiResponse<UserSkillResponse> createSkill(@RequestBody UserSkillRequest request) {
        log.info("Creating new skill: {}", request.getSkillName());
        return ApiResponse.<UserSkillResponse>builder()
                .result(userSkillService.createSkill(request))
                .build();
    }

    @GetMapping("/{skillId}")
    public ApiResponse<UserSkillResponse> getSkill(@PathVariable String skillId) {
        log.info("Getting skill with ID: {}", skillId);
        return ApiResponse.<UserSkillResponse>builder()
                .result(userSkillService.getSkill(skillId))
                .build();
    }

    @GetMapping
    public ApiResponse<List<UserSkillResponse>> getAllSkills() {
        log.info("Getting all skills");
        return ApiResponse.<List<UserSkillResponse>>builder()
                .result(userSkillService.getAllSkills())
                .build();
    }

    @PutMapping("/{skillId}")
    public ApiResponse<UserSkillResponse> updateSkill(
            @PathVariable String skillId, @RequestBody UserSkillRequest request) {
        log.info("Updating skill with ID: {} to: {}", skillId, request.getSkillName());
        return ApiResponse.<UserSkillResponse>builder()
                .result(userSkillService.updateSkill(skillId, request))
                .build();
    }

    @DeleteMapping("/{skillId}")
    public ApiResponse<Void> deleteSkill(@PathVariable String skillId) {
        log.info("Deleting skill with ID: {}", skillId);
        userSkillService.deleteSkill(skillId);
        return ApiResponse.<Void>builder().build();
    }

    @GetMapping("/search")
    public ApiResponse<List<UserSkillResponse>> searchSkills(@RequestParam String skillName) {
        log.info("Searching skills by name: {}", skillName);
        return ApiResponse.<List<UserSkillResponse>>builder()
                .result(userSkillService.searchSkillsByName(skillName))
                .build();
    }

    @GetMapping("/type/{skillType}")
    public ApiResponse<List<UserSkillResponse>> getSkillsByType(@PathVariable SkillType skillType) {
        log.info("Getting skills by type: {}", skillType);
        return ApiResponse.<List<UserSkillResponse>>builder()
                .result(userSkillService.getSkillsByType(skillType))
                .build();
    }

    @GetMapping("/proficiency/{proficiencyLevel}")
    public ApiResponse<List<UserSkillResponse>> getSkillsByProficiencyLevel(
            @PathVariable ProficiencyLevel proficiencyLevel) {
        log.info("Getting skills by proficiency level: {}", proficiencyLevel);
        return ApiResponse.<List<UserSkillResponse>>builder()
                .result(userSkillService.getSkillsByProficiencyLevel(proficiencyLevel))
                .build();
    }
}
