import * as reportService from '../services/report.service.js';

/**
 * Controller for Operational Reports API.
 */
export const getReportSummary = async (req, res, next) => {
  try {
    const data = await reportService.getFullReportSummary();
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};
