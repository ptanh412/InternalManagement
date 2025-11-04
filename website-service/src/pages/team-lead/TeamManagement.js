import React from 'react';
import TeamManagement from '../project-manager/TeamManagement';

// Team Lead version: filter team members by team lead
const TeamLeadTeamManagement = () => {
  // You can add team-lead specific filtering logic here
  return <TeamManagement teamLeadMode={true} />;
};

export default TeamLeadTeamManagement;