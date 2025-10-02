package com.mnp.identity.service;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;

import com.mnp.identity.dto.request.RoleRequest;
import com.mnp.identity.dto.response.RoleResponse;
import com.mnp.identity.entity.Role;
import com.mnp.identity.exception.AppException;
import com.mnp.identity.exception.ErrorCode;
import com.mnp.identity.mapper.RoleMapper;
import com.mnp.identity.repository.RoleRepository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class RoleService {
    RoleRepository roleRepository;
    RoleMapper roleMapper;

    @PreAuthorize("hasRole('ADMIN')")
    public RoleResponse create(RoleRequest request) {
        log.info("Creating role with name: {}", request.getName());

        // Check if role already exists
        if (roleRepository.findByName(request.getName()).isPresent()) {
            throw new AppException(ErrorCode.ROLE_NOT_EXISTED);
        }

        Role role = roleMapper.toRole(request);
        role = roleRepository.save(role);

        log.info("Role created successfully with ID: {}", role.getId());
        return roleMapper.toRoleResponse(role);
    }

    @PreAuthorize("hasRole('ADMIN')")
    public List<RoleResponse> getAll() {
        log.info("Getting all roles");
        return roleRepository.findAll().stream().map(roleMapper::toRoleResponse).toList();
    }

    @PreAuthorize("hasRole('ADMIN')")
    public List<RoleResponse> getAllRoles() {
        return getAll(); // Delegate to the existing method
    }

    @PreAuthorize("hasRole('ADMIN')")
    public RoleResponse getRole(String id) {
        Role role = roleRepository.findById(id).orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_EXISTED));
        return roleMapper.toRoleResponse(role);
    }

    @PreAuthorize("hasRole('ADMIN')")
    public void delete(String id) {
        log.info("Deleting role with ID: {}", id);

        Role role = roleRepository.findById(id).orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_EXISTED));

        roleRepository.delete(role);
        log.info("Role deleted successfully with ID: {}", id);
    }
}
