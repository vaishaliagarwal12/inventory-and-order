const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Utility for making API requests with automatic Authorization Bearer token header.
 */
export const apiFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || `HTTP Error ${response.status}`);
  }
  return data;
};

// --- AUTH APIs ---
export const loginApi = async (email, password) => {
  return await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
};

export const registerApi = async (name, email, password) => {
  return await apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });
};

export const getMeApi = async () => {
  return await apiFetch('/auth/me', { method: 'GET' });
};

export const getUsersApi = async () => {
  return await apiFetch('/auth/users', { method: 'GET' });
};

// --- CATEGORY APIs ---
export const getCategoriesApi = async () => {
  return await apiFetch('/categories', { method: 'GET' });
};

export const createCategoryApi = async (categoryData) => {
  return await apiFetch('/categories', {
    method: 'POST',
    body: JSON.stringify(categoryData),
  });
};

export const updateCategoryApi = async (id, categoryData) => {
  return await apiFetch(`/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(categoryData),
  });
};

export const deleteCategoryApi = async (id) => {
  return await apiFetch(`/categories/${id}`, {
    method: 'DELETE',
  });
};

// --- PRODUCT APIs ---
export const getProductsApi = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.page) query.append('page', params.page);
  if (params.limit) query.append('limit', params.limit);
  if (params.search) query.append('search', params.search);
  if (params.category_id) query.append('category_id', params.category_id);
  if (params.is_active !== undefined && params.is_active !== '') query.append('is_active', params.is_active);

  const queryString = query.toString() ? `?${query.toString()}` : '';
  return await apiFetch(`/products${queryString}`, { method: 'GET' });
};

export const getProductByIdApi = async (id) => {
  return await apiFetch(`/products/${id}`, { method: 'GET' });
};

export const createProductApi = async (productData) => {
  return await apiFetch('/products', {
    method: 'POST',
    body: JSON.stringify(productData),
  });
};

export const updateProductApi = async (id, productData) => {
  return await apiFetch(`/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(productData),
  });
};

export const patchProductStatusApi = async (id, is_active) => {
  return await apiFetch(`/products/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ is_active }),
  });
};

export const deleteProductApi = async (id) => {
  return await apiFetch(`/products/${id}`, {
    method: 'DELETE',
  });
};

// --- INVENTORY APIs ---
export const getInventoryApi = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.page) query.append('page', params.page);
  if (params.limit) query.append('limit', params.limit);
  if (params.search) query.append('search', params.search);
  if (params.stock_status) query.append('stock_status', params.stock_status);

  const queryString = query.toString() ? `?${query.toString()}` : '';
  return await apiFetch(`/inventory${queryString}`, { method: 'GET' });
};

export const getInventoryByProductIdApi = async (productId) => {
  return await apiFetch(`/inventory/product/${productId}`, { method: 'GET' });
};

export const createInventoryApi = async (inventoryData) => {
  return await apiFetch('/inventory', {
    method: 'POST',
    body: JSON.stringify(inventoryData),
  });
};

export const updateInventoryQuantityApi = async (productId, quantity) => {
  return await apiFetch(`/inventory/product/${productId}`, {
    method: 'PUT',
    body: JSON.stringify({ quantity }),
  });
};

export const adjustInventoryQuantityApi = async (productId, change) => {
  return await apiFetch(`/inventory/product/${productId}/adjust`, {
    method: 'PATCH',
    body: JSON.stringify({ change }),
  });
};

// --- ORDER APIs ---
export const getOrdersApi = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.page) query.append('page', params.page);
  if (params.limit) query.append('limit', params.limit);
  if (params.status) query.append('status', params.status);
  if (params.user_id) query.append('user_id', params.user_id);

  const queryString = query.toString() ? `?${query.toString()}` : '';
  return await apiFetch(`/orders${queryString}`, { method: 'GET' });
};

export const getOrderByIdApi = async (id) => {
  return await apiFetch(`/orders/${id}`, { method: 'GET' });
};

export const createOrderApi = async (items) => {
  return await apiFetch('/orders', {
    method: 'POST',
    body: JSON.stringify({ items }),
  });
};

export const updateOrderStatusApi = async (id, status) => {
  return await apiFetch(`/orders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
};

// --- CURRENCY APIs ---
export const getExchangeRatesApi = async () => {
  return await apiFetch('/currency/rates', { method: 'GET' });
};

export const fetchHealthStatus = async () => {
  const startTime = performance.now();
  try {
    const data = await apiFetch('/health', { method: 'GET' });
    const endTime = performance.now();
    return {
      success: true,
      data,
      responseTimeMs: Math.round(endTime - startTime),
    };
  } catch (error) {
    const endTime = performance.now();
    return {
      success: false,
      error: error.message || 'Failed to connect to backend API server',
      responseTimeMs: Math.round(endTime - startTime),
    };
  }
};
