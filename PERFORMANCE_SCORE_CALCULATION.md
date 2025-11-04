# Performance Score Calculation System

## Overview

The Performance Score Calculation System is a comprehensive evaluation mechanism designed to assess user performance across multiple dimensions. This system generates quantitative performance data that serves as training input for machine learning models used in task assignment and workload optimization.

## Performance Score Components

The performance score is calculated using a weighted average of four key metrics:

### 1. Quality Score (Weight: 35%)
- **Definition**: Average quality rating of completed tasks
- **Scale**: 1-5 (where 5 is excellent, 1 is poor)
- **Calculation**: Sum of all quality ratings ÷ Number of rated tasks
- **Purpose**: Measures the standard of work output

### 2. Timeliness Score (Weight: 25%)
- **Definition**: Percentage of tasks completed on or before deadline
- **Scale**: 0-100%
- **Calculation**: (Tasks completed on time ÷ Total completed tasks) × 100
- **Purpose**: Evaluates deadline adherence and time management

### 3. Completion Rate (Weight: 20%)
- **Definition**: Percentage of assigned tasks that are completed
- **Scale**: 0-100%
- **Calculation**: (Completed tasks ÷ Total assigned tasks) × 100
- **Purpose**: Measures reliability and task follow-through

### 4. Efficiency Score (Weight: 20%)
- **Definition**: Ratio of expected time to actual time spent on tasks
- **Scale**: 0-200% (capped at 200% for exceptional efficiency)
- **Calculation**: (Total estimated hours ÷ Total actual hours) × 100
- **Purpose**: Evaluates work speed and resource utilization

## Performance Score Formula

```
Performance Score = (Quality Score × 0.35) + 
                   (Timeliness Score × 0.25) + 
                   (Completion Rate × 0.20) + 
                   (Efficiency Score × 0.20)
```

### Final Score Scale
- **Range**: 0-100
- **Interpretation**:
  - 90-100: Exceptional performance
  - 80-89: High performance
  - 70-79: Good performance
  - 60-69: Average performance
  - 50-59: Below average performance
  - Below 50: Poor performance requiring improvement

## Calculation Workflow

### 1. Data Collection
The system collects the following data points:
- Task assignments and completions
- Quality ratings from task reviews
- Estimated vs. actual time spent
- Deadline adherence records

### 2. Automatic Updates
Performance scores are automatically recalculated when:
- A task is marked as completed
- A task review is submitted with quality ratings
- Time tracking data is updated
- Task deadlines are modified

### 3. Real-time Integration
The performance calculation integrates with:
- **Task Service**: Retrieves task completion and timing data
- **Identity Service**: Stores and manages user performance scores
- **ML Service**: Consumes performance data for model training

## API Endpoints

### Get User Performance Metrics
```http
GET /api/performance/user/{userId}/metrics
```

**Response Structure:**
```json
{
  "userId": "string",
  "performanceScore": 85.7,
  "qualityScore": 4.2,
  "timelinessScore": 88.5,
  "completionRate": 92.3,
  "efficiencyScore": 76.8,
  "totalTasksAssigned": 150,
  "totalTasksCompleted": 138,
  "averageTaskRating": 4.2,
  "onTimeCompletions": 122,
  "lastUpdated": "2024-11-04T10:30:00Z"
}
```

### Update Performance Score
```http
POST /api/performance/user/{userId}/recalculate
```

## Machine Learning Integration

### Training Data Generation
The performance scores serve as feature inputs for ML models:

1. **Task Assignment Models**: Use performance scores to predict optimal task assignments
2. **Workload Optimization**: Balance team workloads based on performance capabilities
3. **Skill Assessment**: Identify areas for training and development
4. **Resource Planning**: Predict project timelines based on team performance

### Data Export Format
```json
{
  "userId": "user123",
  "performanceScore": 85.7,
  "skills": ["Java", "React", "MongoDB"],
  "taskHistory": [
    {
      "taskId": "task456",
      "complexity": "high",
      "timeToComplete": 8.5,
      "qualityRating": 4.5,
      "onTime": true
    }
  ],
  "teamCollaboration": 4.1,
  "learningVelocity": 3.8
}
```

## Implementation Details

### Service Architecture
- **PerformanceCalculationService**: Core calculation logic in identity-service
- **TaskMetricsService**: Data aggregation from task-service
- **Feign Client Integration**: Cross-service communication for data collection

### Database Schema
```sql
-- User Performance Table
users (
  id VARCHAR PRIMARY KEY,
  performance_score DECIMAL(5,2),
  quality_score DECIMAL(3,2),
  timeliness_score DECIMAL(5,2),
  completion_rate DECIMAL(5,2),
  efficiency_score DECIMAL(5,2),
  last_performance_update TIMESTAMP
);

-- Task Performance Tracking
task_submissions (
  id VARCHAR PRIMARY KEY,
  assignee_id VARCHAR,
  quality_rating INTEGER,
  submitted_at TIMESTAMP,
  deadline TIMESTAMP,
  estimated_hours DECIMAL(4,1),
  actual_hours DECIMAL(4,1)
);
```

## Configuration Parameters

### Adjustable Weights
The performance calculation weights can be configured via application properties:

```yaml
performance:
  calculation:
    weights:
      quality: 0.35
      timeliness: 0.25
      completion: 0.20
      efficiency: 0.20
    thresholds:
      minimum-tasks-for-calculation: 5
      max-efficiency-score: 200
      quality-scale-max: 5
```

### Calculation Triggers
- **Immediate**: After task review submission
- **Batch**: Daily recalculation for all users
- **On-demand**: Manual recalculation via API

## Best Practices

### For Managers
1. **Consistent Rating**: Use standardized criteria for quality ratings
2. **Realistic Estimates**: Provide accurate time estimates for fair efficiency scoring
3. **Regular Reviews**: Conduct timely task reviews to keep scores current

### For Development Team
1. **Data Validation**: Ensure all input data is validated before calculation
2. **Error Handling**: Implement fallback calculations for incomplete data
3. **Performance Monitoring**: Track calculation performance and optimize queries

### For ML Training
1. **Data Freshness**: Use recent performance data for model training
2. **Feature Scaling**: Normalize performance scores when combining with other features
3. **Bias Detection**: Monitor for potential biases in performance scoring

## Troubleshooting

### Common Issues

#### Low Performance Scores
- **Cause**: Incomplete task data or missing quality ratings
- **Solution**: Ensure all task reviews include quality ratings

#### Calculation Errors
- **Cause**: Division by zero when user has no completed tasks
- **Solution**: Implement minimum task threshold (default: 5 tasks)

#### Outdated Scores
- **Cause**: Performance scores not updating after task completion
- **Solution**: Verify Feign client connectivity between services

## Future Enhancements

### Planned Features
1. **Skill-specific Performance**: Track performance by skill category
2. **Team Performance Metrics**: Calculate team-level performance indicators
3. **Trend Analysis**: Historical performance tracking and prediction
4. **Peer Evaluation**: Incorporate peer review scores into calculations

### ML Model Improvements
1. **Contextual Scoring**: Adjust scores based on task complexity and project context
2. **Seasonal Adjustments**: Account for project cycles and deadlines
3. **Cross-functional Analysis**: Compare performance across different roles and departments

## Conclusion

The Performance Score Calculation System provides a robust foundation for evaluating user performance and generating high-quality training data for machine learning models. By combining multiple performance dimensions with configurable weights, the system delivers comprehensive insights that drive intelligent task assignment and workload optimization decisions.

For questions or support regarding the performance calculation system, contact the development team or refer to the API documentation in the respective service repositories.