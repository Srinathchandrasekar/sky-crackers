import React, { useState, useEffect } from 'react'
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Stack,
  Button,
  Chip,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Alert,
  CircularProgress,
  Card,
  CardContent,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import PersonIcon from '@mui/icons-material/Person'
import PhoneIcon from '@mui/icons-material/Phone'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'
import Inventory2Icon from '@mui/icons-material/Inventory2'
import PaymentIcon from '@mui/icons-material/Payment'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import PendingActionsIcon from '@mui/icons-material/PendingActions'
import DownloadIcon from '@mui/icons-material/Download'
import AddIcon from '@mui/icons-material/Add'
import RemoveIcon from '@mui/icons-material/Remove'
import DeleteIcon from '@mui/icons-material/Delete'
import RefreshIcon from '@mui/icons-material/Refresh'
import VerifiedIcon from '@mui/icons-material/Verified'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import CreditCardIcon from '@mui/icons-material/CreditCard'
import { downloadStructuredInvoice } from '../utils/invoiceGenerator'
import { lookupCustomerApi, getOrdersListApi, updateOrderStatusApi } from '../services/api'

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

export default function PersonOrdersPage({
  person,
  cart = [],
  onUpdateCartQuantity,
  onRemoveCartItem,
  onAddProducts,
  onCheckoutCart,
  onBack,
}) {
  const [loading, setLoading] = useState(true)
  const [customer, setCustomer] = useState(person || null)
  const [savedOrders, setSavedOrders] = useState([])
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [payingOrderId, setPayingOrderId] = useState(null)

  const phone = person?.mobileNumber || person?.customerPhone || person?.phone || ''

  useEffect(() => {
    if (phone) {
      loadPersonData(phone)
    } else {
      setLoading(false)
    }
  }, [phone])

  const loadPersonData = async (targetPhone = phone) => {
    const cleanPhone = (targetPhone || '').replace(/\D/g, '').slice(-10)
    if (!cleanPhone) {
      setLoading(false)
      return
    }

    setLoading(true)
    setErrorMsg('')

    try {
      const [lookupRes, ordersRes] = await Promise.all([
        lookupCustomerApi(cleanPhone).catch(() => null),
        getOrdersListApi({ search: cleanPhone }).catch(() => []),
      ])

      if (lookupRes && lookupRes.customer) {
        setCustomer((prev) => ({ ...prev, ...lookupRes.customer }))
      }

      const ordersMap = new Map()

      if (Array.isArray(ordersRes)) {
        ordersRes.forEach((o) => {
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

      // Check local storage fallback
      try {
        const localSaved = JSON.parse(localStorage.getItem('skycrackers_orders_history') || '[]')
        localSaved.forEach((lo) => {
          const loPhone = (lo.customerPhone || '').replace(/\D/g, '')
          if (loPhone.includes(cleanPhone) && lo.orderNumber && !ordersMap.has(lo.orderNumber)) {
            ordersMap.set(lo.orderNumber, lo)
          }
        })
      } catch (locErr) {
        console.warn('Local storage fallback error:', locErr)
      }

      const combined = Array.from(ordersMap.values()).sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      )

      setSavedOrders(combined)

      if (!customer && combined.length > 0) {
        setCustomer({
          customerName: combined[0].customerName,
          mobileNumber: combined[0].customerPhone,
          address: combined[0].deliveryAddress,
        })
      }
    } catch (err) {
      console.error('Error loading person details:', err)
      setErrorMsg('Could not fetch updated server records. Showing cached details.')
    } finally {
      setLoading(false)
    }
  }

  // Handle Pay Now with Razorpay
  const handlePayNow = async (order) => {
    try {
      setPayingOrderId(order.orderId || order.orderNumber)
      setErrorMsg('')

      const scriptLoaded = await loadRazorpayScript()
      if (!scriptLoaded) {
        setErrorMsg('Razorpay payment gateway failed to load. Please check internet connection.')
        setPayingOrderId(null)
        return
      }

      const rzpKey = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_TihKhwOYL8AwVm'
      const amountPaise = Math.max(100, Math.round((Number(order.totalAmount) || 0) * 100))

      const options = {
        key: rzpKey,
        amount: amountPaise,
        currency: 'INR',
        name: 'SkyFire Crackers Sivakasi',
        description: `Payment for Order #${order.orderNumber || order.orderId}`,
        image: 'https://cdn-icons-png.flaticon.com/512/3595/3595455.png',
        prefill: {
          name: order.customerName || customer?.customerName || '',
          contact: order.customerPhone || customer?.mobileNumber || '',
          email: customer?.email || 'customer@skycrackers.com',
        },
        theme: {
          color: '#FFA000',
        },
        handler: async function (response) {
          try {
            await updateOrderStatusApi(order.orderId || order.orderNumber, {
              orderStatus: 'Confirmed',
              paymentStatus: 'Completed',
              paymentMethod: 'Online Razorpay',
              transactionId: response.razorpay_payment_id,
            })
            try {
              const existingOrders = JSON.parse(localStorage.getItem('skycrackers_orders_history') || '[]')
              const updated = existingOrders.map((o) => {
                if (String(o.orderId) === String(order.orderId) || String(o.orderNumber) === String(order.orderNumber)) {
                  return { ...o, paymentStatus: 'Completed', paymentMethod: 'Online Razorpay', transactionId: response.razorpay_payment_id }
                }
                return o
              })
              localStorage.setItem('skycrackers_orders_history', JSON.stringify(updated))
            } catch (lsErr) {
              console.warn('LocalStorage sync warning:', lsErr)
            }
            setSuccessMsg(`Payment Successful! Payment ID: ${response.razorpay_payment_id}`)
            loadPersonData()
          } catch (updateErr) {
            console.error('Payment sync error:', updateErr)
            setSuccessMsg(`Payment received! ID: ${response.razorpay_payment_id}`)
            loadPersonData()
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
        setErrorMsg(resp.error?.description || 'Payment could not be completed.')
      })
      rzp.open()
    } catch (err) {
      console.error('Pay now error:', err)
      setErrorMsg('Payment gateway initialization error.')
      setPayingOrderId(null)
    }
  }

  // Structured Invoice generator
  const handleDownloadInvoice = (order) => {
    downloadStructuredInvoice({
      ...order,
      customerName: order.customerName || customer?.customerName,
      customerPhone: order.customerPhone || customer?.mobileNumber,
      deliveryAddress: order.deliveryAddress || customer?.address,
      paymentStatus: order.paymentStatus || 'Pending',
      paymentMethod: order.paymentMethod || 'Online Payment (Pending / Pay Later)',
    })
  }

  // Selected Cart totals
  const cartItemCount = (cart || []).reduce((acc, item) => acc + item.quantity, 0)
  const cartSubtotal = (cart || []).reduce(
    (acc, item) => acc + (item.product?.discountPrice || item.price || 0) * item.quantity,
    0
  )
  const cartDiscount = cartSubtotal > 1500 ? 150 : cartSubtotal > 800 ? 100 : 0
  const cartFinalTotal = Math.max(0, cartSubtotal - cartDiscount)

  const personName = customer?.customerName || customer?.fullName || 'Customer'
  const personPhone = customer?.mobileNumber || customer?.customerPhone || phone || ''
  const personAddress = customer?.address || customer?.streetName || 'Tamil Nadu, India'

  return (
    <Box sx={{ minHeight: '85vh', backgroundColor: '#F8FAFC', py: { xs: 2.5, sm: 4 } }}>
      <Container maxWidth="lg" sx={{ px: { xs: 1.5, sm: 3 } }}>
        {/* Top Navigation Row */}
        <Box sx={{ mb: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={onBack}
            variant="outlined"
            size="small"
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 800,
              borderColor: '#CBD5E1',
              color: '#0B132B',
              backgroundColor: '#FFFFFF',
              px: 2,
              py: 0.6,
              '&:hover': { backgroundColor: '#F1F5F9' },
            }}
          >
            ← Back to Previous Page
          </Button>

          <Button
            startIcon={<RefreshIcon />}
            onClick={() => loadPersonData()}
            size="small"
            variant="contained"
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 800,
              backgroundColor: '#0B132B',
              color: '#FFA000',
              px: 2,
              '&:hover': { backgroundColor: '#162244' },
            }}
          >
            Refresh Data
          </Button>
        </Box>

        {/* Notifications */}
        {errorMsg && (
          <Alert severity="warning" sx={{ mb: 2.5, borderRadius: 2 }} onClose={() => setErrorMsg('')}>
            {errorMsg}
          </Alert>
        )}
        {successMsg && (
          <Alert severity="success" sx={{ mb: 2.5, borderRadius: 2 }} onClose={() => setSuccessMsg('')}>
            {successMsg}
          </Alert>
        )}

        {/* 1. CUSTOMER IDENTITY CARD */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, sm: 3.5 },
            borderRadius: 3,
            backgroundColor: '#0B132B',
            color: '#FFFFFF',
            border: '2px solid #FFA000',
            boxShadow: '0 8px 30px rgba(11, 19, 43, 0.25)',
            mb: 3.5,
          }}
        >
          <Grid container spacing={2.5} alignItems="center">
            <Grid item xs={12} sm={8}>
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255, 160, 0, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1.5px solid #FFA000',
                  }}
                >
                  <PersonIcon sx={{ color: '#FFA000', fontSize: 28 }} />
                </Box>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Typography variant="h5" sx={{ fontWeight: 900, color: '#FFFFFF' }}>
                      {personName}
                    </Typography>
                    <Chip
                      size="small"
                      icon={<VerifiedIcon sx={{ fontSize: '14px !important', color: '#16A34A !important' }} />}
                      label="Verified Customer Hub"
                      sx={{
                        backgroundColor: '#DCFCE7',
                        color: '#15803D',
                        fontWeight: 900,
                        fontSize: '0.72rem',
                      }}
                    />
                  </Box>
                  <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                    Live Customer Overview • Selected Cart Items • Saved Database Bookings • Payment Status
                  </Typography>
                </Box>
              </Stack>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 1, sm: 3 }} sx={{ mt: 2, pl: { sm: 7 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PhoneIcon sx={{ color: '#FFA000', fontSize: 18 }} />
                  <Typography variant="body2" sx={{ fontWeight: 800, color: '#FFFFFF' }}>
                    +91 {personPhone}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LocationOnIcon sx={{ color: '#FFA000', fontSize: 18 }} />
                  <Typography variant="body2" sx={{ color: '#CBD5E1' }}>
                    {personAddress}
                  </Typography>
                </Box>
              </Stack>
            </Grid>

            <Grid item xs={12} sm={4} sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
              <Stack direction={{ xs: 'row', sm: 'column' }} spacing={1} justifyContent="flex-end">
                <Button
                  variant="contained"
                  href={`tel:${personPhone}`}
                  startIcon={<PhoneIcon />}
                  size="small"
                  sx={{
                    backgroundColor: '#FFA000',
                    color: '#0B132B',
                    fontWeight: 900,
                    borderRadius: 2,
                    textTransform: 'none',
                    '&:hover': { backgroundColor: '#FF8F00' },
                  }}
                >
                  Call Customer
                </Button>
                <Button
                  variant="outlined"
                  onClick={onAddProducts}
                  startIcon={<AddIcon />}
                  size="small"
                  sx={{
                    borderColor: '#94A3B8',
                    color: '#FFFFFF',
                    fontWeight: 800,
                    borderRadius: 2,
                    textTransform: 'none',
                    '&:hover': { borderColor: '#FFFFFF', backgroundColor: 'rgba(255,255,255,0.08)' },
                  }}
                >
                  + Add More Crackers
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </Paper>

        <Grid container spacing={3.5}>
          {/* 2. SECTION: SELECTED PRODUCTS (ACTIVE CART) */}
          <Grid item xs={12} md={5}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2, sm: 3 },
                borderRadius: 3,
                border: '1.5px solid #0284C7',
                backgroundColor: '#FFFFFF',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, pb: 1.5, borderBottom: '2px solid #E0F2FE' }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <ShoppingCartIcon sx={{ color: '#0284C7' }} />
                  <Typography variant="h6" sx={{ fontWeight: 900, color: '#0B132B', fontSize: '1.1rem' }}>
                    1. Selected Products ({cartItemCount} Boxes)
                  </Typography>
                </Stack>
                <Chip
                  size="small"
                  label={cart.length > 0 ? 'Active Cart' : 'Cart Empty'}
                  sx={{
                    backgroundColor: cart.length > 0 ? '#E0F2FE' : '#F1F5F9',
                    color: cart.length > 0 ? '#0284C7' : '#64748B',
                    fontWeight: 800,
                  }}
                />
              </Box>

              {cart && cart.length > 0 ? (
                <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  <Stack spacing={1.5} sx={{ mb: 2.5, maxHeight: 380, overflowY: 'auto', pr: 0.5 }}>
                    {cart.map((item) => {
                      const p = item.product || item
                      const price = p.discountPrice || p.price || 0
                      const itemTotal = price * item.quantity

                      return (
                        <Box
                          key={p.id}
                          sx={{
                            p: 1.5,
                            borderRadius: 2,
                            backgroundColor: '#F8FAFC',
                            border: '1px solid #E2E8F0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 1.5,
                          }}
                        >
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 800, color: '#0B132B' }}>
                              {p.name}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                              ₹{price} × {item.quantity} box(es)
                            </Typography>
                          </Box>

                          {/* Quantity Controls */}
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <IconButton
                              size="small"
                              onClick={() => onUpdateCartQuantity && onUpdateCartQuantity(p.id, -1)}
                              sx={{
                                width: 26,
                                height: 26,
                                border: '1px solid #CBD5E1',
                                borderRadius: 1.5,
                              }}
                            >
                              <RemoveIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                            <Typography variant="body2" sx={{ fontWeight: 800, minWidth: 22, textAlign: 'center' }}>
                              {item.quantity}
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={() => onUpdateCartQuantity && onUpdateCartQuantity(p.id, 1)}
                              sx={{
                                width: 26,
                                height: 26,
                                border: '1px solid #CBD5E1',
                                borderRadius: 1.5,
                                backgroundColor: '#FFA000',
                                color: '#0B132B',
                                '&:hover': { backgroundColor: '#FF8F00' },
                              }}
                            >
                              <AddIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                          </Stack>

                          <Box sx={{ textAlign: 'right', minWidth: 70 }}>
                            <Typography variant="body2" sx={{ fontWeight: 900, color: '#16A34A' }}>
                              ₹{itemTotal}
                            </Typography>
                            {onRemoveCartItem && (
                              <IconButton
                                size="small"
                                onClick={() => onRemoveCartItem(p.id)}
                                sx={{ color: '#EF4444', p: 0.2 }}
                              >
                                <DeleteIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            )}
                          </Box>
                        </Box>
                      )
                    })}
                  </Stack>

                  {/* Cart Total Card */}
                  <Box sx={{ p: 2, borderRadius: 2, backgroundColor: '#F0F9FF', border: '1px solid #BAE6FD', mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2" sx={{ color: '#64748B' }}>Cart Subtotal:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>₹{cartSubtotal}</Typography>
                    </Box>
                    {cartDiscount > 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" sx={{ color: '#16A34A' }}>Discount Applied:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: '#16A34A' }}>-₹{cartDiscount}</Typography>
                      </Box>
                    )}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 1, borderTop: '1px dashed #93C5FD' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#0369A1' }}>Selected Cart Total:</Typography>
                      <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#16A34A' }}>₹{cartFinalTotal}</Typography>
                    </Box>
                  </Box>

                  {/* Checkout & Booking Actions */}
                  <Stack spacing={1.5}>
                    <Button
                      variant="contained"
                      onClick={onCheckoutCart}
                      startIcon={<PaymentIcon />}
                      fullWidth
                      sx={{
                        backgroundColor: '#FFA000',
                        color: '#0B132B',
                        fontWeight: 900,
                        py: 1.1,
                        borderRadius: 2,
                        textTransform: 'none',
                        boxShadow: '0 4px 15px rgba(255, 160, 0, 0.3)',
                        '&:hover': { backgroundColor: '#FF8F00' },
                      }}
                    >
                      Save & Book Selected Cart for {personName.split(' ')[0]} →
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={onAddProducts}
                      size="small"
                      sx={{
                        borderColor: '#CBD5E1',
                        color: '#0284C7',
                        fontWeight: 800,
                        textTransform: 'none',
                        borderRadius: 2,
                      }}
                    >
                      + Select More Crackers from Catalog
                    </Button>
                  </Stack>
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 6, px: 2 }}>
                  <ShoppingCartIcon sx={{ fontSize: 48, color: '#CBD5E1', mb: 1.5 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#475569', mb: 0.5 }}>
                    No Crackers in Current Selection
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', mb: 2.5 }}>
                    You can pick crackers from the wholesale catalog for {personName}.
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={onAddProducts}
                    startIcon={<AddIcon />}
                    size="small"
                    sx={{
                      backgroundColor: '#FFA000',
                      color: '#0B132B',
                      fontWeight: 900,
                      borderRadius: 2,
                      textTransform: 'none',
                      '&:hover': { backgroundColor: '#FF8F00' },
                    }}
                  >
                    Select Products for {personName.split(' ')[0]}
                  </Button>
                </Box>
              )}
            </Paper>
          </Grid>

          {/* 3. SECTION: SAVED PRODUCTS & PAYMENT STATUS (DATABASE ORDERS) */}
          <Grid item xs={12} md={7}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2, sm: 3 },
                borderRadius: 3,
                border: '1.5px solid #E2E8F0',
                backgroundColor: '#FFFFFF',
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, pb: 1.5, borderBottom: '2px solid #F1F5F9' }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Inventory2Icon sx={{ color: '#16A34A' }} />
                  <Typography variant="h6" sx={{ fontWeight: 900, color: '#0B132B', fontSize: '1.1rem' }}>
                    2. Saved Products & 3. Payment Status ({savedOrders.length} Bookings)
                  </Typography>
                </Stack>
                <Chip
                  size="small"
                  label="SQL Server Database"
                  sx={{ backgroundColor: '#DCFCE7', color: '#15803D', fontWeight: 800 }}
                />
              </Box>

              {loading ? (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <CircularProgress size={32} sx={{ color: '#FFA000', mb: 1.5 }} />
                  <Typography variant="body2" sx={{ color: '#64748B' }}>
                    Retrieving customer bookings from SQL database...
                  </Typography>
                </Box>
              ) : savedOrders.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6, px: 2 }}>
                  <ReceiptLongIcon sx={{ fontSize: 48, color: '#CBD5E1', mb: 1.5 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#475569', mb: 0.5 }}>
                    No Prior Bookings Recorded in DB
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', mb: 2 }}>
                    This customer has not completed an order checkout yet. Select items from the left cart to book now!
                  </Typography>
                </Box>
              ) : (
                <Stack spacing={2.5}>
                  {savedOrders.map((ord) => {
                    const isPaid =
                      ord.paymentStatus?.toLowerCase() === 'completed' ||
                      ord.paymentStatus?.toLowerCase() === 'paid' ||
                      ord.paymentStatus?.toLowerCase() === 'success'

                    const isPaying = payingOrderId === (ord.orderId || ord.orderNumber)

                    return (
                      <Paper
                        key={ord.orderNumber}
                        elevation={0}
                        sx={{
                          borderRadius: 2.5,
                          border: '1.5px solid #E2E8F0',
                          backgroundColor: '#FFFFFF',
                          overflow: 'hidden',
                          boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
                        }}
                      >
                        {/* Order Header: Booking ID & Payment Status */}
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
                            </Stack>
                            <Typography variant="caption" sx={{ color: '#64748B' }}>
                              Booked on {new Date(ord.createdAt).toLocaleString()}
                            </Typography>
                          </Box>

                          {/* PAYMENT STATUS BADGE */}
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {isPaid ? (
                              <Chip
                                icon={<CheckCircleIcon sx={{ fontSize: 16, color: '#16A34A !important' }} />}
                                label="Payment Status: COMPLETED"
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
                                label="Payment Status: PENDING / PAY LATER"
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

                        {/* SAVED PRODUCTS TABLE */}
                        <Box sx={{ p: { xs: 1.5, sm: 2 } }}>
                          <Typography variant="caption" sx={{ fontWeight: 800, color: '#475569', mb: 1, display: 'block' }}>
                            SAVED CRACKERS FOR THIS BOOKING:
                          </Typography>
                          <TableContainer sx={{ overflowX: 'auto' }}>
                            <Table size="small">
                              <TableHead sx={{ backgroundColor: '#F8FAFC' }}>
                                <TableRow>
                                  <TableCell sx={{ fontWeight: 700, color: '#64748B' }}>Product Name</TableCell>
                                  <TableCell align="center" sx={{ fontWeight: 700, color: '#64748B' }}>Quantity</TableCell>
                                  <TableCell align="right" sx={{ fontWeight: 700, color: '#64748B' }}>Unit Price</TableCell>
                                  <TableCell align="right" sx={{ fontWeight: 700, color: '#64748B' }}>Total</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {(ord.items || []).map((item, idx) => (
                                  <TableRow key={idx}>
                                    <TableCell sx={{ fontWeight: 600, color: '#0B132B' }}>
                                      {item.productName}
                                    </TableCell>
                                    <TableCell align="center">
                                      <Chip size="small" label={`${item.quantity} boxes`} sx={{ fontWeight: 700 }} />
                                    </TableCell>
                                    <TableCell align="right" sx={{ color: '#64748B' }}>
                                      ₹{item.unitPrice}
                                    </TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 700, color: '#16A34A' }}>
                                      ₹{item.totalPrice || item.unitPrice * item.quantity}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>

                          {/* Grand Total & Payment Actions Row */}
                          <Divider sx={{ my: 1.5 }} />

                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              flexWrap: 'wrap',
                              gap: 1.5,
                            }}
                          >
                            <Box>
                              <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                                Method: <strong>{ord.paymentMethod?.toLowerCase().includes('cod') ? 'Online Payment (Pending)' : (ord.paymentMethod || 'Online Payment (Pending)')}</strong>
                              </Typography>
                              <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#16A34A' }}>
                                Booking Total: ₹{ord.totalAmount}
                              </Typography>
                            </Box>

                            <Stack direction="row" spacing={1} alignItems="center">
                              {!isPaid && (
                                <Button
                                  variant="contained"
                                  size="small"
                                  disabled={isPaying}
                                  onClick={() => handlePayNow(ord)}
                                  startIcon={isPaying ? <CircularProgress size={16} sx={{ color: '#0B132B' }} /> : <CreditCardIcon />}
                                  sx={{
                                    backgroundColor: '#FFA000',
                                    color: '#0B132B',
                                    fontWeight: 900,
                                    fontSize: '0.8rem',
                                    borderRadius: 2,
                                    py: 0.6,
                                    px: 2,
                                    textTransform: 'none',
                                    '&:hover': { backgroundColor: '#FF8F00' },
                                  }}
                                >
                                  {isPaying ? 'Opening Gateway...' : 'Pay Online Now →'}
                                </Button>
                              )}

                              <Button
                                variant="outlined"
                                size="small"
                                onClick={() => handleDownloadInvoice(ord)}
                                startIcon={<DownloadIcon />}
                                sx={{
                                  borderColor: '#CBD5E1',
                                  color: '#0B132B',
                                  fontWeight: 700,
                                  fontSize: '0.8rem',
                                  borderRadius: 2,
                                  py: 0.6,
                                  px: 1.5,
                                  textTransform: 'none',
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
              )}
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  )
}
