package com.internalmanagement.mlservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DataAlignmentDto {

    private boolean taskDataAligned;

    private boolean profileDataAligned;

    private boolean workloadDataAligned;

    private boolean overallAlignment;

    private LocalDateTime lastChecked;

    private String error;

    private String recommendations;
}
