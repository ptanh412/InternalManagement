import React, { useState } from 'react';
import { SparklesIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import TaskRecommendationsModal from '../components/TaskRecommendationsModal';

// Example of how to integrate AI recommendations into an existing task component
const TaskCard = ({ task, onTaskUpdate }) => {
  const [showAIModal, setShowAIModal] = useState(false);

  const handleAIAssignment = (userId, recommendationData) => {
    // Handle the assignment logic here
    console.log('Assigning task to:', userId, 'with recommendation:', recommendationData);
    
    // Example: Call your assignment API
    // await apiService.assignTask(task.id, userId);
    
    // Update the task in parent component
    if (onTaskUpdate) {
      onTaskUpdate({
        ...task,
        assignedTo: userId,
        status: 'IN_PROGRESS',
        aiRecommendationScore: Math.round(recommendationData.overallScore * 100)
      });
    }

    setShowAIModal(false);
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-md border p-4">
        <h3 className="font-semibold text-gray-900 mb-2">{task.title}</h3>
        <p className="text-sm text-gray-600 mb-4">{task.description}</p>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-500">
            {task.assignedTo ? `Assigned to: ${task.assignedTo}` : 'Unassigned'}
          </span>
          
          <div className="flex space-x-2">
            {!task.assignedTo ? (
              <button
                onClick={() => setShowAIModal(true)}
                className="btn-primary flex items-center space-x-2 text-sm"
              >
                <SparklesIcon className="h-4 w-4" />
                <span>AI Assign</span>
              </button>
            ) : (
              <button
                onClick={() => setShowAIModal(true)}
                className="btn-secondary flex items-center space-x-2 text-sm"
              >
                <UserPlusIcon className="h-4 w-4" />
                <span>Reassign</span>
              </button>
            )}
          </div>
        </div>

        {task.aiRecommendationScore && (
          <div className="mt-2 text-xs text-green-600">
            ✨ Assigned with {task.aiRecommendationScore}% AI confidence
          </div>
        )}
      </div>

      <TaskRecommendationsModal
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
        taskId={task.id}
        taskTitle={task.title}
        onSelectEmployee={handleAIAssignment}
      />
    </>
  );
};

export default TaskCard;