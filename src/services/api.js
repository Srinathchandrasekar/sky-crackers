import { API_CONFIG } from '../config/api.config.js'

export const API_BASE_URL = API_CONFIG.BASE_URL

// Helper for fetch requests with dual fallback (/api proxy and direct localhost:5066)
async function fetchJson(endpoint, options = {}) {
  const baseUrls = [
    API_CONFIG.BASE_URL,
    ...(API_CONFIG.FALLBACK_URLS || []),
  ]
  // Deduplicate
  const uniqueBases = Array.from(new Set(baseUrls.filter(Boolean)))

  let lastError = null

  for (const base of uniqueBases) {
    try {
      const url = `${base.replace(/\/+$/, '')}${endpoint}`
      const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      }

      const res = await fetch(url, { ...options, headers })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        const error = new Error(data.message || data.error || `HTTP error ${res.status}`)
        error.status = res.status
        error.data = data
        throw error
      }

      return data
    } catch (err) {
      lastError = err
      // If it's an HTTP error with response (e.g. 400 validation error), don't retry on other URL
      if (err.status) {
        throw err
      }
    }
  }

  throw lastError || new Error('API connection failed. Please ensure the backend is running.')
}

// 1. Health
export const getHealthApi = () => fetchJson('/health')

// 2. Categories & Products
export const getCategoriesApi = () => fetchJson('/categories')

export const getProductsApi = ({ category, search } = {}) => {
  const params = new URLSearchParams()
  if (category && category !== 'all') params.append('category', category)
  if (search) params.append('search', search)
  const qs = params.toString() ? `?${params.toString()}` : ''
  return fetchJson(`/products${qs}`)
}

export const getProductByIdApi = (id) => fetchJson(`/products/${id}`)

// 3. Customers
export const saveCustomerApi = (customerData) => {
  const payload = {
    CustomerName: customerData.CustomerName || customerData.customerName || customerData.fullName || '',
    MobileNumber: customerData.MobileNumber || customerData.mobileNumber || '',
    EmailAddress: customerData.EmailAddress || customerData.emailAddress || customerData.email || null,
    Address: customerData.Address || customerData.address || `${customerData.doorNumber || ''}, ${customerData.streetName || ''}, ${customerData.area || ''}`.trim().replace(/^,\s*|,\s*$/g, ''),
    DoorNumber: customerData.DoorNumber || customerData.doorNumber || '',
    StreetName: customerData.StreetName || customerData.streetName || '',
    Area: customerData.Area || customerData.area || '',
    City: customerData.City || customerData.city || '',
    District: customerData.District || customerData.district || 'Virudhunagar',
    State: customerData.State || customerData.state || 'Tamil Nadu',
    PinCode: customerData.PinCode || customerData.pinCode || customerData.pincode || '',
    PrivacyPolicyAccepted: Boolean(customerData.agreePrivacy ?? customerData.PrivacyPolicyAccepted ?? true),
  }
  return fetchJson('/customers', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export const lookupCustomerApi = (mobileNumber) => {
  return fetchJson('/customers/lookup', {
    method: 'POST',
    body: JSON.stringify({ MobileNumber: mobileNumber }),
  })
}

export const getCustomerByIdApi = (id, token) => {
  return fetchJson(`/customers/${id}`, {
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
}

// 4. Orders / Bookings
export const createOrderApi = (orderPayload) => {
  return fetchJson('/orders', {
    method: 'POST',
    body: JSON.stringify(orderPayload),
  })
}

export const getOrderByNumberApi = (orderNumber) => fetchJson(`/orders/${orderNumber}`)

export const getOrdersListApi = ({ status, search, page = 1 } = {}) => {
  const params = new URLSearchParams()
  if (status && status !== 'all') params.append('status', status)
  if (search) params.append('search', search)
  params.append('page', page)
  return fetchJson(`/orders?${params.toString()}`)
}

export const updateOrderStatusApi = (orderId, { orderStatus, paymentStatus, notes }) => {
  return fetchJson(`/orders/${orderId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ OrderStatus: orderStatus, PaymentStatus: paymentStatus, Notes: notes }),
  })
}

// 5. Admin Authentication & Dashboard
export const adminLoginApi = (credentials) => {
  return fetchJson('/admin/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  })
}

export const getAdminDashboardApi = (token) => {
  return fetchJson('/admin/dashboard', {
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
}

export const getInventoryMovementsApi = (token) => {
  return fetchJson('/admin/dashboard/inventory', {
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
}

export const updateProductApi = (id, productData) => {
  return fetchJson(`/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(productData),
  })
}
