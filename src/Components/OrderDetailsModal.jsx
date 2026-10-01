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

export default function OrderDetailsModal({
  open,
  onClose,
  initialMobile = '',
  onRestoreCart,
  onOpenShop,
}) {
  const [mobileNumber, setMobileNumber] = useState(initialMobile || '')
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [customer, setCustomer] = useState(null)
  const [orders, setOrders] = useState([])
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [payingOrderId, setPayingOrderId] = useState(null)

  useEffect(() => {
    if (open && initialMobile && initialMobile.length === 10) {
      setMobileNumber(initialMobile)
      handleSearch(initialMobile)
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

      const combinedOrders = Array.from(ordersMap.values()).sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      )

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
        setErrorMsg(`No saved bookings or orders found for +91 ${cleanPhone}.`)
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

  // Invoice download generator
  const handleDownloadInvoice = (order) => {
    const text = `========================================
SKYFIRE CRACKERS - OFFICIAL BOOKING INVOICE
Direct From Sivakasi Factories Wholesale
Booking ID: ${order.orderNumber}
Date: ${new Date(order.createdAt).toLocaleString()}
Customer: ${order.customerName || 'Valued Customer'}
Phone: ${order.customerPhone || 'N/A'}
Delivery Address: ${order.deliveryAddress || 'N/A'}
Payment Method: ${order.paymentMethod || 'COD'}
Payment Status: ${order.paymentStatus || 'Pending'}
========================================
ITEMS ORDERED:
${(order.items || []).map((i) => `- ${i.productName} (Qty: ${i.quantity}) - ₹${i.totalPrice || (i.unitPrice * i.quantity)}`).join('\n')}

Subtotal: ₹${order.subTotal || order.totalAmount}
Discount: -₹${order.discountAmount || 0}
Delivery Charges: FREE (₹0)
TOTAL AMOUNT: ₹${order.totalAmount}
========================================
Happy & Safe Celebrations!
SkyFire Crackers Sivakasi
========================================`

    const element = document.createElement('a')
    const file = new Blob([text], { type: 'text/plain' })
    element.href = URL.createObjectURL(file)
    element.download = `Invoice_${order.orderNumber}.txt`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: 'hidden',
          backgroundColor: '#F8FAFC',
          maxHeight: '90vh',
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          backgroundColor: '#0B132B',
          color: '#FFFFFF',
          px: { xs: 2.5, sm: 3.5 },
          py: 2.2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '3px solid #FFA000',
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 160, 0, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ReceiptLongIcon sx={{ color: '#FFA000', fontSize: 24 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, fontSize: { xs: '1rem', sm: '1.2rem' } }}>
              Order Details & Saved Bookings (ஆர்டர் விபரங்கள்)
            </Typography>
            <Typography variant="caption" sx={{ color: '#94A3B8' }}>
              Retrieve your crackers, live payment status & transport dispatch details
            </Typography>
          </Box>
        </Stack>

        <IconButton onClick={onClose} size="small" sx={{ color: '#94A3B8', '&:hover': { color: '#FFFFFF' } }}>
          <CloseIcon />
        </IconButton>
      </Box>

      <DialogContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
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
            Enter Customer 10-Digit Mobile Number to Retrieve Bookings:
          </Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <TextField
              fullWidth
              size="small"
              placeholder="e.g. 7448849672"
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
              {loading ? 'Searching DB...' : 'Find My Orders'}
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
            sx={{
              p: 2.5,
              borderRadius: 2.5,
              backgroundColor: '#FFFFFF',
              border: '1px solid #BAE6FD',
              mb: 3,
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <PersonIcon sx={{ color: '#0284C7' }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0B132B' }}>
                  {customer.customerName}
                </Typography>
              </Stack>
              <Chip
                label={`+91 ${customer.mobileNumber}`}
                sx={{ backgroundColor: '#E0F2FE', color: '#0369A1', fontWeight: 800 }}
              />
            </Box>

            <Stack direction="row" spacing={1} alignItems="flex-start">
              <LocationOnIcon sx={{ color: '#64748B', fontSize: 18, mt: 0.2 }} />
              <Typography variant="body2" sx={{ color: '#475569' }}>
                {customer.address}
              </Typography>
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
                  sx={{
                    borderRadius: 2.5,
                    border: '1.5px solid #E2E8F0',
                    backgroundColor: '#FFFFFF',
                    overflow: 'hidden',
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
                  <Box sx={{ p: 2.5 }}>
                    <TableContainer>
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

                    <Divider sx={{ my: 2 }} />

                    {/* Order Footer & Actions */}
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 2,
                      }}
                    >
                      <Box>
                        <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                          Total Booking Amount (Zero Delivery Fee):
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 900, color: '#0B132B' }}>
                          ₹{ord.totalAmount}
                        </Typography>
                      </Box>

                      {/* Action buttons */}
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="center">
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
                              '&:hover': { backgroundColor: '#FF8F00' },
                            }}
                          >
                            Pay Now (₹{ord.totalAmount})
                          </Button>
                        )}

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
          <Paper elevation={0} sx={{ p: 4, textAlign: 'center', borderRadius: 3, border: '1px solid #E2E8F0' }}>
            <Typography variant="body1" sx={{ color: '#64748B', mb: 2 }}>
              No bookings found for this mobile number.
            </Typography>
            {onOpenShop && (
              <Button variant="contained" onClick={onOpenShop} sx={{ backgroundColor: '#0B132B', color: '#FFA000', fontWeight: 800 }}>
                Explore Crackers Catalog
              </Button>
            )}
          </Paper>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
