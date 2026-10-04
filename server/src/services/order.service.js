import { pool } from '../config/db.js';
import * as orderRepo from '../repositories/order.repository.js';
import * as userRepo from '../repositories/user.repository.js';
import { AppError } from '../utils/errors.js';

const VALID_STATUSES = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

const ALLOWED_TRANSITIONS = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['SHIPPED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};

/**
 * Service Layer for Order operations with Security & Identity enforcement.
 */
export const createOrder = async (body, reqUser) => {
  // Security Requirement: Never trust client-provided user_id. Use reqUser.id if present.
  const rawUserId = reqUser ? reqUser.id : body.user_id;

  const numericUserId = parseInt(rawUserId, 10);
  if (isNaN(numericUserId) || numericUserId <= 0) {
    throw new AppError('Valid user identity is required', 400);
  }

  // Verify user exists in database
  const userExists = await userRepo.findById(numericUserId);
  if (!userExists) {
    throw new AppError(`User with ID ${numericUserId} does not exist`, 404);
  }

  const items = body.items;

  // Validate items array
  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new AppError('Order items must be a non-empty array', 400);
  }

  const productIds = [];
  for (const item of items) {
    const numericProductId = parseInt(item.product_id, 10);
    const numericQuantity = parseInt(item.quantity, 10);

    if (isNaN(numericProductId) || numericProductId <= 0) {
      throw new AppError('Each order item must have a valid positive integer product_id', 400);
    }

    if (isNaN(numericQuantity) || numericQuantity <= 0) {
      throw new AppError('Each order item quantity must be a positive integer greater than 0', 400);
    }

    productIds.push(numericProductId);
  }

  // Reject duplicate product IDs in items array
  if (new Set(productIds).size !== productIds.length) {
    throw new AppError('Duplicate product IDs are not allowed in order items', 400);
  }

  // Begin PostgreSQL Transaction with Row-Level Locking
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Sort product IDs in ascending order to prevent deadlocks during FOR UPDATE row locking
    const sortedProductIds = [...productIds].sort((a, b) => a - b);

    // Lock inventory & product rows FOR UPDATE
    const lockedRows = await orderRepo.lockInventoryRowsForProductsInClient(client, sortedProductIds);
    const lockedMap = new Map(lockedRows.map((row) => [row.product_id, row]));

    // Validate product existence, active status, and inventory stock
    for (const item of items) {
      const productId = parseInt(item.product_id, 10);
      const quantity = parseInt(item.quantity, 10);
      const productData = lockedMap.get(productId);

      if (!productData) {
        throw new AppError(
          `Product with ID ${productId} does not exist or has no inventory record`,
          400
        );
      }

      if (!productData.is_active) {
        throw new AppError(
          `Product '${productData.product_name}' (ID ${productId}) is inactive and cannot be ordered`,
          400
        );
      }

      if (productData.current_stock < quantity) {
        throw new AppError(
          `Insufficient stock for product '${productData.product_name}'. Requested: ${quantity}, Available: ${productData.current_stock}`,
          400
        );
      }
    }

    // Insert order container record (status: PENDING, total_amount: 0.00)
    const newOrder = await orderRepo.createOrderInClient(client, {
      user_id: numericUserId,
      status: 'PENDING',
      total_amount: 0.00,
    });

    // Insert order items and deduct stock
    for (const item of items) {
      const productId = parseInt(item.product_id, 10);
      const quantity = parseInt(item.quantity, 10);
      const productData = lockedMap.get(productId);

      await orderRepo.createOrderItemInClient(client, {
        order_id: newOrder.id,
        product_id: productId,
        quantity,
        price_at_purchase: productData.current_price,
      });

      const updateResult = await orderRepo.reduceInventoryQuantityInClient(client, {
        product_id: productId,
        quantity,
      });

      if (!updateResult) {
        throw new AppError(`Insufficient stock for product ID ${productId}`, 400);
      }
    }

    // Calculate total amount in PostgreSQL (NUMERIC precision) and update orders.total_amount
    const updatedOrder = await orderRepo.calculateAndSetOrderTotalInClient(client, newOrder.id);

    await client.query('COMMIT');

    // Return complete order details (bypassing role check for newly created order)
    return await fetchOrderInternal(updatedOrder.id);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

const fetchOrderInternal = async (numericId) => {
  const order = await orderRepo.findById(numericId);
  if (!order) {
    throw new AppError('Order not found', 404);
  }
  const items = await orderRepo.findOrderItemsByOrderId(numericId);
  return { ...order, items };
};

export const getOrderById = async (id, reqUser) => {
  const numericId = parseInt(id, 10);
  if (isNaN(numericId) || numericId <= 0) {
    throw new AppError('Invalid order ID', 400);
  }

  const order = await orderRepo.findById(numericId);
  if (!order) {
    throw new AppError('Order not found', 404);
  }

  // Authorization Check: Customers can only view their own orders
  if (reqUser && reqUser.role === 'CUSTOMER' && order.user_id !== reqUser.id) {
    throw new AppError('Access forbidden: You are not authorized to view another customer order', 403);
  }

  const items = await orderRepo.findOrderItemsByOrderId(numericId);
  return {
    ...order,
    items,
  };
};

export const getOrdersList = async (queryParams = {}, reqUser) => {
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

  let parsedUserId = undefined;

  // Security & Authorization Rule:
  // Customers can ONLY see their own orders. Overrides any client-supplied user_id filter.
  if (reqUser && reqUser.role === 'CUSTOMER') {
    parsedUserId = reqUser.id;
  } else if (queryParams.user_id !== undefined && queryParams.user_id !== '') {
    parsedUserId = parseInt(queryParams.user_id, 10);
    if (isNaN(parsedUserId) || parsedUserId <= 0) {
      throw new AppError('Invalid user_id filter', 400);
    }
  }

  let parsedStatus = undefined;
  if (queryParams.status !== undefined && queryParams.status !== '') {
    if (!VALID_STATUSES.includes(queryParams.status)) {
      throw new AppError(`Invalid status filter. Must be one of: ${VALID_STATUSES.join(', ')}`, 400);
    }
    parsedStatus = queryParams.status;
  }

  const { rows, total } = await orderRepo.findAndCountAll({
    page,
    limit,
    user_id: parsedUserId,
    status: parsedStatus,
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

export const updateOrderStatus = async (id, newStatus, reqUser) => {
  const numericId = parseInt(id, 10);
  if (isNaN(numericId) || numericId <= 0) {
    throw new AppError('Invalid order ID', 400);
  }

  if (!newStatus || !VALID_STATUSES.includes(newStatus)) {
    throw new AppError(`Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`, 400);
  }

  // Authorization Check for Status Updates
  if (reqUser && reqUser.role === 'CUSTOMER') {
    // Customer can ONLY request status = 'CANCELLED'
    if (newStatus !== 'CANCELLED') {
      throw new AppError('Forbidden: Customers cannot update order status', 403);
    }

    // Verify Customer owns this order
    const orderCheck = await orderRepo.findById(numericId);
    if (!orderCheck) {
      throw new AppError('Order not found', 404);
    }
    if (orderCheck.user_id !== reqUser.id) {
      throw new AppError("Forbidden: Cannot cancel another customer's order", 403);
    }
  }

  // CANCELLATION WORKFLOW (Requires PostgreSQL Transaction to restore stock safely)
  if (newStatus === 'CANCELLED') {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Lock order record
      const order = await orderRepo.lockOrderForUpdateInClient(client, numericId);
      if (!order) {
        throw new AppError('Order not found', 404);
      }

      if (order.status === 'CANCELLED') {
        throw new AppError('Order is already cancelled', 400);
      }

      if (!['PENDING', 'CONFIRMED'].includes(order.status)) {
        throw new AppError(
          `Cannot cancel order in '${order.status}' status. Only PENDING or CONFIRMED orders can be cancelled.`,
          400
        );
      }

      // Fetch order items to restore
      const items = await orderRepo.findOrderItemsByOrderIdInClient(client, numericId);
      const productIds = items.map((i) => i.product_id).sort((a, b) => a - b);

      if (productIds.length > 0) {
        await orderRepo.lockInventoryRowsForProductsInClient(client, productIds);

        for (const item of items) {
          await orderRepo.restoreInventoryQuantityInClient(client, {
            product_id: item.product_id,
            quantity: item.quantity,
          });
        }
      }

      await orderRepo.updateOrderStatusInClient(client, numericId, 'CANCELLED');

      await client.query('COMMIT');
      return await fetchOrderInternal(numericId);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // STANDARD STATUS TRANSITIONS (CONFIRMED, PROCESSING, SHIPPED, DELIVERED)
  const existingOrder = await orderRepo.findById(numericId);
  if (!existingOrder) {
    throw new AppError('Order not found', 404);
  }

  const currentStatus = existingOrder.status;

  if (currentStatus === newStatus) {
    return await fetchOrderInternal(numericId);
  }

  const allowedNextStatuses = ALLOWED_TRANSITIONS[currentStatus] || [];
  if (!allowedNextStatuses.includes(newStatus)) {
    throw new AppError(
      `Invalid status transition from '${currentStatus}' to '${newStatus}'`,
      400
    );
  }

  await orderRepo.updateOrderStatus(numericId, newStatus);
  return await fetchOrderInternal(numericId);
};
