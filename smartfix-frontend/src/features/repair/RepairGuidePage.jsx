import React from 'react';
import { ModulePlaceholderPage } from '../../shared/components/Common/ModulePlaceholderPage';

export const RepairGuidePage = () => (
  <ModulePlaceholderPage
    title="Repair Guide Module"
    description="Technicians can view structured repair guidance after diagnosis."
    bullets={[
      'Fault diagnosis already pulls AI repair recommendations',
      'Required tools and parts are shown in diagnosis results',
      'Safety precautions and estimated repair cost/time are available'
    ]}
  />
);
