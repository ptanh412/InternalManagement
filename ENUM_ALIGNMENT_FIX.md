# Enum Alignment Fix - AI Service & Task Service

## Problem
The AI service was generating tasks with enum values that didn't match the task-service, causing JSON deserialization errors when creating tasks:
- **Error**: `Cannot deserialize value of type 'com.mnp.task.enums.TaskPriority' from String "CRITICAL": not one of the values accepted for Enum class: [URGENT, HIGH, LOW, MEDIUM]`

## Root Cause
The enums in `ai-service` and `task-service` were not aligned:

### Before Fix:

**AI Service (ai-service):**
- TaskPriority: `HIGH, MEDIUM, LOW, CRITICAL`
- TaskType: `FEATURE, BUG, TASK, EPIC, STORY, SUBTASK, RESEARCH, DOCUMENTATION, TESTING, DEPLOYMENT, DEVELOPMENT, DESIGN`

**Task Service (task-service):**
- TaskPriority: `LOW, MEDIUM, HIGH, URGENT`
- TaskType: `DEVELOPMENT, FRONTEND_DEVELOPMENT, BACKEND_DEVELOPMENT, DATABASE_DEVELOPMENT, MOBILE_DEVELOPMENT, TESTING, UNIT_TESTING, INTEGRATION_TESTING, RESEARCH, DOCUMENTATION, DESIGN, CODE_REVIEW, BUG_FIX, DEPLOYMENT, MAINTENANCE, PLANNING, ARCHITECTURE, SECURITY`

## Solution

### 1. Updated AI Service Enums to Match Task Service

**File: `/ai-service/src/main/java/com/mnp/ai/enums/TaskPriority.java`**
```java
public enum TaskPriority {
    LOW,
    MEDIUM,
    HIGH,
    URGENT  // Changed from CRITICAL
}
```

**File: `/ai-service/src/main/java/com/mnp/ai/enums/TaskType.java`**
```java
public enum TaskType {
    DEVELOPMENT,
    FRONTEND_DEVELOPMENT,
    BACKEND_DEVELOPMENT,
    DATABASE_DEVELOPMENT,
    MOBILE_DEVELOPMENT,
    TESTING,
    UNIT_TESTING,
    INTEGRATION_TESTING,
    RESEARCH,
    DOCUMENTATION,
    DESIGN,
    CODE_REVIEW,
    BUG_FIX,
    DEPLOYMENT,
    MAINTENANCE,
    PLANNING,
    ARCHITECTURE,
    SECURITY
}
```

### 2. Updated Enum Mapping in RequirementsAnalysisEngine

**File: `/ai-service/src/main/java/com/mnp/ai/service/RequirementsAnalysisEngine.java`**

Changed priority mapping:
```java
private TaskPriority mapPriority(RequirementPriority reqPriority) {
    if (reqPriority == null) return TaskPriority.MEDIUM;
    
    return switch (reqPriority) {
        case CRITICAL -> TaskPriority.URGENT;  // Map CRITICAL to URGENT
        case HIGH -> TaskPriority.HIGH;
        case MEDIUM -> TaskPriority.MEDIUM;
        case LOW -> TaskPriority.LOW;
        case OPTIONAL -> TaskPriority.LOW;  // Map OPTIONAL to LOW
    };
}
```

Updated priority comparison:
```java
private int comparePriority(TaskPriority p1, TaskPriority p2) {
    Map<TaskPriority, Integer> priorityOrder = Map.of(
            TaskPriority.URGENT, 1,  // Changed from CRITICAL
            TaskPriority.HIGH, 2,
            TaskPriority.MEDIUM, 3,
            TaskPriority.LOW, 4);
    
    return Integer.compare(priorityOrder.getOrDefault(p1, 3), priorityOrder.getOrDefault(p2, 3));
}
```

### 3. Updated GeminiTaskAnalysisService

**File: `/ai-service/src/main/java/com/mnp/ai/service/GeminiTaskAnalysisService.java`**

Added safe enum parsing methods:
```java
private TaskPriority parseTaskPriority(String priorityStr) {
    if (priorityStr == null || priorityStr.isEmpty()) {
        return TaskPriority.MEDIUM;
    }
    
    // Handle old CRITICAL value by mapping to URGENT
    if ("CRITICAL".equalsIgnoreCase(priorityStr)) {
        log.debug("Mapping deprecated CRITICAL priority to URGENT");
        return TaskPriority.URGENT;
    }
    
    try {
        return TaskPriority.valueOf(priorityStr.toUpperCase());
    } catch (IllegalArgumentException e) {
        log.warn("Invalid task priority '{}', defaulting to MEDIUM", priorityStr);
        return TaskPriority.MEDIUM;
    }
}

private TaskType parseTaskType(String typeStr) {
    if (typeStr == null || typeStr.isEmpty()) {
        return TaskType.DEVELOPMENT;
    }
    
    // Map old task type values to new ones
    String mappedType = switch (typeStr.toUpperCase()) {
        case "TASK", "FEATURE", "STORY", "EPIC" -> "DEVELOPMENT";
        case "BUG" -> "BUG_FIX";
        default -> typeStr.toUpperCase();
    };
    
    try {
        return TaskType.valueOf(mappedType);
    } catch (IllegalArgumentException e) {
        log.warn("Invalid task type '{}', defaulting to DEVELOPMENT", typeStr);
        return TaskType.DEVELOPMENT;
    }
}
```

Updated AI prompt to use correct enum values:
```java
- Use only these priorities: LOW, MEDIUM, HIGH, URGENT (NOT CRITICAL)
- Use specific task types like FRONTEND_DEVELOPMENT, BACKEND_DEVELOPMENT, DATABASE_DEVELOPMENT, TESTING, etc.
```

Updated fallback tasks:
- `TaskType.TASK` → `TaskType.DEVELOPMENT`
- `TaskType.FEATURE` → `TaskType.DATABASE_DEVELOPMENT`

### 4. Fixed Autowiring Issue in RequirementImportController

**File: `/ai-service/src/main/java/com/mnp/ai/controller/RequirementImportController.java`**

Changed from `@RequiredArgsConstructor` to explicit constructor with `@Autowired`:
```java
@Autowired
public RequirementImportController(
        FileProcessingService fileProcessingService,
        RequirementsAnalysisEngine requirementsAnalysisEngine,
        GeminiTaskAnalysisService geminiTaskAnalysisService) {
    this.fileProcessingService = fileProcessingService;
    this.requirementsAnalysisEngine = requirementsAnalysisEngine;
    this.geminiTaskAnalysisService = geminiTaskAnalysisService;
}
```

Added bean name to RequirementsAnalysisEngine:
```java
@Service("requirementsAnalysisEngine")
```

## Benefits

1. **Eliminates JSON Deserialization Errors**: Tasks generated by AI can now be successfully created in task-service
2. **Backward Compatibility**: Old enum values (CRITICAL, FEATURE, TASK, etc.) are automatically mapped to new values
3. **Graceful Degradation**: Invalid enum values default to safe fallback values instead of throwing exceptions
4. **Better Error Handling**: Logs warnings when invalid enum values are encountered
5. **Consistent Data Model**: Both services now use the same enum values

## Testing

After this fix, you should be able to:
1. Generate tasks using AI text analysis
2. Generate tasks using AI file analysis
3. Create tasks from AI recommendations without enum mismatch errors
4. See appropriate task types and priorities in the task management system

## Migration Notes

- Old CRITICAL priority is automatically mapped to URGENT
- Old task types (FEATURE, TASK, BUG, STORY, EPIC) are mapped to appropriate new types
- No database migration needed as this is a code-level fix

