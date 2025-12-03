package com.internalmanagement.mlservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrainingRequestDto {

    private boolean forceRetrain = false;

    private boolean useSyntheticData = false;

    private int dataMonthsBack = 12;

    private String trainingType = "HYBRID"; // CONTENT_ONLY, COLLABORATIVE_ONLY, HYBRID

    private String dataType = "REAL"; // REAL, SYNTHETIC

    private boolean enableHyperparameterTuning = true;

    private String requestedBy;

    private String reason;
}
