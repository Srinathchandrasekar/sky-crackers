import React, { useState, useEffect } from 'react'
import {
  Box,
  Container,
  Grid,
  Typography,
  Paper,
  TextField,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Button,
  Divider,
  Stack,
  InputAdornment,
  Alert,
  Chip,
  CircularProgress,
} from '@mui/material'
import { createOrderApi, saveCustomerApi } from '../services/api'
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined'
import LockIcon from '@mui/icons-material/Lock'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import AccountBalanceIcon from '@mui/icons-material/AccountBalance'
import CreditCardIcon from '@mui/icons-material/CreditCard'
import QrCode2Icon from '@mui/icons-material/QrCode2'
import LocalAtmIcon from '@mui/icons-material/LocalAtm'
import SaveIcon from '@mui/icons-material/Save'

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

export default function CheckoutPage({
  cart,
  customerData,
  onBackToCart,
  onPlaceOrder,
}) {
  const [formData, setFormData] = useState({
    fullName: customerData?.fullName || customerData?.customerName || '',
    mobileNumber: customerData?.mobileNumber || '',
    address: customerData
      ? (customerData.address || [customerData.doorNumber, customerData.streetName, customerData.area, customerData.city, customerData.district]
          .filter(Boolean)
          .join(', ') + (customerData.pinCode || customerData.pincode ? ` - ${customerData.pinCode || customerData.pincode}` : ''))
      : '',
    city: customerData?.city || '',
    pincode: customerData?.pinCode || customerData?.pincode || '',
  })

  useEffect(() => {
    if (customerData) {
      setFormData({
        fullName: customerData.fullName || customerData.customerName || '',
        mobileNumber: customerData.mobileNumber || '',
        address: customerData.address || [customerData.doorNumber, customerData.streetName, customerData.area, customerData.city, customerData.district]
          .filter(Boolean)
          .join(', ') + (customerData.pinCode || customerData.pincode ? ` - ${customerData.pinCode || customerData.pincode}` : ''),
        city: customerData.city || '',
        pincode: customerData.pinCode || customerData.pincode || '',
      })
    }
  }, [customerData])

  const [paymentMethod, setPaymentMethod] = useState('razorpay')
  const [errorMsg, setErrorMsg] = useState('')

  // Calculations (Zero delivery fee!)
  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = cart.reduce((sum, item) => sum + (item.product.discountPrice || 0) * item.quantity, 0)
  const discount = 0
  const deliveryCharges = 0
  const totalAmount = subtotal

  const handleInputChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }))
    setErrorMsg('')
  }

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmitOrder = async (e) => {
    e.preventDefault()
    if (isSubmitting) return

    if (cart.length === 0) {
      setErrorMsg('Your cart is empty. Please add crackers before placing an order.')
      return
    }

    if (!formData.fullName.trim() || !formData.mobileNumber.trim() || !formData.address.trim()) {
      setErrorMsg('Please provide your complete customer name, mobile number, and delivery address.')
      return
    }

    setIsSubmitting(true)
    setErrorMsg('')

    try {
      let custId = customerData?.customerId || customerData?.CustomerId

      // If customerId is not yet saved, save customer directly to SQL Server first
      if (!custId) {
        const custRes = await saveCustomerApi({
          fullName: formData.fullName.trim(),
          mobileNumber: formData.mobileNumber.trim(),
          doorNumber: customerData?.doorNumber || '1',
          streetName: customerData?.streetName || formData.address,
          area: customerData?.area || formData.city || 'Locality',
          city: formData.city || customerData?.city || 'Tirunelveli',
          district: customerData?.district || formData.city || 'Tirunelveli',
          state: customerData?.state || 'Tamil Nadu',
          pincode: formData.pincode || customerData?.pincode || '627001',
          agreePrivacy: true,
        })
        custId = custRes?.data?.customerId || custRes?.data?.CustomerId || custRes?.Data?.CustomerId
      }

      // Format items with real database Product IDs for SQL Server
      const itemsPayload = cart.map((item) => {
        const pId = Number(
          item.product.productId ||
          item.product.ProductId ||
          item.product.sno ||
          parseInt(String(item.product.id || '').replace(/\D/g, ''), 10) ||
          1
        )
        return {
          productId: pId,
          quantity: item.quantity,
        }
      })

      // If Razorpay gateway is selected, load Razorpay and open payment popup
      if (paymentMethod === 'razorpay') {
        const isLoaded = await loadRazorpayScript()
        if (!isLoaded) {
          setErrorMsg('Failed to load Razorpay SDK. Please check your internet or select Cash on Delivery / UPI.')
          setIsSubmitting(false)
          return
        }

        const rzpKey = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_TihKhwOYL8AwVm'

        const rzpOptions = {
          key: rzpKey,
          amount: Math.round(totalAmount * 100),
          currency: 'INR',
          name: 'Sky Fire Crackers',
          description: `Diwali Crackers Booking (${totalItemsCount} items)`,
          prefill: {
            name: formData.fullName,
            contact: formData.mobileNumber,
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
              // Transactionally save order to SQL Server after payment confirmation
              const orderRes = await createOrderApi({
                customerId: Number(custId),
                paymentMethod: 'RAZORPAY',
                notes: `Razorpay Payment ID: ${response.razorpay_payment_id || 'CONFIRMED'}`,
                items: itemsPayload,
              })

              const orderSummary = {
                orderId: orderRes.orderNumber,
                customer: {
                  name: orderRes.customerName || formData.fullName,
                  phone: orderRes.customerPhone || formData.mobileNumber,
                  address: orderRes.deliveryAddress || formData.address,
                },
                paymentMethod: `Razorpay Confirmed (${response.razorpay_payment_id})`,
                items: cart,
                subtotal: orderRes.subTotal || subtotal,
                discount: orderRes.discountAmount || discount,
                delivery: orderRes.deliveryFee || deliveryCharges,
                total: orderRes.totalAmount || totalAmount,
              }

              setIsSubmitting(false)
              onPlaceOrder(orderSummary)
            } catch (createErr) {
              console.error('Order creation after payment error:', createErr)
              setIsSubmitting(false)
              setErrorMsg('Payment processed successfully. Payment ID: ' + response.razorpay_payment_id)
            }
          },
          modal: {
            ondismiss: function () {
              setIsSubmitting(false)
            },
          },
        }

        const rzp = new window.Razorpay(rzpOptions)
        rzp.on('payment.failed', function (resp) {
          setIsSubmitting(false)
          setErrorMsg(resp.error?.description || 'Razorpay payment was not completed.')
        })
        rzp.open()
        return
      }

      // Cash on Delivery (COD) or Direct UPI
      const orderRes = await createOrderApi({
        customerId: Number(custId),
        paymentMethod: paymentMethod.toUpperCase(),
        notes: `Festival Delivery to ${formData.city || 'Tamil Nadu'}`,
        items: itemsPayload,
      })

      const paymentLabels = {
        razorpay: 'Razorpay Secure (UPI, GPay, Cards)',
        upi: 'Direct UPI (GPay / PhonePe / Paytm)',
        card: 'Credit / Debit Card',
        netbanking: 'Net Banking',
        cod: 'Cash on Delivery',
      }

      const orderSummary = {
        orderId: orderRes.orderNumber,
        customer: {
          name: orderRes.customerName || formData.fullName,
          phone: orderRes.customerPhone || formData.mobileNumber,
          address: orderRes.deliveryAddress || formData.address,
        },
        paymentMethod: paymentLabels[paymentMethod] || paymentMethod,
        items: cart,
        subtotal: orderRes.subTotal || subtotal,
        discount: orderRes.discountAmount || discount,
        delivery: orderRes.deliveryFee || deliveryCharges,
        total: orderRes.totalAmount || totalAmount,
      }

      setIsSubmitting(false)
      onPlaceOrder(orderSummary)
    } catch (err) {
      console.error('Order creation error:', err)
      setIsSubmitting(false)
      setErrorMsg(err.message || 'Failed to place booking in database. Please check connection and stock.')
    }
  }

  // Handle saving booking & order items without immediate payment
  const handleSaveBookingOnly = async (e) => {
    if (e && e.preventDefault) e.preventDefault()
    if (isSubmitting) return

    if (cart.length === 0) {
      setErrorMsg('Your cart is empty. Please add crackers before saving booking.')
      return
    }

    if (!formData.fullName.trim() || !formData.mobileNumber.trim() || !formData.address.trim()) {
      setErrorMsg('Please provide your complete customer name, mobile number, and delivery address.')
      return
    }

    setIsSubmitting(true)
    setErrorMsg('')

    try {
      let custId = customerData?.customerId || customerData?.CustomerId

      // If customerId is not yet saved, save customer directly to SQL Server first
      if (!custId) {
        const custRes = await saveCustomerApi({
          CustomerName: formData.fullName.trim(),
          customerName: formData.fullName.trim(),
          fullName: formData.fullName.trim(),
          MobileNumber: formData.mobileNumber.trim(),
          mobileNumber: formData.mobileNumber.trim(),
          doorNumber: customerData?.doorNumber || '1',
          streetName: customerData?.streetName || formData.address,
          area: customerData?.area || formData.city || 'Locality',
          city: formData.city || customerData?.city || 'Tirunelveli',
          district: customerData?.district || formData.city || 'Tirunelveli',
          state: customerData?.state || 'Tamil Nadu',
          pinCode: formData.pincode || customerData?.pincode || '627001',
          agreePrivacy: true,
        })
        custId = custRes?.data?.customerId || custRes?.customerId || 1
      }

      // Format items with real database Product IDs for SQL Server
      const itemsPayload = cart.map((item) => {
        const pId = Number(
          item.product.productId ||
          item.product.ProductId ||
          item.product.sno ||
          parseInt(String(item.product.id || '').replace(/\D/g, ''), 10) ||
          1
        )
        return {
          productId: pId,
          quantity: item.quantity,
        }
      })

      // Transactionally save order and order items with CustomerId in SQL Server
      const orderRes = await createOrderApi({
        customerId: Number(custId),
        paymentMethod: 'SAVED_BOOKING',
        notes: `Saved booking by customer (+91 ${formData.mobileNumber})`,
        items: itemsPayload,
      })

      const orderSummary = {
        orderId: orderRes.orderNumber,
        customer: {
          name: orderRes.customerName || formData.fullName,
          phone: orderRes.customerPhone || formData.mobileNumber,
          address: orderRes.deliveryAddress || formData.address,
        },
        paymentMethod: 'Saved Booking (Pay Later / Cash on Delivery)',
        items: cart,
        subtotal: orderRes.subTotal || subtotal,
        discount: orderRes.discountAmount || discount,
        delivery: 0,
        total: orderRes.totalAmount || totalAmount,
      }

      setIsSubmitting(false)
      onPlaceOrder(orderSummary)
    } catch (err) {
      console.error('Save booking error:', err)
      setIsSubmitting(false)
      setErrorMsg(err.message || 'Failed to save booking. Please check database connection.')
    }
  }

  return (
    <Box sx={{ py: { xs: 2, md: 5 }, backgroundColor: '#F8FAFC', minHeight: '80vh' }}>
      <Container maxWidth="xl" sx={{ px: { xs: 1.5, sm: 3 } }}>
        {/* Header */}
        <Box sx={{ mb: 3, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, gap: 1.8 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={onBackToCart}
            variant="outlined"
            size="small"
            sx={{
              color: '#0B132B',
              borderColor: '#CBD5E1',
              borderRadius: 2,
              fontWeight: 700,
              textTransform: 'none',
              px: 2,
              '&:hover': {
                borderColor: '#94A3B8',
                backgroundColor: '#F1F5F9',
              },
            }}
          >
            ← Back to Shop / Products
          </Button>
          <Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                color: '#0F172A',
                fontSize: { xs: '1.35rem', md: '2.1rem' },
                mb: 0.3,
              }}
            >
              Order Review & Payment
            </Typography>
            <Typography variant="body1" sx={{ color: '#64748B', fontSize: { xs: '0.82rem', md: '0.95rem' } }}>
              Verify your parcel delivery address, review crackers breakdown & complete booking
            </Typography>
          </Box>
        </Box>

        {errorMsg && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {errorMsg}
          </Alert>
        )}

        <Grid container spacing={3.5}>
          {/* Left Column (7.5 cols): Customer Details & Full Crackers Table */}
          <Grid item xs={12} lg={7.5}>
            <Stack spacing={3}>
              {/* Section 1: Customer Details */}
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 2.5, sm: 3.5 },
                  borderRadius: 3,
                  border: '1px solid #E2E8F0',
                  backgroundColor: '#FFFFFF',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 800,
                      color: '#0F172A',
                      fontSize: '1.1rem',
                    }}
                  >
                    1. Parcel Delivery & Contact Details
                  </Typography>
                  {customerData?.customerId && (
                    <Chip
                      size="small"
                      label={`Verified Customer #${customerData.customerId}`}
                      sx={{
                        backgroundColor: '#ECFDF5',
                        color: '#065F46',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        border: '1px solid #A7F3D0',
                      }}
                    />
                  )}
                </Box>

                <Grid container spacing={2.5}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#475569', mb: 0.8, display: 'block' }}>
                      Customer Full Name *
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      value={formData.fullName}
                      onChange={handleInputChange('fullName')}
                      placeholder="Enter customer name"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          backgroundColor: '#FFFFFF',
                        },
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#475569', mb: 0.8, display: 'block' }}>
                      Primary Mobile Number *
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      value={formData.mobileNumber}
                      onChange={handleInputChange('mobileNumber')}
                      placeholder="10-digit mobile number"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          backgroundColor: '#FFFFFF',
                        },
                      }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#475569', mb: 0.8, display: 'block' }}>
                      Full Transport Delivery Address *
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      multiline
                      rows={2}
                      value={formData.address}
                      onChange={handleInputChange('address')}
                      placeholder="Door no, Street name, Area, City & Pincode"
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <LocationOnOutlinedIcon sx={{ color: '#94A3B8' }} />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          backgroundColor: '#FFFFFF',
                        },
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#475569', mb: 0.8, display: 'block' }}>
                      City / Town
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      value={formData.city}
                      onChange={handleInputChange('city')}
                      placeholder="e.g. Sivakasi / Chennai"
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#475569', mb: 0.8, display: 'block' }}>
                      PIN Code
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      value={formData.pincode}
                      onChange={handleInputChange('pincode')}
                      placeholder="6-digit PIN"
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                  </Grid>
                </Grid>
              </Paper>

              {/* Section 2: Selected Crackers & Products Breakdown Table */}
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 2.5, sm: 3.5 },
                  borderRadius: 3,
                  border: '1px solid #E2E8F0',
                  backgroundColor: '#FFFFFF',
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 800,
                      color: '#0F172A',
                      fontSize: '1.15rem',
                    }}
                  >
                    2. Selected Crackers & Products Breakdown
                  </Typography>
                  <Chip
                    size="small"
                    label={`${totalItemsCount} Total Items Selected`}
                    sx={{ fontWeight: 800, backgroundColor: '#0B132B', color: '#FFA000' }}
                  />
                </Box>

                {/* Items List with details & qty */}
                <Stack spacing={1.5} sx={{ mb: 2.5 }}>
                  {cart.map((item) => (
                    <Box
                      key={item.product.id}
                      sx={{
                        p: { xs: 1.2, sm: 1.5 },
                        borderRadius: 2,
                        backgroundColor: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: { xs: 1, sm: 2 },
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.2, sm: 2 }, minWidth: 0, flex: 1 }}>
                        <Box
                          component="img"
                          src={item.product.image}
                          alt={item.product.name}
                          sx={{
                            width: { xs: 46, sm: 52 },
                            height: { xs: 46, sm: 52 },
                            borderRadius: 2,
                            objectFit: 'cover',
                            border: '1px solid #CBD5E1',
                            flexShrink: 0,
                          }}
                        />
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography
                            variant="subtitle2"
                            sx={{
                              fontWeight: 800,
                              color: '#0F172A',
                              lineHeight: 1.2,
                              fontSize: { xs: '0.85rem', sm: '0.95rem' },
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {item.product.name}
                          </Typography>
                          {(item.product.nameTamil || item.product.tamilName) && (
                            <Typography
                              variant="caption"
                              sx={{ color: '#B45309', fontWeight: 600, display: 'block', fontSize: { xs: '0.72rem', sm: '0.8rem' }, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                            >
                              {item.product.nameTamil || item.product.tamilName}
                            </Typography>
                          )}
                          <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, fontSize: { xs: '0.72rem', sm: '0.78rem' }, display: 'block' }}>
                            Qty: <strong>{item.quantity} box(es)</strong> × ₹{item.product.discountPrice}
                          </Typography>
                        </Box>
                      </Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#16A34A', whiteSpace: 'nowrap', fontSize: { xs: '0.95rem', sm: '1.1rem' }, ml: 1 }}>
                        ₹{item.product.discountPrice * item.quantity}
                      </Typography>
                    </Box>
                  ))}
                </Stack>

                <Divider sx={{ my: 2 }} />

                <Grid container spacing={2} sx={{ mb: 1 }}>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ p: 2, backgroundColor: '#F8FAFC', borderRadius: 2, border: '1px solid #E2E8F0' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" sx={{ color: '#64748B' }}>
                          Items Subtotal:
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                          ₹{subtotal.toLocaleString('en-IN')}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ color: '#64748B' }}>
                          Delivery Charges:
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#16A34A' }}>
                          FREE (Direct Factory Wholesale)
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Box
                      sx={{
                        p: 2.2,
                        backgroundColor: '#0B132B',
                        borderRadius: 2,
                        border: '2px solid #FFA000',
                        color: '#FFFFFF',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                      }}
                    >
                      <Typography variant="caption" sx={{ color: '#FFA000', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Total Order Booking Amount
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 900, color: '#FFFFFF', mt: 0.5 }}>
                        ₹{totalAmount.toLocaleString('en-IN')}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#94A3B8', mt: 0.5 }}>
                        Inclusive of all factory discounts & zero transport booking fees
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </Stack>
          </Grid>

          {/* Right Column (4.5 cols): Compact Payment Mode in Right Corner */}
          <Grid item xs={12} lg={4.5}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3,
                border: '2px solid #FFA000',
                backgroundColor: '#FFFFFF',
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.08)',
                position: 'sticky',
                top: 90,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 900,
                    color: '#0F172A',
                    fontSize: '1.1rem',
                  }}
                >
                  3. Select Payment Option
                </Typography>
                <Chip
                  size="small"
                  label="100% Safe Wholesaler"
                  color="success"
                  sx={{ fontWeight: 800, fontSize: '0.72rem' }}
                />
              </Box>

              {/* Total Payable Card */}
              <Box
                sx={{
                  p: 2,
                  mb: 2.5,
                  backgroundColor: '#0B132B',
                  borderRadius: 2,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Box>
                  <Typography variant="caption" sx={{ color: '#FFA000', fontWeight: 800, display: 'block' }}>
                    AMOUNT TO PAY
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 900, color: '#FFFFFF', lineHeight: 1.1 }}>
                    ₹{totalAmount.toLocaleString('en-IN')}
                  </Typography>
                </Box>
                <Chip
                  size="small"
                  label="Direct Sivakasi"
                  sx={{ backgroundColor: '#16A34A', color: '#FFFFFF', fontWeight: 800, fontSize: '0.75rem' }}
                />
              </Box>

              <RadioGroup
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                {/* Option 1: Razorpay Online Payment */}
                <Paper
                  elevation={0}
                  onClick={() => setPaymentMethod('razorpay')}
                  sx={{
                    p: 1.8,
                    mb: 1.5,
                    borderRadius: 2,
                    border: paymentMethod === 'razorpay' ? '2px solid #FFA000' : '1px solid #E2E8F0',
                    backgroundColor: paymentMethod === 'razorpay' ? '#FFFBEB' : '#F8FAFC',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <FormControlLabel
                    value="razorpay"
                    control={<Radio size="small" sx={{ color: '#FFA000', '&.Mui-checked': { color: '#FFA000' } }} />}
                    label={
                      <Box sx={{ ml: 0.5 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0B132B', fontSize: '0.92rem' }}>
                          Online Payment (Razorpay Secure)
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748B', display: 'block', lineHeight: 1.2 }}>
                          UPI (GPay / PhonePe / Paytm / QR), Cards, Net Banking
                        </Typography>
                      </Box>
                    }
                  />
                  <Stack direction="row" spacing={0.6} flexWrap="wrap" useFlexGap sx={{ mt: 1, ml: 3.5 }}>
                    <Chip size="small" label="UPI / GPay" sx={{ fontSize: '0.68rem', fontWeight: 600, height: 20 }} />
                    <Chip size="small" label="PhonePe" sx={{ fontSize: '0.68rem', fontWeight: 600, height: 20 }} />
                    <Chip size="small" label="Cards" sx={{ fontSize: '0.68rem', fontWeight: 600, height: 20 }} />
                    <Chip size="small" label="Net Banking" sx={{ fontSize: '0.68rem', fontWeight: 600, height: 20 }} />
                  </Stack>
                </Paper>

                {/* Option 2: Cash on Delivery (COD) */}
                <Paper
                  elevation={0}
                  onClick={() => setPaymentMethod('cod')}
                  sx={{
                    p: 1.8,
                    borderRadius: 2,
                    border: paymentMethod === 'cod' ? '2px solid #FFA000' : '1px solid #E2E8F0',
                    backgroundColor: paymentMethod === 'cod' ? '#FFFBEB' : '#F8FAFC',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <FormControlLabel
                    value="cod"
                    control={<Radio size="small" sx={{ color: '#FFA000', '&.Mui-checked': { color: '#FFA000' } }} />}
                    label={
                      <Box sx={{ ml: 0.5 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0B132B', fontSize: '0.92rem' }}>
                          Cash on Delivery (COD)
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748B', display: 'block', lineHeight: 1.2 }}>
                          Pay cash at your local Sivakasi transport parcel office
                        </Typography>
                      </Box>
                    }
                  />
                </Paper>
              </RadioGroup>

              {/* Confirm & Place Order Button */}
              <Button
                variant="contained"
                fullWidth
                disabled={isSubmitting || cart.length === 0}
                startIcon={isSubmitting ? <CircularProgress size={18} sx={{ color: '#0B132B' }} /> : <LockIcon sx={{ fontSize: 18 }} />}
                onClick={handleSubmitOrder}
                sx={{
                  mt: 2.5,
                  backgroundColor: '#FFA000',
                  color: '#0B132B',
                  fontWeight: 900,
                  fontSize: '1rem',
                  py: 1.5,
                  borderRadius: 2,
                  boxShadow: '0 4px 14px rgba(255, 160, 0, 0.35)',
                  '&:hover': {
                    backgroundColor: '#FF8F00',
                  },
                }}
              >
                {isSubmitting
                  ? 'Processing Booking in Database...'
                  : paymentMethod === 'razorpay'
                  ? `Pay ₹${totalAmount.toLocaleString('en-IN')} via Razorpay →`
                  : `Confirm Booking with COD (₹${totalAmount.toLocaleString('en-IN')}) →`}
              </Button>

              {/* Save Order Details Button */}
              <Button
                variant="outlined"
                fullWidth
                disabled={isSubmitting || cart.length === 0}
                startIcon={isSubmitting ? <CircularProgress size={18} sx={{ color: '#0B132B' }} /> : <SaveIcon sx={{ color: '#0B132B' }} />}
                onClick={handleSaveBookingOnly}
                sx={{
                  mt: 1.5,
                  borderColor: '#0B132B',
                  color: '#0B132B',
                  fontWeight: 900,
                  fontSize: '0.92rem',
                  py: 1.3,
                  borderRadius: 2,
                  borderWidth: 2,
                  backgroundColor: '#F8FAFC',
                  '&:hover': {
                    borderWidth: 2,
                    backgroundColor: '#E2E8F0',
                    borderColor: '#0B132B',
                  },
                }}
              >
                💾 Save Booking (Pay Later)
              </Button>

              <Typography variant="caption" sx={{ color: '#64748B', display: 'block', textAlign: 'center', mt: 1.2, fontSize: '0.75rem' }}>
                💡 Click <strong>Save Booking</strong> to save into database without payment now. You can retrieve it anytime using +91 {formData.mobileNumber || 'XXXXXXXXXX'}.
              </Typography>

              {/* Security note */}
              <Stack direction="row" spacing={1} alignItems="center" justifyContent="center" sx={{ mt: 2, pt: 1.5, borderTop: '1px solid #E2E8F0' }}>
                <LockOutlinedIcon sx={{ fontSize: 16, color: '#64748B' }} />
                <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.78rem' }}>
                  100% Encrypted & Safe Wholesaler Transport
                </Typography>
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  )
}
