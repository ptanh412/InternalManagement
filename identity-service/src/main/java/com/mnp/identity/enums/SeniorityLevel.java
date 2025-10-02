package com.mnp.identity.enums;

import lombok.Getter;

@Getter
public enum SeniorityLevel {
    INTERN(1),
    JUNIOR(2),
    MID_LEVEL(3),
    SENIOR(4),
    LEAD(5),
    PRINCIPAL(6),
    DIRECTOR(7);

    private final int level;

    SeniorityLevel(int level) {
        this.level = level;
    }
}
