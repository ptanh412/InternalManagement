package com.mnp.chat.dto.request;

import java.util.List;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CreateProjectGroupRequest {
    String projectId;
    String projectName;
    String projectManagerId;
    String teamLeadId;
    List<String> initialMemberIds; // Additional initial members if any
}
