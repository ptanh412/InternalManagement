package com.mnp.chat.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;

import lombok.Getter;

@Getter
public enum ErrorCode {
    UNCATEGORIZED_EXCEPTION(9999, "Uncategorized error", HttpStatus.INTERNAL_SERVER_ERROR),
    INVALID_KEY(1001, "Uncategorized error", HttpStatus.BAD_REQUEST),
    USER_EXISTED(1002, "User existed", HttpStatus.BAD_REQUEST),
    USERNAME_INVALID(1003, "Username must be at least {min} characters", HttpStatus.BAD_REQUEST),
    INVALID_PASSWORD(1004, "Password must be at least {min} characters", HttpStatus.BAD_REQUEST),
    USER_NOT_EXISTED(1005, "User not existed", HttpStatus.NOT_FOUND),
    UNAUTHENTICATED(1006, "Unauthenticated", HttpStatus.UNAUTHORIZED),
    UNAUTHORIZED(1007, "You do not have permission", HttpStatus.FORBIDDEN),
    INVALID_DOB(1008, "Your age must be at least {min}", HttpStatus.BAD_REQUEST),
    CONVERSATION_NOT_FOUND(1009, "Chat conversation not found", HttpStatus.NOT_FOUND),
    MESSAGE_NOT_FOUND(1010, "Message not found", HttpStatus.NOT_FOUND),
    INVALID_FILE(1011, "Invalid file or file is empty", HttpStatus.BAD_REQUEST),
    FILE_UPLOAD_FAILED(1012, "Failed to upload file", HttpStatus.INTERNAL_SERVER_ERROR),
    MESSAGE_CREATION_FAILED(1013, "Failed to create message", HttpStatus.INTERNAL_SERVER_ERROR),
    INVALID_REPLY_MESSAGE(1014, "Invalid reply message ID", HttpStatus.BAD_REQUEST),
    ACCESS_DENIED(1015, "Access denied to this resource", HttpStatus.FORBIDDEN),
    NOT_MEDIA_MESSAGE(1016, "Message is not a media message", HttpStatus.BAD_REQUEST),
    INVALID_GROUP_NAME(1017, "Group name cannot be empty", HttpStatus.BAD_REQUEST),
    INVALID_PARTICIPANTS(1018, "Group must have at least one participant", HttpStatus.BAD_REQUEST),
    INVALID_CONVERSATION_TYPE(1019, "Invalid conversation type", HttpStatus.BAD_REQUEST);

    ErrorCode(int code, String message, HttpStatusCode statusCode) {
        this.code = code;
        this.message = message;
        this.statusCode = statusCode;
    }

    private final int code;
    private final String message;
    private final HttpStatusCode statusCode;
}
