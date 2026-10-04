import * as inventoryRepo from '../repositories/inventory.repository.js';
import * as productRepo from '../repositories/product.repository.js';
import { AppError } from '../utils/errors.js';

const LOW_STOCK_THRESHOLD = parseInt(process.env.LOW_STOCK_THRESHOLD || '10', 10);

/**
 * Determines stock status category based on current quantity and threshold.
 */
export const calculateStockStatus = (quantity, threshold = LOW_STOCK_THRESHOLD) => {
  if (quantity === 0) return 'out_of_stock';
  if (quantity <= threshold) return 'low_stock';
  return 'in_stock';
};

/**
 * Service Layer for Inventory operations.
 * Handles validation, business logic, low-stock classification, and atomic adjustment coordination.
 */
export const getInventoryList = async (queryParams = {}) => {
  let page = parseInt(queryParams.page || '1', 10);
  let limit = parseInt(queryParams.limit || '10', 10);

  if (isNaN(page) || page < 1) {
    throw new AppError('Page number must be an integer greater than or equal to 1', 400);
  }

  if (isNaN(limit) || limit < 1) {
    throw new AppError('Limit must be an integer greater than or equal to 1', 400);
  }

  if (limit > 100) {
    limit = 100;
  }

  const stockStatusFilter = queryParams.stock_status;
  if (
    stockStatusFilter &&
    !['in_stock', 'low_stock', 'out_of_stock'].includes(stockStatusFilter)
  ) {
    throw new AppError(
      'stock_status filter must be one of: in_stock, low_stock, out_of_stock',
      400
    );
  }

  const search = queryParams.search ? String(queryParams.search).trim() : undefined;

  const { rows, total } = await inventoryRepo.findAndCountAll({
    page,
    limit,
    search,
    stock_status: stockStatusFilter,
    low_stock_threshold: LOW_STOCK_THRESHOLD,
  });

  const formattedRows = rows.map((row) => ({
    ...row,
    stock_status: calculateStockStatus(row.quantity),
  }));

  const totalPages = Math.ceil(total / limit) || (total === 0 ? 0 : 1);

  return {
    data: formattedRows,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
};

export const getInventoryById = async (id) => {
  const numericId = parseInt(id, 10);
  if (isNaN(numericId) || numericId <= 0) {
    throw new AppError('Invalid inventory ID', 400);
  }

  const inventory = await inventoryRepo.findById(numericId);
  if (!inventory) {
    throw new AppError('Inventory record not found', 404);
  }

  return {
    ...inventory,
    stock_status: calculateStockStatus(inventory.quantity),
  };
};

export const getInventoryByProductId = async (productId) => {
  const numericProductId = parseInt(productId, 10);
  if (isNaN(numericProductId) || numericProductId <= 0) {
    throw new AppError('Invalid product ID', 400);
  }

  // Verify product exists
  const productExists = await productRepo.findById(numericProductId);
  if (!productExists) {
    throw new AppError('Product not found', 404);
  }

  const inventory = await inventoryRepo.findByProductId(numericProductId);
  if (!inventory) {
    throw new AppError('Inventory record not found for this product', 404);
  }

  return {
    ...inventory,
    stock_status: calculateStockStatus(inventory.quantity),
  };
};

export const createInitialInventory = async ({ product_id, quantity }) => {
  const numericProductId = parseInt(product_id, 10);
  if (isNaN(numericProductId) || numericProductId <= 0) {
    throw new AppError('Valid product_id is required', 400);
  }

  // Verify product exists
  const productExists = await productRepo.findById(numericProductId);
  if (!productExists) {
    throw new AppError(`Referenced product with ID ${numericProductId} does not exist`, 400);
  }

  // Validate quantity
  const numericQuantity = parseInt(quantity, 10);
  if (quantity === undefined || quantity === null || isNaN(numericQuantity) || numericQuantity < 0) {
    throw new AppError('Quantity must be an integer greater than or equal to 0', 400);
  }

  // Check if inventory already exists for this product
  const existingInventory = await inventoryRepo.findByProductId(numericProductId);
  if (existingInventory) {
    throw new AppError(`Inventory record already exists for product ID ${numericProductId}`, 409);
  }

  const created = await inventoryRepo.create({
    product_id: numericProductId,
    quantity: numericQuantity,
  });

  // Fetch complete joined product metadata
  const fullInventory = await inventoryRepo.findById(created.id);
  return {
    ...fullInventory,
    stock_status: calculateStockStatus(fullInventory.quantity),
  };
};

export const updateQuantityByProductId = async (productId, { quantity }) => {
  const numericProductId = parseInt(productId, 10);
  if (isNaN(numericProductId) || numericProductId <= 0) {
    throw new AppError('Invalid product ID', 400);
  }

  // Verify product exists
  const productExists = await productRepo.findById(numericProductId);
  if (!productExists) {
    throw new AppError('Product not found', 404);
  }

  // Validate quantity
  const numericQuantity = parseInt(quantity, 10);
  if (quantity === undefined || quantity === null || isNaN(numericQuantity) || numericQuantity < 0) {
    throw new AppError('Quantity must be an integer greater than or equal to 0', 400);
  }

  // Check inventory record exists
  const existingInventory = await inventoryRepo.findByProductId(numericProductId);
  if (!existingInventory) {
    throw new AppError(
      'Inventory record not found for this product. Use POST /api/inventory to create initial inventory.',
      404
    );
  }

  const updated = await inventoryRepo.updateQuantityByProductId(numericProductId, numericQuantity);
  const fullInventory = await inventoryRepo.findById(updated.id);
  return {
    ...fullInventory,
    stock_status: calculateStockStatus(fullInventory.quantity),
  };
};

export const adjustQuantityByProductId = async (productId, { change }) => {
  const numericProductId = parseInt(productId, 10);
  if (isNaN(numericProductId) || numericProductId <= 0) {
    throw new AppError('Invalid product ID', 400);
  }

  // Verify product exists
  const productExists = await productRepo.findById(numericProductId);
  if (!productExists) {
    throw new AppError('Product not found', 404);
  }

  // Validate change
  const numericChange = parseInt(change, 10);
  if (change === undefined || change === null || isNaN(numericChange)) {
    throw new AppError('Stock adjustment change must be a valid integer', 400);
  }

  if (numericChange === 0) {
    throw new AppError('Stock adjustment change must be a non-zero integer', 400);
  }

  // Verify inventory record exists
  const existingInventory = await inventoryRepo.findByProductId(numericProductId);
  if (!existingInventory) {
    throw new AppError('Inventory record not found for this product', 404);
  }

  // Atomic Update: Executed directly in database
  const result = await inventoryRepo.adjustQuantityAtomic(numericProductId, numericChange);

  // If result is null, it means (current_quantity + change) < 0
  if (!result) {
    throw new AppError('Insufficient stock. Inventory cannot become negative.', 400);
  }

  const fullInventory = await inventoryRepo.findById(result.id);
  return {
    ...fullInventory,
    stock_status: calculateStockStatus(fullInventory.quantity),
  };
};
