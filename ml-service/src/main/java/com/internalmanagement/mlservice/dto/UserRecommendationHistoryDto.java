package com.internalmanagement.mlservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserRecommendationHistoryDto {

    private String userId;

    private List<RecommendationHistoryItemDto> history;

    private int totalCount;

    private int page;

    private int size;

    private LocalDateTime retrievedAt;
}
