package com.mnp.task.service;

import com.mnp.task.entity.Task;
import com.mnp.task.entity.TaskCommit;
import com.mnp.task.enums.TaskStatus;
import com.mnp.task.repository.TaskCommitRepository;
import com.mnp.task.repository.TaskRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class GitIntegrationService {

    TaskRepository taskRepository;
    TaskCommitRepository taskCommitRepository;

    @Transactional
    public void processGitHubPush(Map<String, Object> payload) {
        if (!payload.containsKey("commits")) return;

        // 1. LẤY TÊN BRANCH TỪ PAYLOAD
        // Payload trả về dạng: "ref": "refs/heads/feature/login-page"
        String ref = (String) payload.get("ref");
        String branchName = "unknown";
        if (ref != null && ref.contains("refs/heads/")) {
            branchName = ref.replace("refs/heads/", "");
        }

        List<Map<String, Object>> commits = (List<Map<String, Object>>) payload.get("commits");

        // Regex tìm Task ID
        Pattern pattern = Pattern.compile("#(\\w{8}-\\w{4}-\\w{4}-\\w{4}-\\w{12})|#(\\w+)");

        for (Map<String, Object> commitData : commits) {
            String hash = (String) commitData.get("id");

            if (taskCommitRepository.existsByCommitHash(hash)) continue;

            String message = (String) commitData.get("message");
            Matcher matcher = pattern.matcher(message);

            if (matcher.find()) {
                String taskId = matcher.group(1) != null ? matcher.group(1) : matcher.group(2);

                // Biến final để dùng trong lambda
                String finalBranchName = branchName;

                taskRepository.findById(taskId).ifPresent(task -> {
                    saveCommit(task, commitData, hash, message);

                    // 2. CẬP NHẬT BRANCH NAME VÀ AUTO-START
                    updateTaskInfo(task, finalBranchName);
                });
            }
        }
    }

    private void saveCommit(Task task, Map<String, Object> data, String hash, String message) {
        Map<String, Object> author = (Map<String, Object>) data.get("author");

        TaskCommit commit = new TaskCommit();
        commit.setTask(task);
        commit.setCommitHash(hash);
        commit.setMessage(message);
        commit.setAuthorName((String) author.get("name"));
        commit.setAuthorEmail((String) author.get("email"));
        commit.setCommitUrl((String) data.get("url"));
        commit.setCommittedAt(LocalDateTime.now());

        taskCommitRepository.save(commit);
        log.info("Linked commit {} to task {}", hash, task.getId());
    }

    // Hàm mới: Cập nhật thông tin Task
    private void updateTaskInfo(Task task, String branchName) {
        boolean isUpdated = false;

        // Tự động lưu branch name nếu chưa có hoặc branch thay đổi
        if (task.getBranchName() == null || !task.getBranchName().equals(branchName)) {
            task.setBranchName(branchName);
            isUpdated = true;
            log.info("Auto-detected branch '{}' for task {}", branchName, task.getId());
        }

        // Tự động chuyển trạng thái IN_PROGRESS
        if (task.getStatus() == TaskStatus.TODO) {
            task.setStatus(TaskStatus.IN_PROGRESS);
            if (task.getStartedAt() == null) task.setStartedAt(LocalDateTime.now());
            isUpdated = true;
        }

        if (isUpdated) {
            taskRepository.save(task);
        }
    }

    public List<TaskCommit> getTaskCommits(String taskId) {
        return taskCommitRepository.findByTaskIdOrderByCommittedAtDesc(taskId);
    }
}