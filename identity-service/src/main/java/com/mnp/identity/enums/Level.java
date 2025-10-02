package com.mnp.identity.enums;

public enum Level {
    INTERN("Intern", 1),
    JUNIOR("Junior", 2),
    SENIOR("Senior", 3),
    LEAD("Lead", 4),
    MANAGER("Manager", 5);

    private final String displayName;
    private final int hierarchy;

    Level(String displayName, int hierarchy) {
        this.displayName = displayName;
        this.hierarchy = hierarchy;
    }

    public String getDisplayName() {
        return displayName;
    }

    public int getHierarchy() {
        return hierarchy;
    }
}
