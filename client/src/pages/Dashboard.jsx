import React from 'react';
import { DashboardPlaceholder } from '../components/DashboardPlaceholder';

export const Dashboard = ({ healthData, loading, error }) => {
  return <DashboardPlaceholder healthData={healthData} loading={loading} error={error} />;
};
