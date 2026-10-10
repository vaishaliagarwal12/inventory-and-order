import * as productRepo from '../repositories/product.repository.js';
import * as categoryRepo from '../repositories/category.repository.js';
import { AppError } from '../utils/errors.js';

/**
 * Service Layer for Products.
 * Encapsulates search, pagination calculations, business validation, and foreign key verification.
 */
export const getProducts = async (queryParams = {}) => {
  let page = parseInt(queryParams.page || '1', 10);
  let limit = parseInt(queryParams.limit || '10', 10);

  if (isNaN(page) || page < 1) {
    throw new AppError('Page number must be an integer greater than or equal to 1', 400);
  }

  if (isNaN(limit) || limit < 1) {
    throw new AppError('Limit must be an integer greater than or equal to 1', 400);
  }

  // Enforce reasonable maximum limit
  if (limit > 100) {
    limit = 100;
  }

  let parsedCategoryId = undefined;
  if (queryParams.category_id !== undefined && queryParams.category_id !== '') {
    parsedCategoryId = parseInt(queryParams.category_id, 10);
    if (isNaN(parsedCategoryId) || parsedCategoryId <= 0) {
      throw new AppError('Invalid category_id filter', 400);
    }
  }

  let parsedIsActive = undefined;
  if (queryParams.is_active !== undefined && queryParams.is_active !== '') {
    if (queryParams.is_active === 'true' || queryParams.is_active === true) {
      parsedIsActive = true;
    } else if (queryParams.is_active === 'false' || queryParams.is_active === false) {
      parsedIsActive = false;
    } else {
      throw new AppError('is_active filter must be a boolean (true or false)', 400);
    }
  }

  const search = queryParams.search ? String(queryParams.search).trim() : undefined;

  let excludeTest = false;
  if (queryParams.exclude_test === 'true' || queryParams.exclude_test === true || queryParams.exclude_test === undefined) {
    if (queryParams.exclude_test !== 'false' && queryParams.exclude_test !== false) {
      excludeTest = true;
    }
  }

  const { rows, total } = await productRepo.findAndCountAll({
    page,
    limit,
    search,
    category_id: parsedCategoryId,
    is_active: parsedIsActive,
    exclude_test: excludeTest,
  });

  const totalPages = Math.ceil(total / limit) || (total === 0 ? 0 : 1);

  return {
    data: rows,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
};

export const getProductById = async (id) => {
  const numericId = parseInt(id, 10);
  if (isNaN(numericId) || numericId <= 0) {
    throw new AppError('Invalid product ID', 400);
  }

  const product = await productRepo.findById(numericId);
  if (!product) {
    throw new AppError('Product not found', 404);
  }
  return product;
};

export const createProduct = async ({ category_id, name, description, price, is_active }) => {
  // Validate category_id
  const numericCategoryId = parseInt(category_id, 10);
  if (isNaN(numericCategoryId) || numericCategoryId <= 0) {
    throw new AppError('Valid category_id is required', 400);
  }

  // Verify referenced category exists
  const categoryExists = await categoryRepo.findById(numericCategoryId);
  if (!categoryExists) {
    throw new AppError(`Referenced category with ID ${numericCategoryId} does not exist`, 400);
  }

  // Validate name
  if (!name || typeof name !== 'string' || name.trim() === '') {
    throw new AppError('Product name is required and cannot be empty', 400);
  }

  // Validate price
  const numericPrice = parseFloat(price);
  if (price === undefined || price === null || isNaN(numericPrice) || numericPrice < 0) {
    throw new AppError('Product price is required and must be a non-negative number', 400);
  }

  // Validate or default is_active
  let activeState = true;
  if (is_active !== undefined && is_active !== null) {
    if (typeof is_active === 'boolean') {
      activeState = is_active;
    } else if (is_active === 'true') {
      activeState = true;
    } else if (is_active === 'false') {
      activeState = false;
    } else {
      throw new AppError('is_active must be a boolean value', 400);
    }
  }

  return await productRepo.create({
    category_id: numericCategoryId,
    name: name.trim(),
    description: description && typeof description === 'string' ? description.trim() : null,
    price: numericPrice,
    is_active: activeState,
  });
};

export const updateProduct = async (id, { category_id, name, description, price }) => {
  const numericId = parseInt(id, 10);
  if (isNaN(numericId) || numericId <= 0) {
    throw new AppError('Invalid product ID', 400);
  }

  const existingProduct = await productRepo.findById(numericId);
  if (!existingProduct) {
    throw new AppError('Product not found', 404);
  }

  // Validate category_id
  const numericCategoryId = parseInt(category_id, 10);
  if (isNaN(numericCategoryId) || numericCategoryId <= 0) {
    throw new AppError('Valid category_id is required', 400);
  }

  // Verify category exists
  const categoryExists = await categoryRepo.findById(numericCategoryId);
  if (!categoryExists) {
    throw new AppError(`Referenced category with ID ${numericCategoryId} does not exist`, 400);
  }

  // Validate name
  if (!name || typeof name !== 'string' || name.trim() === '') {
    throw new AppError('Product name is required and cannot be empty', 400);
  }

  // Validate price
  const numericPrice = parseFloat(price);
  if (price === undefined || price === null || isNaN(numericPrice) || numericPrice < 0) {
    throw new AppError('Product price is required and must be a non-negative number', 400);
  }

  return await productRepo.update(numericId, {
    category_id: numericCategoryId,
    name: name.trim(),
    description: description && typeof description === 'string' ? description.trim() : null,
    price: numericPrice,
  });
};

export const updateProductStatus = async (id, is_active) => {
  const numericId = parseInt(id, 10);
  if (isNaN(numericId) || numericId <= 0) {
    throw new AppError('Invalid product ID', 400);
  }

  const existingProduct = await productRepo.findById(numericId);
  if (!existingProduct) {
    throw new AppError('Product not found', 404);
  }

  let activeState;
  if (typeof is_active === 'boolean') {
    activeState = is_active;
  } else if (is_active === 'true') {
    activeState = true;
  } else if (is_active === 'false') {
    activeState = false;
  } else {
    throw new AppError('is_active must be a boolean value (true or false)', 400);
  }

  return await productRepo.updateStatus(numericId, activeState);
};

export const deleteProduct = async (id) => {
  const numericId = parseInt(id, 10);
  if (isNaN(numericId) || numericId <= 0) {
    throw new AppError('Invalid product ID', 400);
  }

  const existingProduct = await productRepo.findById(numericId);
  if (!existingProduct) {
    throw new AppError('Product not found', 404);
  }

  try {
    await productRepo.deleteById(numericId);
  } catch (error) {
    // 23503 is PostgreSQL foreign key restriction (ON DELETE RESTRICT from order_items)
    if (error.code === '23503') {
      throw new AppError(
        'Cannot delete product because it is referenced in historical order records. Please deactivate the product instead.',
        400
      );
    }
    throw error;
  }
};
