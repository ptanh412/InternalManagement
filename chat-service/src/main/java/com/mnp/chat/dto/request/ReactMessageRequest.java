package com.mnp.chat.dto.request;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ReactMessageRequest {
    String messageId;
    String icon;
    boolean remove; // true to remove reaction, false to add
}
