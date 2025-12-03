package com.mnp.ai.entity;

import java.time.LocalDateTime;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Document(collection = "cv_analysis_history")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CVAnalysisHistory {

    @Id
    String id;

    @Field("file_name")
    @Indexed
    String fileName;

    @Field("file_size")
    Long fileSize;

    @Field("file_type")
    String fileType;

    @Field("cv_file_url")
    String cvFileUrl;

    @Field("status")
    @Indexed
    AnalysisStatus status;

    @Field("confidence_score")
    Double confidenceScore;

    @Field("processing_time_ms")
    Long processingTimeMs;

    @Field("analysis_result_json")
    String analysisResultJson; // Store full ParsedUserProfile as JSON

    @Field("created_user_id")
    @Indexed
    String createdUserId;

    @Field("created_username")
    String createdUsername;

    @Field("created_user_email")
    String createdUserEmail;

    @Field("created_by")
    @Indexed
    String createdBy;

    @Field("error_message")
    String errorMessage;

    @Field("notes")
    String notes;

    @Field("created_at")
    @Indexed
    LocalDateTime createdAt;

    @Field("updated_at")
    LocalDateTime updatedAt;

    // Auto-set timestamps
    public void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public enum AnalysisStatus {
        PENDING,
        ANALYZING,
        ANALYZED,
        USER_CREATED,
        FAILED
    }
}
