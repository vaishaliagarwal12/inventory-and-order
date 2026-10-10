import * as userRepo from '../repositories/user.repository.js';
import { AppError } from '../utils/errors.js';

export const getCustomersList = async (queryParams = {}) => {
  let page = parseInt(queryParams.page || '1', 10);
  let limit = parseInt(queryParams.limit || '10', 10);

  if (isNaN(page) || page < 1) {
    throw new AppError('Page number must be an integer greater than or equal to 1', 400);
  }
  if (isNaN(limit) || limit < 1) {
    throw new AppError('Limit must be an integer greater than or equal to 1', 400);
  }

  const search = queryParams.search ? String(queryParams.search).trim() : undefined;

  const { rows, total } = await userRepo.findCustomersAndCount({
    page,
    limit,
    search,
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

export const getCustomerById = async (id) => {
  const numericId = parseInt(id, 10);
  if (isNaN(numericId) || numericId <= 0) {
    throw new AppError('Invalid customer ID', 400);
  }
  const customer = await userRepo.findById(numericId);
  if (!customer) {
    throw new AppError('Customer record not found', 404);
  }
  return customer;
};
