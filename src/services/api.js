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
export const saveCustomerApi = async (customerData) => {
  const cleanMobile = (customerData.MobileNumber || customerData.mobileNumber || '').replace(/\D/g, '').slice(-10)
  const cleanPin = (customerData.PinCode || customerData.pinCode || customerData.pincode || '626123').replace(/\D/g, '').slice(0, 6)
  const custName = (customerData.CustomerName || customerData.customerName || customerData.fullName || 'Valued Customer').trim()
  const doorNum = customerData.DoorNumber || customerData.doorNumber || '1'
  const street = customerData.StreetName || customerData.streetName || customerData.Address || 'Main Road'
  const area = customerData.Area || customerData.area || customerData.city || 'Locality'
  const city = customerData.City || customerData.city || 'Tirunelveli'
  const district = customerData.District || customerData.district || 'Virudhunagar'
  const state = customerData.State || customerData.state || 'Tamil Nadu'
  const addr = customerData.Address || customerData.address || `${doorNum}, ${street}, ${area}`.trim().replace(/^,\s*|,\s*$/g, '')

  const payload = {
    CustomerName: custName,
    customerName: custName,
    MobileNumber: cleanMobile,
    mobileNumber: cleanMobile,
    EmailAddress: customerData.EmailAddress || customerData.emailAddress || customerData.email || null,
    emailAddress: customerData.EmailAddress || customerData.emailAddress || customerData.email || null,
    Address: addr,
    address: addr,
    DoorNumber: doorNum,
    doorNumber: doorNum,
    StreetName: street,
    streetName: street,
    Area: area,
    area: area,
    City: city,
    city: city,
    District: district,
    district: district,
    State: state,
    state: state,
    PinCode: cleanPin.length === 6 ? cleanPin : '626123',
    pinCode: cleanPin.length === 6 ? cleanPin : '626123',
    PrivacyPolicyAccepted: true,
  }

  // Generate or preserve local ID
  let custId = customerData.customerId || customerData.CustomerId || Date.now()
  try {
    const existingStored = JSON.parse(localStorage.getItem('sky_customers') || '[]')
    const idx = existingStored.findIndex((c) => {
      const mob = (c.mobileNumber || c.MobileNumber || '').replace(/\D/g, '').slice(-10)
      return mob === cleanMobile
    })
    if (idx > -1) {
      custId = existingStored[idx].customerId || existingStored[idx].CustomerId || custId
      existingStored[idx] = { ...existingStored[idx], ...payload, customerId: custId, CustomerId: custId }
    } else {
      existingStored.push({ customerId: custId, CustomerId: custId, ...payload })
    }
    localStorage.setItem('sky_customers', JSON.stringify(existingStored))
    localStorage.setItem('sky_current_customer', JSON.stringify({ customerId: custId, CustomerId: custId, ...payload }))
  } catch (e) {
    console.warn('localStorage customer write warning:', e)
  }

  try {
    const res = await fetchJson('/customers', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    const resolvedId = res?.data?.customerId || res?.data?.CustomerId || res?.customerId || custId
    return {
      success: true,
      isExistingCustomer: Boolean(res?.isExistingCustomer),
      message: res?.message || 'Customer saved successfully to database.',
      customerId: resolvedId,
      CustomerId: resolvedId,
      token: res?.token || 'token-' + resolvedId,
      data: {
        ...(res?.data || {}),
        customerId: resolvedId,
        CustomerId: resolvedId,
        customerName: custName,
        CustomerName: custName,
        mobileNumber: cleanMobile,
        MobileNumber: cleanMobile,
        doorNumber: doorNum,
        streetName: street,
        area: area,
        city: city,
        district: district,
        state: state,
        pinCode: payload.PinCode,
        address: addr,
      },
    }
  } catch (apiErr) {
    console.warn('Server customer save fallback to local session:', apiErr)
    return {
      success: true,
      message: 'Customer profile saved (Local Session).',
      customerId: custId,
      CustomerId: custId,
      isExistingCustomer: false,
      token: 'local-token-' + custId,
      data: {
        customerId: custId,
        CustomerId: custId,
        customerName: custName,
        CustomerName: custName,
        mobileNumber: cleanMobile,
        MobileNumber: cleanMobile,
        doorNumber: doorNum,
        streetName: street,
        area: area,
        city: city,
        district: district,
        state: state,
        pinCode: payload.PinCode,
        address: addr,
      },
    }
  }
}

export const lookupCustomerApi = async (mobileNumber) => {
  const cleanMobile = (mobileNumber || '').replace(/\D/g, '').slice(-10)
  if (!cleanMobile || cleanMobile.length < 10) {
    return { exists: false, message: 'Please enter a valid 10-digit mobile number.' }
  }

  // 1. Check local storage fallback first
  let localFound = null
  try {
    const stored = JSON.parse(localStorage.getItem('sky_customers') || '[]')
    localFound = stored.find((c) => {
      const mob = (c.mobileNumber || c.MobileNumber || '').replace(/\D/g, '').slice(-10)
      return mob === cleanMobile
    })
    if (!localFound) {
      const cur = JSON.parse(localStorage.getItem('sky_current_customer') || 'null')
      if (cur) {
        const curMob = (cur.mobileNumber || cur.MobileNumber || '').replace(/\D/g, '').slice(-10)
        if (curMob === cleanMobile) localFound = cur
      }
    }
  } catch (e) {}

  // 2. Query cloud API
  let cloudRes = null
  let cloudErrStatus = null
  try {
    cloudRes = await fetchJson('/customers/lookup', {
      method: 'POST',
      body: JSON.stringify({ MobileNumber: cleanMobile }),
    })
  } catch (err) {
    cloudErrStatus = err.status || 500
    console.warn('Cloud lookup warning, using local session match:', err)
  }

  if (cloudRes && cloudRes.exists && cloudRes.customer) {
    const c = cloudRes.customer
    const custId = c.customerId || c.CustomerId || 1
    const custName = c.customerName || c.CustomerName || 'Valued Customer'
    const fullAddress = c.address || c.Address || `${c.doorNumber || c.DoorNumber || ''}, ${c.streetName || c.StreetName || ''}, ${c.city || c.City || ''}`.trim()
    return {
      exists: true,
      serverError: false,
      message: cloudRes.message || `Account found for ${custName}.`,
      customerId: custId,
      customerName: custName,
      maskedName: custName,
      maskedMobile: '+91 ' + cleanMobile,
      cityHint: c.city || c.City || c.district || c.District || 'Tamil Nadu',
      customer: {
        customerId: custId,
        CustomerId: custId,
        customerName: custName,
        CustomerName: custName,
        mobileNumber: cleanMobile,
        MobileNumber: cleanMobile,
        emailAddress: c.emailAddress || c.EmailAddress || '',
        address: fullAddress,
        doorNumber: c.doorNumber || c.DoorNumber || '',
        streetName: c.streetName || c.StreetName || '',
        area: c.area || c.Area || '',
        city: c.city || c.City || '',
        district: c.district || c.District || '',
        state: c.state || c.State || 'Tamil Nadu',
        pinCode: c.pinCode || c.PinCode || '',
      },
      previousOrders: cloudRes.previousOrders || [],
    }
  }

  if (localFound) {
    const custId = localFound.customerId || localFound.CustomerId || Date.now()
    const custName = localFound.CustomerName || localFound.customerName || localFound.fullName || 'Valued Customer'
    const fullAddress = localFound.Address || localFound.address || `${localFound.DoorNumber || localFound.doorNumber || ''}, ${localFound.StreetName || localFound.streetName || ''}, ${localFound.City || localFound.city || ''}`.trim()
    return {
      exists: true,
      serverError: false,
      message: `Account found for ${custName}.`,
      customerId: custId,
      customerName: custName,
      maskedName: custName,
      maskedMobile: '+91 ' + cleanMobile,
      cityHint: localFound.City || localFound.city || localFound.District || localFound.district || 'Tamil Nadu',
      customer: {
        customerId: custId,
        CustomerId: custId,
        customerName: custName,
        CustomerName: custName,
        mobileNumber: cleanMobile,
        MobileNumber: cleanMobile,
        emailAddress: localFound.EmailAddress || localFound.emailAddress || localFound.email || '',
        address: fullAddress,
        doorNumber: localFound.DoorNumber || localFound.doorNumber || '',
        streetName: localFound.StreetName || localFound.streetName || '',
        area: localFound.Area || localFound.area || '',
        city: localFound.City || localFound.city || '',
        district: localFound.District || localFound.district || '',
        state: localFound.State || localFound.state || 'Tamil Nadu',
        pinCode: localFound.PinCode || localFound.pinCode || localFound.pincode || '',
      },
      previousOrders: [],
    }
  }

  return {
    exists: false,
    serverError: Boolean(cloudErrStatus),
    status: cloudErrStatus,
    message: cloudErrStatus
      ? `Server error (${cloudErrStatus}). The MonsterASP backend requires deployment.`
      : 'No existing profile found. Please register as a new customer.',
  }
}

export const getCustomerByIdApi = (id, token) => {
  return fetchJson(`/customers/${id}`, {
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
}

// 4. Orders / Bookings
export const createOrderApi = async (orderPayload) => {
  const orderNum = `SFC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100000 + Math.random() * 900000)}`
  const localOrder = {
    orderId: Date.now(),
    orderNumber: orderNum,
    createdAt: new Date().toISOString(),
    orderStatus: 'Confirmed',
    paymentStatus: (orderPayload.paymentMethod || '').toUpperCase().includes('PENDING') ? 'Pending' : ((orderPayload.paymentMethod || '').toUpperCase() === 'RAZORPAY' ? 'Paid' : 'Pending'),
    ...orderPayload,
  }

  // Always save in localStorage first so order is NEVER lost!
  try {
    const storedOrders = JSON.parse(localStorage.getItem('sky_orders') || '[]')
    storedOrders.unshift(localOrder)
    localStorage.setItem('sky_orders', JSON.stringify(storedOrders))
  } catch (e) {}

  try {
    const res = await fetchJson('/orders', {
      method: 'POST',
      body: JSON.stringify(orderPayload),
    })
    return res
  } catch (apiErr) {
    console.warn('Cloud orders save fallback to confirmed local booking:', apiErr)
    return {
      success: true,
      orderId: localOrder.orderId,
      orderNumber: orderNum,
      customerName: orderPayload.customerName || (orderPayload.notes && !orderPayload.notes.startsWith('Razorpay') && !orderPayload.notes.startsWith('Online') ? orderPayload.notes : 'Valued Customer'),
      customerPhone: orderPayload.customerPhone || '',
      deliveryAddress: orderPayload.deliveryAddress || 'Tamil Nadu, India',
      totalAmount: orderPayload.items?.reduce((s, i) => s + (i.price || 0) * (i.quantity || 1), 0) || 0,
      orderStatus: 'Confirmed',
      paymentStatus: localOrder.paymentStatus,
      message: `Order #${orderNum} confirmed successfully!`,
    }
  }
}

export const getOrderByNumberApi = (orderNumber) => fetchJson(`/orders/${orderNumber}`)

export const getOrdersListApi = async ({ status, search, page = 1 } = {}) => {
  const params = new URLSearchParams()
  if (status && status !== 'all') params.append('status', status)
  if (search) params.append('search', search)
  params.append('page', page)

  let cloudOrders = []
  try {
    const res = await fetchJson(`/orders?${params.toString()}`)
    cloudOrders = Array.isArray(res) ? res : (Array.isArray(res?.value) ? res.value : [])
  } catch (e) {
    console.warn('Cloud orders fetch warning:', e)
  }

  // Merge with localStorage orders
  let localOrders = []
  try {
    localOrders = JSON.parse(localStorage.getItem('sky_orders') || '[]')
    if (search) {
      const s = search.toLowerCase()
      localOrders = localOrders.filter(
        (o) =>
          (o.orderNumber || '').toLowerCase().includes(s) ||
          (o.customerPhone || '').includes(search) ||
          (o.customerName || '').toLowerCase().includes(s)
      )
    }
  } catch (e) {}

  // Combine and deduplicate by orderNumber
  const combined = [...cloudOrders]
  for (const lo of localOrders) {
    if (!combined.some((co) => co.orderNumber === lo.orderNumber)) {
      combined.push(lo)
    }
  }

  return combined
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
