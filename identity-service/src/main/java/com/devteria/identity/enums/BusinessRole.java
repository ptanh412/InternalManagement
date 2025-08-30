package com.devteria.identity.enums;

import lombok.Getter;

@Getter
public enum BusinessRole {
    DIRECTOR("Director", "Company Director", 10),
    SECRETARY("Secretary", "Executive Secretary", 9),
    HEADER_DEPARTMENT("Header Department", "Department Head", 8),
    DEPUTY_DEPARTMENT("Deputy Department", "Deputy Department Head", 7),
    LEADER_PROJECT("Leader Project", "Project Leader", 6),
    DEPUTY_PROJECT("Deputy Project", "Deputy Project Leader", 5),
    ADMINISTRATION("Administration", "Administrative Staff", 4),
    MEMBER("Member", "Regular Member", 3);

    private final String displayName;
    private final String description;
    private final int hierarchyLevel; // Higher number = higher authority

    BusinessRole(String displayName, String description, int hierarchyLevel) {
        this.displayName = displayName;
        this.description = description;
        this.hierarchyLevel = hierarchyLevel;
    }

    public boolean hasHigherAuthorityThan(BusinessRole other) {
        return this.hierarchyLevel > other.hierarchyLevel;
    }

    public boolean canManage(BusinessRole other) {
        return this.hierarchyLevel >= other.hierarchyLevel;
    }
}
