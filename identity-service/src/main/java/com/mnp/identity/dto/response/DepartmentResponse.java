package com.mnp.identity.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class DepartmentResponse {

    String id;
    String name;
    Long userCount;
    LocalDate createdAt;
}
