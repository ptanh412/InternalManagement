package com.mnp.chat.mapper;

import java.util.List;

import org.mapstruct.Mapper;

import com.mnp.chat.dto.response.ConversationResponse;
import com.mnp.chat.entity.Conversation;

@Mapper(componentModel = "spring")
public interface ConversationMapper {
    ConversationResponse toConversationResponse(Conversation conversation);

    List<ConversationResponse> toConversationResponseList(List<Conversation> conversations);
}
