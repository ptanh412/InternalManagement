package com.mnp.ai.enums;

public enum GeneratedTaskStatus {
    PENDING_REVIEW, // Chờ human review
    APPROVED, // Được approve
    REJECTED, // Bị reject
    NEEDS_REVISION, // Cần chỉnh sửa
    CONVERTED,
    TASK_CREATED, // Đã tạo task
    CREATION_FAILED // Tạo task thất bại
}
