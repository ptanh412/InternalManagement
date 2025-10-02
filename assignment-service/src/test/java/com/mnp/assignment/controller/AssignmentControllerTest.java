package com.mnp.assignment.controller;

import com.mnp.assignment.dto.request.CreateAssignmentRequest;
import com.mnp.assignment.dto.response.AssignmentResponse;
import com.mnp.assignment.service.AssignmentService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AssignmentController.class)
public class AssignmentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AssignmentService assignmentService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void testGetUserAssignments() throws Exception {
        // Given
        when(assignmentService.getAssignmentsByUserId(anyString()))
                .thenReturn(Collections.emptyList());

        // When & Then
        mockMvc.perform(get("/api/assignments/user/test-user"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000));
    }

    @Test
    void testCreateAssignment() throws Exception {
        // Given
        CreateAssignmentRequest request = CreateAssignmentRequest.builder()
                .taskId("test-task")
                .candidateUserId("test-user")
                .assignmentReason("Manual assignment")
                .build();

        AssignmentResponse response = AssignmentResponse.builder()
                .id("test-id")
                .taskId("test-task")
                .candidateUserId("test-user")
                .isSelected(false)
                .build();

        when(assignmentService.createAssignment(any(CreateAssignmentRequest.class)))
                .thenReturn(response);

        // When & Then
        mockMvc.perform(post("/api/assignments")
                .contentType("application/json")
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.taskId").value("test-task"));
    }
}
