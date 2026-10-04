import { useState, useEffect, useCallback } from 'react';
import { fetchHealthStatus } from '../services/api.js';

export const useHealthCheck = (autoCheckInterval = 30000) => {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);
  const [responseTimeMs, setResponseTimeMs] = useState(null);

  const checkHealth = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    const result = await fetchHealthStatus();
    
    setResponseTimeMs(result.responseTimeMs);
    setLastChecked(new Date());

    if (result.success) {
      setHealthData(result.data);
      setError(null);
    } else {
      setHealthData(null);
      setError(result.error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    checkHealth();

    if (autoCheckInterval > 0) {
      const intervalId = setInterval(checkHealth, autoCheckInterval);
      return () => clearInterval(intervalId);
    }
  }, [checkHealth, autoCheckInterval]);

  return {
    healthData,
    loading,
    error,
    lastChecked,
    responseTimeMs,
    refetch: checkHealth,
  };
};
