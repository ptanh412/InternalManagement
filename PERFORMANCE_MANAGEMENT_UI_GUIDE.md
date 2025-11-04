# Performance Management UI - User Guide

## Overview

The Performance Management system allows team leads and project managers to view detailed performance metrics for team members and recalculate performance scores when needed.

## Accessing Performance Management

### For Team Leads and Project Managers:
1. Navigate to the sidebar menu
2. Click on "Performance Management" 
3. The system will load the performance management interface

### Permissions:
- **Team Leads**: Can view and manage performance for their team members
- **Project Managers**: Can view and manage performance for all team members
- **Admins**: Full access to all performance data

## Features

### 1. Team Member Selection
- **Search Functionality**: Use the search bar to quickly find team members by name or email
- **Filter by Role**: The system shows employees, developers, and designers
- **User Information**: Each team member card shows their name, email, and role

### 2. Performance Overview
- **Overall Performance Score**: Weighted average score (0-100)
- **Performance Category**: Classification (Exceptional, High, Good, Average, Below Average, Poor)
- **Component Scores**: Individual metrics breakdown:
  - Quality Score (35% weight) - out of 5.0
  - Timeliness Score (25% weight) - percentage of on-time completions
  - Completion Rate (20% weight) - percentage of tasks completed
  - Efficiency Score (20% weight) - time efficiency ratio

### 3. Detailed Metrics
- **Task Statistics**:
  - Total tasks assigned
  - Total tasks completed
  - On-time completions
  - Total hours worked
  
- **Performance Insights**:
  - **Strength Areas**: Automatically identified strong performance areas
  - **Improvement Areas**: Areas where the employee could improve

### 4. Performance Score Management
- **View Current Score**: See the latest calculated performance score
- **Recalculate Score**: Manually trigger a recalculation of the performance score
- **Real-time Updates**: Scores update automatically after task reviews with quality ratings

## API Integration

### Backend Endpoints Used:
- `GET /identity/performance/details/{userId}` - Fetch detailed performance metrics
- `POST /identity/performance/recalculate/{userId}` - Recalculate performance score
- `GET /identity/users` - Get list of team members

### Performance Calculation Logic:
```
Performance Score = (Quality Score × 0.35) + 
                   (Timeliness Score × 0.25) + 
                   (Completion Rate × 0.20) + 
                   (Efficiency Score × 0.20)
```

## How to Use

### Step 1: Select a Team Member
1. Use the search bar to find a specific team member
2. Click on the team member's card from the list
3. The system will load their performance details

### Step 2: Review Performance Data
1. **Overall Score**: Check the main performance score and category
2. **Component Analysis**: Review individual metric scores:
   - Quality ratings from task reviews
   - On-time completion percentage
   - Task completion rate
   - Time efficiency ratio
3. **Task Statistics**: Understand workload and completion patterns
4. **Insights**: Review identified strengths and improvement areas

### Step 3: Recalculate if Needed
1. Click the "Recalculate" button if you want to refresh the score
2. The system will:
   - Fetch latest task data from the task service
   - Recalculate all component scores
   - Update the overall performance score
   - Refresh the display with new data

## Performance Categories

| Score Range | Category | Color |
|------------|----------|-------|
| 90-100 | Exceptional | Green |
| 80-89 | High | Blue |
| 70-79 | Good | Indigo |
| 60-69 | Average | Yellow |
| 50-59 | Below Average | Orange |
| Below 50 | Poor | Red |

## Strength and Improvement Areas

### Automatically Identified Strengths:
- **High Quality Work**: Average quality rating ≥ 4.0/5.0
- **Meeting Deadlines**: Timeliness score ≥ 85%
- **Task Completion**: Completion rate ≥ 90%
- **Time Management**: Efficiency score ≥ 100%

### Automatically Identified Improvement Areas:
- **Work Quality**: Average quality rating < 3.5/5.0
- **Deadline Management**: Timeliness score < 70%
- **Task Follow-through**: Completion rate < 80%
- **Time Efficiency**: Efficiency score < 80%

## Best Practices

### For Team Leads:
1. **Regular Reviews**: Check performance data weekly to identify trends
2. **Proactive Coaching**: Address improvement areas early
3. **Recognition**: Acknowledge strength areas and exceptional performance
4. **Data-Driven Decisions**: Use metrics for task assignment and team planning

### For Performance Management:
1. **Quality Ratings**: Ensure all task reviews include quality ratings (1-5)
2. **Realistic Estimates**: Provide accurate time estimates for fair efficiency calculations
3. **Consistent Reviews**: Conduct timely task reviews to keep scores current
4. **Regular Updates**: Use the recalculate function when significant changes occur

## Troubleshooting

### Common Issues:

#### Performance Data Not Loading
- **Cause**: User might not have completed any tasks yet
- **Solution**: Ensure the employee has been assigned and completed tasks with reviews

#### Score Seems Outdated
- **Cause**: Performance score hasn't been updated after recent task completions
- **Solution**: Click the "Recalculate" button to refresh the score

#### Missing Team Members
- **Cause**: Only employees, developers, and designers are shown by default
- **Solution**: Check that the user has the correct role assigned

#### API Errors
- **Cause**: Backend service connectivity issues
- **Solution**: Check that the identity-service and task-service are running

## Technical Notes

### Data Flow:
1. Frontend requests performance details from identity-service
2. Identity-service fetches task metrics from task-service via Feign client
3. Performance calculation service computes all scores and insights
4. Detailed response is returned to the frontend for display

### Performance Updates:
- Scores are automatically updated when tasks are reviewed with quality ratings
- Manual recalculation fetches fresh data from the task service
- All calculations follow the documented weighted formula

### Security:
- Role-based access control ensures only authorized users can view performance data
- Team leads can only see performance data (current implementation shows all team members)
- All API calls are authenticated and authorized

## Future Enhancements

### Planned Features:
- **Historical Trends**: View performance changes over time
- **Team Comparisons**: Compare performance across team members
- **Goal Setting**: Set and track performance improvement goals
- **Automated Alerts**: Notifications for significant performance changes
- **Export Reports**: Generate PDF/Excel reports of performance data

This performance management system provides comprehensive insights to help team leads make data-driven decisions about task assignment, team development, and performance coaching.