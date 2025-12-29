package com.mnp.ai.dto;

import java.util.List;
import java.util.Map;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MLPredictionRequest {
    private String taskId;
    private Map<String, Object> taskData;

    // Changed from List<CandidateFeatures> to List<Map<String, Object>>
    // Now only sends userId + AI scores, ML service fetches user data from databases
    private List<Map<String, Object>> candidates;
}

