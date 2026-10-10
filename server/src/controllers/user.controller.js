import * as userService from '../services/user.service.js';

export const getCustomers = async (req, res, next) => {
  try {
    const result = await userService.getCustomersList(req.query);
    return res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

export const getCustomerById = async (req, res, next) => {
  try {
    const customer = await userService.getCustomerById(req.params.id);
    return res.status(200).json({
      success: true,
      data: customer,
    });
  } catch (error) {
    next(error);
  }
};
