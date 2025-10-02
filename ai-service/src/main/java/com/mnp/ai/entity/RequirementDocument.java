package com.mnp.ai.entity;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.MongoId;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Document(collection = "requirement_documents")
public class RequirementDocument {
    @MongoId
    String id;

    String fileName;
    String fileType; // PDF, DOCX, TXT, MD, JSON, XML
    String uploadSource; // FILE_UPLOAD, URL_IMPORT, DIRECT_INPUT
    String filePath;
    String originalContent;

    String projectId;
    String uploadedBy;
    Long fileSize;
    String mimeType;
    String checksum;

    List<String> tags;
    String status; // UPLOADED, PROCESSED, ANALYZED, FAILED
    String processingNotes;

    LocalDateTime uploadedAt;
    LocalDateTime processedAt;
    LocalDateTime updatedAt;
}
