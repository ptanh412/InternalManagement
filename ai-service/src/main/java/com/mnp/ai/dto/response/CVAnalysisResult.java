package com.mnp.ai.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CVAnalysisResult {
    private String fileName;
    private Boolean success;
    private ParsedUserProfile userProfile;
    private String rawAnalysis;
    private Double confidence;
    private Long processingTime;
    private String errorMessage;
    private String historyId;
}
