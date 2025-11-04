# Progress Tracking Design Decision

## Overview

This document explains the design philosophy behind task progress tracking in our system, specifically regarding the `progressPercentage` property in the Task entity.

## Design Decision: Employee Self-Evaluation Approach

### Philosophy
The `progressPercentage` field is designed to capture **employee self-evaluation** rather than system-calculated completion status. This approach provides several advantages for both user experience and machine learning training data quality.

### Implementation Details

#### Employee Control
- Employees update their progress percentage through the `updateTaskProgress` endpoint
- Progress reflects the employee's honest assessment of work completed vs. work required
- System does **NOT** automatically override progress percentage when task status changes

#### Status vs Progress Separation
- **Task Status**: Workflow state managed by team leads (TODO, IN_PROGRESS, DONE, etc.)
- **Progress Percentage**: Employee's self-assessment of completion (0-100%)
- These two properties serve different purposes and can have different values

#### Example Scenarios
1. **Task marked DONE with 85% progress**: Employee completed the minimum requirements but acknowledges more could be done
2. **Task at 100% but status IN_PROGRESS**: Employee finished their work but waiting for review
3. **Task DONE with 110% progress**: Employee went above and beyond (system caps at 100% in UI)

## Benefits for Machine Learning

### Training Data Quality
- **Honest Self-Assessment**: Provides genuine effort and completion perception data
- **Individual Variation**: Captures different working styles and self-evaluation patterns
- **Accuracy Indicators**: Helps ML models understand employee reliability and self-awareness

### Performance Prediction
- **Effort Estimation**: ML models can learn individual effort patterns
- **Quality Correlation**: Compare self-assessed progress with actual quality ratings
- **Time Management**: Analyze relationship between progress reports and actual completion times

### Implementation Code Changes

### Removed Automatic 100% Assignment
Previously, the system automatically set `progressPercentage = 100%` when:
- Task status changed to DONE
- Task was approved through review process

### Current Behavior
- Progress percentage is **only** updated when employee explicitly changes it
- Task status changes preserve the existing progress percentage
- **NEW**: Employee can include final progress assessment during task submission
- Comments added to code explain the design decision

### Code Locations
```java
// TaskSubmissionService.java - Line ~617
// Removed: task.setProgressPercentage(100.0);
// Added comment explaining design decision
// Added: Progress saving during task submission

// TaskService.java - Line ~598  
// Removed: task.setProgressPercentage(100.0);
// Added comment explaining employee self-evaluation approach

// TaskSubmissionRequest.java
// Added: progressPercentage field for submission-time progress capture
```

## API Behavior

### Employee Progress Update
```http
POST /api/tasks/{taskId}/progress
{
  "progressPercentage": 85,
  "actualHoursSpent": 6.5,
  "comments": "Core functionality complete, testing remaining"
}
```

### Task Submission with Progress
```http
POST /api/tasks/{taskId}/submissions
{
  "description": "Task completed with full functionality and testing",
  "progressPercentage": 100,
  "attachments": [...]
}
```
- Employee can include their final progress assessment when submitting
- This captures their completion perception at submission time

### Team Lead Status Update
```http
PUT /api/tasks/{taskId}/status
{
  "status": "DONE",
  "comments": "Approved after review"
}
```
- This will **NOT** change the employee's progress percentage
- Preserves the employee's self-assessment for ML training

## Business Value

### For Employees
- **Ownership**: Maintains control over their work assessment
- **Accuracy**: Reflects actual effort and completion perception
- **Learning**: Encourages honest self-evaluation and reflection

### For Team Leads
- **Insights**: Understand employee self-assessment vs. actual deliverables
- **Coaching**: Identify gaps between self-perception and quality standards
- **Trust Building**: Respects employee autonomy in work assessment

### For ML Models
- **Rich Data**: Captures subjective completion assessment alongside objective metrics
- **Pattern Recognition**: Learn individual and team self-evaluation patterns
- **Prediction Accuracy**: Improve task estimation and assignment algorithms

## Edge Cases and Considerations

### Progress > 100%
- Allow employees to report > 100% if they went above expectations
- UI can cap display at 100% while preserving actual values for ML training

### Progress vs Quality Mismatch
- Employee reports 100% progress but receives low quality rating
- This data is valuable for ML models to learn self-assessment accuracy patterns
- Helps identify employees who may need coaching on self-evaluation

### Missing Progress Updates
- Some employees may forget to update progress
- ML models can learn to handle sparse progress data
- System can send gentle reminders based on task age and status

## Future Enhancements

### Smart Suggestions
- ML model suggests progress percentage based on:
  - Time spent vs. estimated time
  - Similar task completion patterns
  - Individual historical accuracy

### Progress Accuracy Scoring
- Compare employee progress reports with final quality ratings
- Generate "self-assessment accuracy" metric for performance reviews
- Help employees improve their self-evaluation skills over time

## Conclusion

By preserving employee autonomy in progress reporting, we maintain data integrity for machine learning while respecting individual work assessment patterns. This approach provides richer training data and better insights into employee behavior and performance patterns.

The system now clearly separates objective task status (managed by team leads) from subjective progress assessment (managed by employees), creating a more nuanced and accurate data model for both human management and machine learning applications.