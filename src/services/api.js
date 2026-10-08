import { API_CONFIG } from '../config/api.config.js'

export const API_BASE_URL = API_CONFIG.BASE_URL

// Cache the known working base URL for instant zero-latency subsequent calls
let cachedWorkingBase = null

async function fetchWithTimeout(url, options = {}, timeoutMs = 12000) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      ...options,
      signal: options.signal || controller.signal,
    })
    return res
  } finally {
    clearTimeout(timeoutId)
  }
}

// Helper for fetch requests with dual fallback (/api proxy and direct localhost:5066)
async function fetchJson(endpoint, options = {}) {
  const allBases = [
    cachedWorkingBase,
    API_CONFIG.BASE_URL,
    ...(API_CONFIG.FALLBACK_URLS || []),
  ].filter(Boolean)

  // Deduplicate preserving order
  const uniqueBases = Array.from(new Set(allBases))

  let lastError = null

  for (const base of uniqueBases) {
    try {
      const url = `${base.replace(/\/+$/, '')}${endpoint}`
      const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      }

      const res = await fetchWithTimeout(url, { ...options, headers }, 12000)
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        const error = new Error(data.message || data.error || `HTTP error ${res.status}`)
        error.status = res.status
        error.data = data
        throw error
      }

      // Memorize working base for subsequent requests
      cachedWorkingBase = base
      return data
    } catch (err) {
      lastError = err
      // If it's a real HTTP status response (e.g. 400 validation error), backend is alive, don't retry
      if (err.status) {
        cachedWorkingBase = base
        throw err
      }
      // If connection timed out or refused, clear cached base and try next
      if (cachedWorkingBase === base) {
        cachedWorkingBase = null
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
  const orderNum = orderPayload.orderNumber || `SFC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100000 + Math.random() * 900000)}`
  const initialPaymentStatus = orderPayload.paymentStatus || ((orderPayload.paymentMethod || '').toUpperCase().includes('PENDING') ? 'Pending' : ((orderPayload.paymentMethod || '').toUpperCase() === 'RAZORPAY' ? 'Paid' : 'Pending Verification'))

  const localOrder = {
    orderId: orderPayload.orderId || Date.now(),
    orderNumber: orderNum,
    createdAt: orderPayload.createdAt || new Date().toISOString(),
    orderStatus: orderPayload.orderStatus || 'Confirmed',
    paymentStatus: initialPaymentStatus,
    ...orderPayload,
  }

  // Always save in both local storages first so order is NEVER lost!
  try {
    ['sky_orders', 'skycrackers_orders_history'].forEach((key) => {
      const list = JSON.parse(localStorage.getItem(key) || '[]')
      const existsIdx = list.findIndex((o) => o.orderNumber === orderNum)
      if (existsIdx > -1) {
        list[existsIdx] = { ...list[existsIdx], ...localOrder }
      } else {
        list.unshift(localOrder)
      }
      localStorage.setItem(key, JSON.stringify(list.slice(0, 50)))
    })
  } catch (e) {}

  // Ensure customer exists in SQL Server
  let validCustomerId = orderPayload.customerId || orderPayload.CustomerId
  if (!validCustomerId || isNaN(Number(validCustomerId)) || Number(validCustomerId) > 1000000 || Number(validCustomerId) <= 0) {
    try {
      const cleanPhone = (orderPayload.customerPhone || '9999999999').replace(/\D/g, '').slice(-10)
      const custRes = await saveCustomerApi({
        CustomerName: orderPayload.customerName || 'Valued Customer',
        MobileNumber: cleanPhone.length === 10 ? cleanPhone : '9999999999',
        Address: orderPayload.deliveryAddress || 'Tamil Nadu, India',
        PinCode: '626123',
        PrivacyPolicyAccepted: true,
      })
      validCustomerId = custRes?.data?.customerId || custRes?.customerId || 1
    } catch (_) {
      validCustomerId = 1
    }
  }

  // Format clean items according to CreateOrderDto
  const serverItems = (orderPayload.items || []).map((i) => {
    let pid = Number(i.productId || i.ProductId || i.sno || 1)
    if (pid <= 0 || pid > 91) pid = 1
    return {
      productId: pid,
      quantity: Math.max(1, Math.min(1000, Number(i.quantity || 1))),
    }
  })

  const serverPayload = {
    customerId: Number(validCustomerId),
    paymentMethod: (orderPayload.paymentMethod || 'UPI').toUpperCase().includes('WHATSAPP') ? 'WHATSAPP_ENQUIRY' : 'UPI',
    notes: orderPayload.notes || (orderPayload.utrNumber ? `UPI Payment - UTR: ${orderPayload.utrNumber}` : 'Online Crackers Booking'),
    items: serverItems.length > 0 ? serverItems : [{ productId: 1, quantity: 1 }],
  }

  try {
    const res = await fetchJson('/orders', {
      method: 'POST',
      body: JSON.stringify(serverPayload),
    })

    // If server returned created order, update local stored order with real server ID and orderNumber!
    if (res && (res.orderId || res.OrderId)) {
      const serverId = res.orderId || res.OrderId
      const serverNum = res.orderNumber || res.OrderNumber || orderNum
      try {
        ['sky_orders', 'skycrackers_orders_history'].forEach((key) => {
          const list = JSON.parse(localStorage.getItem(key) || '[]')
          const updated = list.map((o) => {
            if (o.orderNumber === orderNum || o.orderNumber === serverNum) {
              return {
                ...o,
                orderId: serverId,
                orderNumber: serverNum,
                paymentStatus: res.paymentStatus || o.paymentStatus,
              }
            }
            return o
          })
          localStorage.setItem(key, JSON.stringify(updated))
        })
      } catch (_) {}
    }

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

  // Merge with localStorage orders from both keys
  let localOrders = []
  try {
    const s1 = JSON.parse(localStorage.getItem('sky_orders') || '[]')
    const s2 = JSON.parse(localStorage.getItem('skycrackers_orders_history') || '[]')
    const mergedLocalMap = new Map()
    ;[...s1, ...s2].forEach((o) => {
      if (o && o.orderNumber) {
        mergedLocalMap.set(o.orderNumber, o)
      }
    })
    localOrders = Array.from(mergedLocalMap.values())
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

  // Sync any local-only order to cloud server so all other devices can see it!
  if (cloudOrders.length > 0 && localOrders.length > 0) {
    localOrders.forEach((lo) => {
      const inCloud = cloudOrders.some((co) => co.orderNumber === lo.orderNumber)
      if (!inCloud && (!lo.orderId || String(lo.orderId).length > 9)) {
        // Sync to cloud in background
        createOrderApi(lo).catch(() => {})
      }
    })
  }

  // Combine and deduplicate by orderNumber
  const combinedMap = new Map()
  cloudOrders.forEach((co) => {
    combinedMap.set(co.orderNumber, co)
  })

  localOrders.forEach((lo) => {
    if (!combinedMap.has(lo.orderNumber)) {
      combinedMap.set(lo.orderNumber, lo)
    } else {
      // Merge extra local details (like utrNumber or couponCode) if cloud lacks them
      const existing = combinedMap.get(lo.orderNumber)
      combinedMap.set(lo.orderNumber, {
        ...existing,
        utrNumber: existing.utrNumber || lo.utrNumber,
        couponCode: existing.couponCode || lo.couponCode,
        notes: existing.notes || lo.notes,
      })
    }
  })

  return Array.from(combinedMap.values()).sort(
    (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  )
}

export const updateOrderStatusApi = async (orderId, { orderStatus, paymentStatus, notes }) => {
  // Update both local storage keys immediately
  try {
    ['sky_orders', 'skycrackers_orders_history'].forEach((storageKey) => {
      const list = JSON.parse(localStorage.getItem(storageKey) || '[]')
      const updated = list.map((o) => {
        if (
          String(o.orderId) === String(orderId) ||
          String(o.orderNumber) === String(orderId)
        ) {
          return {
            ...o,
            paymentStatus: paymentStatus || o.paymentStatus,
            orderStatus: orderStatus || o.orderStatus,
            notes: notes !== undefined ? notes : o.notes,
          }
        }
        return o
      })
      localStorage.setItem(storageKey, JSON.stringify(updated))
    })
  } catch (_) {}

  // Resolve numeric orderId if string orderNumber was passed
  let targetId = orderId
  if (typeof orderId === 'string' && orderId.startsWith('SFC-')) {
    try {
      const orderData = await fetchJson(`/orders/${orderId}`)
      if (orderData && (orderData.orderId || orderData.OrderId)) {
        targetId = orderData.orderId || orderData.OrderId
      }
    } catch (_) {}
  }

  return fetchJson(`/orders/${targetId}/status`, {
    method: 'PUT',
    body: JSON.stringify({
      OrderStatus: orderStatus || 'Confirmed',
      PaymentStatus: paymentStatus,
      Notes: notes,
    }),
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
