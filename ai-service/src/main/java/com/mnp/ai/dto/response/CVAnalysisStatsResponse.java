package com.mnp.ai.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CVAnalysisStatsResponse {
     Long totalAnalyzed;
     Long totalUsersCreated;
     Long pendingAnalysis;
     Long failedAnalysis;
     Double averageConfidence;
     Double successRate;

     Map<String, Long> analysisByStatus;
     Map<String, Long> analysisByMonth;
}
