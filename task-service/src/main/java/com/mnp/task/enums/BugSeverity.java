package com.mnp.task.enums;

public enum BugSeverity {
    CRITICAL,   // Lỗi nghiêm trọng, sập hệ thống (System crash, data loss)
    MAJOR,      // Lỗi chức năng chính (Main feature broken)
    MINOR,      // Lỗi nhỏ, có thể workaround (Glitch, UI issue)
    COSMETIC
}
