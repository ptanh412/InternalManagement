package com.devteria.chat.mapper;

import java.util.List;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import com.devteria.chat.dto.request.ChatMessageRequest;
import com.devteria.chat.dto.request.ReplyMessageRequest;
import com.devteria.chat.dto.response.ChatMessageResponse;
import com.devteria.chat.entity.ChatMessage;

@Mapper(componentModel = "spring")
public interface ChatMessageMapper {
    @Mapping(target = "recalled", expression = "java(chatMessage.isRecalled())")
    @Mapping(target = "isPinned", expression = "java(chatMessage.isPinned())")
    @Mapping(target = "mediaUrl", source = "mediaUrl")
    @Mapping(target = "mediaType", source = "mediaType")
    @Mapping(target = "fileName", source = "fileName")
    @Mapping(target = "fileSize", source = "fileSize")
    ChatMessageResponse toChatMessageResponse(ChatMessage chatMessage);

    ChatMessage toChatMessage(ChatMessageRequest request);

    ChatMessage toChatMessage(ReplyMessageRequest request);

    List<ChatMessageResponse> toChatMessageResponses(List<ChatMessage> chatMessages);
}
