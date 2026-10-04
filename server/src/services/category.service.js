import * as categoryRepo from '../repositories/category.repository.js';
import { AppError } from '../utils/errors.js';

/**
 * Service Layer for Categories.
 * Encapsulates business rules, validation, and domain error handling.
 */
export const getAllCategories = async () => {
  return await categoryRepo.findAll();
};

export const getCategoryById = async (id) => {
  const numericId = parseInt(id, 10);
  if (isNaN(numericId) || numericId <= 0) {
    throw new AppError('Invalid category ID', 400);
  }

  const category = await categoryRepo.findById(numericId);
  if (!category) {
    throw new AppError('Category not found', 404);
  }
  return category;
};

export const createCategory = async ({ name, description }) => {
  if (!name || typeof name !== 'string' || name.trim() === '') {
    throw new AppError('Category name is required and cannot be empty', 400);
  }

  const trimmedName = name.trim();
  const trimmedDesc = description && typeof description === 'string' ? description.trim() : null;

  // Check uniqueness (case-insensitive)
  const existing = await categoryRepo.findByName(trimmedName);
  if (existing) {
    throw new AppError(`Category with name '${trimmedName}' already exists`, 409);
  }

  return await categoryRepo.create({
    name: trimmedName,
    description: trimmedDesc,
  });
};

export const updateCategory = async (id, { name, description }) => {
  const numericId = parseInt(id, 10);
  if (isNaN(numericId) || numericId <= 0) {
    throw new AppError('Invalid category ID', 400);
  }

  const existingCategory = await categoryRepo.findById(numericId);
  if (!existingCategory) {
    throw new AppError('Category not found', 404);
  }

  if (!name || typeof name !== 'string' || name.trim() === '') {
    throw new AppError('Category name is required and cannot be empty', 400);
  }

  const trimmedName = name.trim();
  const trimmedDesc = description && typeof description === 'string' ? description.trim() : null;

  // Check uniqueness excluding current category
  const duplicate = await categoryRepo.findByNameExcludingId(trimmedName, numericId);
  if (duplicate) {
    throw new AppError(`Category with name '${trimmedName}' already exists`, 409);
  }

  return await categoryRepo.update(numericId, {
    name: trimmedName,
    description: trimmedDesc,
  });
};

export const deleteCategory = async (id) => {
  const numericId = parseInt(id, 10);
  if (isNaN(numericId) || numericId <= 0) {
    throw new AppError('Invalid category ID', 400);
  }

  const category = await categoryRepo.findById(numericId);
  if (!category) {
    throw new AppError('Category not found', 404);
  }

  try {
    await categoryRepo.deleteById(numericId);
  } catch (error) {
    // 23503 is PostgreSQL foreign key violation (ON DELETE RESTRICT)
    if (error.code === '23503') {
      throw new AppError(
        'Cannot delete category because it contains associated products. Delete or reassign products first.',
        400
      );
    }
    throw error;
  }
};
