package com.mnp.ai.exception;

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
    INVALID_EMAIL(1009, "Invalid email address", HttpStatus.BAD_REQUEST),
    EMAIL_IS_REQUIRED(1009, "Email is required", HttpStatus.BAD_REQUEST),

    // Department related errors
    DEPARTMENT_EXISTED(1010, "Department already exists", HttpStatus.BAD_REQUEST),
    DEPARTMENT_NOT_EXISTED(1011, "Department not found", HttpStatus.NOT_FOUND),
    DEPARTMENT_HAS_USERS(1012, "Cannot delete department with active users", HttpStatus.BAD_REQUEST),
    DEPARTMENT_HAS_SUBDEPARTMENTS(1013, "Cannot delete department with sub-departments", HttpStatus.BAD_REQUEST),
    INVALID_BUSINESS_ROLE(1014, "Invalid business role", HttpStatus.BAD_REQUEST),
    INSUFFICIENT_BUSINESS_AUTHORITY(1015, "Insufficient business authority for this operation", HttpStatus.FORBIDDEN),

    // Employee and email related errors
    EMAIL_EXISTED(1016, "Email already exists", HttpStatus.BAD_REQUEST),
    EMPLOYEE_ID_EXISTED(1017, "Employee ID already exists", HttpStatus.BAD_REQUEST),
    POSITION_NOT_EXISTED(1018, "Position not found", HttpStatus.NOT_FOUND),

    // AI Service related errors
    AI_SERVICE_ERROR(1024, "AI service is unavailable or returned an error", HttpStatus.SERVICE_UNAVAILABLE),

    // Requirements Analysis related errors
    UNSUPPORTED_FILE_TYPE(1025, "Unsupported file type", HttpStatus.BAD_REQUEST),
    FILE_TOO_LARGE(1026, "File size exceeds limit", HttpStatus.BAD_REQUEST),
    FILE_PROCESSING_ERROR(1027, "Error processing file content", HttpStatus.INTERNAL_SERVER_ERROR),
    REQUIREMENTS_ANALYSIS_FAILED(1028, "Requirements analysis failed", HttpStatus.INTERNAL_SERVER_ERROR),
    DOCUMENT_NOT_FOUND(1029, "Requirement document not found", HttpStatus.NOT_FOUND),
    TASK_GENERATION_FAILED(1030, "Task generation failed", HttpStatus.INTERNAL_SERVER_ERROR),
    URL_DOWNLOAD_FAILED(1031, "Failed to download content from URL", HttpStatus.BAD_REQUEST),

    HISTORY_NOT_FOUND(1032, "History not found", HttpStatus.NOT_FOUND),

    ;

    ErrorCode(int code, String message, HttpStatusCode statusCode) {
        this.code = code;
        this.message = message;
        this.statusCode = statusCode;
    }

    private final int code;
    private final String message;
    private final HttpStatusCode statusCode;
}
