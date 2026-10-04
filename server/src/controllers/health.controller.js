import * as healthService from '../services/health.service.js';

export const checkHealth = async (req, res, next) => {
  try {
    const healthInfo = await healthService.getHealthStatus();
    return res.status(200).json(healthInfo);
  } catch (error) {
    next(error);
  }
};
