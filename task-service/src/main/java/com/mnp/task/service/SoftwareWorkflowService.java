package com.mnp.task.service;

import com.mnp.task.dto.request.TaskSubmissionRequest;
import com.mnp.task.dto.request.ReviewUpdateRequest;
import com.mnp.task.dto.response.TaskSubmissionResponse;
import com.mnp.task.entity.Task;
import com.mnp.task.entity.TaskBugDetail;
import com.mnp.task.enums.BugSeverity;
import com.mnp.task.enums.SubmissionStatus;
import com.mnp.task.repository.TaskBugDetailRepository;
import com.mnp.task.repository.TaskRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class SoftwareWorkflowService {

    TaskSubmissionService taskSubmissionService; // Gọi service cũ
    TaskRepository taskRepository;
    TaskBugDetailRepository taskBugDetailRepository;
    GitIntegrationService gitIntegrationService;

    // --- 1. SUBMIT TASK (Kèm Link GitHub) ---
    @Transactional
    public TaskSubmissionResponse submitSoftwareTask(String taskId, String userId, TaskSubmissionRequest request) {
        // Gọi logic submit cơ bản của file cũ
        TaskSubmissionResponse response = taskSubmissionService.submitTask(taskId, userId, request);

        // Logic mở rộng: Kiểm tra xem task này đã có commit nào chưa
        var commits = gitIntegrationService.getTaskCommits(taskId);
        if (commits.isEmpty()) {
            log.warn("Warning: Task {} submitted without any linked git commits", taskId);
            // Có thể throw exception bắt buộc phải có commit mới được submit nếu muốn
        }

        return response;
    }

    // --- 2. REVIEW TASK (Có logic tạo Bug nếu Reject) ---
    @Transactional
    public TaskSubmissionResponse reviewSoftwareTask(String submissionId, String reviewerId, ReviewUpdateRequest reviewRequest) {
        // 1. Thực hiện review chuẩn (Logic cũ để update status, performance...)
        TaskSubmissionResponse response = taskSubmissionService.reviewSubmissionWithQuality(
                submissionId, reviewerId, reviewRequest
        );

        // 2. LOGIC MỚI: Nếu Reject/Needs Revision -> Tạo TaskBugDetail
        if (reviewRequest.getStatus() == SubmissionStatus.REJECTED ||
                reviewRequest.getStatus() == SubmissionStatus.NEEDS_REVISION) {

            createBugFromRejection(response.getTaskId(), reviewRequest.getComments());
        } else if (reviewRequest.getStatus() == SubmissionStatus.APPROVED) {
            // Nếu Approve -> Có thể trigger Auto Merge Git (Advanced)
            log.info("Task {} approved. Ready for merge.", response.getTaskId());
        }

        return response;
    }

    private void createBugFromRejection(String taskId, String reviewComments) {
        Task task = taskRepository.findById(taskId).orElseThrow();

        // Tạo bản ghi chi tiết lỗi
        TaskBugDetail bugDetail = new TaskBugDetail();
        bugDetail.setTask(task);
        bugDetail.setSeverity(BugSeverity.MAJOR); // Default, Lead có thể sửa sau
        bugDetail.setIdentifiedAt(LocalDateTime.now());

        // Biến comment của Lead thành "Các bước tái hiện/Mô tả lỗi"
        bugDetail.setReproduceSteps("Rejected Reason: " + reviewComments);

        // Lưu phiên bản lỗi (VD: Lấy branch hiện tại)
        bugDetail.setAffectedVersion(task.getBranchName() != null ? task.getBranchName() : "Current Branch");

        taskBugDetailRepository.save(bugDetail);

        log.info("System auto-created BugDetail for rejected task {}", taskId);

        // TODO: Có thể gửi thêm Noti riêng: "You have a new bug detail to fix"
    }
}