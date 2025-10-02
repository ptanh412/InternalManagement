package com.mnp.ai.enums;

public enum RequirementPriority {
    CRITICAL(1),
    HIGH(2),
    MEDIUM(3),
    LOW(4),
    OPTIONAL(5);

    private final int level;

    RequirementPriority(int level) {
        this.level = level;
    }

    public int getLevel() {
        return level;
    }
}
