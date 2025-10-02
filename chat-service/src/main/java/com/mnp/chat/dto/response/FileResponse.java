package com.mnp.chat.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class FileResponse {
    String fileName;
    String fileUrl;
    String fileType;
    Long fileSize;
    String uploadDate;
}
