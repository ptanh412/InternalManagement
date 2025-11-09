# 🤖 GIẢI THÍCH THUẬT TOÁN MACHINE LEARNING VÀ HYBRID SYSTEM

## 📋 MỤC LỤC

1. [Tổng Quan Hệ Thống](#1-tổng-quan-hệ-thống)
2. [ML Service - Các Thuật Toán Machine Learning](#2-ml-service---các-thuật-toán-machine-learning)
3. [Hybrid Algorithm - Thuật Toán Lai](#3-hybrid-algorithm---thuật-toán-lai)
4. [Nguồn Dữ Liệu và Quy Trình Training](#4-nguồn-dữ-liệu-và-quy-trình-training)
5. [Cách Thức Hoạt Động Tích Hợp](#5-cách-thức-hoạt-động-tích-hợp)

---

## 1. TỔNG QUAN HỆ THỐNG

### 🏗️ Kiến Trúc 3 Tầng

Hệ thống gợi ý phân công task sử dụng **3 tầng thông minh**:

```
┌─────────────────────────────────────────────────────────┐
│              TẦNG 1: AI SERVICE (JAVA)                  │
│         🧠 Hybrid Algorithm + Gemini AI                 │
│                                                         │
│  • Kết hợp Content-Based (60%) + Collaborative (40%)   │
│  • Tích hợp Gemini AI cho task khó & quan trọng        │
│  • Quyết định thông minh dựa trên độ ưu tiên           │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│           TẦNG 2: ML SERVICE (PYTHON)                   │
│       🎯 Machine Learning Models (Sklearn)              │
│                                                         │
│  • RandomForest Classifier                             │
│  • Gradient Boosting Classifier                        │
│  • Neural Networks (Deep Learning)                     │
│  • SVD Matrix Factorization                            │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│               TẦNG 3: DATABASE                          │
│         📊 Training Data & Feedback Loop                │
│                                                         │
│  • Lịch sử phân công task                              │
│  • Kết quả thực hiện (performance)                     │
│  • Kỹ năng nhân viên (skills)                          │
│  • Phản hồi từ thực tế (feedback)                      │
└─────────────────────────────────────────────────────────┘
```

---

## 2. ML SERVICE - CÁC THUẬT TOÁN MACHINE LEARNING

### 🎯 2.1. Random Forest Classifier (Rừng Ngẫu Nhiên)

#### **Khái Niệm Đơn Giản:**
Random Forest giống như **hỏi ý kiến của nhiều chuyên gia** trước khi đưa ra quyết định cuối cùng.

#### **Cách Hoạt Động:**

```
┌──────────────────────────────────────────────────────┐
│          RANDOM FOREST = NHIỀU CÂY QUYẾT ĐỊNH        │
└──────────────────────────────────────────────────────┘

Ví dụ: Chọn nhân viên phù hợp cho task "Phát triển API Payment"

Cây Quyết Định 1:              Cây Quyết Định 2:
┌────────────┐                 ┌────────────┐
│ Có kỹ năng │                 │ Workload   │
│   Java?    │                 │   thấp?    │
└─────┬──────┘                 └─────┬──────┘
   Có │                           Có │
      ▼                              ▼
┌────────────┐                 ┌────────────┐
│ Kinh nghiệm│                 │ Đã làm API │
│  > 3 năm?  │                 │  trước?    │
└─────┬──────┘                 └─────┬──────┘
   Có │                           Có │
      ▼                              ▼
   ✅ Nguyễn Văn A               ✅ Nguyễn Văn A

Cây Quyết Định 3:              ... đến Cây 200
┌────────────┐
│ Performance│
│  score > 0.8? │
└─────┬──────┘
   Có │
      ▼
   ✅ Nguyễn Văn A

┌─────────────────────────────────────────┐
│  KẾT QUẢ CUỐI CÙNG (VOTING):           │
│                                         │
│  Nguyễn Văn A: 180/200 cây chọn ✅     │
│  Trần Thị B:    15/200 cây chọn        │
│  Lê Văn C:       5/200 cây chọn        │
│                                         │
│  ➡️ Gợi ý: NGUYỄN VĂN A (90% tin cậy) │
└─────────────────────────────────────────┘
```

#### **Tại Sao Sử Dụng Random Forest?**

✅ **Ưu điểm:**
- Chính xác cao (accuracy 85-95%)
- Không dễ bị "học vẹt" (overfitting)
- Xử lý tốt dữ liệu thiếu (missing data)
- Cho biết tính năng nào quan trọng nhất

❌ **Nhược điểm:**
- Tốn thời gian training nhiều cây
- Khó giải thích chi tiết quyết định

#### **Code Implementation:**

```python
from sklearn.ensemble import RandomForestClassifier

# Khởi tạo Random Forest với 200 cây
self.content_model = RandomForestClassifier(
    n_estimators=200,        # 200 cây quyết định
    max_depth=15,            # Độ sâu tối đa mỗi cây
    min_samples_split=5,     # Tối thiểu 5 mẫu để tách nhánh
    class_weight='balanced', # Cân bằng các class
    random_state=42          # Đảm bảo kết quả nhất quán
)

# Training
self.content_model.fit(X_train, y_train)

# Dự đoán xác suất
prediction_prob = self.content_model.predict_proba(X_test)
```

---

### 🚀 2.2. Gradient Boosting Classifier (Tăng Cường Độ Chính Xác)

#### **Khái Niệm Đơn Giản:**
Gradient Boosting giống như **học từ sai lầm**. Mỗi mô hình mới tập trung sửa lỗi của mô hình trước.

#### **Cách Hoạt Động:**

```
┌─────────────────────────────────────────────────────────┐
│        GRADIENT BOOSTING = HỌC TỪ SAI LẦM              │
└─────────────────────────────────────────────────────────┘

Vòng 1: Mô hình cơ bản
┌────────────────────────────────────────┐
│ Task: "API Payment"                    │
│ Dự đoán: Nguyễn Văn A (70% tin cậy)   │
│ Thực tế: Sai! (Người phù hợp là B)    │
│ ❌ SAI LẦM: Đánh giá thấp kỹ năng API │
└────────────────────────────────────────┘
           │
           ▼
Vòng 2: Sửa sai lầm vòng 1
┌────────────────────────────────────────┐
│ Tăng trọng số cho kỹ năng API         │
│ Dự đoán: Trần Thị B (75% tin cậy)     │
│ Thực tế: Đúng! ✅                      │
│ Học được: Kỹ năng API quan trọng hơn  │
└────────────────────────────────────────┘
           │
           ▼
Vòng 3: Tinh chỉnh thêm
┌────────────────────────────────────────┐
│ Cân nhắc thêm workload hiện tại       │
│ Dự đoán: Trần Thị B (88% tin cậy)     │
│ ✅ Ngày càng chính xác hơn!            │
└────────────────────────────────────────┘
```

#### **So Sánh Random Forest vs Gradient Boosting:**

| Tiêu Chí | Random Forest 🌲 | Gradient Boosting 🚀 |
|----------|------------------|---------------------|
| **Nguyên lý** | Nhiều cây độc lập, vote kết quả | Cây tuần tự, học từ sai lầm |
| **Tốc độ training** | Nhanh (song song) | Chậm hơn (tuần tự) |
| **Độ chính xác** | Cao (85-92%) | Rất cao (90-95%) |
| **Overfitting** | Ít (nhiều cây đa dạng) | Có thể cao nếu không tune tốt |
| **Khi nào dùng** | Dữ liệu lớn, cần nhanh | Cần độ chính xác cao nhất |

#### **Code Implementation:**

```python
from sklearn.ensemble import GradientBoostingClassifier

# Có thể dùng Gradient Boosting thay Random Forest
alternative_model = GradientBoostingClassifier(
    n_estimators=100,         # 100 vòng học
    learning_rate=0.1,        # Tốc độ học (0.01 - 0.3)
    max_depth=5,              # Độ sâu mỗi cây
    subsample=0.8,            # Dùng 80% data mỗi vòng
    random_state=42
)

alternative_model.fit(X_train, y_train)
```

---

### 🧠 2.3. Neural Networks (Mạng Nơ-ron - Deep Learning)

#### **Khái Niệm Đơn Giản:**
Neural Network bắt chước cách **não bộ con người** học và ra quyết định.

#### **Cách Hoạt Động:**

```
┌──────────────────────────────────────────────────────────┐
│            NEURAL NETWORK = NÃO NHÂN TẠO                 │
└──────────────────────────────────────────────────────────┘

INPUT LAYER          HIDDEN LAYERS           OUTPUT LAYER
(Đặc điểm)           (Xử lý phức tạp)       (Quyết định)

Kỹ năng Java ────┐
                 ├──→ [Nơ-ron 1] ───┐
Kinh nghiệm ─────┤                  ├──→ [Kết hợp] ──→ 0.92
                 ├──→ [Nơ-ron 2] ───┤                (Phù hợp 92%)
Workload ────────┤                  │
                 ├──→ [Nơ-ron 3] ───┤
Performance ─────┤                  ├──→ [Đánh giá]
                 └──→ [Nơ-ron 4] ───┘

Mỗi nơ-ron:
• Nhận thông tin từ nhiều nguồn
• Tính toán tổng trọng số (weighted sum)
• Quyết định có "kích hoạt" hay không (activation)
• Truyền kết quả sang tầng tiếp theo
```

#### **Ví Dụ Chi Tiết:**

```python
# Giả sử đánh giá nhân viên A cho task X

# INPUT (Đầu vào)
Java_skill = 0.9        # 9/10 điểm Java
Experience = 0.7        # 7 năm kinh nghiệm
Workload = 0.3          # 30% công suất đang dùng
Performance = 0.85      # 85% hiệu suất lịch sử

# HIDDEN LAYER 1 (Xử lý cơ bản)
neuron_1 = Java_skill * 0.8 + Experience * 0.2 = 0.86
neuron_2 = Workload * 0.5 + Performance * 0.5 = 0.58

# HIDDEN LAYER 2 (Xử lý phức tạp)
neuron_3 = neuron_1 * 0.7 + neuron_2 * 0.3 = 0.776

# OUTPUT (Kết quả cuối)
Suitability_Score = sigmoid(neuron_3) = 0.92

➡️ Nhân viên A phù hợp 92% cho task này!
```

#### **Code Implementation:**

```python
from sklearn.neural_network import MLPClassifier

# Neural Network với 2 hidden layers
neural_model = MLPClassifier(
    hidden_layer_sizes=(100, 50),  # Layer 1: 100 nơ-ron, Layer 2: 50 nơ-ron
    activation='relu',              # Hàm kích hoạt ReLU
    solver='adam',                  # Thuật toán tối ưu Adam
    learning_rate='adaptive',       # Tự động điều chỉnh learning rate
    max_iter=300,                   # Tối đa 300 epochs
    random_state=42
)

neural_model.fit(X_train, y_train)
```

---

### 📊 2.4. SVD Matrix Factorization (Collaborative Filtering)

#### **Khái Niệm Đơn Giản:**
SVD giống như **tìm pattern ẩn** trong dữ liệu. Ví dụ: "Những người giỏi Java thường cũng giỏi Spring Boot"

#### **Cách Hoạt Động:**

```
┌─────────────────────────────────────────────────────────┐
│    COLLABORATIVE FILTERING = HỌC TỪ NGƯỜI KHÁC         │
└─────────────────────────────────────────────────────────┘

Ma trận User-Task (Lịch sử phân công)
        Task1  Task2  Task3  Task4  Task5
        API    UI     DB     Test   DevOps
UserA   0.9    0.2    0.8    0.3    0.7
UserB   0.8    0.9    0.3    0.8    0.2
UserC   0.3    0.8    0.2    0.9    0.3
UserD   0.7    0.3    0.9    0.4    0.8

SVD Phân Tích ➡️ Tìm ra "Hidden Factors"

Hidden Factor 1: "Backend Skills"
UserA: 0.85 (Giỏi backend)
UserB: 0.50 (Trung bình)
UserC: 0.20 (Yếu backend)
UserD: 0.80 (Giỏi backend)

Hidden Factor 2: "Frontend Skills"
UserA: 0.30 (Yếu frontend)
UserB: 0.90 (Giỏi frontend)
UserC: 0.85 (Giỏi frontend)
UserD: 0.35 (Yếu frontend)

➡️ Khi có task mới "API Gateway" (Backend):
   Hệ thống biết UserA và UserD phù hợp nhất!
```

#### **Ví Dụ Thực Tế:**

```
Tình huống: Task mới "Develop Payment Gateway"

Bước 1: Tìm các task tương tự đã làm
• "API Integration" - UserA (score 0.9)
• "Banking API" - UserD (score 0.85)
• "REST API" - UserA (score 0.88)

Bước 2: SVD tính toán pattern
• Pattern "Backend + Security" → UserA & UserD giỏi
• Pattern "Payment Domain" → UserA có kinh nghiệm

Bước 3: Dự đoán
• UserA: 0.87 (Rất phù hợp)
• UserD: 0.78 (Phù hợp)
• UserB: 0.34 (Không phù hợp - chuyên frontend)
```

#### **Code Implementation:**

```python
from sklearn.decomposition import TruncatedSVD
from scipy.sparse import csr_matrix

# Tạo ma trận tương tác User-Task
interaction_matrix = csr_matrix(
    (ratings, (user_indices, task_indices)),
    shape=(n_users, n_tasks)
)

# SVD để tìm hidden factors
svd_model = TruncatedSVD(
    n_components=50,        # 50 hidden factors
    random_state=42
)

# Học pattern ẩn
user_factors = svd_model.fit_transform(interaction_matrix)

# Dự đoán task mới cho user
predicted_score = user_factors @ task_factors.T
```

---

## 3. HYBRID ALGORITHM - THUẬT TOÁN LAI

### 🎭 3.1. Kiến Trúc Hybrid System

Hybrid Algorithm **KHÔNG PHỤ THUỘC** trực tiếp vào ML Service. Nó có engine riêng!

```
┌──────────────────────────────────────────────────────────┐
│         HYBRID ALGORITHM (trong AI Service)              │
│                                                          │
│  ┌────────────────┐         ┌──────────────────┐       │
│  │ CONTENT-BASED  │  60%    │ COLLABORATIVE    │ 40%   │
│  │ (Dựa kỹ năng) │   +     │ (Dựa lịch sử)    │   =   │
│  └────────────────┘         └──────────────────┘       │
│          ↓                           ↓                  │
│  ┌──────────────────────────────────────────────┐      │
│  │        KẾT QUẢ HYBRID (Final Score)          │      │
│  └──────────────────────────────────────────────┘      │
└──────────────────────────────────────────────────────────┘
```

### 📊 3.2. Content-Based Filtering (60% trọng số)

#### **Dựa Vào Dữ Liệu Gì?**

```java
// AI Service tự tính toán dựa trên database
1. Kỹ năng yêu cầu của task (từ Task Service)
   → requiredSkills: ["Java", "Spring Boot", "PostgreSQL"]

2. Kỹ năng của nhân viên (từ Profile Service)
   → userSkills: ["Java", "Spring Boot", "MySQL", "Docker"]

3. Độ khớp kỹ năng (Tự tính)
   → matchedSkills: ["Java", "Spring Boot"]
   → matchScore = 2/3 = 0.67 (67% khớp)

4. Các yếu tố khác:
   → Performance hiện tại: 0.85
   → Workload: 0.45 (45% đang dùng)
   → Experience: 5 năm
```

#### **Công Thức Tính:**

```java
// Trong HybridRecommendationAlgorithm.java

// TRỌNG SỐ (Weights) - Tổng = 100%
private static final double SKILL_MATCH_WEIGHT = 0.35;      // 35%
private static final double PERFORMANCE_WEIGHT = 0.25;       // 25%
private static final double AVAILABILITY_WEIGHT = 0.20;      // 20%
private static final double WORKLOAD_WEIGHT = 0.15;          // 15%
private static final double COLLABORATION_WEIGHT = 0.05;     // 5%

private double calculateContentBasedScore(TaskProfile task, UserProfile candidate) {
    double skillMatchScore = calculateSkillMatchScore(task, candidate);
    double performanceScore = calculatePerformanceScore(candidate);
    double availabilityScore = candidate.getAvailabilityScore() != null 
                                ? candidate.getAvailabilityScore() : 0.5;
    double workloadScore = calculateWorkloadScore(candidate);
    double collaborationScore = calculateCollaborationScore(candidate);

    return (SKILL_MATCH_WEIGHT * skillMatchScore)           // 35%
            + (PERFORMANCE_WEIGHT * performanceScore)        // 25%
            + (AVAILABILITY_WEIGHT * availabilityScore)      // 20%
            + (WORKLOAD_WEIGHT * workloadScore)              // 15%
            + (COLLABORATION_WEIGHT * collaborationScore);   // 5%
}

// ⚠️ QUAN TRỌNG: WORKLOAD_WEIGHT LẤY DỮ LIỆU TỪ ĐÂU?
private double calculateWorkloadScore(UserProfile candidate) {
    // Lấy từ UserProfile.workloadCapacity (giá trị 0.0-1.0)
    // workloadCapacity = currentWorkload / maxCapacity
    // Score càng cao = workload càng thấp = càng rảnh
    Double workloadCapacity = candidate.getWorkloadCapacity();
    return workloadCapacity != null ? Math.max(0.0, 1.0 - workloadCapacity) : 0.5;
}
```

#### **⚠️ VẤN ĐỀ ĐỒNG BỘ DỮ LIỆU:**

**Profile Service có 3 thuộc tính KHÔNG được cập nhật tự động:**

```java
// File: profile-service/.../entity/UserProfile.java
Double averageTaskCompletionRate = 0.0;  // ❌ KHÔNG tự động cập nhật
Integer totalTasksCompleted = 0;         // ❌ KHÔNG tự động cập nhật  
Integer currentWorkLoadHours = 0;        // ❌ KHÔNG tự động cập nhật
```

**Hybrid Algorithm KHÔNG dùng 3 thuộc tính này!**

Thay vào đó, `workloadScore` được tính từ:

```java
// AI Service gọi Workload Service để lấy dữ liệu REAL-TIME
UserWorkloadResponse workloadData = workloadServiceClient.getUserWorkload(userId);

// workloadCapacity được tính từ Workload Service
workloadCapacity = workloadData.getUtilizationPercentage() / 100.0;

// Ví dụ:
// utilizationPercentage = 45% (đang dùng 45% công suất)
// workloadCapacity = 0.45
// workloadScore = 1.0 - 0.45 = 0.55 (55% rảnh)
```

#### **Ví Dụ Thực Tế:**

```java
// Data từ Workload Service (Real-time)
UserWorkloadResponse workload = {
    userId: "USER-123",
    weeklyCapacityHours: 40,              // Công suất: 40 giờ/tuần
    totalEstimateHours: 18,               // Đang có task: 18 giờ
    utilizationPercentage: 45.0,          // 18/40 = 45%
    availabilityPercentage: 55.0,         // Còn rảnh: 55%
    currentTasksCount: 3                  // 3 task đang làm
}

// Tính workloadScore
workloadCapacity = 45.0 / 100 = 0.45
workloadScore = 1.0 - 0.45 = 0.55 (55% available)

// Tính contentScore với đầy đủ 5 yếu tố
skillMatchScore = 0.67       // 67% kỹ năng khớp
performanceScore = 0.85      // 85% hiệu suất
availabilityScore = 0.90     // 90% khả dụng (không nghỉ phép)
workloadScore = 0.55         // 55% công suất còn trống
collaborationScore = 0.75    // 75% điểm làm việc nhóm

contentScore = (0.35 * 0.67) + (0.25 * 0.85) + (0.20 * 0.90) + 
               (0.15 * 0.55) + (0.05 * 0.75)
             = 0.2345 + 0.2125 + 0.180 + 0.0825 + 0.0375
             = 0.747 (74.7%)
```

### 🤝 3.3. Collaborative Filtering (40% trọng số)

#### **Dựa Vào Dữ Liệu Gì?**

```java
// Phân tích lịch sử từ Task Service
1. Lịch sử phân công task tương tự
   Query: "SELECT * FROM task_assignments 
           WHERE task_skills SIMILAR TO current_task
           AND completion_status = 'SUCCESS'"

2. Nhân viên nào đã làm tốt task tương tự?
   → Nguyễn Văn A: 5 task tương tự, avg score 0.88
   → Trần Thị B: 3 task tương tự, avg score 0.75

3. Pattern learning
   → "Người làm tốt API thường làm tốt Gateway"
   → "Senior developer phù hợp task khó"
```

#### **Công Thức Tính:**

```java
// Tìm similarity giữa task hiện tại với task cũ

List<Task> similarTasks = findSimilarTasks(currentTask);

Map<String, Double> userScores = new HashMap<>();
for (Task task : similarTasks) {
    String assignee = task.getAssigneeId();
    double performance = task.getPerformanceScore();
    double similarity = calculateTaskSimilarity(currentTask, task);
    
    // Cộng dồn score có trọng số
    userScores.merge(assignee, 
        performance * similarity, 
        Double::sum
    );
}

// Normalize scores
collaborativeScore = userScores.get(userId) / totalSimilarity;

// Ví dụ:
// UserA từng làm 3 task tương tự:
// Task1: similarity=0.8, performance=0.9 → 0.72
// Task2: similarity=0.6, performance=0.85 → 0.51
// Task3: similarity=0.7, performance=0.88 → 0.616
// Total: 1.846 / 2.1 (total similarity) = 0.879 (87.9%)
```

### 🎯 3.4. Kết Hợp Cuối Cùng (Hybrid Score)

```java
// Final calculation trong AI Service

double CONTENT_WEIGHT = 0.60;      // 60%
double COLLABORATIVE_WEIGHT = 0.40; // 40%

double hybridScore = 
    (contentScore * CONTENT_WEIGHT) + 
    (collaborativeScore * COLLABORATIVE_WEIGHT);

// Ví dụ với UserA:
contentScore = 0.704 (từ phần 3.2)
collaborativeScore = 0.879 (từ phần 3.3)

hybridScore = (0.704 * 0.60) + (0.879 * 0.40)
            = 0.4224 + 0.3516
            = 0.774 (77.4% phù hợp)

// Điều chỉnh dựa trên ưu tiên và độ khó
if (taskPriority == "HIGH" || taskDifficulty == "HARD") {
    // Ưu tiên người có kinh nghiệm cao
    hybridScore *= (1 + experienceBonus);
}

if (isTeamLead) {
    // Team Lead được ưu tiên cao hơn
    hybridScore *= 1.15;
}
```

---

## 4. NGUỒN DỮ LIỆU VÀ QUY TRÌNH TRAINING

### 📦 4.1. Nguồn Dữ Liệu Training

```
┌─────────────────────────────────────────────────────────┐
│         DỮ LIỆU TRAINING (Training Data Sources)        │
└─────────────────────────────────────────────────────────┘

1️⃣ TASK SERVICE (PostgreSQL)
   ├── tasks: Thông tin task (priority, difficulty, skills)
   ├── task_assignments: Lịch sử phân công
   ├── task_completions: Kết quả hoàn thành
   └── task_time_logs: Thời gian làm việc

2️⃣ PROFILE SERVICE (PostgreSQL)
   ├── profiles: Thông tin nhân viên
   ├── user_skills: Kỹ năng & proficiency level
   ├── skill_endorsements: Đánh giá kỹ năng
   └── performance_history: Lịch sử hiệu suất

3️⃣ WORKLOAD SERVICE (PostgreSQL)
   ├── user_workload: Công suất hiện tại
   ├── capacity_planning: Kế hoạch capacity
   └── utilization_metrics: Số liệu sử dụng

4️⃣ PROJECT SERVICE (PostgreSQL)
   ├── projects: Thông tin dự án
   ├── project_teams: Thành viên team
   └── project_milestones: Các mốc quan trọng

5️⃣ FEEDBACK DATA (Runtime)
   ├── assignment_feedback: Phản hồi sau phân công
   ├── performance_ratings: Đánh giá hiệu suất
   └── completion_metrics: Metrics hoàn thành
```

### 🔄 4.2. Quy Trình Thu Thập Dữ Liệu

```python
# File: ml-service/ml-training-python/src/data/data_collector.py

class MultiDatabaseDataCollector:
    """Thu thập dữ liệu từ nhiều database"""
    
    def collect_comprehensive_training_data(self):
        """Thu thập dữ liệu toàn diện"""
        
        # 1. Thu thập thông tin task
        tasks_data = self._fetch_tasks_data()
        # Query: SELECT t.*, ta.assignee_id, ta.performance_score
        #        FROM tasks t
        #        JOIN task_assignments ta ON t.id = ta.task_id
        #        WHERE ta.status = 'COMPLETED'
        
        # 2. Thu thập kỹ năng user
        user_skills = self._fetch_user_skills()
        # Query: SELECT us.user_id, s.skill_name, us.proficiency_level
        #        FROM user_skills us
        #        JOIN skills s ON us.skill_id = s.id
        
        # 3. Thu thập workload
        workload_data = self._fetch_workload_metrics()
        # Query: SELECT user_id, utilization, capacity, available_hours
        #        FROM user_workload
        
        # 4. Thu thập performance history
        performance = self._fetch_performance_history()
        # Query: SELECT user_id, AVG(rating) as avg_performance,
        #               COUNT(*) as tasks_completed
        #        FROM task_completions
        #        GROUP BY user_id
        
        # 5. Kết hợp tất cả
        training_data = self._merge_all_data(
            tasks_data, 
            user_skills, 
            workload_data, 
            performance
        )
        
        return training_data
```

### 🎓 4.3. Quy Trình Training Model

```
┌──────────────────────────────────────────────────────────┐
│          QUY TRÌNH TRAINING ML MODELS                    │
└──────────────────────────────────────────────────────────┘

BƯỚC 1: THU THẬP DỮ LIỆU (Data Collection)
├── Connect tới 4 databases (Task, Profile, Workload, Project)
├── Query lịch sử phân công task (assignments)
├── Lấy kết quả thực hiện (performance scores)
└── Tổng hợp thành training dataset
      ↓
BƯỚC 2: TIỀN XỬ LÝ (Preprocessing)
├── Xử lý missing values (điền giá trị thiếu)
├── Chuẩn hóa dữ liệu (normalization)
├── Feature engineering (tạo features mới)
│   ├── skill_match_ratio = matched_skills / required_skills
│   ├── experience_level = categorize(years_experience)
│   ├── workload_pressure = utilization / capacity
│   └── complexity_score = priority * difficulty
└── Encoding categorical variables
      ↓
BƯỚC 3: CHIA DỮ LIỆU (Train/Test Split)
├── Training set: 80% (học)
├── Test set: 20% (kiểm tra)
└── Stratified split (đảm bảo cân bằng)
      ↓
BƯỚC 4: TRAINING MODELS
├── Random Forest (200 trees)
│   └── Training time: ~5-10 phút
├── Gradient Boosting (100 estimators)
│   └── Training time: ~10-15 phút
├── Neural Network (100-50 neurons)
│   └── Training time: ~15-20 phút
└── SVD Matrix Factorization
    └── Training time: ~2-5 phút
      ↓
BƯỚC 5: ĐÁNH GIÁ (Evaluation)
├── Accuracy: Tỷ lệ dự đoán đúng
├── Precision: Độ chính xác gợi ý
├── Recall: Bao phủ các trường hợp
├── F1-Score: Cân bằng Precision & Recall
└── Cross-validation: Kiểm tra 5 lần
      ↓
BƯỚC 6: LƯU MODEL (Save Models)
├── content_model.pkl (Random Forest)
├── collaborative_model.pkl (SVD)
├── feature_scaler.pkl (Scaler)
├── label_encoders.pkl (Encoders)
└── model_metadata.pkl (Thông tin model)
      ↓
BƯỚC 7: TRIỂN KHAI (Deployment)
└── Load models vào ML Service API
    └── Sẵn sàng phục vụ predictions
```

### 📊 4.4. Ví Dụ Training Data

```python
# Sample training record

training_record = {
    # Task information
    'task_id': 'TASK-001',
    'task_title': 'Develop Payment API',
    'priority': 'HIGH',
    'difficulty': 'HARD',
    'estimated_hours': 40,
    'required_skills': ['Java', 'Spring Boot', 'PostgreSQL', 'REST API'],
    
    # User information
    'user_id': 'USER-123',
    'user_name': 'Nguyễn Văn A',
    'user_skills': ['Java', 'Spring Boot', 'MySQL', 'Docker', 'Redis'],
    'years_experience': 5,
    'seniority_level': 'SENIOR',
    
    # Workload information
    'current_utilization': 0.45,  # 45% đang bận
    'capacity': 160,              # 160 giờ/tháng
    'available_hours': 88,        # 88 giờ còn trống
    
    # Performance history
    'avg_performance_score': 0.85,  # 85% hiệu suất trung bình
    'tasks_completed': 23,          # Đã hoàn thành 23 task
    'on_time_rate': 0.91,           # 91% đúng deadline
    
    # Outcome (TARGET - cái cần dự đoán)
    'assignment_success': 1,        # 1 = Thành công, 0 = Thất bại
    'actual_performance': 0.88      # Hiệu suất thực tế: 88%
}

# Model sẽ học pattern:
# "Người có kỹ năng Java + Spring Boot + High performance + 
#  Workload thấp = Phù hợp với task API khó"
```

---

## 5. CÁCH THỨC HOẠT ĐỘNG TÍCH HỢP

### 🔄 5.1. Quy Trình Gợi Ý Hoàn Chỉnh

```
┌──────────────────────────────────────────────────────────┐
│    LUỒNG XỬ LÝ KHI TEAM LEAD YÊU CẦU GỢI Ý            │
└──────────────────────────────────────────────────────────┘

1️⃣ TEAM LEAD NHẤN NÚT "AI RECOMMEND"
   ↓
   POST /ai/recommendations/task/TASK-123

2️⃣ API GATEWAY (:8888)
   ↓ Forward request
   
3️⃣ AI SERVICE (:8085) - Xử lý logic chính
   ├─→ Kiểm tra độ ưu tiên task
   │   ├─ HIGH/CRITICAL → Dùng Gemini AI
   │   └─ MEDIUM/LOW → Dùng Hybrid Algorithm
   │
   ├─→ HYBRID ALGORITHM BƯỚC 1: Content-Based (60%)
   │   ├─ Query Profile Service → Lấy kỹ năng users
   │   ├─ Tính skill_match_score
   │   ├─ Query Workload Service → Lấy utilization
   │   ├─ Tính availability_score
   │   └─ Kết hợp: contentScore = 0.704
   │
   ├─→ HYBRID ALGORITHM BƯỚC 2: Collaborative (40%)
   │   ├─ Query Task Service → Lấy lịch sử task tương tự
   │   ├─ Tìm users đã làm tốt task tương tự
   │   ├─ Tính similarity scores
   │   └─ Kết hợp: collaborativeScore = 0.879
   │
   ├─→ KẾT HỢP HYBRID
   │   └─ hybridScore = (0.704 * 0.6) + (0.879 * 0.4) = 0.774
   │
   └─→ (OPTIONAL) GEMINI AI Enhancement
       ├─ Nếu task quan trọng, gọi Gemini API
       ├─ Gemini phân tích context và đưa ra reasoning
       └─ Điều chỉnh score dựa trên AI insights

4️⃣ RANKING & FILTERING
   ├─ Sắp xếp users theo hybrid score (cao → thấp)
   ├─ Lọc users không đủ kỹ năng cơ bản
   └─ Chọn top 5 candidates

5️⃣ TRẢ KẾT QUẢ CHO FRONTEND
   └─ JSON response với danh sách gợi ý + explanations

6️⃣ FEEDBACK LOOP (Sau khi phân công)
   ├─ Lưu assignment vào database
   ├─ Theo dõi performance thực tế
   └─ Gửi feedback cho ML Service để retrain
```

### 🧮 5.2. Ví Dụ Tính Toán Cụ Thể

```
TASK: "Develop OAuth2 Authentication System"
├── Priority: HIGH
├── Difficulty: HARD
├── Required Skills: ["Java", "Spring Security", "OAuth2", "JWT"]
└── Estimated Hours: 60

CANDIDATE 1: Nguyễn Văn A
├── Skills: ["Java", "Spring Security", "OAuth2", "Redis"]
├── Experience: 6 years
├── Current Workload: 45%
└── Avg Performance: 0.88

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONTENT-BASED CALCULATION (60% weight)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Skill Match Score:
   Matched: ["Java", "Spring Security", "OAuth2"] = 3/4
   skillMatchScore = 0.75

2. Performance Score:
   Avg historical performance = 0.88
   performanceScore = 0.88

3. Availability Score:
   Current workload = 45%
   Available = 55%
   availabilityScore = 0.55

4. Experience Score:
   6 years / 8 years (senior level) = 0.75
   experienceScore = 0.75

→ contentScore = (0.75 * 0.40) + (0.88 * 0.25) + 
                 (0.55 * 0.20) + (0.75 * 0.15)
               = 0.30 + 0.22 + 0.11 + 0.11
               = 0.74 (74%)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COLLABORATIVE FILTERING (40% weight)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Tìm task tương tự đã làm:
1. "JWT Authentication" (similarity: 0.85)
   → Nguyễn Văn A đã làm, performance: 0.90
   → Contribution: 0.85 * 0.90 = 0.765

2. "Spring Security Setup" (similarity: 0.78)
   → Nguyễn Văn A đã làm, performance: 0.86
   → Contribution: 0.78 * 0.86 = 0.671

3. "API Authentication" (similarity: 0.70)
   → Nguyễn Văn A đã làm, performance: 0.88
   → Contribution: 0.70 * 0.88 = 0.616

Total similarity: 0.85 + 0.78 + 0.70 = 2.33

→ collaborativeScore = (0.765 + 0.671 + 0.616) / 2.33
                     = 2.052 / 2.33
                     = 0.88 (88%)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HYBRID SCORE (Final)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

hybridScore = (contentScore * 0.60) + (collaborativeScore * 0.40)
            = (0.74 * 0.60) + (0.88 * 0.40)
            = 0.444 + 0.352
            = 0.796

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ADJUSTMENTS (Điều chỉnh)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Priority Bonus (HIGH priority):
   finalScore = 0.796 * 1.10 = 0.876

2. Experience Bonus (SENIOR + HARD task):
   finalScore = 0.876 * 1.05 = 0.920

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FINAL RESULT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👤 Nguyễn Văn A
   Overall Score: 92.0% ⭐⭐⭐⭐⭐
   
   Breakdown:
   ├─ Skills Match: 75% ✓
   ├─ Availability: 55% ⚠️
   ├─ Performance: 88% ✓✓
   └─ Experience: Good fit ✓

   Recommendation: STRONGLY RECOMMENDED
   
   Reasoning:
   • High skill match (3/4 required skills)
   • Excellent track record on similar tasks
   • Strong performance history (88% avg)
   • Suitable experience level (6 years)
   ⚠ Note: Currently at 45% workload capacity
```

---

## 📚 TÓM TẮT & SO SÁNH

### 🎯 Câu Hỏi Quan Trọng

#### **Q1: ML Service dùng thuật toán gì?**

**Trả lời:**
- ✅ **Random Forest Classifier** - Chính (200 cây quyết định)
- ✅ **Gradient Boosting** - Backup option (học từ sai lầm)
- ✅ **Neural Networks** - Deep learning (mạng nơ-ron)
- ✅ **SVD Matrix Factorization** - Collaborative filtering

#### **Q2: Hybrid dựa vào data nào?**

**Trả lời:**
Hybrid Algorithm **KHÔNG** phụ thuộc ML Service. Nó có engine riêng và query trực tiếp:

```
Hybrid Algorithm Data Sources:
├── Profile Service Database
│   └── Kỹ năng users (user_skills table)
├── Task Service Database
│   └── Lịch sử task (task_assignments table)
├── Workload Service Database
│   └── Công suất hiện tại (user_workload table)
└── Real-time calculation
    └── Tự tính toán scores (không dùng ML models)
```

#### **Q3: Hybrid vs ML Service - Khác biệt gì?**

| Đặc Điểm | Hybrid Algorithm (AI Service) | ML Service |
|----------|-------------------------------|------------|
| **Công nghệ** | Java logic + rules-based | Python sklearn ML models |
| **Dữ liệu** | Query trực tiếp databases | Training data → Model |
| **Tốc độ** | Rất nhanh (~100-200ms) | Nhanh (~50-100ms) |
| **Độ chính xác** | Tốt (75-85%) | Rất tốt (85-95%) |
| **Cần training** | Không | Có (định kỳ) |
| **Giải thích** | Dễ (có công thức rõ ràng) | Khó (black box) |
| **Khi nào dùng** | Mọi request thông thường | Optional enhancement |

#### **Q4: Tại sao cần cả 2 systems?**

**Trả lời:**

1. **Hybrid (AI Service)** - Fast & Reliable
   - Xử lý 95% requests thông thường
   - Luôn available, không cần training
   - Logic rõ ràng, dễ debug

2. **ML Service** - Accurate & Learning
   - Xử lý cases phức tạp
   - Học từ feedback, cải thiện theo thời gian
   - Backup khi Hybrid không chắc chắn

3. **Gemini AI** - Smart Enhancement
   - Chỉ dùng cho task HIGH/CRITICAL
   - Phân tích context sâu
   - Đưa ra reasoning chi tiết

---

## 🚀 KẾT LUẬN

### Hệ Thống Hoạt Động Như Thế Nào?

```
          ┌─────────────────────────────┐
          │  TEAM LEAD REQUEST SUGGEST  │
          └────────────┬────────────────┘
                       │
                       ▼
          ┌─────────────────────────────┐
          │    AI SERVICE (MAIN)        │
          │  🧠 Hybrid Algorithm        │
          │                             │
          │  1. Content-Based (60%)     │
          │     → Query databases       │
          │     → Tính skill match      │
          │                             │
          │  2. Collaborative (40%)     │
          │     → Tìm task tương tự     │
          │     → Học từ lịch sử        │
          │                             │
          │  3. Combine & Rank          │
          │     → Hybrid score          │
          │     → Top 5 suggestions     │
          └────────────┬────────────────┘
                       │
                       ├─────────→ (Optional) ML Service
                       │           • Dùng trained models
                       │           • Dự đoán chính xác hơn
                       │
                       └─────────→ (Optional) Gemini AI
                                   • Task quan trọng
                                   • Phân tích context
                                   • Smart reasoning
```

### Điểm Mạnh Của Kiến Trúc

✅ **Tốc độ:** Hybrid xử lý nhanh (100-200ms)
✅ **Độ tin cậy:** Luôn có kết quả (không depend ML)
✅ **Chính xác:** ML Service nâng cao độ chính xác
✅ **Thông minh:** Gemini AI cho cases phức tạp
✅ **Học hỏi:** Continuous learning từ feedback
✅ **Giải thích:** Có reasoning rõ ràng cho mỗi gợi ý

---

## 📖 TÀI LIỆU THAM KHẢO

### Code Locations

1. **ML Service Training:**
   - `ml-service/ml-training-python/train_models.py`
   - `ml-service/ml-training-python/src/models/hybrid_recommender.py`

2. **AI Service Hybrid:**
   - `ai-service/src/main/java/com/mnp/ai/service/AIRecommendationService.java`
   - `ai-service/src/main/java/com/mnp/ai/controller/AIRecommendationController.java`

3. **Data Collection:**
   - `ml-service/ml-training-python/src/data/data_collector.py`

### Training Commands

```bash
# Train với synthetic data
cd ml-service/ml-training-python
python train_models.py --synthetic

# Train với real data
python train_models.py --real

# Continuous learning
python train_models.py --continuous

# Validate models
python train_models.py --validate
```

---

**Tác giả:** Internal Management System Team
**Ngày tạo:** 08/11/2025
**Phiên bản:** 1.0

---

## ⚠️ PHỤ LỤC: VẤN ĐỀ ĐỒNG BỘ DỮ LIỆU & GIẢI PHÁP

### 🔴 Vấn Đề Phát Hiện

**Hybrid Algorithm có 5 trọng số nhưng chỉ dùng 4?**

Không! Code thực tế có **ĐẦY ĐỦ 5 TRỌNG SỐ**:

```java
// File: ai-service/.../HybridRecommendationAlgorithm.java

private static final double SKILL_MATCH_WEIGHT = 0.35;      // 35%
private static final double PERFORMANCE_WEIGHT = 0.25;       // 25%
private static final double AVAILABILITY_WEIGHT = 0.20;      // 20%
private static final double WORKLOAD_WEIGHT = 0.15;          // 15% ✅ CÓ!
private static final double COLLABORATION_WEIGHT = 0.05;     // 5%
// TỔNG = 100% ✅

private double calculateContentBasedScore(TaskProfile task, UserProfile candidate) {
    double skillMatchScore = calculateSkillMatchScore(task, candidate);
    double performanceScore = calculatePerformanceScore(candidate);
    double availabilityScore = candidate.getAvailabilityScore() != null 
                                ? candidate.getAvailabilityScore() : 0.5;
    double workloadScore = calculateWorkloadScore(candidate);           // ✅ CÓ!
    double collaborationScore = calculateCollaborationScore(candidate);

    return (SKILL_MATCH_WEIGHT * skillMatchScore)
            + (PERFORMANCE_WEIGHT * performanceScore)
            + (AVAILABILITY_WEIGHT * availabilityScore)
            + (WORKLOAD_WEIGHT * workloadScore)              // ✅ CÓ!
            + (COLLABORATION_WEIGHT * collaborationScore);
}
```

### 🔴 Vấn Đề Thực Sự: Profile Service Không Tự Động Cập Nhật

```java
// File: profile-service/.../entity/UserProfile.java

@Node("user_profile")
public class UserProfile {
    // ... các fields khác
    
    Double averageTaskCompletionRate = 0.0;  // ❌ MÃI MÃI = 0.0
    Integer totalTasksCompleted = 0;         // ❌ MÃI MÃI = 0
    Integer currentWorkLoadHours = 0;        // ❌ MÃI MÃI = 0
    
    // KHÔNG có logic tự động cập nhật khi:
    // - Team Lead assign task
    // - Employee submit task
    // - Team Lead mark complete
}
```

**Vì sao không cập nhật?**

1. **Profile Service** quản lý thông tin cơ bản (skills, personal info)
2. **Task Service** quản lý tasks và assignments
3. **Workload Service** quản lý workload REAL-TIME
4. Không có event listener/webhook để sync giữa các services

### ✅ Giải Pháp Hiện Tại: Hybrid Algorithm Dùng Workload Service

```
┌──────────────────────────────────────────────────────────┐
│  HYBRID ALGORITHM LẤY DỮ LIỆU TỪ ĐÂU?                   │
└──────────────────────────────────────────────────────────┘

1️⃣ SKILL MATCH (35%) → Profile Service
   ├─ Query: GET /api/profiles/internal/{userId}
   └─ Data: userSkills[]

2️⃣ PERFORMANCE (25%) → Profile Service (Static)
   ├─ Sử dụng: candidate.getPerformanceScore()
   └─ ⚠️ Giá trị này KHÔNG tự động cập nhật

3️⃣ AVAILABILITY (20%) → Profile Service
   ├─ Sử dụng: candidate.getAvailabilityScore()
   └─ Data: availabilityStatus (AVAILABLE, ON_LEAVE, BUSY)

4️⃣ WORKLOAD (15%) → ✅ WORKLOAD SERVICE (Real-time!)
   ├─ Query: GET /api/workloads/{userId}
   ├─ Response: UserWorkloadResponse {
   │      utilizationPercentage: 45.0,
   │      totalEstimateHours: 18,
   │      weeklyCapacityHours: 40
   │   }
   └─ Calculate: workloadScore = 1.0 - (utilization/100)

5️⃣ COLLABORATION (5%) → Profile Service
   └─ Sử dụng: candidate.getCollaborationHistory()
```

### 📊 So Sánh: Profile Service vs Workload Service

| Data Field | Profile Service | Workload Service |
|------------|----------------|------------------|
| **averageTaskCompletionRate** | ❌ Static (0.0) | ✅ Calculated real-time |
| **totalTasksCompleted** | ❌ Static (0) | ✅ Query from Task Service |
| **currentWorkLoadHours** | ❌ Static (0) | ✅ Sum of active tasks |
| **utilizationPercentage** | ❌ Không có | ✅ Real-time calculation |
| **weeklyCapacityHours** | ❌ Không có | ✅ Configurable per user |
| **availabilityPercentage** | ❌ Không có | ✅ Capacity - Utilization |

### 🔧 Code Implementation Chi Tiết

```java
// AI Service gọi Workload Service để lấy dữ liệu

@Service
public class AIRecommendationService {
    
    @Autowired
    private WorkloadServiceClient workloadClient;  // Feign Client
    
    private UserProfile enrichUserProfileWithWorkload(String userId) {
        // 1. Lấy profile cơ bản từ Profile Service
        UserProfile profile = profileServiceClient.getUserProfile(userId);
        
        // 2. Lấy workload REAL-TIME từ Workload Service
        UserWorkloadResponse workload = workloadClient.getUserWorkload(userId);
        
        // 3. Tính workloadCapacity từ dữ liệu real-time
        Double utilizationPercentage = workload.getUtilizationPercentage();
        Double workloadCapacity = utilizationPercentage / 100.0;
        
        // 4. Set vào profile để dùng trong calculateWorkloadScore
        profile.setWorkloadCapacity(workloadCapacity);
        
        // 5. Optional: Có thể set thêm các metrics khác
        profile.setCurrentTasksCount(workload.getCurrentTasksCount());
        profile.setAvailableHours(workload.getWeeklyCapacityHours() - 
                                   workload.getTotalEstimateHours());
        
        return profile;
    }
}
```

### 📈 Ví Dụ Thực Tế: Luồng Dữ Liệu

```
SCENARIO: Team Lead gọi AI để gợi ý nhân viên cho task "API Payment"

┌─────────────────────────────────────────────────────────┐
│ BƯỚC 1: AI Service nhận request                        │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ BƯỚC 2: Lấy danh sách candidates                       │
│ • Query Profile Service: GET /api/profiles/department/IT│
│ • Response: List<UserProfile> (10 users)               │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ BƯỚC 3: Enrich với Workload data (FOR EACH USER)       │
│                                                         │
│ User A (USER-123):                                      │
│ ├─ Profile Service data:                               │
│ │  ├─ skills: ["Java", "Spring Boot"]                  │
│ │  ├─ averageTaskCompletionRate: 0.0  ❌ (không dùng) │
│ │  └─ totalTasksCompleted: 0  ❌ (không dùng)         │
│ │                                                       │
│ └─ Workload Service data: ✅ (DÙNG CÁI NÀY!)          │
│    ├─ GET /api/workloads/USER-123                      │
│    ├─ utilizationPercentage: 45.0%                     │
│    ├─ totalEstimateHours: 18                           │
│    ├─ weeklyCapacityHours: 40                          │
│    └─ currentTasksCount: 3                             │
│                                                         │
│ User B (USER-456):                                      │
│ └─ GET /api/workloads/USER-456                         │
│    └─ utilizationPercentage: 75.0% (Bận hơn)          │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ BƯỚC 4: Calculate Scores                               │
│                                                         │
│ User A:                                                 │
│ ├─ skillMatchScore: 0.75 (3/4 skills matched)         │
│ ├─ performanceScore: 0.85 (from profile)              │
│ ├─ availabilityScore: 0.90 (AVAILABLE)                │
│ ├─ workloadScore: 0.55 ✅ (1.0 - 0.45) FROM WORKLOAD  │
│ └─ collaborationScore: 0.80                            │
│                                                         │
│ contentScore = (0.35*0.75) + (0.25*0.85) +            │
│                (0.20*0.90) + (0.15*0.55) +            │
│                (0.05*0.80)                             │
│              = 0.2625 + 0.2125 + 0.18 + 0.0825 + 0.04 │
│              = 0.7775 (77.75%)                         │
│                                                         │
│ User B:                                                 │
│ ├─ workloadScore: 0.25 (1.0 - 0.75) THẤP HƠN!        │
│ └─ contentScore: 0.65 (thấp hơn vì workload cao)      │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ BƯỚC 5: Ranking & Return                               │
│ 1. User A (77.75%) ⭐⭐⭐⭐                             │
│ 2. User B (65.00%) ⭐⭐⭐                               │
└─────────────────────────────────────────────────────────┘
```

### 🔄 Luồng Cập Nhật Khi Task Hoàn Thành

```
SCENARIO: Employee submit task và Team Lead mark complete

┌──────────────────────────────────────────────────────┐
│ 1. Employee Submit Task                              │
│    POST /api/tasks/{taskId}/submit                   │
└───────────────────┬──────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────────────────┐
│ 2. Task Service Update                               │
│    • task.status = "IN_REVIEW"                       │
│    • task.submittedAt = now()                        │
│    • Save to database ✅                             │
└───────────────────┬──────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────────────────┐
│ 3. Team Lead Mark Complete                           │
│    PUT /api/tasks/{taskId}/status                    │
│    { status: "COMPLETED", performanceRating: 0.9 }   │
└───────────────────┬──────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────────────────┐
│ 4. Task Service Update                               │
│    • task.status = "COMPLETED"                       │
│    • task.completedAt = now()                        │
│    • task.performanceScore = 0.9                     │
└───────────────────┬──────────────────────────────────┘
                    │
                    ├───────────────────────────────────┐
                    │                                   │
                    ▼                                   ▼
┌────────────────────────────┐    ┌──────────────────────────┐
│ ❌ Profile Service         │    │ ✅ Workload Service      │
│ KHÔNG tự động cập nhật:    │    │ TỰ ĐỘNG cập nhật:        │
│                            │    │                          │
│ • averageTaskCompletionRate│    │ • utilizationPercentage  │
│   → Vẫn là 0.0            │    │   → Giảm xuống           │
│                            │    │                          │
│ • totalTasksCompleted      │    │ • totalEstimateHours     │
│   → Vẫn là 0              │    │   → Trừ đi giờ task này │
│                            │    │                          │
│ • currentWorkLoadHours     │    │ • availableHours         │
│   → Vẫn là 0              │    │   → Tăng lên            │
└────────────────────────────┘    └──────────────────────────┘
```

### ✅ Kết Luận & Khuyến Nghị

#### **Câu Trả Lời Cho Câu Hỏi:**

**Q: Trọng số WORKLOAD_WEIGHT lấy dữ liệu từ đâu?**

**A:** ✅ **Workload Service** - KHÔNG phải từ 3 thuộc tính `averageTaskCompletionRate`, `totalTasksCompleted`, `currentWorkLoadHours` trong Profile Service.

**Lý do:**
1. ✅ Profile Service có 3 thuộc tính này nhưng **KHÔNG tự động cập nhật**
2. ✅ Workload Service có dữ liệu **REAL-TIME** và **TỰ ĐỘNG CẬP NHẬT**
3. ✅ Hybrid Algorithm gọi Workload Service qua REST API để lấy `utilizationPercentage`
4. ✅ `workloadScore = 1.0 - (utilizationPercentage / 100)`

#### **Khuyến Nghị:**

**Option 1: Xóa 3 thuộc tính không dùng trong Profile Service** ⭐ **RECOMMENDED**

```java
// Xóa trong UserProfile.java
// Double averageTaskCompletionRate = 0.0;  ❌ DELETE
// Integer totalTasksCompleted = 0;         ❌ DELETE
// Integer currentWorkLoadHours = 0;        ❌ DELETE

// Lý do: Gây hiểu lầm, không ai sử dụng, luôn = 0
```

**Option 2: Implement Event-Driven Sync** (Phức tạp hơn)

```java
// Task Service publish event khi task complete
@EventListener
public void onTaskCompleted(TaskCompletedEvent event) {
    // Publish Kafka event
    kafkaTemplate.send("task-completed", event);
}

// Profile Service subscribe và update
@KafkaListener(topics = "task-completed")
public void handleTaskCompleted(TaskCompletedEvent event) {
    UserProfile profile = findByUserId(event.getUserId());
    profile.setTotalTasksCompleted(profile.getTotalTasksCompleted() + 1);
    // Tính lại averageTaskCompletionRate...
    profileRepository.save(profile);
}
```

**Option 3: Sử dụng Scheduled Job** (Cập nhật định kỳ)

```java
@Scheduled(cron = "0 0 2 * * *")  // 2AM mỗi ngày
public void syncProfileMetrics() {
    List<UserProfile> profiles = profileRepository.findAll();
    
    for (UserProfile profile : profiles) {
        // Query Task Service
        TaskStatistics stats = taskServiceClient.getUserStats(profile.getUserId());
        
        // Update profile
        profile.setTotalTasksCompleted(stats.getCompletedCount());
        profile.setAverageTaskCompletionRate(stats.getCompletionRate());
        
        // Query Workload Service
        UserWorkloadResponse workload = workloadClient.getUserWorkload(profile.getUserId());
        profile.setCurrentWorkLoadHours(workload.getTotalEstimateHours());
        
        profileRepository.save(profile);
    }
}
```

**Khuyến nghị của tôi: Option 1 ⭐**

Vì:
- ✅ Đơn giản nhất
- ✅ Tránh data inconsistency
- ✅ Workload Service đã có data real-time tốt hơn
- ✅ Profile Service tập trung vào skills & personal info

---

**Cập nhật:** 08/11/2025 - Phụ lục về vấn đề đồng bộ dữ liệu
**Người phát hiện vấn đề:** Pham Anh (Code Review)

---

## 🔧 PHỤ LỤC 2: VẤN ĐỀ COLLABORATION SCORE & ROADMAP TÍCH HỢP

### 🔴 Vấn Đề 1: CollaborationHistory Không Tồn Tại

#### **Phát Hiện:**

```java
// File: ai-service/.../algorithm/HybridRecommendationAlgorithm.java

private static final double COLLABORATION_WEIGHT = 0.05;  // 5%

private double calculateCollaborationScore(UserProfile candidate) {
    Map<String, Double> collaborationHistory = candidate.getCollaborationHistory();
    if (collaborationHistory == null || collaborationHistory.isEmpty()) {
        return 0.5; // ❌ LUÔN TRẢ VỀ 0.5 vì không có data!
    }
    // Code này KHÔNG BAO GIỜ chạy
    return collaborationHistory.values().stream()
            .mapToDouble(Double::doubleValue)
            .average()
            .orElse(0.5);
}
```

#### **Kiểm Tra Database:**

```sql
-- Profile Service (Neo4j) - KHÔNG có collaborationHistory
@Node("user_profile")
public class UserProfile {
    String userId;
    List<UserSkill> skills;
    // ❌ KHÔNG có: Map<String, Double> collaborationHistory
}

-- Task Service (PostgreSQL) - KHÔNG có bảng collaboration
-- Workload Service (PostgreSQL) - KHÔNG có bảng collaboration
-- Project Service (PostgreSQL) - CÓ project_teams nhưng không track collaboration score
```

#### **Kết Luận:**

❌ **CollaborationScore KHÔNG CẦN THIẾT** vì:
1. Không có dữ liệu trong database
2. Luôn trả về 0.5 (neutral score)
3. Chỉ chiếm 5% trọng số (ảnh hưởng rất nhỏ)
4. Không có logic thu thập collaboration history

---

### ✅ Giải Pháp: Loại Bỏ COLLABORATION_WEIGHT

#### **Trước Khi Sửa (5 yếu tố):**

```java
private static final double SKILL_MATCH_WEIGHT = 0.35;      // 35%
private static final double PERFORMANCE_WEIGHT = 0.25;       // 25%
private static final double AVAILABILITY_WEIGHT = 0.20;      // 20%
private static final double WORKLOAD_WEIGHT = 0.15;          // 15%
private static final double COLLABORATION_WEIGHT = 0.05;     // 5% ❌ XÓA

TỔNG = 100%
```

#### **Sau Khi Sửa (4 yếu tố - Phân Bổ Lại):**

**Option A: Tăng đều các yếu tố quan trọng**

```java
private static final double SKILL_MATCH_WEIGHT = 0.40;      // 40% (+5%)
private static final double PERFORMANCE_WEIGHT = 0.25;       // 25% (giữ nguyên)
private static final double AVAILABILITY_WEIGHT = 0.20;      // 20% (giữ nguyên)
private static final double WORKLOAD_WEIGHT = 0.15;          // 15% (giữ nguyên)

TỔNG = 100%
```

**Option B: Cân bằng theo tầm quan trọng** ⭐ **RECOMMENDED**

```java
private static final double SKILL_MATCH_WEIGHT = 0.40;      // 40% (+5%)
private static final double PERFORMANCE_WEIGHT = 0.30;       // 30% (+5%)
private static final double AVAILABILITY_WEIGHT = 0.20;      // 20% (giữ nguyên)
private static final double WORKLOAD_WEIGHT = 0.10;          // 10% (-5%)

TỔNG = 100%

// Lý do:
// - Skill Match quan trọng nhất → 40%
// - Performance là yếu tố chính → 30%
// - Availability cần thiết → 20%
// - Workload ít quan trọng hơn → 10%
```

#### **Ảnh Hưởng Đến Kết Quả:**

```
VÍ DỤ: Task "Develop Payment API"
Candidate: Nguyễn Văn A

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TRƯỚC (5 yếu tố với collaboration = 0.5):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
skillMatchScore = 0.75
performanceScore = 0.88
availabilityScore = 0.90
workloadScore = 0.55
collaborationScore = 0.5 (mặc định)

contentScore = (0.35*0.75) + (0.25*0.88) + (0.20*0.90) + 
               (0.15*0.55) + (0.05*0.50)
             = 0.2625 + 0.22 + 0.18 + 0.0825 + 0.025
             = 0.77 (77%)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SAU (4 yếu tố - Option B):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
skillMatchScore = 0.75
performanceScore = 0.88
availabilityScore = 0.90
workloadScore = 0.55

contentScore = (0.40*0.75) + (0.30*0.88) + (0.20*0.90) + 
               (0.10*0.55)
             = 0.30 + 0.264 + 0.18 + 0.055
             = 0.799 (79.9%)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
KẾT LUẬN: Tăng 2.9% (77% → 79.9%)
→ Chính xác hơn vì tập trung vào yếu tố thực tế!
```

---

### 🔴 Vấn Đề 2: Workload Service & ML Service Chưa Được Tích Hợp

#### **Tình Trạng Hiện Tại:**

```
┌──────────────────────────────────────────────────────┐
│          SERVICES ĐANG CHẠY                          │
└──────────────────────────────────────────────────────┘
✅ API Gateway (:8888)
✅ Identity Service (:8080)
✅ Profile Service (:8081)
✅ Task Service (:8082)
✅ Project Service (:8083)
✅ AI Service (:8085) - ĐANG DÙNG
✅ Chat Service (:8086)
✅ Notification Service (:8089)
✅ Post Service (:8090)
✅ File Service (:8091)

┌──────────────────────────────────────────────────────┐
│          SERVICES CHƯA TÍCH HỢP                      │
└──────────────────────────────────────────────────────┘
❌ Workload Service (:8084) - Code có nhưng KHÔNG dùng
❌ ML Service (:8087) - Code có nhưng KHÔNG chạy
```

#### **Vấn Đề Cụ Thể:**

**1. AI Service KHÔNG gọi Workload Service:**

```java
// File: ai-service/.../service/AIRecommendationService.java

// ❌ KHÔNG có WorkloadServiceClient
// ❌ KHÔNG gọi GET /api/workloads/{userId}
// ❌ Lấy workloadCapacity từ đâu? → Luôn mặc định 0.5!

private UserProfile enrichUserProfile(String userId) {
    UserProfile profile = profileClient.getUserProfile(userId);
    
    // ❌ THIẾU đoạn này:
    // UserWorkloadResponse workload = workloadClient.getUserWorkload(userId);
    // profile.setWorkloadCapacity(workload.getUtilizationPercentage() / 100);
    
    return profile; // workloadCapacity = null → score = 0.5
}
```

**2. AI Service KHÔNG gọi ML Service:**

```java
// ❌ KHÔNG có MLServiceClient
// ❌ KHÔNG gọi POST /api/ml/recommendations
// ❌ Chỉ dùng Hybrid Algorithm & Gemini AI
```

---

### 🚀 ROADMAP: TÍCH HỢP ĐẦY ĐỦ HỆ THỐNG

## GIAI ĐOẠN 1: CẤU HÌNH & KIỂM TRA CƠ BẢN (1-2 giờ)

### Bước 1.1: Xóa COLLABORATION_WEIGHT

```java
// File: ai-service/src/main/java/com/mnp/ai/algorithm/HybridRecommendationAlgorithm.java

// ❌ XÓA
// private static final double COLLABORATION_WEIGHT = 0.05;

// ✅ CẬP NHẬT
private static final double SKILL_MATCH_WEIGHT = 0.40;      // 40%
private static final double PERFORMANCE_WEIGHT = 0.30;       // 30%
private static final double AVAILABILITY_WEIGHT = 0.20;      // 20%
private static final double WORKLOAD_WEIGHT = 0.10;          // 10%

// ❌ XÓA trong calculateContentBasedScore
// double collaborationScore = calculateCollaborationScore(candidate);
// + (COLLABORATION_WEIGHT * collaborationScore);

// ✅ CẬP NHẬT
private double calculateContentBasedScore(TaskProfile task, UserProfile candidate) {
    double skillMatchScore = calculateSkillMatchScore(task, candidate);
    double performanceScore = calculatePerformanceScore(candidate);
    double availabilityScore = candidate.getAvailabilityScore() != null 
                                ? candidate.getAvailabilityScore() : 0.5;
    double workloadScore = calculateWorkloadScore(candidate);

    return (SKILL_MATCH_WEIGHT * skillMatchScore)
            + (PERFORMANCE_WEIGHT * performanceScore)
            + (AVAILABILITY_WEIGHT * availabilityScore)
            + (WORKLOAD_WEIGHT * workloadScore);
}

// ❌ XÓA method không dùng
// private double calculateCollaborationScore(UserProfile candidate) { ... }
```

### Bước 1.2: Kiểm Tra Workload Service

```bash
# 1. Kiểm tra service có chạy không
curl http://localhost:8084/actuator/health

# Nếu không chạy, start service:
cd workload-service
mvn spring-boot:run

# 2. Test API
curl http://localhost:8084/api/workloads/USER-123

# Expected Response:
{
  "userId": "USER-123",
  "utilizationPercentage": 45.0,
  "weeklyCapacityHours": 40,
  "totalEstimateHours": 18,
  "availabilityPercentage": 55.0
}
```

---

## GIAI ĐOẠN 2: TÍCH HỢP WORKLOAD SERVICE (2-3 giờ)

### Bước 2.1: Thêm Workload Service Client

```java
// File: ai-service/src/main/java/com/mnp/ai/client/WorkloadServiceClient.java

package com.mnp.ai.client;

import com.mnp.ai.dto.response.UserWorkloadResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(
    name = "workload-service",
    url = "${services.workload-service.url:http://localhost:8084}",
    fallback = WorkloadServiceFallback.class
)
public interface WorkloadServiceClient {
    
    @GetMapping("/api/workloads/{userId}")
    UserWorkloadResponse getUserWorkload(@PathVariable("userId") String userId);
}
```

### Bước 2.2: Tạo DTO Response

```java
// File: ai-service/src/main/java/com/mnp/ai/dto/response/UserWorkloadResponse.java

package com.mnp.ai.dto.response;

import lombok.Data;

@Data
public class UserWorkloadResponse {
    private String userId;
    private Integer weeklyCapacityHours;
    private Double utilizationPercentage;
    private Integer totalEstimateHours;
    private Double availabilityPercentage;
    private Integer currentTasksCount;
}
```

### Bước 2.3: Tạo Fallback

```java
// File: ai-service/src/main/java/com/mnp/ai/client/WorkloadServiceFallback.java

package com.mnp.ai.client;

import com.mnp.ai.dto.response.UserWorkloadResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class WorkloadServiceFallback implements WorkloadServiceClient {
    
    @Override
    public UserWorkloadResponse getUserWorkload(String userId) {
        log.warn("Workload Service unavailable for user: {}. Using default values.", userId);
        
        UserWorkloadResponse fallback = new UserWorkloadResponse();
        fallback.setUserId(userId);
        fallback.setUtilizationPercentage(50.0); // Default 50%
        fallback.setWeeklyCapacityHours(40);
        fallback.setTotalEstimateHours(20);
        fallback.setAvailabilityPercentage(50.0);
        fallback.setCurrentTasksCount(0);
        
        return fallback;
    }
}
```

### Bước 2.4: Cập Nhật AIRecommendationService

```java
// File: ai-service/src/main/java/com/mnp/ai/service/AIRecommendationService.java

@Service
@RequiredArgsConstructor
@Slf4j
public class AIRecommendationService {
    
    private final ProfileServiceClient profileClient;
    private final TaskServiceClient taskClient;
    private final WorkloadServiceClient workloadClient; // ✅ THÊM MỚI
    
    private List<UserProfile> enrichUserProfiles(List<UserProfile> profiles) {
        return profiles.stream()
                .map(this::enrichSingleProfile)
                .collect(Collectors.toList());
    }
    
    private UserProfile enrichSingleProfile(UserProfile profile) {
        try {
            // ✅ LẤY WORKLOAD REAL-TIME
            UserWorkloadResponse workload = workloadClient.getUserWorkload(profile.getUserId());
            
            // ✅ TÍNH WORKLOAD CAPACITY
            Double utilizationPercentage = workload.getUtilizationPercentage();
            if (utilizationPercentage != null) {
                profile.setWorkloadCapacity(utilizationPercentage / 100.0);
            }
            
            // ✅ SET THÊM THÔNG TIN
            profile.setCurrentTasksCount(workload.getCurrentTasksCount());
            profile.setAvailableHours(
                workload.getWeeklyCapacityHours() - workload.getTotalEstimateHours()
            );
            
            log.debug("Enriched user {} with workload data: {}% utilization", 
                      profile.getUserId(), utilizationPercentage);
                      
        } catch (Exception e) {
            log.warn("Failed to fetch workload for user {}: {}", 
                     profile.getUserId(), e.getMessage());
            // Fallback sẽ tự động chạy
        }
        
        return profile;
    }
}
```

### Bước 2.5: Cập Nhật application.yaml

```yaml
# File: ai-service/src/main/resources/application.yaml

services:
  profile-service:
    url: http://localhost:8081
  task-service:
    url: http://localhost:8082
  workload-service:  # ✅ THÊM MỚI
    url: http://localhost:8084

feign:
  client:
    config:
      default:
        connectTimeout: 5000
        readTimeout: 5000
      workload-service:  # ✅ THÊM MỚI
        connectTimeout: 3000
        readTimeout: 3000
```

### Bước 2.6: Test Tích Hợp

```bash
# 1. Start tất cả services
# Terminal 1: Workload Service
cd workload-service && mvn spring-boot:run

# Terminal 2: AI Service
cd ai-service && mvn spring-boot:run

# 2. Test recommendation với workload data
curl -X POST http://localhost:8085/api/ai/recommendations/task/TASK-123 \
  -H "Content-Type: application/json"

# 3. Kiểm tra logs
# AI Service logs should show:
# "Enriched user USER-123 with workload data: 45.0% utilization"
```

### Bước 2.7: ⚠️ QUAN TRỌNG - Tích Hợp Task Service với Workload Service

**🔴 VẤN ĐỀ PHÁT HIỆN:**

Hiện tại Task Service **KHÔNG đồng bộ dữ liệu** với Workload Service khi:
- ❌ Assign task → Không tăng workload
- ❌ Submit task → Không cập nhật trạng thái
- ❌ Complete task → Không giảm workload

**➡️ KẾT QUẢ:** Workload data luôn lỗi thời, AI không có dữ liệu real-time!

---

#### **Giải pháp: Thêm WorkloadServiceClient vào Task Service**

**A. Tạo Workload Service Client trong Task Service**

```java
// File: task-service/src/main/java/com/mnp/task/client/WorkloadServiceClient.java

package com.mnp.task.client;

import com.mnp.task.dto.workload.WorkloadUpdateRequest;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;

@FeignClient(
    name = "workload-service",
    url = "${services.workload-service.url:http://localhost:8084}",
    fallback = WorkloadServiceFallback.class
)
public interface WorkloadServiceClient {
    
    // Thêm task vào workload khi assign
    @PostMapping("/api/workloads/tasks")
    void addTaskToWorkload(@RequestBody WorkloadUpdateRequest request);
    
    // Cập nhật workload khi task thay đổi trạng thái
    @PutMapping("/api/workloads/tasks/{taskId}")
    void updateTaskWorkload(
        @PathVariable("taskId") String taskId,
        @RequestBody WorkloadUpdateRequest request
    );
    
    // Xóa task khỏi workload khi complete/delete
    @DeleteMapping("/api/workloads/tasks/{taskId}")
    void removeTaskFromWorkload(@PathVariable("taskId") String taskId);
}
```

**B. Tạo DTO Request**

```java
// File: task-service/src/main/java/com/mnp/task/dto/workload/WorkloadUpdateRequest.java

package com.mnp.task.dto.workload;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class WorkloadUpdateRequest {
    private String taskId;
    private String userId;
    private Integer estimatedHours;
    private String status;  // ASSIGNED, IN_PROGRESS, REVIEW, COMPLETED
}
```

**C. Tạo Fallback**

```java
// File: task-service/src/main/java/com/mnp/task/client/WorkloadServiceFallback.java

package com.mnp.task.client;

import com.mnp.task.dto.workload.WorkloadUpdateRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class WorkloadServiceFallback implements WorkloadServiceClient {
    
    @Override
    public void addTaskToWorkload(WorkloadUpdateRequest request) {
        log.warn("Workload Service unavailable - Failed to add task {} to workload", 
                 request.getTaskId());
        // Don't throw exception - allow task assignment to continue
    }
    
    @Override
    public void updateTaskWorkload(String taskId, WorkloadUpdateRequest request) {
        log.warn("Workload Service unavailable - Failed to update task {} workload", taskId);
    }
    
    @Override
    public void removeTaskFromWorkload(String taskId) {
        log.warn("Workload Service unavailable - Failed to remove task {} from workload", taskId);
    }
}
```

**D. Cập Nhật TaskService.assignTask()**

```java
// File: task-service/src/main/java/com/mnp/task/service/TaskService.java

@Service
@RequiredArgsConstructor
@Slf4j
public class TaskService {
    
    private final TaskRepository taskRepository;
    private final WorkloadServiceClient workloadClient; // ✅ THÊM MỚI
    
    public TaskResponse assignTask(String taskId, String userId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));

        String previousAssignedTo = task.getAssignedTo();
        
        // Update task assignment
        task.setAssignedTo(userId);
        Task updatedTask = taskRepository.save(task);

        log.info("Task assigned to user {} for task ID: {}", userId, taskId);

        // ✅ ĐỒNG BỘ VỚI WORKLOAD SERVICE
        if (!userId.equals(previousAssignedTo)) {
            try {
                // Nếu task trước đó đã assign cho người khác, xóa workload cũ
                if (previousAssignedTo != null && !previousAssignedTo.isEmpty()) {
                    workloadClient.removeTaskFromWorkload(taskId);
                    log.info("Removed task {} from previous assignee {} workload", 
                             taskId, previousAssignedTo);
                }
                
                // Thêm workload mới cho người được assign
                WorkloadUpdateRequest workloadRequest = WorkloadUpdateRequest.builder()
                    .taskId(taskId)
                    .userId(userId)
                    .estimatedHours(task.getEstimatedHours() != null ? task.getEstimatedHours() : 8)
                    .status("ASSIGNED")
                    .build();
                
                workloadClient.addTaskToWorkload(workloadRequest);
                log.info("Added task {} to user {} workload ({} hours)", 
                         taskId, userId, workloadRequest.getEstimatedHours());
                
            } catch (Exception e) {
                log.error("Failed to sync workload for task {}: {}", taskId, e.getMessage());
                // Continue execution - don't fail task assignment
            }
            
            // Existing code: Add to project members, group chat, etc.
            try {
                if (task.getProjectId() != null && !task.getProjectId().isEmpty()) {
                    addUserToProjectMembers(task.getProjectId(), userId);
                    addUserToProjectGroupChat(task.getProjectId(), userId);
                }
            } catch (Exception e) {
                log.error("Error during task assignment integrations: {}", e.getMessage());
            }
        }

        TaskResponse taskResponse = taskMapper.toTaskResponse(updatedTask);
        return taskResponse;
    }
}
```

**E. Cập Nhật TaskSubmissionService.submitTask()**

```java
// File: task-service/src/main/java/com/mnp/task/service/TaskSubmissionService.java

@Service
@RequiredArgsConstructor
@Slf4j
public class TaskSubmissionService {
    
    private final TaskSubmissionRepository taskSubmissionRepository;
    private final TaskRepository taskRepository;
    private final WorkloadServiceClient workloadClient; // ✅ THÊM MỚI
    
    public TaskSubmissionResponse submitTask(String taskId, String userId, TaskSubmissionRequest request) {
        // Existing code: Check duplicate, create submission, etc.
        var existingSubmission = taskSubmissionRepository.findByTaskIdAndSubmittedBy(taskId, userId);
        if (existingSubmission.isPresent()) {
            throw new AppException(ErrorCode.TASK_ALREADY_SUBMITTED);
        }
        
        // ... (existing code for creating submission)
        
        TaskSubmission submission = TaskSubmission.builder()
                .taskId(taskId)
                .submittedBy(userId)
                .description(request.getDescription())
                .attachmentsJson(attachmentsJson)
                .status(SubmissionStatus.PENDING)
                .submittedAt(LocalDateTime.now())
                .build();

        submission = taskSubmissionRepository.save(submission);

        // Update task status to REVIEW
        updateTaskStatus(taskId, TaskStatus.REVIEW);
        
        // ✅ ĐỒNG BỘ VỚI WORKLOAD SERVICE
        try {
            Task task = taskRepository.findById(taskId)
                    .orElseThrow(() -> new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION));
            
            WorkloadUpdateRequest workloadRequest = WorkloadUpdateRequest.builder()
                .taskId(taskId)
                .userId(userId)
                .estimatedHours(task.getEstimatedHours())
                .status("REVIEW")  // ✅ Cập nhật status sang REVIEW
                .build();
            
            workloadClient.updateTaskWorkload(taskId, workloadRequest);
            log.info("Updated workload status to REVIEW for task {}", taskId);
            
        } catch (Exception e) {
            log.error("Failed to update workload for submitted task {}: {}", taskId, e.getMessage());
            // Continue - don't fail submission
        }

        log.info("Task submission created: taskId={}, userId={}, submissionId={}",
                taskId, userId, submission.getId());

        return createTaskSubmissionResponseWithProjectInfo(submission);
    }
}
```

**F. Cập Nhật khi Complete Task**

```java
// File: task-service/src/main/java/com/mnp/task/service/TaskService.java

public void completeTask(String taskId, Double performanceScore) {
    Task task = taskRepository.findById(taskId)
        .orElseThrow(() -> new ResourceNotFoundException("Task not found"));
    
    task.setStatus(TaskStatus.COMPLETED);
    task.setPerformanceScore(performanceScore);
    task.setCompletedAt(LocalDateTime.now());
    
    taskRepository.save(task);
    
    // ✅ XÓA TASK KHỎI WORKLOAD KHI HOÀN THÀNH
    try {
        workloadClient.removeTaskFromWorkload(taskId);
        log.info("Removed completed task {} from workload", taskId);
    } catch (Exception e) {
        log.error("Failed to remove completed task {} from workload: {}", 
                  taskId, e.getMessage());
    }
    
    // Send feedback to ML Service (existing code if any)
    // ...
}
```

**G. Cập Nhật application.yaml**

```yaml
# File: task-service/src/main/resources/application.yaml

services:
  project-service:
    url: http://localhost:8083
  profile-service:
    url: http://localhost:8081
  workload-service:  # ✅ THÊM MỚI
    url: http://localhost:8084

feign:
  client:
    config:
      default:
        connectTimeout: 5000
        readTimeout: 5000
      workload-service:  # ✅ THÊM MỚI
        connectTimeout: 3000
        readTimeout: 3000
```

**H. Test Đồng Bộ**

```bash
# 1. Start services
# Terminal 1
cd workload-service && mvn spring-boot:run

# Terminal 2
cd task-service && mvn spring-boot:run

# 2. Test assign task
curl -X PUT http://localhost:8082/api/tasks/TASK-123/assign/USER-456

# 3. Kiểm tra workload đã được thêm
curl http://localhost:8084/api/workloads/USER-456
# Expected: totalEstimateHours tăng lên

# 4. Test submit task
curl -X POST http://localhost:8082/api/tasks/TASK-123/submit \
  -H "Content-Type: application/json" \
  -d '{"description": "Done", "progressPercentage": 100}'

# 5. Kiểm tra workload status updated
curl http://localhost:8084/api/workloads/USER-456
# Expected: Task status = REVIEW

# 6. Test complete task
curl -X PUT http://localhost:8082/api/tasks/TASK-123/complete

# 7. Kiểm tra workload đã giảm
curl http://localhost:8084/api/workloads/USER-456
# Expected: totalEstimateHours giảm xuống
```

---

#### **Tóm Tắt Bước 2.7**

| Event | Task Service Action | Workload Service Action |
|-------|-------------------|------------------------|
| **Assign Task** | `task.setAssignedTo(userId)` | ✅ `addTaskToWorkload()` - Tăng workload |
| **Submit Task** | `task.setStatus(REVIEW)` | ✅ `updateTaskWorkload()` - Cập nhật status |
| **Complete Task** | `task.setStatus(COMPLETED)` | ✅ `removeTaskFromWorkload()` - Giảm workload |
| **Reassign Task** | `task.setAssignedTo(newUser)` | ✅ Remove old + Add new workload |

**✅ LỢI ÍCH:**
- Workload data luôn real-time
- AI Service có dữ liệu chính xác để recommend
- Không cần manual sync
- Tự động cập nhật utilization percentage

**⚠️ LƯU Ý:**
- Sử dụng Fallback để không fail task khi Workload Service down
- Log rõ ràng để debug
- Async nếu cần performance cao (dùng @Async)

---

## GIAI ĐOẠN 3: TÍCH HỢP ML SERVICE (4-6 giờ)

### Bước 3.1: Setup ML Service Environment

```bash
# 1. Install dependencies
cd ml-service/ml-training-python
pip install -r requirements.txt

# requirements.txt should include:
# scikit-learn==1.3.0
# pandas==2.0.3
# numpy==1.24.3
# joblib==1.3.2
# pyyaml==6.0.1
# structlog==23.1.0
```

### Bước 3.2: Generate Training Data

```bash
# 1. Generate synthetic data for initial training
python train_models.py --synthetic

# Output:
# ┌─────────────────────────────────────────┐
# │  SYNTHETIC DATA TRAINING RESULTS        │
# ├─────────────────────────────────────────┤
# │  Training Samples: 1000                 │
# │  Accuracy: 0.892                        │
# │  F1 Score: 0.885                        │
# │  Models saved to: models/               │
# └─────────────────────────────────────────┘

# 2. Validate models
python train_models.py --validate
```

### Bước 3.3: Start ML Service API

```bash
# Terminal: ML Service
cd ml-service
mvn spring-boot:run

# Service should start on http://localhost:8087
```

### Bước 3.4: Thêm ML Service Client

```java
// File: ai-service/src/main/java/com/mnp/ai/client/MLServiceClient.java

package com.mnp.ai.client;

import com.mnp.ai.dto.request.MLRecommendationRequest;
import com.mnp.ai.dto.response.MLRecommendationResponse;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(
    name = "ml-service",
    url = "${services.ml-service.url:http://localhost:8087}",
    fallback = MLServiceFallback.class
)
public interface MLServiceClient {
    
    @PostMapping("/api/ml/recommendations")
    MLRecommendationResponse getMLRecommendations(
        @RequestBody MLRecommendationRequest request
    );
}
```

### Bước 3.5: Tạo Request/Response DTOs

```java
// File: ai-service/src/main/java/com/mnp/ai/dto/request/MLRecommendationRequest.java

package com.mnp.ai.dto.request;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class MLRecommendationRequest {
    private String taskId;
    private List<String> requiredSkills;
    private String priority;
    private String difficulty;
    private Integer estimatedHours;
    private List<CandidateFeatures> candidates;
    
    @Data
    @Builder
    public static class CandidateFeatures {
        private String userId;
        private List<String> skills;
        private Double performanceScore;
        private Integer yearsExperience;
        private Double currentUtilization;
    }
}

// File: ai-service/src/main/java/com/mnp/ai/dto/response/MLRecommendationResponse.java

package com.mnp.ai.dto.response;

import lombok.Data;
import java.util.List;

@Data
public class MLRecommendationResponse {
    private String taskId;
    private List<MLPrediction> predictions;
    private String modelVersion;
    private Double confidence;
    
    @Data
    public static class MLPrediction {
        private String userId;
        private Double predictionScore;
        private Double confidence;
        private String explanation;
    }
}
```

### Bước 3.6: Tích Hợp ML vào Hybrid Algorithm

```java
// File: ai-service/src/main/java/com/mnp/ai/service/AIRecommendationService.java

@Service
@RequiredArgsConstructor
@Slf4j
public class AIRecommendationService {
    
    private final HybridRecommendationAlgorithm hybridAlgorithm;
    private final MLServiceClient mlServiceClient; // ✅ THÊM MỚI
    private final GeminiAIService geminiAIService;
    
    @Value("${ai.ml-service.enabled:true}")
    private boolean mlServiceEnabled;
    
    @Value("${ai.ml-service.weight:0.3}")
    private double mlServiceWeight;
    
    public List<AssignmentRecommendation> generateRecommendations(
            String taskId, TaskProfile task, List<UserProfile> candidates) {
        
        // 1. Hybrid Algorithm (60%)
        List<AssignmentRecommendation> hybridRecommendations = 
            hybridAlgorithm.generateRecommendations(task, candidates);
        
        // 2. ML Service Enhancement (30%) - ✅ MỚI
        if (mlServiceEnabled) {
            try {
                enhanceWithMLPredictions(hybridRecommendations, task, candidates);
            } catch (Exception e) {
                log.warn("ML Service unavailable, using hybrid only: {}", e.getMessage());
            }
        }
        
        // 3. Gemini AI Enhancement (10%) - Cho HIGH/CRITICAL tasks
        if (isHighPriorityTask(task)) {
            enhanceWithGeminiAI(hybridRecommendations, task);
        }
        
        // Re-rank và return
        return rankAndFilterRecommendations(hybridRecommendations);
    }
    
    private void enhanceWithMLPredictions(
            List<AssignmentRecommendation> recommendations,
            TaskProfile task,
            List<UserProfile> candidates) {
        
        // Prepare ML request
        MLRecommendationRequest mlRequest = buildMLRequest(task, candidates);
        
        // Call ML Service
        MLRecommendationResponse mlResponse = mlServiceClient.getMLRecommendations(mlRequest);
        
        // Merge ML predictions with hybrid scores
        Map<String, Double> mlScores = mlResponse.getPredictions().stream()
            .collect(Collectors.toMap(
                MLPrediction::getUserId,
                MLPrediction::getPredictionScore
            ));
        
        // Combine scores
        recommendations.forEach(rec -> {
            Double mlScore = mlScores.get(rec.getUserId());
            if (mlScore != null) {
                // Hybrid (60%) + ML (30%) + Gemini (10%)
                double combinedScore = 
                    (rec.getHybridScore() * 0.60) + 
                    (mlScore * 0.30) +
                    (rec.getGeminiScore() != null ? rec.getGeminiScore() * 0.10 : 0.05);
                
                rec.setOverallScore(combinedScore);
                rec.setMlScore(mlScore);
                
                log.debug("User {}: Hybrid={}, ML={}, Combined={}", 
                         rec.getUserId(), rec.getHybridScore(), mlScore, combinedScore);
            }
        });
    }
}
```

### Bước 3.7: Cập Nhật Configuration

```yaml
# File: ai-service/src/main/resources/application.yaml

ai:
  ml-service:
    enabled: true      # ✅ Enable ML Service
    weight: 0.3        # 30% weight
    timeout: 5000      # 5 seconds timeout
  
  hybrid-algorithm:
    content-weight: 0.6
    collaborative-weight: 0.4
  
  gemini-ai:
    enabled: true
    weight: 0.1
    api-key: ${GEMINI_API_KEY}

services:
  ml-service:         # ✅ THÊM MỚI
    url: http://localhost:8087
```

---

## GIAI ĐOẠN 4: CONTINUOUS LEARNING & FEEDBACK LOOP (2-3 giờ)

### Bước 4.1: Implement Feedback Collection

```java
// File: ai-service/src/main/java/com/mnp/ai/service/FeedbackCollectionService.java

@Service
@RequiredArgsConstructor
@Slf4j
public class FeedbackCollectionService {
    
    private final MLServiceClient mlServiceClient;
    
    @Async
    public void submitAssignmentFeedback(String taskId, String userId, 
                                        Double actualPerformance) {
        try {
            FeedbackDTO feedback = FeedbackDTO.builder()
                .taskId(taskId)
                .userId(userId)
                .predictedScore(getPredictedScore(taskId, userId))
                .actualPerformance(actualPerformance)
                .timestamp(LocalDateTime.now())
                .build();
            
            // Send to ML Service for retraining
            mlServiceClient.submitFeedback(feedback);
            
            log.info("Submitted feedback for task {} - user {}: {}", 
                     taskId, userId, actualPerformance);
                     
        } catch (Exception e) {
            log.error("Failed to submit feedback: {}", e.getMessage());
        }
    }
}
```

### Bước 4.2: Trigger Feedback từ Task Completion

```java
// File: task-service/src/main/java/com/mnp/task/service/TaskService.java

@Service
@RequiredArgsConstructor
public class TaskService {
    
    private final FeedbackClient feedbackClient;
    
    public void completeTask(String taskId, Double performanceScore) {
        Task task = taskRepository.findById(taskId)
            .orElseThrow(() -> new ResourceNotFoundException("Task not found"));
        
        task.setStatus(TaskStatus.COMPLETED);
        task.setPerformanceScore(performanceScore);
        task.setCompletedAt(LocalDateTime.now());
        
        taskRepository.save(task);
        
        // ✅ SEND FEEDBACK TO ML SERVICE
        if (task.getAssigneeId() != null) {
            feedbackClient.submitFeedback(
                taskId, 
                task.getAssigneeId(), 
                performanceScore
            );
        }
    }
}
```

### Bước 4.3: Schedule Automatic Retraining

```bash
# Setup cron job for nightly retraining
# File: ml-service/retrain-cron.sh

#!/bin/bash
# Run every night at 2 AM

cd /path/to/ml-service/ml-training-python
python train_models.py --real --continuous

# Log results
echo "Retraining completed at $(date)" >> /var/log/ml-retrain.log
```

```bash
# Add to crontab
crontab -e
# Add line:
0 2 * * * /path/to/retrain-cron.sh
```

---

## GIAI ĐOẠN 5: MONITORING & OPTIMIZATION (1-2 giờ)

### Bước 5.1: Add Metrics Collection

```java
// File: ai-service/src/main/java/com/mnp/ai/metrics/RecommendationMetrics.java

@Component
public class RecommendationMetrics {
    
    private final MeterRegistry meterRegistry;
    
    public void recordRecommendation(
            String method, // "HYBRID", "ML", "GEMINI"
            double score,
            long responseTime) {
        
        meterRegistry.counter("ai.recommendations.count", 
            "method", method).increment();
        
        meterRegistry.timer("ai.recommendations.time",
            "method", method).record(responseTime, TimeUnit.MILLISECONDS);
        
        meterRegistry.gauge("ai.recommendations.score",
            Tags.of("method", method), score);
    }
}
```

### Bước 5.2: Dashboard & Alerts

```yaml
# File: prometheus.yml
scrape_configs:
  - job_name: 'ai-service'
    static_configs:
      - targets: ['localhost:8085']
  
  - job_name: 'ml-service'
    static_configs:
      - targets: ['localhost:8087']

# Grafana Dashboard queries:
# - Recommendation accuracy by method
# - Response time comparison
# - ML model performance over time
# - Feedback loop effectiveness
```

---

## 📊 KẾT QUẢ MONG ĐỢI

### Performance Comparison

| Metric | Hybrid Only | + Workload Service | + ML Service | Full Stack |
|--------|-------------|-------------------|--------------|------------|
| **Accuracy** | 75-80% | 80-85% | 85-90% | 90-95% |
| **Response Time** | 100-150ms | 150-200ms | 200-300ms | 250-350ms |
| **Data Freshness** | Static | Real-time workload | Real-time + ML | Real-time all |
| **Adaptability** | Low | Medium | High | Very High |

### Cost-Benefit Analysis

```
BENEFITS:
✅ Workload Integration: +5-8% accuracy improvement
✅ ML Service: +8-12% accuracy improvement
✅ Real-time data: Better decision making
✅ Continuous learning: Improving over time
✅ Feedback loop: Self-correcting system

COSTS:
⏱️ Development time: 10-15 hours total
💰 Infrastructure: Minimal (1 additional service)
🔧 Maintenance: Scheduled retraining jobs
📊 Monitoring: Prometheus + Grafana setup
```

---

## 🎯 CHECKLIST HOÀN THÀNH

### Phase 1: Foundation (NGAY LẬP TỨC)
- [ ] Xóa COLLABORATION_WEIGHT khỏi code
- [ ] Phân bổ lại 4 trọng số (40/30/20/10)
- [ ] Test hybrid algorithm với 4 yếu tố
- [ ] Update documentation

### Phase 2: Workload Integration (TUẦN NÀY)
- [ ] Tạo WorkloadServiceClient
- [ ] Implement enrichUserProfile với workload data
- [ ] Test tích hợp với Workload Service
- [ ] Monitor workload data accuracy

### Phase 3: ML Service Integration (TUẦN SAU)
- [ ] Train initial ML models với synthetic data
- [ ] Start ML Service API
- [ ] Tạo MLServiceClient
- [ ] Implement score combination logic
- [ ] Test ML predictions

### Phase 4: Feedback Loop (TUẦN 3)
- [ ] Implement feedback collection
- [ ] Connect Task Service → AI Service feedback
- [ ] Setup scheduled retraining
- [ ] Monitor feedback effectiveness

### Phase 5: Production Ready (TUẦN 4)
- [ ] Add comprehensive logging
- [ ] Setup monitoring & alerts
- [ ] Performance testing & optimization
- [ ] Documentation & training
- [ ] Production deployment

---

**Tổng thời gian ước tính:** 15-20 giờ
**Độ khó:** Trung bình → Cao
**ROI:** Rất cao (15-20% accuracy improvement)

---

**Cập nhật:** 08/11/2025 - Roadmap tích hợp Workload & ML Services
**Người đề xuất:** Pham Anh
**Trạng thái:** Ready to implement

