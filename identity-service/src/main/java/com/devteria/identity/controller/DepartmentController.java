package com.devteria.identity.controller;

import java.util.List;

import jakarta.validation.Valid;

import org.springframework.web.bind.annotation.*;

import com.devteria.identity.dto.request.ApiResponse;
import com.devteria.identity.dto.request.DepartmentCreationRequest;
import com.devteria.identity.dto.request.DepartmentUpdateRequest;
import com.devteria.identity.dto.response.DepartmentResponse;
import com.devteria.identity.service.DepartmentService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/departments")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class DepartmentController {

    DepartmentService departmentService;

    @PostMapping
    ApiResponse<DepartmentResponse> createDepartment(@RequestBody @Valid DepartmentCreationRequest request) {
        return ApiResponse.<DepartmentResponse>builder()
                .result(departmentService.createDepartment(request))
                .build();
    }

    @GetMapping
    ApiResponse<List<DepartmentResponse>> getDepartments() {
        return ApiResponse.<List<DepartmentResponse>>builder()
                .result(departmentService.getAllDepartments())
                .build();
    }

    @GetMapping("/{departmentId}")
    ApiResponse<DepartmentResponse> getDepartment(@PathVariable("departmentId") String departmentId) {
        return ApiResponse.<DepartmentResponse>builder()
                .result(departmentService.getDepartment(departmentId))
                .build();
    }

    @PutMapping("/{departmentId}")
    ApiResponse<DepartmentResponse> updateDepartment(
            @PathVariable String departmentId, @RequestBody @Valid DepartmentUpdateRequest request) {
        return ApiResponse.<DepartmentResponse>builder()
                .result(departmentService.updateDepartment(departmentId, request))
                .build();
    }

    @DeleteMapping("/{departmentId}")
    ApiResponse<String> deleteDepartment(@PathVariable String departmentId) {
        departmentService.deleteDepartment(departmentId);
        return ApiResponse.<String>builder()
                .result("Department has been deleted")
                .build();
    }
}
