package com.mnp.post.controller;

import com.mnp.post.dto.ApiResponse;
import com.mnp.post.dto.request.ReactionRequest;
import com.mnp.post.dto.response.ReactionResponse;
import com.mnp.post.service.ReactionService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/reactions")
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ReactionController {
    ReactionService reactionService;

    @PostMapping("/toggle")
    ApiResponse<ReactionResponse> toggleReaction(@RequestBody ReactionRequest request){
        return ApiResponse.<ReactionResponse>builder()
                .result(reactionService.toggleReaction(request))
                .build();
    }

    @GetMapping("/target/{targetId}")
    ApiResponse<List<ReactionResponse>> getReactionsByTargetId(@PathVariable String targetId){
        return ApiResponse.<List<ReactionResponse>>builder()
                .result(reactionService.getReactionsByTargetId(targetId))
                .build();
    }
}

