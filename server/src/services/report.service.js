import * as reportRepo from '../repositories/report.repository.js';
import * as inventoryRepo from '../repositories/inventory.repository.js';

/**
 * Service Layer for Operational Reports & Business Intelligence.
 */
export const getFullReportSummary = async () => {
  const [summary, salesByStatus, topProducts, lowStockItems, recentMovements] = await Promise.all([
    reportRepo.getDashboardSummary(),
    reportRepo.getSalesByStatus(),
    reportRepo.getTopSellingProducts(5),
    reportRepo.getLowStockAlerts(10),
    inventoryRepo.findMovementsAndCount({ page: 1, limit: 10 }),
  ]);

  return {
    summary,
    sales_by_status: salesByStatus,
    top_selling_products: topProducts,
    low_stock_items: lowStockItems,
    recent_movements: recentMovements.rows,
  };
};
