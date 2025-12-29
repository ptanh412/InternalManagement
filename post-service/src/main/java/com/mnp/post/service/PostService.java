package com.mnp.post.service;

import com.mnp.post.client.IdentityClient;
import com.mnp.post.client.RealTimeNotificationClient;
import com.mnp.post.dto.PageResponse;
import com.mnp.post.dto.request.PostRequest;
import com.mnp.post.dto.response.PostResponse;
import com.mnp.post.dto.response.UserProfileResponse;
import com.mnp.post.entity.Post;
import com.mnp.post.exception.AppException;
import com.mnp.post.exception.ErrorCode;
import com.mnp.post.mapper.PostMapper;
import com.mnp.post.repository.PostRepository;
import com.mnp.post.repository.httpclient.ProfileClient;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class PostService {
    DateTimeFormatter dateTimeFormatter;
    PostRepository postRepository;
    PostMapper postMapper;
    ProfileClient profileClient;
    IdentityClient identityClient;
    RealTimeNotificationClient realTimeNotificationClient;

    public PostResponse createPost(PostRequest request){
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        log.info("Creating post by user: {}", authentication.getName());
        return createPostWithUserId(request, authentication.getName());
    }
    
    /**
     * Create post with explicit userId (for Socket.IO)
     */
    public PostResponse createPostWithUserId(PostRequest request, String userId){
        log.info("Creating post by user: {}", userId);
        Post post = Post.builder()
                .content(request.getContent())
                .userId(userId)
                .departmentId(request.getDepartmentId())
                .imageUrls(request.getImageUrls())
                .fileUrls(request.getFileUrls())
                .createdDate(Instant.now())
                .modifiedDate(Instant.now())
                .commentCount(0)
                .reactionCount(0)
                .build();

        post = postRepository.save(post);
        
        PostResponse postResponse = postMapper.toPostResponse(post);
        
        // Fetch and populate username and author name
        String authorName = "Unknown User";
        try {
            // Try to get user info from identity service first (has firstName and lastName)
            var identityResponse = identityClient.getUser(userId);
            if (identityResponse != null && identityResponse.getResult() != null) {
                var user = identityResponse.getResult();
                String fullName = (user.getFirstName() != null ? user.getFirstName() : "") + 
                                 " " + 
                                 (user.getLastName() != null ? user.getLastName() : "");
                authorName = fullName.trim();
                postResponse.setUsername(user.getUsername() != null ? user.getUsername() : authorName);
                log.info("User info from identity service: {}, fullName: {}", user.getUsername(), authorName);
            } else {
                // Fallback to profile service
                UserProfileResponse userProfile = profileClient.getProfile(userId).getResult();
                if (userProfile != null) {
                    postResponse.setUsername(userProfile.getUsername());
                    if (userProfile.getFirstName() != null || userProfile.getLastName() != null) {
                        authorName = (userProfile.getFirstName() != null ? userProfile.getFirstName() : "") + 
                                   " " + 
                                   (userProfile.getLastName() != null ? userProfile.getLastName() : "");
                        authorName = authorName.trim();
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error while getting user info for userId: {}", userId, e);
        }
        
        // Send notification to department employees if this is a department post
        if (request.getDepartmentId() != null && !request.getDepartmentId().isEmpty()) {
            sendDepartmentPostNotification(post.getId(), request.getDepartmentId(), userId, authorName, request.getContent());
        }
        
        return postResponse;
    }
    
    /**
     * Send notification to all employees in a department when a new post is created
     */
    private void sendDepartmentPostNotification(String postId, String departmentId, String authorId, 
                                                 String authorName, String postContent) {
        log.info("Post id: {}, department id: {}, author id: {}, author name: {}, post content: {}. Sending department post notification...",
                postId, departmentId, authorId, authorName, postContent);
        try {
            // Get department info
            String departmentName = "Department";
            try {
                var deptResponse = identityClient.getDepartment(departmentId);
                if (deptResponse != null && deptResponse.getResult() != null) {
                    departmentName = deptResponse.getResult().getName();
                }
            } catch (Exception e) {
                log.warn("Failed to get department name for ID {}: {}", departmentId, e.getMessage());
            }
            
            // Get all employees in the department
            var usersResponse = identityClient.getUsersByDepartment(departmentId);
            if (usersResponse != null && usersResponse.getResult() != null) {
                List<String> employeeIds = usersResponse.getResult().stream()
                        .filter(user -> !user.getId().equals(authorId)) // Exclude the author
                        .filter(IdentityClient.UserResponse::isActive) // Only active users
                        .map(IdentityClient.UserResponse::getId)
                        .collect(Collectors.toList());
                
                if (!employeeIds.isEmpty()) {
                    // Truncate content if too long
                    String truncatedContent = postContent != null && postContent.length() > 100 
                            ? postContent.substring(0, 100) + "..." 
                            : postContent;
                    
                    RealTimeNotificationClient.DepartmentPostNotificationRequest request = 
                            new RealTimeNotificationClient.DepartmentPostNotificationRequest(
                                    employeeIds,
                                    postId,
                                    departmentId,
                                    departmentName,
                                    authorName,
                                    truncatedContent
                            );
                    
                    realTimeNotificationClient.sendDepartmentPostNotification(request);
                    log.info("Department post notification sent to {} employees in department: {}", 
                            employeeIds.size(), departmentName);
                } else {
                    log.info("No other employees to notify in department: {}", departmentId);
                }
            }
        } catch (Exception e) {
            log.error("Failed to send department post notification for post: {}", postId, e);
            // Don't fail post creation if notification fails
        }
    }

    public PostResponse updatePost(String postId, PostRequest request){
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return updatePostWithUserId(postId, request, authentication.getName());
    }
    
    /**
     * Update post with explicit userId (for Socket.IO)
     */
    public PostResponse updatePostWithUserId(String postId, PostRequest request, String userId){
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new AppException(ErrorCode.POST_NOT_EXISTED));

        if (!post.getUserId().equals(userId)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        post.setContent(request.getContent());
        post.setImageUrls(request.getImageUrls());
        post.setFileUrls(request.getFileUrls());
        post.setModifiedDate(Instant.now());

        post = postRepository.save(post);
        
        PostResponse postResponse = postMapper.toPostResponse(post);
        
        // Fetch and populate username
        try {
            UserProfileResponse userProfile = profileClient.getProfile(userId).getResult();
            if (userProfile != null) {
                postResponse.setUsername(userProfile.getUsername());
            }
        } catch (Exception e) {
            log.error("Error while getting user profile for userId: {}", userId, e);
        }
        
        return postResponse;
    }

    public void deletePost(String postId){
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        deletePostWithUserId(postId, authentication.getName());
    }
    
    /**
     * Delete post with explicit userId (for Socket.IO)
     */
    public void deletePostWithUserId(String postId, String userId){
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new AppException(ErrorCode.POST_NOT_EXISTED));

        if (!post.getUserId().equals(userId)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        postRepository.delete(post);
    }

    public String getPostDepartmentId(String postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new AppException(ErrorCode.POST_NOT_EXISTED));
        return post.getDepartmentId();
    }

    public PageResponse<PostResponse> getMyPosts(int page, int size){

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        log.info("Fetching posts for user: {}, page: {}, size: {}", authentication.getName(), page, size);
        String userId = authentication.getName();

        UserProfileResponse userProfile = null;

        try {
            userProfile = profileClient.getProfile(userId).getResult();
        } catch (Exception e) {
            log.error("Error while getting user profile", e);
        }
        Sort sort = Sort.by("createdDate").descending();

        Pageable pageable = PageRequest.of(page - 1, size, sort);
        var pageData = postRepository.findAllByUserId(userId, pageable);

        String username = userProfile != null ? userProfile.getUsername() : null;
        var postList = pageData.getContent().stream().map(post -> {
            var postResponse = postMapper.toPostResponse(post);
            postResponse.setCreated(dateTimeFormatter.format(post.getCreatedDate()));
            postResponse.setUsername(username);
            return postResponse;
        }).toList();

        log.info("Total posts: {}", pageData.getTotalElements());

        return PageResponse.<PostResponse>builder()
                .currentPage(page)
                .pageSize(pageData.getSize())
                .totalPages(pageData.getTotalPages())
                .totalElements(pageData.getTotalElements())
                .data(postList)
                .build();
    }

    public PageResponse<PostResponse> getDepartmentPosts(String departmentId, int page, int size){
        log.info("Fetching department posts: departmentId: {}, page: {}, size: {}", departmentId, page, size);
        Sort sort = Sort.by("createdDate").descending();
        Pageable pageable = PageRequest.of(page - 1, size, sort);
        var pageData = postRepository.findAllByDepartmentId(departmentId, pageable);

        var postList = pageData.getContent().stream().map(post -> {
            UserProfileResponse userProfile = null;
            try {
                userProfile = profileClient.getProfile(post.getUserId()).getResult();
            } catch (Exception e) {
                log.error("Error while getting user profile", e);
            }

            var postResponse = postMapper.toPostResponse(post);
            postResponse.setCreated(dateTimeFormatter.format(post.getCreatedDate()));
            postResponse.setUsername(userProfile != null ? userProfile.getUsername() : null);
            return postResponse;
        }).toList();

        return PageResponse.<PostResponse>builder()
                .currentPage(page)
                .pageSize(pageData.getSize())
                .totalPages(pageData.getTotalPages())
                .totalElements(pageData.getTotalElements())
                .data(postList)
                .build();
    }
}
