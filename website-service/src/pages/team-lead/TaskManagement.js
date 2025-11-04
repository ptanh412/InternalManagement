import React from 'react';
import TaskManagement from '../project-manager/TaskManagement';

// Team Lead version: filter tasks by team lead
const TeamLeadTaskManagement = () => {
  // You can add team-lead specific filtering logic here
  return <TaskManagement teamLeadMode={true} />;
};

export default TeamLeadTaskManagement;