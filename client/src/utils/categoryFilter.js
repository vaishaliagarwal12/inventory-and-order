/**
 * Category Utility: Returns categories directly without regex name filtering.
 * Test data is handled through the database workflow.
 */
export const isLegitCategory = () => true;

export const filterLegitCategories = (categories = []) => {
  return Array.isArray(categories) ? categories : [];
};
