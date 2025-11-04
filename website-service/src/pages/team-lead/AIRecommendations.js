import React from 'react';
import AIRecommendations from '../project-manager/AIRecommendations';

// Team Lead version: filter recommendations by team lead
const TeamLeadAIRecommendations = () => {
  // You can add team-lead specific filtering logic here
  return <AIRecommendations teamLeadMode={true} />;
};

export default TeamLeadAIRecommendations;