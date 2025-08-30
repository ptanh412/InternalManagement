package com.devteria.identity.service;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import com.devteria.identity.entity.User;
import com.devteria.identity.enums.BusinessRole;
import com.devteria.identity.exception.AppException;
import com.devteria.identity.exception.ErrorCode;
import com.devteria.identity.repository.UserRepository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class BusinessAuthorizationService {

    UserRepository userRepository;

    public void checkBusinessRoleAssignmentAuthority(BusinessRole targetRole) {
        String currentUserId =
                SecurityContextHolder.getContext().getAuthentication().getName();

        // Add debugging to see what's happening
        if (currentUserId == null || currentUserId.isEmpty()) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }

        User currentUser =
                userRepository.findById(currentUserId).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        // If current user has no business role, they can only assign MEMBER role
        if (currentUser.getBusinessRole() == null) {
            if (targetRole != BusinessRole.MEMBER) {
                throw new AppException(ErrorCode.INSUFFICIENT_BUSINESS_AUTHORITY);
            }
            return;
        }

        // Check if current user has authority to assign the target role
        if (!currentUser.getBusinessRole().canManage(targetRole)) {
            throw new AppException(ErrorCode.INSUFFICIENT_BUSINESS_AUTHORITY);
        }
    }

    public boolean canManageDepartment(String departmentId) {
        String currentUserId =
                SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser =
                userRepository.findById(currentUserId).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        // Directors can manage all departments
        if (currentUser.getBusinessRole() == BusinessRole.DIRECTOR) {
            return true;
        }

        // Department heads can only manage their own department
        if (currentUser.getBusinessRole() == BusinessRole.HEADER_DEPARTMENT
                || currentUser.getBusinessRole() == BusinessRole.DEPUTY_DEPARTMENT) {
            return currentUser.getDepartment() != null
                    && currentUser.getDepartment().getId().equals(departmentId);
        }

        return false;
    }

    public boolean canManageUser(String targetUserId) {
        String currentUserId =
                SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser =
                userRepository.findById(currentUserId).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        User targetUser =
                userRepository.findById(targetUserId).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        // Directors can manage all users
        if (currentUser.getBusinessRole() == BusinessRole.DIRECTOR) {
            return true;
        }

        // Users cannot manage users with higher or equal authority
        if (targetUser.getBusinessRole() != null && currentUser.getBusinessRole() != null) {
            if (!currentUser.getBusinessRole().hasHigherAuthorityThan(targetUser.getBusinessRole())) {
                return false;
            }
        }

        // Department heads can manage users in their department
        if ((currentUser.getBusinessRole() == BusinessRole.HEADER_DEPARTMENT
                        || currentUser.getBusinessRole() == BusinessRole.DEPUTY_DEPARTMENT)
                && currentUser.getDepartment() != null
                && targetUser.getDepartment() != null) {
            return currentUser
                    .getDepartment()
                    .getId()
                    .equals(targetUser.getDepartment().getId());
        }

        // Project leaders can manage their project members (this would need project context)
        // For now, we'll allow project leaders to manage members in their department
        if (currentUser.getBusinessRole() == BusinessRole.LEADER_PROJECT
                && targetUser.getBusinessRole() == BusinessRole.MEMBER
                && currentUser.getDepartment() != null
                && targetUser.getDepartment() != null) {
            return currentUser
                    .getDepartment()
                    .getId()
                    .equals(targetUser.getDepartment().getId());
        }

        return false;
    }

    public User getCurrentUser() {
        String currentUserId =
                SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findById(currentUserId).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
    }
}
