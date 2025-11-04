import React from 'react';
import RequirementsImport from '../project-manager/RequirementsImport';

// Team Lead version: filter requirements by team lead
const TeamLeadRequirementsImport = () => {
  // You can add team-lead specific filtering logic here
  return <RequirementsImport teamLeadMode={true} />;
};

export default TeamLeadRequirementsImport;