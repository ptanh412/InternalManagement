# Internal Management System - Test Cases

**Project:** Internal Management System  
**Version:** 1.0.0  
**Date:** November 25, 2025  
**Test Type:** Functional Testing  
**Status:** Ready for Execution

---

## Table of Contents
1. [Identity Service Test Cases](#identity-service-test-cases)
2. [Task Service Test Cases](#task-service-test-cases)
3. [Project Service Test Cases](#project-service-test-cases)
4. [AI Service Test Cases](#ai-service-test-cases)
5. [ML Service Test Cases](#ml-service-test-cases)
6. [Profile Service Test Cases](#profile-service-test-cases)
7. [Workload Service Test Cases](#workload-service-test-cases)
8. [Chat Service Test Cases](#chat-service-test-cases)
9. [Notification Service Test Cases](#notification-service-test-cases)

---

## Identity Service Test Cases

### Authentication & Authorization

| Test Code | Scenario | Test Steps | Test Data | Expected Results | Actual Results |
|-----------|----------|------------|-----------|------------------|----------------|
| **AUTH-001** | User Login - Valid Credentials | 1. Navigate to login page<br>2. Enter valid username<br>3. Enter valid password<br>4. Click Login button | Username: `john.doe@company.com`<br>Password: `Test@123` | - Login successful<br>- JWT token generated<br>- Redirect to dashboard<br>- User status set to "online" | *To be tested* |
| **AUTH-002** | User Login - Invalid Credentials | 1. Navigate to login page<br>2. Enter valid username<br>3. Enter wrong password<br>4. Click Login button | Username: `john.doe@company.com`<br>Password: `WrongPass123` | - Login failed<br>- Error message: "Invalid credentials"<br>- User remains on login page<br>- No token generated | *To be tested* |
| **AUTH-003** | User Logout | 1. Login with valid credentials<br>2. Navigate to user menu<br>3. Click Logout button<br>4. Confirm logout | Username: `john.doe@company.com`<br>Password: `Test@123` | - User logged out<br>- Token invalidated<br>- Redirect to login page<br>- User status set to "offline" | *To be tested* |
| **AUTH-004** | Token Refresh | 1. Login successfully<br>2. Wait for token to near expiry<br>3. Make API call with refresh token<br>4. Verify new token received | Valid refresh token | - New access token generated<br>- Token expiry extended<br>- User session continues<br>- Old token invalidated | *To be tested* |
| **AUTH-005** | Access Protected Resource - Valid Token | 1. Login successfully<br>2. Get JWT token<br>3. Call protected API endpoint with token<br>4. Verify response | Valid JWT token in Authorization header | - API call successful<br>- Status code: 200<br>- Data returned<br>- No authentication error | *To be tested* |
| **AUTH-006** | Access Protected Resource - No Token | 1. Do not login<br>2. Call protected API endpoint without token<br>3. Verify error response | No Authorization header | - API call rejected<br>- Status code: 401 Unauthorized<br>- Error message displayed<br>- Redirect to login | *To be tested* |

### User Management

| Test Code | Scenario | Test Steps | Test Data | Expected Results | Actual Results |
|-----------|----------|------------|-----------|------------------|----------------|
| **USER-001** | Create New User | 1. Login as admin<br>2. Navigate to user management<br>3. Click "Add User"<br>4. Fill all required fields<br>5. Submit form | Username: `alice.smith`<br>Email: `alice.smith@company.com`<br>Department: `Engineering`<br>Role: `EMPLOYEE` | - User created successfully<br>- User ID generated<br>- Confirmation message shown<br>- User appears in user list | *To be tested* |
| **USER-002** | Update User Profile | 1. Login as user<br>2. Navigate to profile page<br>3. Update firstName and phoneNumber<br>4. Click Save | FirstName: `Alice Updated`<br>Phone: `+1234567890` | - Profile updated successfully<br>- Changes saved to database<br>- Success message displayed<br>- Updated data reflected in UI | *To be tested* |
| **USER-003** | Delete User Account | 1. Login as admin<br>2. Navigate to user list<br>3. Select user to delete<br>4. Click Delete<br>5. Confirm deletion | User ID: `user-123` | - User marked as inactive<br>- isActive = false<br>- User cannot login<br>- User data retained for audit | *To be tested* |
| **USER-004** | Assign Role to User | 1. Login as admin<br>2. Select user<br>3. Navigate to role assignment<br>4. Select new role<br>5. Save changes | User: `john.doe`<br>New Role: `TEAM_LEAD` | - Role updated successfully<br>- User permissions changed<br>- New role reflected in UI<br>- Role history logged | *To be tested* |
| **USER-005** | Assign User to Department | 1. Login as admin<br>2. Select user<br>3. Select department<br>4. Assign user to department<br>5. Save | User: `john.doe`<br>Department: `Marketing` | - Department assignment successful<br>- User appears in department list<br>- Department metrics updated<br>- Confirmation displayed | *To be tested* |

---

## Task Service Test Cases

### Task Management

| Test Code | Scenario | Test Steps | Test Data | Expected Results | Actual Results |
|-----------|----------|------------|-----------|------------------|----------------|
| **TASK-001** | Create New Task | 1. Login as team lead<br>2. Navigate to task creation<br>3. Fill task details<br>4. Add required skills<br>5. Submit task | Title: `Implement Login API`<br>Priority: `HIGH`<br>EstimatedHours: `40`<br>Skills: `Java, Spring Boot` | - Task created successfully<br>- Task ID generated<br>- Status set to TODO<br>- Task appears in task list | *To be tested* |
| **TASK-002** | Assign Task to User | 1. Create a task<br>2. Click "Assign Task"<br>3. Select user from recommendations<br>4. Confirm assignment | TaskID: `task-123`<br>AssignedTo: `john.doe`<br>DueDate: `2025-12-01` | - Task assigned successfully<br>- User notified via notification<br>- User workload updated<br>- Assignment logged | *To be tested* |
| **TASK-003** | Update Task Status | 1. Login as assigned user<br>2. Open task details<br>3. Change status from TODO to IN_PROGRESS<br>4. Add comments<br>5. Save | TaskID: `task-123`<br>NewStatus: `IN_PROGRESS`<br>Comment: `Started working on this` | - Status updated successfully<br>- Status change timestamp recorded<br>- Progress percentage updated<br>- Notification sent to reporter | *To be tested* |
| **TASK-004** | Submit Task for Review | 1. Complete task work<br>2. Navigate to submission<br>3. Upload files<br>4. Add description<br>5. Submit for review | TaskID: `task-123`<br>Files: `report.pdf, code.zip`<br>Description: `Completed as per requirements` | - Submission created<br>- Files uploaded successfully<br>- Status: PENDING review<br>- Reviewer notified | *To be tested* |
| **TASK-005** | Review and Approve Task | 1. Login as reviewer<br>2. Open task submission<br>3. Review files and description<br>4. Add review comments<br>5. Approve submission | TaskID: `task-123`<br>Rating: `5`<br>Comments: `Excellent work` | - Task approved<br>- Status changed to COMPLETED<br>- Quality rating saved<br>- Assignee notified | *To be tested* |
| **TASK-006** | Create Task Dependency | 1. Create parent task<br>2. Create child task<br>3. Navigate to dependencies<br>4. Add dependency relationship<br>5. Save | ParentTask: `task-100`<br>ChildTask: `task-101`<br>Type: `FINISH_TO_START` | - Dependency created<br>- Child task blocked until parent completes<br>- Dependency visible in UI<br>- Timeline adjusted | *To be tested* |
| **TASK-007** | Log Time on Task | 1. Open assigned task<br>2. Click "Start Timer"<br>3. Work on task<br>4. Click "Stop Timer"<br>5. Verify logged time | TaskID: `task-123`<br>StartTime: `10:00 AM`<br>EndTime: `12:00 PM`<br>Duration: `120 minutes` | - Time logged successfully<br>- Duration calculated correctly<br>- Actual hours updated<br>- Time entry saved | *To be tested* |

---

## Project Service Test Cases

### Project Management

| Test Code | Scenario | Test Steps | Test Data | Expected Results | Actual Results |
|-----------|----------|------------|-----------|------------------|----------------|
| **PROJ-001** | Create New Project | 1. Login as project manager<br>2. Navigate to projects<br>3. Click "Create Project"<br>4. Fill project details<br>5. Set budget and timeline<br>6. Submit | Name: `E-Commerce Platform`<br>Budget: `$100,000`<br>StartDate: `2025-12-01`<br>EndDate: `2026-06-30`<br>Priority: `HIGH` | - Project created successfully<br>- Project ID generated<br>- Status set to PLANNING<br>- Project leader assigned | *To be tested* |
| **PROJ-002** | Add Team Member to Project | 1. Open project<br>2. Navigate to team section<br>3. Click "Add Member"<br>4. Search and select user<br>5. Assign role<br>6. Save | ProjectID: `proj-123`<br>User: `john.doe`<br>Role: `DEVELOPER` | - Member added to project<br>- User appears in team list<br>- Project chat group updated<br>- Member notified | *To be tested* |
| **PROJ-003** | Remove Team Member | 1. Open project<br>2. Navigate to team section<br>3. Select member<br>4. Click "Remove"<br>5. Confirm removal | ProjectID: `proj-123`<br>User: `john.doe` | - Member removed from project<br>- isActive set to false<br>- Tasks reassigned<br>- Chat access revoked | *To be tested* |
| **PROJ-004** | Update Project Status | 1. Open project<br>2. Change status dropdown<br>3. Select new status<br>4. Add status notes<br>5. Save | ProjectID: `proj-123`<br>NewStatus: `IN_PROGRESS`<br>Notes: `Development started` | - Status updated<br>- Status change logged<br>- Team notified<br>- Timeline activated | *To be tested* |
| **PROJ-005** | Create Project Milestone | 1. Open project<br>2. Navigate to milestones<br>3. Click "Add Milestone"<br>4. Fill milestone details<br>5. Save | Name: `MVP Release`<br>DueDate: `2026-03-01`<br>Description: `First working version` | - Milestone created<br>- Milestone ID generated<br>- Added to project timeline<br>- Visible in project dashboard | *To be tested* |
| **PROJ-006** | Track Project Progress | 1. Open project dashboard<br>2. View completion metrics<br>3. Check task statistics<br>4. Verify calculations | ProjectID: `proj-123`<br>TotalTasks: `50`<br>CompletedTasks: `30` | - Completion % = 60%<br>- Charts display correctly<br>- Metrics are accurate<br>- Real-time updates work | *To be tested* |

---

## AI Service Test Cases

### AI-Powered Features

| Test Code | Scenario | Test Steps | Test Data | Expected Results | Actual Results |
|-----------|----------|------------|-----------|------------------|----------------|
| **AI-001** | Get Task Recommendations - LOW Priority | 1. Create task with LOW priority<br>2. Add skill requirements<br>3. Request AI recommendations<br>4. Verify response | TaskID: `task-200`<br>Priority: `LOW`<br>Skills: `JavaScript, React`<br>EstimatedHours: `16` | - Hybrid algorithm used<br>- Response time < 100ms<br>- Top 5 candidates returned<br>- Scores calculated correctly | *To be tested* |
| **AI-002** | Get Task Recommendations - CRITICAL Priority | 1. Create task with CRITICAL priority<br>2. Add skill requirements<br>3. Request AI recommendations<br>4. Verify Gemini AI activation | TaskID: `task-201`<br>Priority: `CRITICAL`<br>Skills: `Security, Java`<br>Difficulty: `HARD` | - Gemini AI activated<br>- Response time 1-2 seconds<br>- Team leads prioritized (+15%)<br>- Detailed reasoning provided | *To be tested* |
| **AI-003** | Analyze CV with Gemini AI | 1. Login as HR admin<br>2. Navigate to CV analysis<br>3. Upload CV file (PDF)<br>4. Submit for analysis<br>5. Wait for results | File: `john_doe_cv.pdf`<br>Size: `2.5 MB`<br>Format: `PDF` | - CV parsed successfully<br>- Skills extracted<br>- Experience calculated<br>- Confidence score > 0.8<br>- User profile data generated | *To be tested* |
| **AI-004** | Analyze Requirements and Generate Tasks | 1. Create project<br>2. Upload requirement document<br>3. Request AI analysis<br>4. Review generated tasks<br>5. Accept or modify | ProjectID: `proj-200`<br>Document: `requirements.txt`<br>Content: User stories | - Requirements analyzed<br>- Tasks generated with titles<br>- Estimated hours assigned<br>- Required skills identified<br>- Priorities set | *To be tested* |
| **AI-005** | Fallback to Hybrid Algorithm | 1. Create HIGH priority task<br>2. Simulate Gemini API failure<br>3. Request recommendations<br>4. Verify fallback mechanism | TaskID: `task-202`<br>Priority: `HIGH`<br>Gemini Status: `UNAVAILABLE` | - Gemini fails gracefully<br>- Hybrid algorithm activated<br>- Recommendations still returned<br>- Error logged<br>- No service interruption | *To be tested* |

---

## ML Service Test Cases

### Machine Learning Features

| Test Code | Scenario | Test Steps | Test Data | Expected Results | Actual Results |
|-----------|----------|------------|-----------|------------------|----------------|
| **ML-001** | Train ML Model with Synthetic Data | 1. Start Python ML service<br>2. Call training endpoint<br>3. Use synthetic data flag<br>4. Monitor training progress<br>5. Verify model saved | POST `/train`<br>Body: `{"use_synthetic_data": true}`<br>Records: `500+` | - Training starts<br>- Status: RUNNING<br>- Model trained successfully<br>- Accuracy > 85%<br>- Model files saved | *To be tested* |
| **ML-002** | Get ML Recommendations | 1. Ensure model is trained<br>2. Create recommendation request<br>3. Call ML prediction endpoint<br>4. Verify response format | POST `/recommend`<br>TaskID: `task-300`<br>Candidates: `10 users` | - Predictions returned<br>- Confidence scores included<br>- Content + Collaborative scores<br>- Response time < 200ms<br>- Ranked by score | *To be tested* |
| **ML-003** | Collect Training Data from Task Completion | 1. Assign task to user<br>2. User completes task<br>3. Record performance<br>4. Verify data collection<br>5. Check PostgreSQL | TaskID: `task-301`<br>UserID: `user-100`<br>PerformanceScore: `4.5`<br>ActualHours: `30` | - Event captured<br>- Data saved to TrainingData table<br>- Features calculated<br>- Ready for next training<br>- Event logged | *To be tested* |
| **ML-004** | Monitor Model Performance | 1. Access model metrics endpoint<br>2. View accuracy trends<br>3. Check F1 scores<br>4. Review training history | GET `/model/metrics`<br>GET `/training/history` | - Metrics displayed<br>- Accuracy graph shown<br>- F1, Precision, Recall available<br>- Training history listed<br>- Deployment status visible | *To be tested* |
| **ML-005** | Automated Model Retraining | 1. Configure weekly schedule<br>2. Wait for scheduled trigger<br>3. Verify auto-training starts<br>4. Check new model deployment | Schedule: `Weekly Sunday 2 AM`<br>MinRecords: `100` | - Training triggered automatically<br>- New data collected<br>- Model retrained<br>- Performance compared<br>- Best model deployed | *To be tested* |

---

## Profile Service Test Cases

### User Profile & Skills Management

| Test Code | Scenario | Test Steps | Test Data | Expected Results | Actual Results |
|-----------|----------|------------|-----------|------------------|----------------|
| **PROF-001** | Create User Profile | 1. User account created in Identity service<br>2. Profile service triggered<br>3. Create profile in Neo4j<br>4. Verify profile created | UserID: `user-500`<br>Avatar: `default.png`<br>City: `San Francisco` | - Profile node created in Neo4j<br>- UserID linked correctly<br>- Default values set<br>- Profile accessible | *To be tested* |
| **PROF-002** | Add Skill to User Profile | 1. Login as user<br>2. Navigate to skills section<br>3. Click "Add Skill"<br>4. Select skill and proficiency<br>5. Save | UserID: `user-500`<br>Skill: `Python`<br>Type: `PROGRAMMING_LANGUAGE`<br>Level: `ADVANCED`<br>Experience: `5 years` | - Skill node created<br>- HAS_SKILL relationship established<br>- Skill appears in profile<br>- Proficiency recorded | *To be tested* |
| **PROF-003** | Update Skill Proficiency | 1. Open user profile<br>2. Navigate to existing skill<br>3. Update proficiency level<br>4. Update years of experience<br>5. Save changes | UserID: `user-500`<br>Skill: `Python`<br>NewLevel: `EXPERT`<br>NewExperience: `6 years` | - Skill updated in Neo4j<br>- Proficiency level changed<br>- Experience updated<br>- Last used date updated<br>- Change reflected in UI | *To be tested* |
| **PROF-004** | Remove Skill from Profile | 1. Open user profile<br>2. Navigate to skills<br>3. Select skill to remove<br>4. Click Delete<br>5. Confirm deletion | UserID: `user-500`<br>Skill: `PHP` | - Skill node deleted<br>- HAS_SKILL relationship removed<br>- Skill removed from UI<br>- Profile metrics updated | *To be tested* |
| **PROF-005** | Query Users by Skill | 1. Navigate to team search<br>2. Search for specific skill<br>3. Set minimum proficiency<br>4. View matching users | Skill: `Java`<br>MinLevel: `INTERMEDIATE`<br>Department: `Engineering` | - Neo4j graph query executed<br>- Users with Java skill returned<br>- Filtered by proficiency<br>- Results sorted by experience | *To be tested* |
| **PROF-006** | Update Profile Metrics | 1. User completes task<br>2. Task service notifies profile service<br>3. Profile metrics recalculated<br>4. Verify updates | UserID: `user-500`<br>TasksCompleted: `+1`<br>CompletionRate: Recalculate | - Total tasks incremented<br>- Completion rate updated<br>- Average performance recalculated<br>- Availability status checked | *To be tested* |

---

## Workload Service Test Cases

### Workload & Capacity Management

| Test Code | Scenario | Test Steps | Test Data | Expected Results | Actual Results |
|-----------|----------|------------|-----------|------------------|----------------|
| **WKLD-001** | Initialize User Workload | 1. New user created<br>2. Workload service triggered<br>3. Create workload record<br>4. Set default capacity | UserID: `user-600`<br>WeeklyCapacity: `40 hours`<br>DailyCapacity: `8 hours` | - Workload record created<br>- Default capacity set<br>- Availability = 100%<br>- No tasks assigned yet | *To be tested* |
| **WKLD-002** | Calculate Availability After Task Assignment | 1. Assign task to user<br>2. Task estimated hours: 20<br>3. Workload service updates<br>4. Calculate availability | UserID: `user-600`<br>TaskHours: `20`<br>WeeklyCapacity: `40` | - Total estimate hours = 20<br>- Availability = 50%<br>- Next available date calculated<br>- Workload updated | *To be tested* |
| **WKLD-003** | Detect Overallocation | 1. Assign multiple tasks to user<br>2. Total hours > weekly capacity<br>3. Check overload status<br>4. Verify warning | UserID: `user-600`<br>Task1: `30 hours`<br>Task2: `25 hours`<br>WeeklyCapacity: `40 hours` | - Total hours = 55<br>- Availability = -37.5% (over)<br>- Overload flag set<br>- Warning notification sent<br>- Manager notified | *To be tested* |
| **WKLD-004** | Update Workload on Task Completion | 1. User completes assigned task<br>2. Task service notifies workload<br>3. Remove task from current tasks<br>4. Recalculate availability | UserID: `user-600`<br>CompletedTask: `task-400`<br>EstimatedHours: `20` | - Task removed from current tasks<br>- Total estimate hours reduced<br>- Availability recalculated<br>- Actual hours logged | *To be tested* |
| **WKLD-005** | Update User Capacity Settings | 1. Login as admin or user<br>2. Navigate to workload settings<br>3. Update weekly capacity<br>4. Save changes | UserID: `user-600`<br>NewWeeklyCapacity: `35 hours`<br>NewDailyCapacity: `7 hours` | - Capacity updated<br>- Availability recalculated<br>- Historical data preserved<br>- Changes logged | *To be tested* |
| **WKLD-006** | Generate Workload History Report | 1. Navigate to workload reports<br>2. Select date range<br>3. Generate report<br>4. View historical trends | UserID: `user-600`<br>DateRange: `Last 30 days` | - History records retrieved<br>- Trends displayed in chart<br>- Peak workload identified<br>- Average utilization calculated | *To be tested* |

---

## Chat Service Test Cases

### Real-time Messaging

| Test Code | Scenario | Test Steps | Test Data | Expected Results | Actual Results |
|-----------|----------|------------|-----------|------------------|----------------|
| **CHAT-001** | Create Direct Conversation | 1. Login as user<br>2. Navigate to chat<br>3. Start new conversation<br>4. Select another user<br>5. Send first message | User1: `alice`<br>User2: `bob`<br>Type: `DIRECT`<br>Message: `Hi Bob!` | - Conversation created<br>- Type = DIRECT<br>- Participants added<br>- Message sent<br>- Bob notified | *To be tested* |
| **CHAT-002** | Create Group Chat | 1. Login as user<br>2. Click "New Group"<br>3. Enter group name<br>4. Add multiple members<br>5. Create group | GroupName: `Dev Team`<br>Members: `alice, bob, charlie`<br>CreatedBy: `alice` | - Group conversation created<br>- Type = GROUP<br>- All members added<br>- Group chat visible to all<br>- Welcome message sent | *To be tested* |
| **CHAT-003** | Send Message in Group | 1. Open group chat<br>2. Type message<br>3. Click Send<br>4. Verify delivery | ConversationID: `conv-100`<br>Sender: `alice`<br>Message: `Meeting at 3 PM` | - Message saved to MongoDB<br>- All members receive message<br>- Real-time delivery via WebSocket<br>- Last message updated<br>- Unread count incremented | *To be tested* |
| **CHAT-004** | React to Message | 1. Open conversation<br>2. Select a message<br>3. Choose emoji reaction<br>4. Add reaction | MessageID: `msg-500`<br>UserID: `bob`<br>Emoji: `👍` | - Reaction saved<br>- Reaction appears on message<br>- Sender notified<br>- Multiple reactions allowed | *To be tested* |
| **CHAT-005** | Recall Message | 1. Send a message<br>2. Click recall option<br>3. Select "Recall for everyone"<br>4. Confirm recall | MessageID: `msg-501`<br>RecalledBy: `alice`<br>RecallType: `everyone` | - isRecalled = true<br>- Original message saved<br>- Message hidden for all users<br>- "Message recalled" displayed<br>- Recall timestamp saved | *To be tested* |
| **CHAT-006** | Pin Important Message | 1. Open group chat<br>2. Select important message<br>3. Click "Pin message"<br>4. Verify pinned | MessageID: `msg-502`<br>PinnedBy: `alice (admin)` | - isPinned = true<br>- Message appears at top<br>- Pin notification sent<br>- Only admins can pin | *To be tested* |
| **CHAT-007** | Upload Media File in Chat | 1. Open conversation<br>2. Click attach file<br>3. Select image/document<br>4. Send with message | File: `screenshot.png`<br>Size: `1.2 MB`<br>Type: `image/png` | - File uploaded to storage<br>- Media URL saved in message<br>- Thumbnail generated<br>- File downloadable<br>- Message sent successfully | *To be tested* |
| **CHAT-008** | Mark Messages as Read | 1. Receive new messages<br>2. Open conversation<br>3. View messages<br>4. Verify read status | ConversationID: `conv-100`<br>Reader: `bob`<br>UnreadCount: `5` | - Messages marked as read<br>- Read receipts sent<br>- Unread count = 0<br>- Last read timestamp updated<br>- Sender sees "Read" status | *To be tested* |

---

## Notification Service Test Cases

### Multi-channel Notifications

| Test Code | Scenario | Test Steps | Test Data | Expected Results | Actual Results |
|-----------|----------|------------|-----------|------------------|----------------|
| **NOTIF-001** | Send Task Assignment Notification | 1. Assign task to user<br>2. Task service triggers notification<br>3. Notification service processes<br>4. Verify delivery | TaskID: `task-700`<br>AssignedTo: `user-600`<br>Type: `TASK_ASSIGNED`<br>Channel: `EMAIL, WEB` | - Email sent via SendGrid<br>- Web notification created<br>- Notification saved to MongoDB<br>- User notified in real-time<br>- isRead = false | *To be tested* |
| **NOTIF-002** | Mark Notification as Read | 1. Login as user<br>2. View notifications<br>3. Click on notification<br>4. Mark as read | NotificationID: `notif-100`<br>UserID: `user-600` | - isRead = true<br>- Read timestamp recorded<br>- Notification badge updated<br>- Unread count decremented | *To be tested* |
| **NOTIF-003** | Send Project Invitation Notification | 1. Add member to project<br>2. Project service triggers notification<br>3. Multiple channel delivery | ProjectID: `proj-300`<br>UserID: `user-601`<br>Type: `PROJECT_INVITATION`<br>Channels: `EMAIL, WEB, PUSH` | - Email sent<br>- Web notification shown<br>- Push notification delivered<br>- Template rendered correctly<br>- All channels successful | *To be tested* |
| **NOTIF-004** | Delete Notification | 1. Login as user<br>2. View notifications<br>3. Select notification<br>4. Click Delete<br>5. Confirm | NotificationID: `notif-101`<br>UserID: `user-600` | - Notification deleted from MongoDB<br>- Removed from UI<br>- Total count updated<br>- Cannot be retrieved | *To be tested* |
| **NOTIF-005** | Notification Preference Management | 1. Navigate to settings<br>2. Update notification preferences<br>3. Disable email notifications<br>4. Save preferences | UserID: `user-600`<br>EmailEnabled: `false`<br>WebEnabled: `true`<br>PushEnabled: `true` | - Preferences saved<br>- Future emails not sent<br>- Web/Push still work<br>- Settings persisted | *To be tested* |
| **NOTIF-006** | Send Bulk Notifications | 1. Create project announcement<br>2. Notify all team members<br>3. Process batch notification | ProjectID: `proj-300`<br>Recipients: `15 users`<br>Type: `ANNOUNCEMENT` | - Batch processing activated<br>- All 15 users notified<br>- No duplicates sent<br>- Delivery status tracked<br>- Performance acceptable | *To be tested* |

---

## Integration Test Cases

### Cross-Service Integration

| Test Code | Scenario | Test Steps | Test Data | Expected Results | Actual Results |
|-----------|----------|------------|-----------|------------------|----------------|
| **INT-001** | Complete Task Assignment Flow | 1. Create task<br>2. Get AI recommendations<br>3. Assign to recommended user<br>4. Update workload<br>5. Send notifications<br>6. Add to project chat | TaskID: `task-800`<br>Priority: `HIGH`<br>AssignedTo: From AI | - AI returns recommendations<br>- Task assigned successfully<br>- Workload updated<br>- Notifications sent<br>- Chat group updated<br>- All services synchronized | *To be tested* |
| **INT-002** | User Onboarding Flow | 1. Create user in Identity<br>2. Profile created in Neo4j<br>3. Workload initialized<br>4. Welcome notification sent<br>5. Default department assigned | Username: `new.user@company.com`<br>Department: `Engineering`<br>Role: `EMPLOYEE` | - User created in MySQL<br>- Profile in Neo4j<br>- Workload in MySQL<br>- Notification in MongoDB<br>- All linked correctly | *To be tested* |
| **INT-003** | Project Creation with AI Task Generation | 1. Create project<br>2. Upload requirements<br>3. AI generates tasks<br>4. Tasks created in task service<br>5. Team members assigned | ProjectID: `proj-400`<br>RequirementsDoc: `specs.txt`<br>Team: `5 members` | - Project created<br>- AI analyzes requirements<br>- Tasks auto-generated<br>- Skills identified<br>- Members added to chat | *To be tested* |
| **INT-004** | ML Model Training from Real Data | 1. Complete multiple tasks<br>2. Performance data collected<br>3. ML service aggregates data<br>4. Train new model<br>5. Deploy and use for predictions | CompletedTasks: `100+`<br>DataSource: `REAL`<br>MinAccuracy: `85%` | - Data collected from MySQL/Neo4j<br>- Training data in PostgreSQL<br>- Model trained successfully<br>- Accuracy meets threshold<br>- Deployed for predictions | *To be tested* |
| **INT-005** | End-to-End Task Lifecycle | 1. Task created<br>2. AI recommendation<br>3. Assignment<br>4. Work logged<br>5. Submission<br>6. Review<br>7. Completion<br>8. ML learns | Complete lifecycle of task-900 | - All transitions successful<br>- Data flows correctly<br>- Notifications at each step<br>- ML data captured<br>- Metrics updated<br>- History complete | *To be tested* |

---

## Performance Test Cases

| Test Code | Scenario | Test Steps | Test Data | Expected Results | Actual Results |
|-----------|----------|------------|-----------|------------------|----------------|
| **PERF-001** | API Response Time - Get Recommendations | 1. Create 100 concurrent requests<br>2. Measure response time<br>3. Verify all succeed | Concurrent Users: `100`<br>Priority: `LOW, MEDIUM, HIGH (mixed)` | - 95% requests < 500ms<br>- 99% requests < 1s<br>- No errors<br>- All return valid data | *To be tested* |
| **PERF-002** | Database Query Performance | 1. Query tasks with complex filters<br>2. Join multiple tables<br>3. Measure execution time | Filters: Department, Skills, Status<br>ResultSet: `1000+ tasks` | - Query execution < 200ms<br>- Proper indexes used<br>- No table scans<br>- Results accurate | *To be tested* |
| **PERF-003** | WebSocket Connection Load | 1. Connect 500 users simultaneously<br>2. Send messages concurrently<br>3. Verify real-time delivery | Concurrent Users: `500`<br>Messages/sec: `100` | - All connections stable<br>- Messages delivered < 100ms<br>- No connection drops<br>- Memory usage acceptable | *To be tested* |
| **PERF-004** | ML Model Prediction Speed | 1. Load trained model<br>2. Make 1000 predictions<br>3. Measure average time | Predictions: `1000`<br>Candidates per request: `10` | - Average time < 100ms<br>- Model loaded in memory<br>- Consistent performance<br>- No degradation | *To be tested* |

---

## Security Test Cases

| Test Code | Scenario | Test Steps | Test Data | Expected Results | Actual Results |
|-----------|----------|------------|-----------|------------------|----------------|
| **SEC-001** | SQL Injection Prevention | 1. Attempt SQL injection in login<br>2. Try malicious task title<br>3. Verify sanitization | Input: `' OR '1'='1`<br>Field: Various inputs | - Input sanitized<br>- No SQL execution<br>- Error handled gracefully<br>- Attack logged | *To be tested* |
| **SEC-002** | XSS Attack Prevention | 1. Submit task with script tags<br>2. Add comment with XSS payload<br>3. Verify output encoding | Payload: `<script>alert('XSS')</script>` | - Script tags escaped<br>- No execution in browser<br>- Content displayed as text<br>- Attack detected | *To be tested* |
| **SEC-003** | Unauthorized API Access | 1. Attempt to access API without token<br>2. Use expired token<br>3. Use another user's token | Various invalid tokens | - All requests rejected<br>- 401 Unauthorized returned<br>- Access denied<br>- Audit log created | *To be tested* |
| **SEC-004** | Role-Based Access Control | 1. Login as EMPLOYEE<br>2. Attempt admin operations<br>3. Verify access denied | Role: `EMPLOYEE`<br>Operation: Delete User | - Access denied<br>- 403 Forbidden<br>- Operation not executed<br>- Attempt logged | *To be tested* |
| **SEC-005** | Password Security | 1. Set weak password<br>2. Verify rejection<br>3. Set strong password<br>4. Verify BCrypt hashing | Weak: `123456`<br>Strong: `Test@123Pass!` | - Weak password rejected<br>- Strong password accepted<br>- BCrypt hash stored<br>- Plain text never saved | *To be tested* |

---

## Test Execution Summary

### Coverage Statistics

| Service | Total Test Cases | Critical | High Priority | Medium Priority |
|---------|-----------------|----------|---------------|-----------------|
| Identity Service | 11 | 6 | 3 | 2 |
| Task Service | 7 | 5 | 2 | 0 |
| Project Service | 6 | 4 | 2 | 0 |
| AI Service | 5 | 3 | 2 | 0 |
| ML Service | 5 | 3 | 2 | 0 |
| Profile Service | 6 | 3 | 2 | 1 |
| Workload Service | 6 | 4 | 2 | 0 |
| Chat Service | 8 | 4 | 3 | 1 |
| Notification Service | 6 | 3 | 2 | 1 |
| Integration Tests | 5 | 5 | 0 | 0 |
| Performance Tests | 4 | 4 | 0 | 0 |
| Security Tests | 5 | 5 | 0 | 0 |
| **TOTAL** | **74** | **49** | **20** | **5** |

---

## Test Environment Setup

### Prerequisites
- All microservices running (ports 8080-8091, 8888)
- Python ML service running (port 8000)
- Website service running (port 3000)
- Databases initialized: MySQL, PostgreSQL, Neo4j, MongoDB, Redis
- Test data loaded
- API Gateway configured

### Test Credentials

| Role | Username | Password | Department |
|------|----------|----------|------------|
| Admin | admin@company.com | Admin@123 | IT |
| Team Lead | teamlead@company.com | Lead@123 | Engineering |
| Developer | developer@company.com | Dev@123 | Engineering |
| Tester | tester@company.com | Test@123 | QA |

---

## Notes for Testers

1. **Execution Order**: Execute test cases in the order listed for each service
2. **Dependencies**: Some test cases depend on data from previous tests
3. **Actual Results**: Update "Actual Results" column after execution
4. **Bug Reporting**: Link failed tests to bug tracking system
5. **Regression**: Re-run all test cases after bug fixes
6. **Performance**: Run performance tests in isolated environment
7. **Security**: Security tests should be run by security team
8. **Integration**: Integration tests require all services to be running

---

## Sign-off

| Role | Name | Signature | Date |
|------|------|-----------|------|
| Test Lead | ___________ | ___________ | ___/___/2025 |
| QA Manager | ___________ | ___________ | ___/___/2025 |
| Project Manager | ___________ | ___________ | ___/___/2025 |
| Tech Lead | ___________ | ___________ | ___/___/2025 |

---

**Document Version:** 1.0  
**Last Updated:** November 25, 2025  
**Status:** Ready for Test Execution  
**Next Review:** After initial test cycle completion
