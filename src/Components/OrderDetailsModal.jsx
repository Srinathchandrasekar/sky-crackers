import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  Typography,
  Box,
  Button,
  TextField,
  Grid,
  Stack,
  Alert,
  Divider,
  Chip,
  IconButton,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  InputAdornment,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import SearchIcon from '@mui/icons-material/Search'
import PhoneIcon from '@mui/icons-material/Phone'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import PendingActionsIcon from '@mui/icons-material/PendingActions'
import ShoppingCartCheckoutIcon from '@mui/icons-material/ShoppingCartCheckout'
import PaymentIcon from '@mui/icons-material/Payment'
import LocalShippingIcon from '@mui/icons-material/LocalShipping'
import PersonIcon from '@mui/icons-material/Person'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import DownloadIcon from '@mui/icons-material/Download'
import { downloadStructuredInvoice } from '../utils/invoiceGenerator'
import { lookupCustomerApi, getOrdersListApi, updateOrderStatusApi } from '../services/api'
import { CRACKERS_DATA } from '../data/crackersData'

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true)
      return
    }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export function normalizeOrderItem(item) {
  if (!item) return null
  const pId = Number(
    item.productId ?? item.ProductId ?? item.id ?? item.sno ?? item.Sno ?? 1
  )

  const matched = CRACKERS_DATA.find(
    (c) =>
      c.productId === pId ||
      c.sno === pId ||
      c.id === `p-${pId}` ||
      (item.productName && c.name?.toLowerCase() === item.productName?.toLowerCase()) ||
      (item.ProductName && c.name?.toLowerCase() === item.ProductName?.toLowerCase())
  )

  const rawQty = item.quantity ?? item.Quantity ?? item.qty ?? item.boxes ?? 1
  const quantity = isNaN(Number(rawQty)) || Number(rawQty) <= 0 ? 1 : Number(rawQty)

  const rawPrice = item.unitPrice ?? item.UnitPrice ?? item.price ?? item.Price ?? matched?.discountPrice ?? matched?.actualRate ?? 50
  const unitPrice = isNaN(Number(rawPrice)) ? 50 : Number(rawPrice)

  const rawTotal = item.totalPrice ?? item.TotalPrice
  const totalPrice = (!isNaN(Number(rawTotal)) && Number(rawTotal) > 0)
    ? Number(rawTotal)
    : unitPrice * quantity

  const productName = item.productName || item.ProductName || matched?.name || `Cracker Item #${pId}`
  const tamilName = item.tamilName || item.TamilName || item.nameTamil || matched?.tamilName || ''
  const image = item.image || item.Image || matched?.image || ''

  return {
    productId: pId,
    productName,
    tamilName,
    image,
    quantity,
    unitPrice,
    totalPrice,
  }
}

export function normalizeOrder(ord) {
  if (!ord) return null
  const rawItems = Array.isArray(ord.items)
    ? ord.items
    : (Array.isArray(ord.Items) ? ord.Items : [])

  const items = rawItems.map(normalizeOrderItem).filter(Boolean)
  const itemsSum = items.reduce((sum, it) => sum + (Number(it.totalPrice) || 0), 0)

  const rawTotal = ord.totalAmount ?? ord.TotalAmount ?? ord.subTotal ?? ord.SubTotal ?? ord.total ?? ord.Total
  const totalAmount = (rawTotal !== undefined && rawTotal !== null && !isNaN(Number(rawTotal)) && Number(rawTotal) > 0)
    ? Number(rawTotal)
    : itemsSum

  const notes = ord.notes ?? ord.Notes ?? ''
  const couponCode = ord.couponCode ?? ord.CouponCode ?? (notes.toUpperCase().includes('TRUSTSKYFIRECRACKERS') ? 'TRUSTSKYFIRECRACKERS' : (notes.toUpperCase().includes('TRUSTSKYCRACKERS') ? 'TRUSTSKYCRACKERS' : null))

  return {
    ...ord,
    orderId: ord.orderId ?? ord.OrderId ?? ord.orderNumber ?? ord.OrderNumber,
    orderNumber: ord.orderNumber ?? ord.OrderNumber ?? `SFC-${Date.now().toString().slice(-6)}`,
    customerName: ord.customerName ?? ord.CustomerName ?? 'Valued Customer',
    customerPhone: ord.customerPhone ?? ord.CustomerPhone ?? '',
    deliveryAddress: ord.deliveryAddress ?? ord.DeliveryAddress ?? 'Tamil Nadu, India',
    orderStatus: ord.orderStatus ?? ord.OrderStatus ?? 'Confirmed',
    paymentStatus: ord.paymentStatus ?? ord.PaymentStatus ?? 'Pending',
    paymentMethod: ord.paymentMethod ?? ord.PaymentMethod ?? 'Online',
    notes,
    couponCode,
    createdAt: ord.createdAt ?? ord.CreatedAt ?? new Date().toISOString(),
    totalAmount,
    items,
  }
}

export default function OrderDetailsModal({
  open,
  onClose,
  initialMobile = '',
  cart = [],
  onRestoreCart,
  onOpenShop,
  onProceedToCheckout,
  onOpenPersonPage,
}) {
  const [mobileNumber, setMobileNumber] = useState(initialMobile || '')
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [customer, setCustomer] = useState(null)
  const [orders, setOrders] = useState([])
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [payingOrderId, setPayingOrderId] = useState(null)
  const [contextMenu, setContextMenu] = useState(null)
  const [quickDetailsOpen, setQuickDetailsOpen] = useState(false)
  const [quickOrder, setQuickOrder] = useState(null)

  const handleContextMenu = (e, cust, ord) => {
    e.preventDefault()
    setContextMenu({
      mouseX: e.clientX + 2,
      mouseY: e.clientY - 6,
      cust,
      ord,
    })
  }

  const handleCloseContextMenu = () => {
    setContextMenu(null)
  }

  useEffect(() => {
    if (open && initialMobile) {
      const digits = (initialMobile || '').replace(/\D/g, '')
      const clean = digits.length >= 10 ? digits.slice(-10) : digits
      if (clean.length === 10) {
        setMobileNumber(clean)
        handleSearch(clean)
      }
    } else if (open) {
      setErrorMsg('')
      setSuccessMsg('')
    }
  }, [open, initialMobile])

  const handleSearch = async (phoneToSearch = mobileNumber) => {
    const cleanPhone = (phoneToSearch || '').replace(/\D/g, '').slice(0, 10)
    if (cleanPhone.length !== 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.')
      return
    }

    setLoading(true)
    setErrorMsg('')
    setSuccessMsg('')
    setSearched(true)

    try {
      // 1. Fetch customer profile & recent orders from lookup endpoint
      const [lookupRes, allOrdersRes] = await Promise.all([
        lookupCustomerApi(cleanPhone).catch(() => null),
        getOrdersListApi({ search: cleanPhone }).catch(() => []),
      ])

      let custData = null
      if (lookupRes && lookupRes.exists && lookupRes.customer) {
        custData = lookupRes.customer
      }

      // Merge past orders from lookup and search results to ensure complete list
      const ordersMap = new Map()

      if (Array.isArray(allOrdersRes)) {
        allOrdersRes.forEach((o) => {
          if (o.orderNumber) ordersMap.set(o.orderNumber, o)
        })
      }

      if (lookupRes && Array.isArray(lookupRes.previousOrders)) {
        lookupRes.previousOrders.forEach((o) => {
          if (o.orderNumber && !ordersMap.has(o.orderNumber)) {
            ordersMap.set(o.orderNumber, o)
          }
        })
      }

      // Check locally saved orders from both history keys as instant fallback
      try {
        const localSaved = JSON.parse(localStorage.getItem('skycrackers_orders_history') || '[]')
        const skyOrders = JSON.parse(localStorage.getItem('sky_orders') || '[]')
        ;[...localSaved, ...skyOrders].forEach((lo) => {
          const loPhone = (lo.customerPhone || lo.CustomerPhone || '').replace(/\D/g, '')
          const ordNum = lo.orderNumber || lo.OrderNumber
          if (loPhone.includes(cleanPhone) && ordNum && !ordersMap.has(ordNum)) {
            ordersMap.set(ordNum, lo)
          }
        })
      } catch (locErr) {
        console.warn('Local orders load warning:', locErr)
      }

      const combinedOrders = Array.from(ordersMap.values())
        .map(normalizeOrder)
        .filter(Boolean)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

      if (!custData && combinedOrders.length > 0) {
        // Synthesize customer info from the latest order
        const latest = combinedOrders[0]
        custData = {
          customerName: latest.customerName,
          mobileNumber: latest.customerPhone,
          address: latest.deliveryAddress,
        }
      }

      setCustomer(custData)
      setOrders(combinedOrders)

      if (!custData && combinedOrders.length === 0) {
        setErrorMsg(`No saved bookings or customer profile found for +91 ${cleanPhone}.`)
      }
    } catch (err) {
      console.error('Failed to retrieve orders:', err)
      setErrorMsg('Failed to connect to database. Please check your network.')
    } finally {
      setLoading(false)
    }
  }

  // Restore crackers into shopping cart
  const handleLoadToCart = (order) => {
    if (!order || !order.items || order.items.length === 0) return

    const restoredCart = order.items.map((item) => {
      const found = CRACKERS_DATA.find(
        (c) =>
          c.productId === item.productId ||
          c.sno === item.productId ||
          c.name?.toLowerCase() === item.productName?.toLowerCase()
      )
      if (found) {
        return { product: found, quantity: item.quantity }
      }
      return {
        product: {
          id: `p-${item.productId}`,
          productId: item.productId,
          sno: item.productId,
          name: item.productName,
          category: 'all',
          originalPrice: Math.round((item.unitPrice || 50) * 5),
          discountPrice: item.unitPrice || 50,
        },
        quantity: item.quantity,
      }
    })

    if (onRestoreCart) {
      onRestoreCart(restoredCart)
      setSuccessMsg(`✅ Successfully loaded ${restoredCart.length} crackers into your cart!`)
      setTimeout(() => {
        if (onClose) onClose()
      }, 1200)
    }
  }

  // Pay Now for pending booking via Razorpay
  const handlePayNow = async (order) => {
    setPayingOrderId(order.orderId || order.OrderId)
    setErrorMsg('')

    try {
      const isLoaded = await loadRazorpayScript()
      if (!isLoaded) {
        alert('Failed to load payment gateway. Please check your internet connection.')
        setPayingOrderId(null)
        return
      }

      const rzpKey = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_TihKhwOYL8AwVm'
      const amountPaise = Math.round((order.totalAmount || 0) * 100)

      const options = {
        key: rzpKey,
        amount: amountPaise,
        currency: 'INR',
        name: 'Sky Fire Crackers',
        description: `Payment for Booking #${order.orderNumber}`,
        prefill: {
          name: order.customerName,
          contact: order.customerPhone,
        },
        theme: {
          color: '#0B132B',
        },
        method: {
          netbanking: true,
          card: true,
          wallet: true,
          upi: true,
        },
        handler: async function (response) {
          try {
            // Update order payment status in SQL Server
            await updateOrderStatusApi(order.orderId, {
              orderStatus: 'Confirmed',
              paymentStatus: 'Completed',
              notes: `Razorpay Online Payment Verified (${response.razorpay_payment_id})`,
            })

            setSuccessMsg(`🎉 Payment Successful! Booking #${order.orderNumber} is now marked as Completed!`)
            handleSearch(order.customerPhone)
          } catch (updateErr) {
            console.error('Payment status update failed:', updateErr)
            setSuccessMsg(`Payment received! ID: ${response.razorpay_payment_id}`)
          } finally {
            setPayingOrderId(null)
          }
        },
        modal: {
          ondismiss: function () {
            setPayingOrderId(null)
          },
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', function (resp) {
        setPayingOrderId(null)
        setErrorMsg(resp.error?.description || 'Payment was not completed.')
      })
      rzp.open()
    } catch (err) {
      console.error('Pay now error:', err)
      setErrorMsg('Failed to initiate payment. Please try again.')
      setPayingOrderId(null)
    }
  }

  // Structured Invoice download generator
  const handleDownloadInvoice = (order) => {
    downloadStructuredInvoice({
      ...order,
      customerName: order.customerName || customer?.customerName,
      customerPhone: order.customerPhone || customer?.mobileNumber,
      deliveryAddress: order.deliveryAddress || customer?.address,
      paymentStatus: order.paymentStatus || 'Pending',
      paymentMethod: order.paymentMethod || 'Online Payment (Pending)',
    })
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: { xs: 2.5, sm: 3 },
          overflow: 'hidden',
          backgroundColor: '#F8FAFC',
          maxHeight: '92vh',
          m: { xs: 1, sm: 2 },
          width: { xs: 'calc(100% - 16px)', sm: 'auto' },
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          backgroundColor: '#0B132B',
          color: '#FFFFFF',
          px: { xs: 2, sm: 3.5 },
          py: { xs: 1.8, sm: 2.2 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '3px solid #FFA000',
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              width: { xs: 34, sm: 40 },
              height: { xs: 34, sm: 40 },
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 160, 0, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ReceiptLongIcon sx={{ color: '#FFA000', fontSize: { xs: 20, sm: 24 } }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, fontSize: { xs: '0.92rem', sm: '1.2rem' } }}>
              My Orders & Saved Bookings (என் ஆர்டர்கள்)
            </Typography>
            <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: { xs: '0.68rem', sm: '0.75rem' } }}>
              Retrieve your crackers, live payment status & transport dispatch details
            </Typography>
          </Box>
        </Stack>

        <IconButton onClick={onClose} size="small" sx={{ color: '#94A3B8', '&:hover': { color: '#FFFFFF' } }}>
          <CloseIcon />
        </IconButton>
      </Box>

      <DialogContent sx={{ p: { xs: 1.5, sm: 3 } }}>
        {/* Phone Search Box */}
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            borderRadius: 2.5,
            border: '1.5px solid #E2E8F0',
            backgroundColor: '#FFFFFF',
            mb: 3,
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0B132B', mb: 1 }}>
            Enter Customer 10-Digit Mobile Number:
          </Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <TextField
              fullWidth
              size="small"
              placeholder="Enter 10-digit mobile number"
              value={mobileNumber}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 10)
                setMobileNumber(val)
                setErrorMsg('')
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PhoneIcon fontSize="small" sx={{ color: '#64748B' }} />
                    <Typography variant="body2" sx={{ ml: 0.5, fontWeight: 700, color: '#0B132B' }}>
                      +91
                    </Typography>
                  </InputAdornment>
                ),
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <Button
              variant="contained"
              disabled={loading || mobileNumber.length !== 10}
              onClick={() => handleSearch()}
              startIcon={loading ? <CircularProgress size={18} sx={{ color: '#0B132B' }} /> : <SearchIcon />}
              sx={{
                backgroundColor: '#FFA000',
                color: '#0B132B',
                fontWeight: 900,
                px: 3,
                borderRadius: 2,
                whiteSpace: 'nowrap',
                '&:hover': { backgroundColor: '#FF8F00' },
              }}
            >
              {loading ? 'Searching...' : 'Search Customer'}
            </Button>
          </Stack>
        </Paper>

        {/* Notifications */}
        {errorMsg && (
          <Alert severity="warning" sx={{ mb: 2.5, borderRadius: 2 }}>
            {errorMsg}
          </Alert>
        )}
        {successMsg && (
          <Alert severity="success" sx={{ mb: 2.5, borderRadius: 2 }}>
            {successMsg}
          </Alert>
        )}

        {/* Customer Profile Card */}
        {customer && (
          <Paper
            elevation={0}
            onContextMenu={(e) => handleContextMenu(e, customer, null)}
            sx={{
              p: 2.5,
              borderRadius: 2.5,
              backgroundColor: '#FFFFFF',
              border: '1.5px solid #0284C7',
              boxShadow: '0 4px 15px rgba(2, 132, 199, 0.08)',
              mb: 3,
              cursor: 'context-menu',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <PersonIcon sx={{ color: '#0284C7' }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0B132B' }}>
                  {customer.customerName}
                </Typography>
                <Chip
                  size="small"
                  label="Verified Account"
                  sx={{ backgroundColor: '#DCFCE7', color: '#16A34A', fontWeight: 800, fontSize: '0.72rem' }}
                />
              </Stack>
              <Chip
                label={`+91 ${customer.mobileNumber}`}
                sx={{ backgroundColor: '#E0F2FE', color: '#0369A1', fontWeight: 800 }}
              />
            </Box>

            <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ mb: 2 }}>
              <LocationOnIcon sx={{ color: '#64748B', fontSize: 18, mt: 0.2 }} />
              <Typography variant="body2" sx={{ color: '#475569' }}>
                {customer.address}
              </Typography>
            </Stack>

            {/* Direct Action Buttons for this customer */}
            <Divider sx={{ my: 1.5 }} />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.2} alignItems="stretch" justifyContent="flex-end" flexWrap="wrap">
              <Button
                variant="contained"
                size="small"
                onClick={() => {
                  if (onOpenPersonPage) onOpenPersonPage(customer)
                }}
                sx={{
                  backgroundColor: '#0284C7',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '0.84rem',
                  textTransform: 'none',
                  borderRadius: '20px',
                  py: 0.8,
                  px: 2.2,
                  width: { xs: '100%', sm: 'auto' },
                  boxShadow: '0 2px 8px rgba(2, 132, 199, 0.25)',
                  '&:hover': { backgroundColor: '#0369A1' },
                }}
              >
                👤 Customer Hub (Saved Bookings & Status) →
              </Button>

              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  if (onOpenShop) onOpenShop(customer)
                }}
                sx={{
                  color: '#0F172A',
                  borderColor: '#CBD5E1',
                  backgroundColor: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '0.84rem',
                  textTransform: 'none',
                  borderRadius: '20px',
                  py: 0.8,
                  px: 2,
                  width: { xs: '100%', sm: 'auto' },
                  '&:hover': { backgroundColor: '#F8FAFC', borderColor: '#94A3B8' },
                }}
              >
                🛒 Select Crackers →
              </Button>

              {cart && cart.length > 0 && (
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => {
                    if (onProceedToCheckout) onProceedToCheckout(customer)
                  }}
                  sx={{
                    background: 'linear-gradient(135deg, #15803D 0%, #16A34A 100%)',
                    color: '#FFFFFF',
                    fontWeight: 900,
                    fontSize: '0.84rem',
                    textTransform: 'none',
                    borderRadius: '20px',
                    py: 0.8,
                    px: 2.2,
                    width: { xs: '100%', sm: 'auto' },
                    boxShadow: '0 3px 10px rgba(22, 163, 74, 0.35)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #166534 0%, #15803D 100%)',
                    },
                  }}
                >
                  💾 Save & Book Cart ({cart.reduce((s, i) => s + i.quantity, 0)} boxes) →
                </Button>
              )}
            </Stack>
          </Paper>
        )}

        {/* Orders Listing */}
        {orders.length > 0 ? (
          <Stack spacing={2.5}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F172A' }}>
              Found {orders.length} Booking(s) in SQL Database:
            </Typography>

            {orders.map((ord) => {
              const isPaid =
                ord.paymentStatus?.toLowerCase() === 'completed' ||
                ord.paymentStatus?.toLowerCase() === 'paid' ||
                ord.paymentStatus?.toLowerCase() === 'success'

              return (
                <Paper
                  key={ord.orderNumber}
                  elevation={0}
                  onContextMenu={(e) =>
                    handleContextMenu(
                      e,
                      customer || {
                        customerName: ord.customerName,
                        mobileNumber: ord.customerPhone,
                        address: ord.deliveryAddress,
                      },
                      ord
                    )
                  }
                  sx={{
                    borderRadius: 2.5,
                    border: '1.5px solid #E2E8F0',
                    backgroundColor: '#FFFFFF',
                    overflow: 'hidden',
                    cursor: 'context-menu',
                  }}
                >
                  {/* Order Top Bar */}
                  <Box
                    sx={{
                      p: 2,
                      backgroundColor: '#F8FAFC',
                      borderBottom: '1px solid #E2E8F0',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 1.5,
                    }}
                  >
                    <Box>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#0B132B' }}>
                          #{ord.orderNumber}
                        </Typography>
                        <Chip
                          size="small"
                          label={ord.orderStatus || 'Confirmed'}
                          sx={{
                            backgroundColor: '#ECFDF5',
                            color: '#065F46',
                            fontWeight: 800,
                            fontSize: '0.72rem',
                          }}
                        />
                        {ord.couponCode && (
                          <Chip
                            size="small"
                            label={`🎟️ ${ord.couponCode}`}
                            sx={{
                              backgroundColor: '#FEF3C7',
                              color: '#92400E',
                              fontWeight: 800,
                              fontSize: '0.72rem',
                              border: '1px solid #F59E0B',
                            }}
                          />
                        )}
                      </Stack>
                      <Typography variant="caption" sx={{ color: '#64748B' }}>
                        Booked on {new Date(ord.createdAt).toLocaleString()}
                      </Typography>
                    </Box>

                    {/* Payment Status Badge */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {isPaid ? (
                        <Chip
                          icon={<CheckCircleIcon sx={{ fontSize: 16, color: '#16A34A !important' }} />}
                          label="Payment Completed"
                          sx={{
                            backgroundColor: '#DCFCE7',
                            color: '#15803D',
                            fontWeight: 900,
                            fontSize: '0.8rem',
                            border: '1px solid #86EFAC',
                          }}
                        />
                      ) : (
                        <Chip
                          icon={<PendingActionsIcon sx={{ fontSize: 16, color: '#B45309 !important' }} />}
                          label="Payment Pending (Saved)"
                          sx={{
                            backgroundColor: '#FEF3C7',
                            color: '#B45309',
                            fontWeight: 900,
                            fontSize: '0.8rem',
                            border: '1px solid #FCD34D',
                          }}
                        />
                      )}
                    </Box>
                  </Box>

                  {/* Order Content */}
                  <Box sx={{ p: { xs: 1.5, sm: 2.5 } }}>
                    {/* MOBILE VIEW (< sm): Clean Compact Item Cards (Zero Horizontal Scroll) */}
                    <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
                      {(ord.items || []).map((item, idx) => (
                        <Box
                          key={idx}
                          sx={{
                            p: 1.4,
                            mb: 1,
                            borderRadius: 2,
                            backgroundColor: '#F8FAFC',
                            border: '1px solid #E2E8F0',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <Box sx={{ pr: 1, flex: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 800, color: '#0F172A', fontSize: '0.88rem', lineHeight: 1.25 }}>
                              {item.productName}
                            </Typography>
                            {item.tamilName && (
                              <Typography variant="caption" sx={{ color: '#B45309', fontWeight: 700, display: 'block', fontSize: '0.74rem' }}>
                                {item.tamilName}
                              </Typography>
                            )}
                            <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mt: 0.3 }}>
                              ₹{item.unitPrice} × {item.quantity} box(es)
                            </Typography>
                          </Box>

                          <Box sx={{ textAlign: 'right', minWidth: 70 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#16A34A', fontSize: '0.98rem' }}>
                              ₹{item.totalPrice}
                            </Typography>
                            <Chip size="small" label={`${item.quantity} box`} sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700, mt: 0.3 }} />
                          </Box>
                        </Box>
                      ))}
                    </Box>

                    {/* DESKTOP VIEW (>= sm): Full Table */}
                    <TableContainer sx={{ display: { xs: 'none', sm: 'block' }, overflowX: 'auto' }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 700, color: '#64748B' }}>Cracker Item</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700, color: '#64748B' }}>Quantity</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700, color: '#64748B' }}>Price</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700, color: '#64748B' }}>Total</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {(ord.items || []).map((item, idx) => (
                            <TableRow key={idx} hover>
                              <TableCell sx={{ fontWeight: 700, color: '#0F172A' }}>
                                {item.productName}
                                {item.tamilName && (
                                  <Typography variant="caption" sx={{ color: '#B45309', display: 'block', fontWeight: 600 }}>
                                    {item.tamilName}
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell align="center">
                                <Chip size="small" label={`${item.quantity} boxes`} sx={{ fontWeight: 700 }} />
                              </TableCell>
                              <TableCell align="right" sx={{ color: '#64748B', fontWeight: 600 }}>
                                ₹{item.unitPrice}
                              </TableCell>
                              <TableCell align="right" sx={{ fontWeight: 800, color: '#16A34A' }}>
                                ₹{item.totalPrice}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>

                    <Divider sx={{ my: 2 }} />

                    {/* Order Footer & Actions */}
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        justifyContent: 'space-between',
                        alignItems: { xs: 'stretch', sm: 'center' },
                        gap: 2,
                      }}
                    >
                      <Box sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
                        <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                          Total Booking Amount (Zero Delivery Fee):
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 900, color: '#0F172A' }}>
                          ₹{ord.totalAmount}
                        </Typography>
                      </Box>

                      {/* Action buttons (Clean vibrant theme, full width on mobile) */}
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="stretch">
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<ShoppingCartCheckoutIcon />}
                          onClick={() => handleLoadToCart(ord)}
                          sx={{
                            borderColor: '#0284C7',
                            color: '#0284C7',
                            fontWeight: 800,
                            textTransform: 'none',
                            borderRadius: 2,
                            width: { xs: '100%', sm: 'auto' },
                            '&:hover': { backgroundColor: '#F0F9FF' },
                          }}
                        >
                          Load Items to Cart
                        </Button>

                        {!isPaid && (
                          <Button
                            size="small"
                            variant="contained"
                            disabled={payingOrderId === (ord.orderId || ord.OrderId)}
                            startIcon={
                              payingOrderId === (ord.orderId || ord.OrderId) ? (
                                <CircularProgress size={16} sx={{ color: '#0B132B' }} />
                              ) : (
                                <PaymentIcon />
                              )
                            }
                            onClick={() => handlePayNow(ord)}
                            sx={{
                              backgroundColor: '#FFA000',
                              color: '#0B132B',
                              fontWeight: 900,
                              textTransform: 'none',
                              borderRadius: 2,
                              width: { xs: '100%', sm: 'auto' },
                              '&:hover': { backgroundColor: '#FF8F00' },
                            }}
                          >
                            Pay Now (₹{ord.totalAmount})
                          </Button>
                        )}

                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<PersonIcon />}
                          onClick={() => {
                            if (onOpenPersonPage) {
                              onOpenPersonPage(
                                customer || {
                                  customerName: ord.customerName,
                                  mobileNumber: ord.customerPhone,
                                  address: ord.deliveryAddress,
                                }
                              )
                            }
                          }}
                          sx={{
                            borderColor: '#0284C7',
                            color: '#0284C7',
                            backgroundColor: '#F0F9FF',
                            fontWeight: 800,
                            textTransform: 'none',
                            borderRadius: 2,
                            width: { xs: '100%', sm: 'auto' },
                            '&:hover': { backgroundColor: '#E0F2FE', borderColor: '#0369A1' },
                          }}
                        >
                          👤 Person Page
                        </Button>

                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<DownloadIcon />}
                          onClick={() => handleDownloadInvoice(ord)}
                          sx={{
                            borderColor: '#CBD5E1',
                            color: '#475569',
                            fontWeight: 700,
                            textTransform: 'none',
                            borderRadius: 2,
                            width: { xs: '100%', sm: 'auto' },
                            '&:hover': { backgroundColor: '#F8FAFC' },
                          }}
                        >
                          Invoice
                        </Button>
                      </Stack>
                    </Box>
                  </Box>
                </Paper>
              )
            })}
          </Stack>
        ) : searched && !loading && !errorMsg ? (
          <Paper elevation={0} sx={{ p: { xs: 2.5, sm: 3.5 }, textAlign: 'center', borderRadius: 3, border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF' }}>
            <Box
              sx={{
                width: 54,
                height: 54,
                borderRadius: '50%',
                backgroundColor: '#FEF3C7',
                color: '#B45309',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px',
              }}
            >
              <ReceiptLongIcon sx={{ fontSize: 28 }} />
            </Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0B132B', mb: 0.8 }}>
              {customer ? `Verified Account: ${customer.customerName}` : 'No Bookings Found'}
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748B', mb: 2.5, maxWidth: 500, mx: 'auto', lineHeight: 1.6 }}>
              {customer ? (
                <span>
                  Your address details are verified in our database! However, no crackers bookings have been placed yet under <strong>+91 {customer.mobileNumber}</strong>. You can choose crackers from our catalog and book now!
                </span>
              ) : (
                `No previous bookings or customer account found for +91 ${mobileNumber}.`
              )}
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="center" alignItems="center">
              {onOpenShop && (
                <Button
                  variant="contained"
                  onClick={() => {
                    if (onClose) onClose()
                    onOpenShop(customer)
                  }}
                  sx={{
                    background: 'linear-gradient(135deg, #FFA000 0%, #FF8F00 100%)',
                    color: '#0B132B',
                    fontWeight: 900,
                    fontSize: '0.88rem',
                    py: 1,
                    px: 3,
                    borderRadius: '24px',
                    boxShadow: '0 4px 14px rgba(255, 160, 0, 0.35)',
                    textTransform: 'none',
                    width: { xs: '100%', sm: 'auto' },
                    '&:hover': { backgroundColor: '#FF8F00' },
                  }}
                >
                  Explore Crackers Catalog & Shop →
                </Button>
              )}

              {customer && cart && cart.length > 0 && onProceedToCheckout && (
                <Button
                  variant="contained"
                  onClick={() => {
                    if (onClose) onClose()
                    onProceedToCheckout(customer)
                  }}
                  sx={{
                    background: 'linear-gradient(135deg, #15803D 0%, #16A34A 100%)',
                    color: '#FFFFFF',
                    fontWeight: 900,
                    fontSize: '0.88rem',
                    py: 1,
                    px: 3,
                    borderRadius: '24px',
                    boxShadow: '0 4px 14px rgba(22, 163, 74, 0.35)',
                    textTransform: 'none',
                    width: { xs: '100%', sm: 'auto' },
                    '&:hover': { background: 'linear-gradient(135deg, #166534 0%, #15803D 100%)' },
                  }}
                >
                  Book Current Cart ({cart.reduce((s, i) => s + i.quantity, 0)} boxes) →
                </Button>
              )}
            </Stack>
          </Paper>
        ) : null}

        {/* Mobile Back / Close Button */}
        <Box sx={{ mt: 3, textAlign: 'center', display: { xs: 'block', sm: 'none' } }}>
          <Button
            variant="outlined"
            fullWidth
            onClick={onClose}
            sx={{
              borderColor: '#CBD5E1',
              color: '#0B132B',
              fontWeight: 800,
              py: 1,
              borderRadius: 2,
              textTransform: 'none',
            }}
          >
            ← Close & Go Back
          </Button>
        </Box>
      </DialogContent>

      {/* Right-Click Context Menu */}
      <Menu
        open={contextMenu !== null}
        onClose={handleCloseContextMenu}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
      >
        {/* Continue Payment if payment is pending */}
        {((contextMenu?.ord && contextMenu.ord.paymentStatus?.toLowerCase() !== 'completed' && contextMenu.ord.paymentStatus?.toLowerCase() !== 'paid') ||
          (!contextMenu?.ord && orders.some(o => o.paymentStatus?.toLowerCase() !== 'completed' && o.paymentStatus?.toLowerCase() !== 'paid'))) && (
          <MenuItem
            onClick={() => {
              const pendingOrd = contextMenu?.ord || orders.find(o => o.paymentStatus?.toLowerCase() !== 'completed' && o.paymentStatus?.toLowerCase() !== 'paid')
              handleCloseContextMenu()
              if (pendingOrd) handlePayNow(pendingOrd)
            }}
            sx={{ backgroundColor: '#FFFBEB', color: '#B45309', fontWeight: 800, borderLeft: '4px solid #FFA000' }}
          >
            <ListItemIcon>
              <PaymentIcon fontSize="small" sx={{ color: '#B45309' }} />
            </ListItemIcon>
            <ListItemText
              primary="💳 Continue Payment Online (Pending)"
              secondary="Instant Razorpay UPI / Cards Gateway"
            />
          </MenuItem>
        )}

        <MenuItem
          onClick={() => {
            const ord = contextMenu?.ord || (orders && orders[0])
            setQuickOrder(ord || {
              orderNumber: 'SAVED-DRAFT',
              customerName: contextMenu?.cust?.customerName || customer?.customerName,
              customerPhone: contextMenu?.cust?.mobileNumber || customer?.mobileNumber,
              deliveryAddress: contextMenu?.cust?.address || customer?.address,
              items: (cart || []).map(i => ({ productName: i.product?.name, quantity: i.quantity, unitPrice: i.product?.discountPrice, totalPrice: i.product?.discountPrice * i.quantity })),
              totalAmount: (cart || []).reduce((s, i) => s + (i.product?.discountPrice || 0) * i.quantity, 0),
              paymentStatus: 'Pending',
            })
            setQuickDetailsOpen(true)
            handleCloseContextMenu()
          }}
        >
          <ListItemIcon>
            <ReceiptLongIcon fontSize="small" sx={{ color: '#0284C7' }} />
          </ListItemIcon>
          <ListItemText
            primary="👁️ View Details (Products, Saved Orders & Payment)"
            secondary="Quick inspection popup"
          />
        </MenuItem>

        <MenuItem
          onClick={() => {
            const c = contextMenu?.cust || customer
            handleCloseContextMenu()
            if (onOpenPersonPage && c) onOpenPersonPage(c)
          }}
        >
          <ListItemIcon>
            <PersonIcon fontSize="small" sx={{ color: '#0284C7' }} />
          </ListItemIcon>
          <ListItemText
            primary={`Open ${contextMenu?.cust?.customerName || customer?.customerName || 'Customer'}'s Full Hub`}
            secondary="Selected Products, Saved Orders & Payment Status"
          />
        </MenuItem>

        <MenuItem
          onClick={() => {
            const c = contextMenu?.cust || customer
            handleCloseContextMenu()
            if (onOpenShop && c) onOpenShop(c)
          }}
        >
          <ListItemIcon>
            <ShoppingCartCheckoutIcon fontSize="small" sx={{ color: '#FFA000' }} />
          </ListItemIcon>
          <ListItemText primary="Select Products from Catalog" />
        </MenuItem>

        {contextMenu?.ord && (
          <MenuItem
            onClick={() => {
              const ord = contextMenu.ord
              handleCloseContextMenu()
              handleDownloadInvoice(ord)
            }}
          >
            <ListItemIcon>
              <DownloadIcon fontSize="small" sx={{ color: '#16A34A' }} />
            </ListItemIcon>
            <ListItemText primary="Download Tax Invoice" />
          </MenuItem>
        )}
      </Menu>

      {/* QUICK INSPECTION DIALOG (Payment Status, Product Details & Saved Products) */}
      <Dialog
        open={quickDetailsOpen}
        onClose={() => setQuickDetailsOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 900, color: '#0B132B' }}>
              Customer Details & Payment Status
            </Typography>
            <IconButton size="small" onClick={() => setQuickDetailsOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Customer info */}
          <Paper elevation={0} sx={{ p: 2, backgroundColor: '#F8FAFC', borderRadius: 2, mb: 2, border: '1px solid #E2E8F0' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0B132B' }}>
              {customer?.customerName || quickOrder?.customerName || 'Customer'}
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748B' }}>
              📞 +91 {customer?.mobileNumber || quickOrder?.customerPhone || mobileNumber}
            </Typography>
            <Typography variant="caption" sx={{ color: '#475569', display: 'block', mt: 0.5 }}>
              📍 {customer?.address || quickOrder?.deliveryAddress || 'Tamil Nadu, India'}
            </Typography>
          </Paper>

          {/* 1. Payment Status Box with Continue Payment button */}
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 2,
              mb: 2.5,
              backgroundColor:
                (quickOrder?.paymentStatus?.toLowerCase() === 'completed' || quickOrder?.paymentStatus?.toLowerCase() === 'paid')
                  ? '#DCFCE7'
                  : '#FEF3C7',
              border:
                (quickOrder?.paymentStatus?.toLowerCase() === 'completed' || quickOrder?.paymentStatus?.toLowerCase() === 'paid')
                  ? '1.5px solid #86EFAC'
                  : '1.5px solid #FCD34D',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', color: '#64748B' }}>
                  Payment Status:
                </Typography>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 900,
                    color:
                      (quickOrder?.paymentStatus?.toLowerCase() === 'completed' || quickOrder?.paymentStatus?.toLowerCase() === 'paid')
                        ? '#15803D'
                        : '#B45309',
                  }}
                >
                  {(quickOrder?.paymentStatus?.toLowerCase() === 'completed' || quickOrder?.paymentStatus?.toLowerCase() === 'paid')
                    ? '✔ PAYMENT COMPLETED'
                    : '⚠️ PAYMENT PENDING (ONLINE DUE)'}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 800, color: '#0B132B' }}>
                  Amount: ₹{quickOrder?.totalAmount || 0}
                </Typography>
              </Box>

              {!(quickOrder?.paymentStatus?.toLowerCase() === 'completed' || quickOrder?.paymentStatus?.toLowerCase() === 'paid') && (
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => {
                    setQuickDetailsOpen(false)
                    if (quickOrder) handlePayNow(quickOrder)
                  }}
                  startIcon={<PaymentIcon />}
                  sx={{
                    backgroundColor: '#FFA000',
                    color: '#0B132B',
                    fontWeight: 900,
                    borderRadius: 2,
                    textTransform: 'none',
                    py: 0.8,
                    px: 2,
                    boxShadow: '0 2px 10px rgba(255, 160, 0, 0.4)',
                    '&:hover': { backgroundColor: '#FF8F00' },
                  }}
                >
                  Continue Payment →
                </Button>
              )}
            </Box>
          </Paper>

          {/* 2. Selected Products (Current Cart) */}
          {cart && cart.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0284C7', mb: 1 }}>
                🛒 Selected Products (Active Cart - {cart.reduce((s, i) => s + i.quantity, 0)} boxes):
              </Typography>
              <Paper elevation={0} sx={{ p: 1.5, backgroundColor: '#F0F9FF', borderRadius: 2, border: '1px solid #BAE6FD' }}>
                {cart.map((item, idx) => (
                  <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.4, borderBottom: '1px solid #E0F2FE' }}>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                      {item.product?.name || item.name}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: '#0284C7' }}>
                      {item.quantity} box(es) × ₹{item.product?.discountPrice || item.price}
                    </Typography>
                  </Box>
                ))}
              </Paper>
            </Box>
          )}

          {/* 3. Saved Products (From Database) */}
          {quickOrder?.items && quickOrder.items.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#16A34A', mb: 1 }}>
                📦 Saved Products (Booking #{quickOrder.orderNumber}):
              </Typography>
              <Paper elevation={0} sx={{ p: 1.5, backgroundColor: '#F8FAFC', borderRadius: 2, border: '1px solid #E2E8F0' }}>
                {quickOrder.items.map((it, idx) => (
                  <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.4, borderBottom: '1px solid #EDF2F7' }}>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#0B132B' }}>
                      {it.productName}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: '#16A34A' }}>
                      {it.quantity} box(es) - ₹{it.totalPrice || it.unitPrice * it.quantity}
                    </Typography>
                  </Box>
                ))}
              </Paper>
            </Box>
          )}

          <Stack direction="row" spacing={1.5} justifyContent="flex-end" sx={{ mt: 2.5 }}>
            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                if (quickOrder) handleDownloadInvoice(quickOrder)
              }}
              startIcon={<DownloadIcon />}
              sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
            >
              Tax Bill
            </Button>
            <Button
              variant="contained"
              size="small"
              onClick={() => {
                setQuickDetailsOpen(false)
                if (onOpenPersonPage && (customer || quickOrder)) {
                  onOpenPersonPage(customer || { customerName: quickOrder.customerName, mobileNumber: quickOrder.customerPhone, address: quickOrder.deliveryAddress })
                }
              }}
              sx={{
                backgroundColor: '#0B132B',
                color: '#FFA000',
                fontWeight: 900,
                borderRadius: 2,
                textTransform: 'none',
              }}
            >
              Open Full Hub →
            </Button>
          </Stack>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}
