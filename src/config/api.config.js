/**
 * Sky Fire Crackers - Central API Configuration
 * Connects Frontend directly to ASP.NET Core Web API & Microsoft SQL Server
 */

export const API_CONFIG = {
  // ASP.NET Core Web API URL (Standard HTTP port 5066 with HTTPS port 7184 fallback)
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5066/api',

  // Fallback URLs to guarantee automatic connection on any port
  FALLBACK_URLS: [
    'http://localhost:5066/api',
    'http://127.0.0.1:5066/api',
    'https://localhost:7184/api',
    '/api',
  ],

  // API Endpoints
  ENDPOINTS: {
    HEALTH: '/health',
    CATEGORIES: '/categories',
    PRODUCTS: '/products',
    PRODUCT_BY_ID: (id) => `/products/${id}`,
    CUSTOMERS: '/customers',
    CUSTOMER_LOOKUP: '/customers/lookup',
    CUSTOMER_BY_ID: (id) => `/customers/${id}`,
    ORDERS: '/orders',
    ORDER_BY_NUMBER: (orderNumber) => `/orders/${orderNumber}`,
    ORDER_STATUS: (id) => `/orders/${id}/status`,
    ADMIN_LOGIN: '/admin/auth/login',
    ADMIN_DASHBOARD: '/admin/dashboard',
    ADMIN_INVENTORY_MOVEMENTS: '/admin/dashboard/inventory',
    UPDATE_STOCK: (id) => `/products/${id}/stock`,
  },
}

export default API_CONFIG
