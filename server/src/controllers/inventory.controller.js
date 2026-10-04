import * as inventoryService from '../services/inventory.service.js';

/**
 * Controller for Inventory API Endpoints.
 * Handles HTTP requests, delegates to Inventory Service, and returns standardized JSON responses.
 */
export const getInventory = async (req, res, next) => {
  try {
    const result = await inventoryService.getInventoryList(req.query);
    return res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

export const getInventoryById = async (req, res, next) => {
  try {
    const inventory = await inventoryService.getInventoryById(req.params.id);
    return res.status(200).json({
      success: true,
      data: inventory,
    });
  } catch (error) {
    next(error);
  }
};

export const getInventoryByProductId = async (req, res, next) => {
  try {
    const inventory = await inventoryService.getInventoryByProductId(req.params.productId);
    return res.status(200).json({
      success: true,
      data: inventory,
    });
  } catch (error) {
    next(error);
  }
};

export const createInventory = async (req, res, next) => {
  try {
    const newInventory = await inventoryService.createInitialInventory(req.body);
    return res.status(201).json({
      success: true,
      message: 'Inventory record created successfully',
      data: newInventory,
    });
  } catch (error) {
    next(error);
  }
};

export const updateInventoryQuantity = async (req, res, next) => {
  try {
    const updatedInventory = await inventoryService.updateQuantityByProductId(
      req.params.productId,
      req.body
    );
    return res.status(200).json({
      success: true,
      message: 'Inventory quantity updated successfully',
      data: updatedInventory,
    });
  } catch (error) {
    next(error);
  }
};

export const adjustInventoryQuantity = async (req, res, next) => {
  try {
    const adjustedInventory = await inventoryService.adjustQuantityByProductId(
      req.params.productId,
      req.body
    );
    return res.status(200).json({
      success: true,
      message: 'Inventory quantity adjusted successfully',
      data: adjustedInventory,
    });
  } catch (error) {
    next(error);
  }
};
