/**
 * Product Utility: Returns products directly without regex name filtering.
 * Test data is handled through the database workflow (is_active status).
 */
export const isLegitProduct = () => true;

export const filterLegitProducts = (products = []) => {
  return Array.isArray(products) ? products : [];
};
