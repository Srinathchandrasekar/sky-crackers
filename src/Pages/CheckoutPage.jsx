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
  Select,
  MenuItem,
  Tabs,
  Tab,
  Tooltip,
} from '@mui/material'
import { createOrderApi, saveCustomerApi } from '../services/api'
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined'
import LockIcon from '@mui/icons-material/Lock'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import QrCode2Icon from '@mui/icons-material/QrCode2'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import WhatsAppIcon from '@mui/icons-material/WhatsApp'
import SendIcon from '@mui/icons-material/Send'
import DownloadIcon from '@mui/icons-material/Download'
import { downloadStructuredInvoice } from '../utils/invoiceGenerator'

const TAMIL_NADU_DISTRICTS = [
  'Ariyalur',
  'Chengalpattu',
  'Chennai',
  'Coimbatore',
  'Cuddalore',
  'Dharmapuri',
  'Dindigul',
  'Erode',
  'Kallakurichi',
  'Kanchipuram',
  'Kanyakumari',
  'Karur',
  'Krishnagiri',
  'Madurai',
  'Mayiladuthurai',
  'Nagapattinam',
  'Namakkal',
  'Nilgiris (Ooty)',
  'Perambalur',
  'Pudukkottai',
  'Ramanathapuram',
  'Ranipet',
  'Salem',
  'Sivaganga',
  'Tenkasi',
  'Thanjavur',
  'Theni',
  'Thoothukudi (Tuticorin)',
  'Tiruchirappalli (Trichy)',
  'Tirunelveli',
  'Tirupathur',
  'Tiruppur',
  'Tiruvallur',
  'Tiruvannamalai',
  'Tiruvarur',
  'Vellore',
  'Viluppuram',
  'Virudhunagar (Sivakasi)',
  'Other District / State',
]

const UPI_CONFIG = {
  upiId: 'suryasrivenkatesh-1@okicici',
  payeeName: 'Sri',
  storeName: 'Sky Fire Crackers',
  bankName: 'HDFC Bank',
  whatsappPhone: '918056704353',
  displayPhone: '+91 80567 04353',
  qrImage: '/gpay_qr.png',
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
    doorNumber: customerData?.doorNumber || '',
    streetName: customerData?.streetName || '',
    area: customerData?.area || '',
    city: customerData?.city || '',
    district: customerData?.district || '',
    pincode: customerData?.pinCode || customerData?.pincode || '',
    address: customerData
      ? (customerData.address || [customerData.doorNumber, customerData.streetName, customerData.area, customerData.city, customerData.district]
          .filter(Boolean)
          .join(', ') + (customerData.pinCode || customerData.pincode ? ` - ${customerData.pinCode || customerData.pincode}` : ''))
      : '',
  })

  useEffect(() => {
    if (customerData) {
      setFormData({
        fullName: customerData.fullName || customerData.customerName || '',
        mobileNumber: customerData.mobileNumber || '',
        doorNumber: customerData.doorNumber || '',
        streetName: customerData.streetName || '',
        area: customerData.area || '',
        city: customerData.city || '',
        district: customerData.district || '',
        pincode: customerData.pinCode || customerData.pincode || '',
        address: customerData.address || [customerData.doorNumber, customerData.streetName, customerData.area, customerData.city, customerData.district]
          .filter(Boolean)
          .join(', ') + (customerData.pinCode || customerData.pincode ? ` - ${customerData.pinCode || customerData.pincode}` : ''),
      })
    }
  }, [customerData])

  const [paymentMethod, setPaymentMethod] = useState('upi') // 'upi' or 'whatsapp'
  const [utrNumber, setUtrNumber] = useState('')
  const [copiedUpi, setCopiedUpi] = useState(false)
  const [qrType, setQrType] = useState('gpay') // 'gpay' or 'dynamic'
  const [errorMsg, setErrorMsg] = useState('')

  // Calculations (Zero delivery fee!)
  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = cart.reduce((sum, item) => sum + (item.product.discountPrice || 0) * item.quantity, 0)
  const discount = 0
  const deliveryCharges = 0
  const totalAmount = subtotal

  const upiOrderId = `ORD${Date.now().toString().slice(-6)}`
  const dynamicUpiUri = `upi://pay?pa=${UPI_CONFIG.upiId}&pn=${encodeURIComponent(UPI_CONFIG.payeeName)}&am=${totalAmount}&cu=INR&tn=${encodeURIComponent(`SkyCrackers_${upiOrderId}`)}`
  const dynamicQrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(dynamicUpiUri)}`

  const handleCopyUpi = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(UPI_CONFIG.upiId)
    }
    setCopiedUpi(true)
    setTimeout(() => setCopiedUpi(false), 2500)
  }

  const handleInputChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }))
    setErrorMsg('')
  }

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmitOrder = async (e) => {
    if (e && e.preventDefault) e.preventDefault()
    if (isSubmitting) return

    if (cart.length === 0) {
      setErrorMsg('Your cart is empty. Please add crackers before placing an order.')
      return
    }

    if (!formData.fullName.trim() || !formData.mobileNumber.trim() || !formData.address.trim()) {
      setErrorMsg('Please provide your complete customer name, mobile number, and delivery address.')
      return
    }

    if (paymentMethod === 'upi') {
      const cleanUtr = utrNumber.trim()
      if (!cleanUtr) {
        setErrorMsg('Please enter your 12-digit UPI Reference / UTR Number from Google Pay or PhonePe.')
        return
      }
      if (cleanUtr.length < 6) {
        setErrorMsg('Please enter a valid 12-digit UPI Reference Number (UTR).')
        return
      }
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
          doorNumber: customerData?.doorNumber || formData.doorNumber || '1',
          streetName: customerData?.streetName || formData.streetName || formData.address,
          area: customerData?.area || formData.area || formData.city || 'Locality',
          city: formData.city || customerData?.city || 'Sivakasi',
          district: formData.district || customerData?.district || 'Virudhunagar (Sivakasi)',
          state: 'Tamil Nadu',
          pincode: formData.pincode || customerData?.pincode || '626123',
          agreePrivacy: true,
        })
        custId = custRes?.data?.customerId || custRes?.data?.CustomerId || custRes?.customerId || 1
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

      const fullAddress = [
        formData.doorNumber?.trim(),
        formData.streetName?.trim(),
        formData.area?.trim(),
        formData.city?.trim(),
        formData.district?.trim(),
        formData.pincode?.trim() ? `- ${formData.pincode.trim()}` : ''
      ].filter(Boolean).join(', ') || formData.address

      const isUpi = paymentMethod === 'upi'
      const paymentMethodLabel = isUpi ? 'UPI' : 'WHATSAPP_ENQUIRY'
      const paymentStatus = isUpi ? 'Completed' : 'Pending'
      const orderNotes = isUpi
        ? `UPI Payment - UTR: ${utrNumber.trim()} (Account: ${UPI_CONFIG.upiId})`
        : `WhatsApp Booking Enquiry - Contact: +91 ${formData.mobileNumber.trim()}`

      // Transactionally save order and order items with CustomerId in SQL Server
      const orderRes = await createOrderApi({
        customerId: Number(custId),
        customerName: formData.fullName.trim(),
        customerPhone: formData.mobileNumber.trim(),
        deliveryAddress: fullAddress,
        paymentMethod: paymentMethodLabel,
        notes: orderNotes,
        items: itemsPayload,
      })

      const orderNum = orderRes.orderNumber || `SFC-${Date.now().toString().slice(-6)}`

      // If WhatsApp enquiry, prepare WhatsApp message and open chat
      if (!isUpi) {
        const itemsListStr = cart
          .map((i, idx) => `${idx + 1}. ${i.product.name} (Qty: ${i.quantity} box) - ₹${i.product.discountPrice * i.quantity}`)
          .join('\n')
        const waText = `💥 *SKY FIRE CRACKERS - NEW BOOKING* 💥\n--------------------------------\n*Booking No:* #${orderNum}\n*Customer:* ${formData.fullName.trim()}\n*Phone:* +91 ${formData.mobileNumber.trim()}\n*Delivery Address:* ${fullAddress}\n--------------------------------\n*Crackers Ordered (${totalItemsCount} Boxes):*\n${itemsListStr}\n--------------------------------\n*Total Amount:* ₹${totalAmount.toLocaleString('en-IN')}\n*Parcel Delivery:* Pay at transport collection\n--------------------------------\nVanakkam! Please confirm my booking and share parcel dispatch details.`
        window.open(`https://wa.me/${UPI_CONFIG.whatsappPhone}?text=${encodeURIComponent(waText)}`, '_blank')
      }

      // Persist locally for instant lookup retrieval
      try {
        const existingOrders = JSON.parse(localStorage.getItem('skycrackers_orders_history') || '[]')
        existingOrders.unshift({
          orderNumber: orderNum,
          customerId: Number(custId),
          customerName: formData.fullName || orderRes.customerName || 'Valued Customer',
          customerPhone: formData.mobileNumber || orderRes.customerPhone || '',
          deliveryAddress: fullAddress || orderRes.deliveryAddress || 'Tamil Nadu, India',
          totalAmount: orderRes.totalAmount || totalAmount,
          subTotal: orderRes.subTotal || subtotal,
          paymentMethod: isUpi ? `UPI (UTR: ${utrNumber.trim()})` : 'WhatsApp Enquiry',
          paymentStatus: paymentStatus,
          orderStatus: 'Confirmed',
          notes: orderNotes,
          createdAt: new Date().toISOString(),
          items: cart.map((i) => ({
            productName: i.product.name,
            quantity: i.quantity,
            unitPrice: i.product.discountPrice,
            totalPrice: i.product.discountPrice * i.quantity,
          })),
        })
        localStorage.setItem('skycrackers_orders_history', JSON.stringify(existingOrders.slice(0, 30)))
      } catch (locErr) {
        console.warn('Local save warning:', locErr)
      }

      const orderSummary = {
        orderId: orderNum,
        customer: {
          name: orderRes.customerName || formData.fullName,
          phone: orderRes.customerPhone || formData.mobileNumber,
          address: orderRes.deliveryAddress || fullAddress,
        },
        paymentMethod: isUpi ? `Direct UPI (GPay/PhonePe - UTR: ${utrNumber.trim()})` : 'WhatsApp Enquiry (Pay Later)',
        paymentStatus: paymentStatus,
        items: cart,
        subtotal: orderRes.subTotal || subtotal,
        discount: 0,
        delivery: 0,
        total: orderRes.totalAmount || totalAmount,
      }

      // Automatically trigger download of structured invoice bill!
      try {
        downloadStructuredInvoice({
          ...orderSummary,
          orderNumber: orderNum,
          customerName: formData.fullName,
          customerPhone: formData.mobileNumber,
          deliveryAddress: fullAddress,
          createdAt: new Date().toISOString(),
        })
      } catch (invErr) {
        console.warn('Invoice auto-download error:', invErr)
      }

      setIsSubmitting(false)
      onPlaceOrder(orderSummary)
    } catch (err) {
      console.error('Order creation error:', err)
      setIsSubmitting(false)
      setErrorMsg(err.message || 'Failed to place booking in database. Please check connection and try again.')
    }
  }

  // Handle saving booking & order items via WhatsApp
  const handleSaveBookingOnly = async (e) => {
    if (e && e.preventDefault) e.preventDefault()
    setPaymentMethod('whatsapp')
    setTimeout(() => handleSubmitOrder(e), 50)
  }

  return (
    <Box sx={{ py: { xs: 2, md: 5 }, backgroundColor: '#F8FAFC', minHeight: '80vh' }}>
      <Container maxWidth="xl" sx={{ px: { xs: 1.5, sm: 3 } }}>
        {/* Header with Mobile-Optimized Back Button */}
        <Box
          sx={{
            mb: 3,
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'flex-start', sm: 'center' },
            gap: { xs: 1.5, sm: 2 },
          }}
        >
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={onBackToCart}
            variant="outlined"
            size="small"
            sx={{
              color: '#0B132B',
              borderColor: '#CBD5E1',
              borderRadius: 2,
              fontWeight: 800,
              fontSize: { xs: '0.82rem', sm: '0.88rem' },
              textTransform: 'none',
              px: 2.2,
              py: 0.8,
              minHeight: 40,
              backgroundColor: '#FFFFFF',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              '&:hover': {
                borderColor: '#FFA000',
                backgroundColor: '#FFFBEB',
              },
            }}
          >
            ← Back to Cart
          </Button>

          <Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                color: '#0F172A',
                fontSize: { xs: '1.25rem', sm: '1.6rem', md: '2rem' },
                mb: 0.3,
              }}
            >
              Order Review & Payment
            </Typography>
            <Typography variant="body1" sx={{ color: '#64748B', fontSize: { xs: '0.8rem', md: '0.92rem' } }}>
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
              {/* Section 1: Customer Details & Proper Structured Address */}
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 2.5, sm: 3.5 },
                  borderRadius: 3,
                  border: '1px solid #E2E8F0',
                  backgroundColor: '#FFFFFF',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5, flexWrap: 'wrap', gap: 1 }}>
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

                <Grid container spacing={2.2}>
                  {/* Customer Full Name */}
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#334155', mb: 0.6, display: 'block' }}>
                      Customer Full Name <span style={{ color: '#DC2626' }}>*</span>
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      value={formData.fullName}
                      onChange={handleInputChange('fullName')}
                      placeholder="Enter customer name"
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, backgroundColor: '#FFFFFF' } }}
                    />
                  </Grid>

                  {/* Primary Mobile Number */}
                  <Grid item xs={12} sm={6}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#334155', mb: 0.6, display: 'block' }}>
                      Primary Mobile Number <span style={{ color: '#DC2626' }}>*</span>
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      value={formData.mobileNumber}
                      onChange={handleInputChange('mobileNumber')}
                      placeholder="10-digit mobile number"
                      inputProps={{ maxLength: 10, inputMode: 'numeric' }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Typography variant="body2" sx={{ fontWeight: 700, color: '#475569' }}>
                              +91
                            </Typography>
                          </InputAdornment>
                        ),
                      }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, backgroundColor: '#FFFFFF' } }}
                    />
                  </Grid>

                  {/* Door / Flat Number */}
                  <Grid item xs={12} sm={4}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#334155', mb: 0.6, display: 'block' }}>
                      Door / Flat No.
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      value={formData.doorNumber}
                      onChange={handleInputChange('doorNumber')}
                      placeholder="e.g. 12/A, Flat 3B"
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                  </Grid>

                  {/* Street Name & Area */}
                  <Grid item xs={12} sm={8}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#334155', mb: 0.6, display: 'block' }}>
                      Street Name & Area / Locality <span style={{ color: '#DC2626' }}>*</span>
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      value={formData.streetName || formData.address}
                      onChange={(e) => {
                        setFormData((prev) => ({
                          ...prev,
                          streetName: e.target.value,
                          address: e.target.value,
                        }))
                        setErrorMsg('')
                      }}
                      placeholder="e.g. Gandhi Road, Anna Nagar"
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <LocationOnOutlinedIcon sx={{ color: '#94A3B8' }} />
                          </InputAdornment>
                        ),
                      }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                  </Grid>

                  {/* City / Town */}
                  <Grid item xs={12} sm={4}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#334155', mb: 0.6, display: 'block' }}>
                      City / Town <span style={{ color: '#DC2626' }}>*</span>
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      value={formData.city}
                      onChange={handleInputChange('city')}
                      placeholder="e.g. Coimbatore / Madurai"
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                  </Grid>

                  {/* District Dropdown (Proper Tamil Nadu Districts) */}
                  <Grid item xs={12} sm={4}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#334155', mb: 0.6, display: 'block' }}>
                      District (மாவட்டம்) <span style={{ color: '#DC2626' }}>*</span>
                    </Typography>
                    <FormControl fullWidth size="small">
                      <Select
                        displayEmpty
                        value={formData.district || ''}
                        onChange={handleInputChange('district')}
                        renderValue={(selected) => {
                          if (!selected) {
                            return <span style={{ color: '#94A3B8' }}>Select District</span>
                          }
                          return selected
                        }}
                        MenuProps={{
                          PaperProps: {
                            sx: {
                              maxHeight: 280,
                              borderRadius: 2,
                              boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
                            },
                          },
                        }}
                        sx={{
                          borderRadius: 2,
                          backgroundColor: '#FFFFFF',
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#FFA000',
                          },
                        }}
                      >
                        <MenuItem disabled value="">
                          <em>Select Tamil Nadu District</em>
                        </MenuItem>
                        {TAMIL_NADU_DISTRICTS.map((dist) => (
                          <MenuItem key={dist} value={dist}>
                            {dist}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* PIN Code */}
                  <Grid item xs={12} sm={4}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#334155', mb: 0.6, display: 'block' }}>
                      6-Digit PIN Code <span style={{ color: '#DC2626' }}>*</span>
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      value={formData.pincode}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 6)
                        setFormData((prev) => ({ ...prev, pincode: val }))
                        setErrorMsg('')
                      }}
                      placeholder="e.g. 641007"
                      inputProps={{ maxLength: 6, inputMode: 'numeric' }}
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

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ color: '#64748B' }}>
                          Delivery Charges:
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: '#D97706', fontSize: '0.84rem' }}>
                          To Pay at Delivery (Transport)
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
                        Inclusive of all factory discounts. Transport charges To-Pay upon collecting parcel.
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
              </Box>

              {/* Payment Mode Selector Tabs */}
              <Box sx={{ mb: 2 }}>
                <Tabs
                  value={paymentMethod === 'upi' ? 0 : 1}
                  onChange={(e, val) => {
                    setPaymentMethod(val === 0 ? 'upi' : 'whatsapp')
                    setErrorMsg('')
                  }}
                  variant="fullWidth"
                  sx={{
                    backgroundColor: '#F1F5F9',
                    borderRadius: 2,
                    p: 0.5,
                    minHeight: 44,
                    '& .MuiTab-root': {
                      minHeight: 40,
                      borderRadius: 1.5,
                      textTransform: 'none',
                      fontWeight: 800,
                      fontSize: { xs: '0.78rem', sm: '0.85rem' },
                      transition: 'all 0.2s',
                    },
                    '& .Mui-selected': {
                      backgroundColor: '#FFFFFF',
                      color: paymentMethod === 'upi' ? '#15803D !important' : '#25D366 !important',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                    },
                    '& .MuiTabs-indicator': { display: 'none' },
                  }}
                >
                  <Tab
                    icon={<QrCode2Icon sx={{ fontSize: 18 }} />}
                    iconPosition="start"
                    label="Pay via UPI / QR"
                  />
                  <Tab
                    icon={<WhatsAppIcon sx={{ fontSize: 18 }} />}
                    iconPosition="start"
                    label="WhatsApp Booking"
                  />
                </Tabs>
              </Box>

              {/* TAB 0: Direct UPI & QR Payment */}
              {paymentMethod === 'upi' && (
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2.5,
                    border: '1.5px solid #BBF7D0',
                    backgroundColor: '#F0FDF4',
                    mb: 2,
                    textAlign: 'center',
                  }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#166534', mb: 0.3 }}>
                    Scan QR or Pay via Any UPI App
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#15803D', display: 'block', mb: 1.5, fontWeight: 600 }}>
                    Google Pay • PhonePe • Paytm • BHIM • CRED
                  </Typography>

                  {/* QR Image Box */}
                  <Box
                    sx={{
                      display: 'inline-block',
                      p: 1.2,
                      backgroundColor: '#FFFFFF',
                      borderRadius: 2,
                      border: '2px solid #86EFAC',
                      boxShadow: '0 4px 12px rgba(22, 163, 74, 0.15)',
                      mb: 1.2,
                    }}
                  >
                    <Box
                      component="img"
                      src={qrType === 'gpay' ? UPI_CONFIG.qrImage : dynamicQrCodeUrl}
                      alt="UPI Payment QR Code"
                      sx={{
                        width: { xs: 180, sm: 200 },
                        height: { xs: 180, sm: 200 },
                        display: 'block',
                        objectFit: 'contain',
                        borderRadius: 1,
                      }}
                    />
                  </Box>

                  {/* QR Mode Switcher */}
                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 1.5 }}>
                    <Chip
                      size="small"
                      clickable
                      onClick={() => setQrType('gpay')}
                      label="Original GPay QR"
                      sx={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        backgroundColor: qrType === 'gpay' ? '#15803D' : '#DCFCE7',
                        color: qrType === 'gpay' ? '#FFFFFF' : '#15803D',
                      }}
                    />
                    <Chip
                      size="small"
                      clickable
                      onClick={() => setQrType('dynamic')}
                      label={`Exact Amount QR (₹${totalAmount})`}
                      sx={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        backgroundColor: qrType === 'dynamic' ? '#15803D' : '#DCFCE7',
                        color: qrType === 'dynamic' ? '#FFFFFF' : '#15803D',
                      }}
                    />
                  </Box>

                  {/* Copy UPI ID Box */}
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: '#FFFFFF',
                      p: 1,
                      px: 1.5,
                      borderRadius: 2,
                      border: '1px solid #CBD5E1',
                      mb: 1.5,
                    }}
                  >
                    <Box sx={{ textAlign: 'left' }}>
                      <Typography variant="caption" sx={{ color: '#64748B', display: 'block', fontSize: '0.68rem', fontWeight: 700 }}>
                        OFFICIAL UPI ID ({UPI_CONFIG.bankName})
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 800, color: '#0B132B', fontSize: '0.82rem' }}>
                        {UPI_CONFIG.upiId}
                      </Typography>
                    </Box>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={handleCopyUpi}
                      startIcon={<ContentCopyIcon sx={{ fontSize: 13 }} />}
                      sx={{
                        backgroundColor: copiedUpi ? '#15803D' : '#0B132B',
                        color: '#FFFFFF',
                        fontWeight: 800,
                        fontSize: '0.72rem',
                        textTransform: 'none',
                        px: 1.2,
                        py: 0.4,
                        borderRadius: 1.5,
                        '&:hover': { backgroundColor: copiedUpi ? '#166534' : '#1C2541' },
                      }}
                    >
                      {copiedUpi ? 'Copied!' : 'Copy'}
                    </Button>
                  </Box>

                  {/* Mobile 1-Tap Pay Buttons */}
                  <Typography variant="caption" sx={{ color: '#334155', fontWeight: 700, display: 'block', mb: 0.8 }}>
                    Mobile-ல் இருந்தால் ஆப்பை கிளிக் செய்யவும்:
                  </Typography>
                  <Grid container spacing={0.8} sx={{ mb: 1.5 }}>
                    <Grid item xs={6}>
                      <Button
                        fullWidth
                        size="small"
                        variant="outlined"
                        component="a"
                        href={dynamicUpiUri}
                        sx={{
                          borderColor: '#4285F4',
                          color: '#1E40AF',
                          backgroundColor: '#EFF6FF',
                          fontWeight: 800,
                          fontSize: '0.74rem',
                          textTransform: 'none',
                          py: 0.7,
                          borderRadius: 2,
                          '&:hover': { backgroundColor: '#DBEAFE', borderColor: '#2563EB' },
                        }}
                      >
                        Google Pay
                      </Button>
                    </Grid>
                    <Grid item xs={6}>
                      <Button
                        fullWidth
                        size="small"
                        variant="outlined"
                        component="a"
                        href={dynamicUpiUri}
                        sx={{
                          borderColor: '#5F259F',
                          color: '#5F259F',
                          backgroundColor: '#FAF5FF',
                          fontWeight: 800,
                          fontSize: '0.74rem',
                          textTransform: 'none',
                          py: 0.7,
                          borderRadius: 2,
                          '&:hover': { backgroundColor: '#F3E8FF', borderColor: '#5F259F' },
                        }}
                      >
                        PhonePe
                      </Button>
                    </Grid>
                    <Grid item xs={6}>
                      <Button
                        fullWidth
                        size="small"
                        variant="outlined"
                        component="a"
                        href={dynamicUpiUri}
                        sx={{
                          borderColor: '#00BAF2',
                          color: '#0369A1',
                          backgroundColor: '#F0F9FF',
                          fontWeight: 800,
                          fontSize: '0.74rem',
                          textTransform: 'none',
                          py: 0.7,
                          borderRadius: 2,
                          '&:hover': { backgroundColor: '#E0F2FE', borderColor: '#00BAF2' },
                        }}
                      >
                        Paytm
                      </Button>
                    </Grid>
                    <Grid item xs={6}>
                      <Button
                        fullWidth
                        size="small"
                        variant="outlined"
                        component="a"
                        href={dynamicUpiUri}
                        sx={{
                          borderColor: '#059669',
                          color: '#065F46',
                          backgroundColor: '#ECFDF5',
                          fontWeight: 800,
                          fontSize: '0.74rem',
                          textTransform: 'none',
                          py: 0.7,
                          borderRadius: 2,
                          '&:hover': { backgroundColor: '#D1FAE5', borderColor: '#059669' },
                        }}
                      >
                        BHIM / Any UPI
                      </Button>
                    </Grid>
                  </Grid>

                  {/* 12-Digit UTR Input Box */}
                  <Box sx={{ mt: 1.5, textAlign: 'left' }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#0B132B', mb: 0.5, display: 'block' }}>
                      Enter 12-Digit UPI Ref / UTR No <span style={{ color: '#DC2626' }}>*</span>
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="e.g. 428394829103"
                      value={utrNumber}
                      onChange={(e) => {
                        setUtrNumber(e.target.value.replace(/[^0-9a-zA-Z]/g, '').slice(0, 16))
                        setErrorMsg('')
                      }}
                      helperText="Found in Google Pay / PhonePe transaction details after paying"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <CheckCircleIcon sx={{ color: '#16A34A', fontSize: 18 }} />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: 2,
                        '& .MuiOutlinedInput-root': { borderRadius: 2 },
                      }}
                    />
                  </Box>
                </Box>
              )}

              {/* TAB 1: WhatsApp Direct Booking Enquiry */}
              {paymentMethod === 'whatsapp' && (
                <Box
                  sx={{
                    p: 2.2,
                    borderRadius: 2.5,
                    border: '1.5px solid #86EFAC',
                    backgroundColor: '#F0FDF4',
                    mb: 2,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 1.2 }}>
                    <WhatsAppIcon sx={{ color: '#25D366', fontSize: 28 }} />
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#166534', fontSize: '0.92rem' }}>
                        Direct WhatsApp Booking Enquiry
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#15803D', fontWeight: 600 }}>
                        Zero online payment needed now
                      </Typography>
                    </Box>
                  </Box>

                  <Typography variant="body2" sx={{ color: '#1E293B', fontSize: '0.82rem', mb: 1.5, lineHeight: 1.5 }}>
                    உடனடி ஆன்லைன் பேமென்ட் தேவையில்லை. உங்கள் பட்டாசு பட்டியல் ஆர்டர் எங்கள் சிவகாசி அலுவலகத்திற்கு (+91 80567 04353) WhatsApp-ல் நேரடியாக சென்றுவிடும். நாங்கள் பேசிவிட்டு பார்சல் டெலிவரி உறுதி செய்வோம்.
                  </Typography>

                  <Box sx={{ p: 1.5, backgroundColor: '#FFFFFF', borderRadius: 2, border: '1px solid #CBD5E1', mb: 1 }}>
                    <Typography variant="caption" sx={{ color: '#64748B', display: 'block', fontWeight: 700 }}>
                      SIVAKASI WHATSAPP HELPLINE
                    </Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#0B132B' }}>
                      {UPI_CONFIG.displayPhone}
                    </Typography>
                  </Box>
                </Box>
              )}

              {/* Action Buttons */}
              {paymentMethod === 'upi' ? (
                <Button
                  variant="contained"
                  fullWidth
                  disabled={isSubmitting || cart.length === 0}
                  startIcon={isSubmitting ? <CircularProgress size={16} sx={{ color: '#FFFFFF' }} /> : <CheckCircleIcon sx={{ fontSize: 18 }} />}
                  onClick={handleSubmitOrder}
                  sx={{
                    background: 'linear-gradient(135deg, #15803D 0%, #16A34A 100%)',
                    color: '#FFFFFF',
                    fontWeight: 900,
                    fontSize: { xs: '0.86rem', sm: '0.94rem' },
                    py: { xs: 1.1, sm: 1.25 },
                    borderRadius: '24px',
                    boxShadow: '0 4px 16px rgba(22, 163, 74, 0.45)',
                    textTransform: 'none',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #166534 0%, #15803D 100%)',
                      boxShadow: '0 6px 20px rgba(22, 163, 74, 0.6)',
                    },
                  }}
                >
                  {isSubmitting ? 'Confirming Payment...' : `Confirm UPI Payment & Download Bill (₹${totalAmount.toLocaleString('en-IN')}) →`}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  fullWidth
                  disabled={isSubmitting || cart.length === 0}
                  startIcon={isSubmitting ? <CircularProgress size={16} sx={{ color: '#FFFFFF' }} /> : <WhatsAppIcon sx={{ fontSize: 20 }} />}
                  onClick={handleSubmitOrder}
                  sx={{
                    backgroundColor: '#25D366',
                    color: '#FFFFFF',
                    fontWeight: 900,
                    fontSize: { xs: '0.86rem', sm: '0.94rem' },
                    py: { xs: 1.1, sm: 1.25 },
                    borderRadius: '24px',
                    boxShadow: '0 4px 16px rgba(37, 211, 102, 0.45)',
                    textTransform: 'none',
                    '&:hover': {
                      backgroundColor: '#1EBE5D',
                      boxShadow: '0 6px 20px rgba(37, 211, 102, 0.6)',
                    },
                  }}
                >
                  {isSubmitting ? 'Submitting Booking...' : `Confirm Booking & Open WhatsApp (${UPI_CONFIG.displayPhone}) →`}
                </Button>
              )}

              {/* Save Order Details Button - Alternative fallback */}
              {paymentMethod === 'upi' && (
                <Button
                  variant="outlined"
                  fullWidth
                  disabled={isSubmitting || cart.length === 0}
                  startIcon={<WhatsAppIcon sx={{ fontSize: 16, color: '#25D366' }} />}
                  onClick={handleSaveBookingOnly}
                  sx={{
                    mt: 1.2,
                    borderColor: '#CBD5E1',
                    color: '#0B132B',
                    fontWeight: 800,
                    fontSize: { xs: '0.8rem', sm: '0.84rem' },
                    py: { xs: 0.75, sm: 0.9 },
                    borderRadius: 2,
                    backgroundColor: '#F8FAFC',
                    textTransform: 'none',
                    '&:hover': {
                      backgroundColor: '#F0FDF4',
                      borderColor: '#25D366',
                      color: '#15803D',
                    },
                  }}
                >
                  💬 Pay Later & Send via WhatsApp Instead
                </Button>
              )}

              <Typography variant="caption" sx={{ color: '#64748B', display: 'block', textAlign: 'center', mt: 1.2, fontSize: '0.72rem' }}>
                💡 All bookings receive an immediate official invoice bill with direct Sivakasi transport dispatch coordination.
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
