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
import LocalOfferIcon from '@mui/icons-material/LocalOffer'
import { downloadStructuredInvoice } from '../utils/invoiceGenerator'
import { cleanAddressDisplay, formatStructuredAddress } from '../utils/addressUtils'

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
      ? cleanAddressDisplay(
          customerData.address ||
          formatStructuredAddress(customerData)
        )
      : '',
  })

  useEffect(() => {
    if (customerData) {
      const cleanAddr = cleanAddressDisplay(
        customerData.address ||
        formatStructuredAddress(customerData)
      )
      setFormData({
        fullName: customerData.fullName || customerData.customerName || '',
        mobileNumber: customerData.mobileNumber || '',
        doorNumber: customerData.doorNumber || '',
        streetName: customerData.streetName || '',
        area: customerData.area || '',
        city: customerData.city || '',
        district: customerData.district || '',
        pincode: customerData.pinCode || customerData.pincode || '',
        address: cleanAddr,
      })
    }
  }, [customerData])

  const [paymentMethod, setPaymentMethod] = useState('upi') // 'upi' or 'whatsapp'
  const [utrNumber, setUtrNumber] = useState('')
  const [copiedUpi, setCopiedUpi] = useState(false)
  const [copiedPhone, setCopiedPhone] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // Instagram Promo Coupon Code State (TRUSTSKYFIRECRACKERS)
  const [couponInput, setCouponInput] = useState('')
  const [appliedCouponCode, setAppliedCouponCode] = useState('')
  const [isCouponApplied, setIsCouponApplied] = useState(false)
  const [couponError, setCouponError] = useState('')

  const handleApplyCoupon = () => {
    setCouponError('')
    const clean = (couponInput || '').trim().toUpperCase()
    if (!clean) {
      setCouponError('Please enter a coupon code.')
      return
    }
    if (clean === 'TRUSTSKYFIRECRACKERS') {
      setIsCouponApplied(true)
      setAppliedCouponCode('TRUSTSKYFIRECRACKERS')
      setCouponError('')
    } else {
      setCouponError('Invalid coupon code! Please enter the correct promo code.')
      setIsCouponApplied(false)
    }
  }

  const handleRemoveCoupon = () => {
    setIsCouponApplied(false)
    setAppliedCouponCode('')
    setCouponInput('')
    setCouponError('')
  }

  // Persistent Unified Booking Order Reference (Synced across GPay, SMS, and Invoice)
  const [checkoutOrderId] = useState(() => {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const rand = Math.floor(100000 + Math.random() * 900000)
    return `SFC-${today}-${rand}`
  })

  // Accurate cart total calculation directly from active cart items
  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = cart.reduce(
    (sum, item) => sum + (Number(item.product?.discountPrice) || Number(item.unitPrice) || 0) * item.quantity,
    0
  )
  const discount = 0
  const deliveryCharges = 0
  const totalAmount = subtotal

  // UPI Payment Link - Cleaned up to avoid commercial intent flags on personal savings account
  const dynamicUpiUri = `upi://pay?pa=${UPI_CONFIG.upiId}&pn=${encodeURIComponent(UPI_CONFIG.payeeName)}&am=${totalAmount}&cu=INR&tn=Crackers`
  const dynamicQrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&margin=8&data=${encodeURIComponent(dynamicUpiUri)}`

  // Strict 12-Digit NPCI UPI Reference Number (UTR) Validator
  const validateUtr = (utr) => {
    const clean = (utr || '').replace(/\s+/g, '').trim()
    if (!clean) {
      return { valid: false, error: 'Please enter your 12-digit UPI Reference Number (UTR) from Google Pay or PhonePe.' }
    }
    if (!/^\d{12}$/.test(clean)) {
      return { valid: false, error: `Invalid UTR! UPI Reference Number must be exactly 12 numeric digits (e.g., 627875967624). You entered ${clean.length} digits.` }
    }
    // Check for repeating dummy digits like 777777777777 or 888888888888
    if (/^(\d)\1{11}$/.test(clean)) {
      return { valid: false, error: `Invalid UTR! Dummy repeating number "${clean}" is not accepted. Please check your GPay / PhonePe payment receipt.` }
    }
    // Check for trivial sequential numbers
    const dummySequences = ['123456789012', '012345678901', '987654321098', '112233445566', '121212121212', '001122334455']
    if (dummySequences.includes(clean)) {
      return { valid: false, error: 'Test sequence detected. Please enter your genuine 12-digit UPI transaction UTR from your payment receipt.' }
    }
    // Check digit entropy (at least 4 distinct digits in real UTR)
    const uniqueDigits = new Set(clean.split('')).size
    if (uniqueDigits < 4) {
      return { valid: false, error: 'Please enter a genuine 12-digit UPI Reference Number from your payment app.' }
    }
    // Check for duplicate UTR usage in previous orders
    try {
      const history = JSON.parse(localStorage.getItem('skycrackers_orders_history') || '[]')
      const duplicate = history.find(o => (o.utrNumber === clean) || (o.notes && o.notes.includes(clean)))
      if (duplicate) {
        return { valid: false, error: `This UPI Reference Number (${clean}) has already been registered with order #${duplicate.orderNumber}. Each transaction must have a unique UTR.` }
      }
    } catch (_) {}

    return { valid: true, cleanUtr: clean }
  }

  const handleCopyUpi = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(UPI_CONFIG.upiId)
    }
    setCopiedUpi(true)
    setTimeout(() => setCopiedUpi(false), 2500)
  }

  const handleCopyPhone = () => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText('8056704353')
    }
    setCopiedPhone(true)
    setTimeout(() => setCopiedPhone(false), 2500)
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

    let cleanUtr = ''
    if (paymentMethod === 'upi') {
      const utrCheck = validateUtr(utrNumber)
      if (!utrCheck.valid) {
        setErrorMsg(utrCheck.error)
        return
      }
      cleanUtr = utrCheck.cleanUtr
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
        const unitPrice = Number(item.product.discountPrice) || Number(item.product.price) || 0
        return {
          productId: pId,
          productName: item.product.name,
          tamilName: item.product.tamilName || '',
          quantity: item.quantity,
          unitPrice: unitPrice,
          totalPrice: unitPrice * item.quantity,
        }
      })

      const fullAddress = formatStructuredAddress({
        doorNumber: formData.doorNumber,
        streetName: formData.streetName || formData.address,
        area: formData.area,
        city: formData.city,
        district: formData.district,
        pincode: formData.pincode,
      }) || cleanAddressDisplay(formData.address)

      const isUpi = paymentMethod === 'upi'
      const paymentMethodLabel = isUpi ? 'UPI' : 'WHATSAPP_ENQUIRY'
      const paymentStatus = isUpi ? 'Completed' : 'Pending'
      const couponTag = isCouponApplied ? `[Promo Coupon: ${appliedCouponCode} - Cashback Eligible]` : ''
      const orderNotes = [
        couponTag,
        isUpi
          ? `UPI Payment - UTR: ${cleanUtr} (Account: ${UPI_CONFIG.upiId})`
          : `WhatsApp Booking Enquiry - Contact: +91 ${formData.mobileNumber.trim()}`,
      ].filter(Boolean).join(' | ')

      // Order number stays strictly unified across GPay note, SMS, and Invoice Bill
      const orderNum = checkoutOrderId

      // Transactionally save order and order items with CustomerId in SQL Server
      await createOrderApi({
        orderNumber: orderNum,
        customerId: Number(custId),
        customerName: formData.fullName.trim(),
        customerPhone: formData.mobileNumber.trim(),
        deliveryAddress: fullAddress,
        paymentMethod: paymentMethodLabel,
        totalAmount: totalAmount,
        subTotal: totalAmount,
        couponCode: isCouponApplied ? appliedCouponCode : null,
        notes: orderNotes,
        items: itemsPayload,
      }).catch((err) => {
        console.warn('Backend order sync notification:', err)
      })

      // If WhatsApp enquiry, prepare WhatsApp message and open chat
      if (!isUpi) {
        const itemsListStr = cart
          .map((i, idx) => `${idx + 1}. ${i.product.name} (Qty: ${i.quantity} box) - ₹${i.product.discountPrice * i.quantity}`)
          .join('\n')
        const couponWaLine = isCouponApplied ? `*Coupon Code:* ${appliedCouponCode} (Cashback Eligible)\n` : ''
        const waText = `💥 *SKY FIRE CRACKERS - NEW BOOKING* 💥\n--------------------------------\n*Booking No:* #${orderNum}\n*Customer:* ${formData.fullName.trim()}\n*Phone:* +91 ${formData.mobileNumber.trim()}\n*Delivery Address:* ${fullAddress}\n${couponWaLine}--------------------------------\n*Crackers Ordered (${totalItemsCount} Boxes):*\n${itemsListStr}\n--------------------------------\n*Total Amount:* ₹${totalAmount.toLocaleString('en-IN')}\n*Parcel Delivery:* Pay at transport collection\n--------------------------------\nVanakkam! Please confirm my booking and share parcel dispatch details.`
        window.open(`https://wa.me/${UPI_CONFIG.whatsappPhone}?text=${encodeURIComponent(waText)}`, '_blank')
      }

      // Persist locally for instant lookup retrieval with accurate totals
      try {
        const existingOrders = JSON.parse(localStorage.getItem('skycrackers_orders_history') || '[]')
        existingOrders.unshift({
          orderNumber: orderNum,
          customerId: Number(custId),
          customerName: formData.fullName.trim(),
          customerPhone: formData.mobileNumber.trim(),
          deliveryAddress: fullAddress,
          totalAmount: totalAmount,
          subTotal: totalAmount,
          paymentMethod: isUpi ? `Direct UPI (UTR: ${cleanUtr})` : 'WhatsApp Enquiry',
          paymentStatus: paymentStatus,
          orderStatus: 'Confirmed',
          couponCode: isCouponApplied ? appliedCouponCode : null,
          notes: orderNotes,
          utrNumber: isUpi ? cleanUtr : null,
          createdAt: new Date().toISOString(),
          items: cart.map((i) => ({
            productName: i.product.name,
            quantity: i.quantity,
            unitPrice: Number(i.product.discountPrice) || Number(i.product.price) || 0,
            totalPrice: (Number(i.product.discountPrice) || Number(i.product.price) || 0) * i.quantity,
          })),
        })
        localStorage.setItem('skycrackers_orders_history', JSON.stringify(existingOrders.slice(0, 30)))
      } catch (locErr) {
        console.warn('Local save warning:', locErr)
      }

      const orderSummary = {
        orderId: orderNum,
        orderNumber: orderNum,
        isPaid: isUpi,
        paymentStatus: paymentStatus,
        couponCode: isCouponApplied ? appliedCouponCode : null,
        customer: {
          name: formData.fullName.trim(),
          phone: formData.mobileNumber.trim(),
          address: cleanAddressDisplay(fullAddress),
        },
        paymentMethod: isUpi ? `Direct UPI (GPay/PhonePe - UTR: ${cleanUtr})` : 'WhatsApp Enquiry (Pay Later)',
        items: cart,
        subtotal: totalAmount,
        discount: 0,
        delivery: 0,
        total: totalAmount,
        utrNumber: isUpi ? cleanUtr : null,
      }

      // Automatically trigger download of structured invoice bill!
      try {
        downloadStructuredInvoice({
          ...orderSummary,
          orderNumber: orderNum,
          couponCode: isCouponApplied ? appliedCouponCode : null,
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

                  {/* Do you have a coupon code? Section */}
                  <Grid item xs={12}>
                    <Divider sx={{ my: 1.5, borderStyle: 'dashed' }} />
                    <Box
                      sx={{
                        p: { xs: 2, sm: 2.2 },
                        borderRadius: 2.5,
                        backgroundColor: isCouponApplied ? '#F0FDF4' : '#F8FAFC',
                        border: isCouponApplied ? '1.5px solid #86EFAC' : '1.5px dashed #CBD5E1',
                        transition: 'all 0.3s ease',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, flexWrap: 'wrap', gap: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 0.8 }}>
                          <LocalOfferIcon sx={{ fontSize: 18, color: '#D97706' }} />
                          Do you have a coupon code? (கூப்பன் குறியீடு உள்ளதா?)
                        </Typography>
                        {isCouponApplied && (
                          <Chip
                            size="small"
                            label="Coupon Applied"
                            color="success"
                            sx={{ fontWeight: 800, fontSize: '0.72rem' }}
                          />
                        )}
                      </Box>

                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="center">
                        <TextField
                          fullWidth
                          size="small"
                          value={couponInput}
                          onChange={(e) => {
                            setCouponInput(e.target.value)
                            setCouponError('')
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              handleApplyCoupon()
                            }
                          }}
                          placeholder="COUPONCODE"
                          disabled={isCouponApplied}
                          InputProps={{
                            sx: { textTransform: 'uppercase', fontWeight: 700, backgroundColor: '#FFFFFF', borderRadius: 2 },
                          }}
                        />
                        {!isCouponApplied ? (
                          <Button
                            variant="contained"
                            onClick={handleApplyCoupon}
                            sx={{
                              minWidth: { xs: '100%', sm: 140 },
                              py: 1,
                              fontWeight: 900,
                              textTransform: 'none',
                              borderRadius: 2,
                              backgroundColor: '#FFA000',
                              color: '#0B132B',
                              boxShadow: '0 2px 8px rgba(255, 160, 0, 0.3)',
                              '&:hover': { backgroundColor: '#FF8F00' },
                            }}
                          >
                            Apply Coupon
                          </Button>
                        ) : (
                          <Button
                            variant="outlined"
                            color="error"
                            onClick={handleRemoveCoupon}
                            sx={{
                              minWidth: { xs: '100%', sm: 110 },
                              py: 0.9,
                              fontWeight: 800,
                              textTransform: 'none',
                              borderRadius: 2,
                            }}
                          >
                            Remove
                          </Button>
                        )}
                      </Stack>

                      {/* Coupon validation messages */}
                      {isCouponApplied && (
                        <Alert severity="success" sx={{ mt: 1.5, py: 0.5, borderRadius: 2, fontWeight: 700, backgroundColor: '#DCFCE7', color: '#15803D' }}>
                          🎉 Coupon applied successfully! ({appliedCouponCode})
                        </Alert>
                      )}
                      {couponError && (
                        <Alert severity="error" sx={{ mt: 1.5, py: 0.5, borderRadius: 2, fontWeight: 600 }}>
                          {couponError}
                        </Alert>
                      )}
                    </Box>
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

                  {/* Clean Generated QR Code Box */}
                  <Box
                    sx={{
                      display: 'inline-block',
                      p: 1.5,
                      backgroundColor: '#FFFFFF',
                      borderRadius: 3,
                      border: '2px solid #22C55E',
                      boxShadow: '0 4px 14px rgba(22, 163, 74, 0.15)',
                      mb: 1.5,
                    }}
                  >
                    <Box
                      component="img"
                      src={dynamicQrCodeUrl}
                      alt="UPI Payment QR Code"
                      sx={{
                        width: { xs: 200, sm: 220 },
                        height: { xs: 200, sm: 220 },
                        display: 'block',
                        objectFit: 'contain',
                        borderRadius: 1.5,
                      }}
                    />
                    <Box
                      sx={{
                        mt: 1.2,
                        py: 0.5,
                        px: 1.2,
                        backgroundColor: '#DCFCE7',
                        borderRadius: 1.5,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 0.6,
                      }}
                    >
                      <CheckCircleIcon sx={{ fontSize: 16, color: '#15803D' }} />
                      <Typography variant="caption" sx={{ fontWeight: 800, color: '#166534', fontSize: '0.8rem' }}>
                        Amount: ₹{totalAmount.toLocaleString('en-IN')} Pre-filled
                      </Typography>
                    </Box>
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

                  {/* Mobile 1-Tap Pay Buttons - Stacked Line-by-Line with High Visibility */}
                  <Typography variant="subtitle2" sx={{ color: '#0F172A', fontWeight: 800, display: 'block', mb: 1.2, textAlign: 'left', fontSize: '0.88rem' }}>
                    📲 Mobile-ல் செலுத்த ஆப்பைத் தேர்ந்தெடுக்கவும் (1-Tap Pay):
                  </Typography>

                  <Stack spacing={1.2} sx={{ mb: 2 }}>
                    {/* Line 1: Google Pay */}
                    <Button
                      fullWidth
                      variant="contained"
                      component="a"
                      href={dynamicUpiUri}
                      sx={{
                        backgroundColor: '#FFFFFF',
                        color: '#1E3A8A',
                        border: '2px solid #3B82F6',
                        py: 1.2,
                        px: 2,
                        borderRadius: 2.5,
                        textTransform: 'none',
                        boxShadow: '0 2px 8px rgba(59, 130, 246, 0.15)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        '&:hover': {
                          backgroundColor: '#EFF6FF',
                          borderColor: '#1D4ED8',
                          boxShadow: '0 4px 14px rgba(59, 130, 246, 0.25)',
                        },
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.4 }}>
                        <Box
                          sx={{
                            width: 34,
                            height: 34,
                            borderRadius: '50%',
                            backgroundColor: '#EFF6FF',
                            border: '1.5px solid #3B82F6',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.05rem',
                            fontWeight: 900,
                            color: '#2563EB',
                          }}
                        >
                          G
                        </Box>
                        <Box sx={{ textAlign: 'left' }}>
                          <Typography variant="body2" sx={{ fontWeight: 900, color: '#0F172A', fontSize: '0.94rem', lineHeight: 1.2 }}>
                            Google Pay (GPay)
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.72rem', display: 'block' }}>
                            Tap to open & pay in Google Pay
                          </Typography>
                        </Box>
                      </Box>
                      <Chip
                        label={`₹${totalAmount.toLocaleString('en-IN')}`}
                        size="small"
                        sx={{
                          backgroundColor: '#DBEAFE',
                          color: '#1E40AF',
                          fontWeight: 900,
                          fontSize: '0.8rem',
                          height: 26,
                        }}
                      />
                    </Button>

                    {/* Line 2: PhonePe */}
                    <Button
                      fullWidth
                      variant="contained"
                      component="a"
                      href={dynamicUpiUri}
                      sx={{
                        backgroundColor: '#FFFFFF',
                        color: '#581C87',
                        border: '2px solid #7E22CE',
                        py: 1.2,
                        px: 2,
                        borderRadius: 2.5,
                        textTransform: 'none',
                        boxShadow: '0 2px 8px rgba(126, 34, 206, 0.15)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        '&:hover': {
                          backgroundColor: '#FAF5FF',
                          borderColor: '#6B21A8',
                          boxShadow: '0 4px 14px rgba(126, 34, 206, 0.25)',
                        },
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.4 }}>
                        <Box
                          sx={{
                            width: 34,
                            height: 34,
                            borderRadius: '50%',
                            backgroundColor: '#FAF5FF',
                            border: '1.5px solid #7E22CE',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.05rem',
                            fontWeight: 900,
                            color: '#7E22CE',
                          }}
                        >
                          पे
                        </Box>
                        <Box sx={{ textAlign: 'left' }}>
                          <Typography variant="body2" sx={{ fontWeight: 900, color: '#0F172A', fontSize: '0.94rem', lineHeight: 1.2 }}>
                            PhonePe
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.72rem', display: 'block' }}>
                            Tap to open & pay in PhonePe
                          </Typography>
                        </Box>
                      </Box>
                      <Chip
                        label={`₹${totalAmount.toLocaleString('en-IN')}`}
                        size="small"
                        sx={{
                          backgroundColor: '#F3E8FF',
                          color: '#6B21A8',
                          fontWeight: 900,
                          fontSize: '0.8rem',
                          height: 26,
                        }}
                      />
                    </Button>

                    {/* Line 3: Paytm */}
                    <Button
                      fullWidth
                      variant="contained"
                      component="a"
                      href={dynamicUpiUri}
                      sx={{
                        backgroundColor: '#FFFFFF',
                        color: '#0369A1',
                        border: '2px solid #0284C7',
                        py: 1.2,
                        px: 2,
                        borderRadius: 2.5,
                        textTransform: 'none',
                        boxShadow: '0 2px 8px rgba(2, 132, 199, 0.15)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        '&:hover': {
                          backgroundColor: '#F0F9FF',
                          borderColor: '#0369A1',
                          boxShadow: '0 4px 14px rgba(2, 132, 199, 0.25)',
                        },
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.4 }}>
                        <Box
                          sx={{
                            width: 34,
                            height: 34,
                            borderRadius: '50%',
                            backgroundColor: '#F0F9FF',
                            border: '1.5px solid #0284C7',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.8rem',
                            fontWeight: 900,
                            color: '#0284C7',
                          }}
                        >
                          pay
                        </Box>
                        <Box sx={{ textAlign: 'left' }}>
                          <Typography variant="body2" sx={{ fontWeight: 900, color: '#0F172A', fontSize: '0.94rem', lineHeight: 1.2 }}>
                            Paytm UPI
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.72rem', display: 'block' }}>
                            Tap to open & pay in Paytm
                          </Typography>
                        </Box>
                      </Box>
                      <Chip
                        label={`₹${totalAmount.toLocaleString('en-IN')}`}
                        size="small"
                        sx={{
                          backgroundColor: '#E0F2FE',
                          color: '#0369A1',
                          fontWeight: 900,
                          fontSize: '0.8rem',
                          height: 26,
                        }}
                      />
                    </Button>

                    {/* Line 4: Any Other UPI App */}
                    <Button
                      fullWidth
                      variant="contained"
                      component="a"
                      href={dynamicUpiUri}
                      sx={{
                        backgroundColor: '#FFFFFF',
                        color: '#065F46',
                        border: '2px solid #059669',
                        py: 1.2,
                        px: 2,
                        borderRadius: 2.5,
                        textTransform: 'none',
                        boxShadow: '0 2px 8px rgba(5, 150, 105, 0.15)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        '&:hover': {
                          backgroundColor: '#ECFDF5',
                          borderColor: '#047857',
                          boxShadow: '0 4px 14px rgba(5, 150, 105, 0.25)',
                        },
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.4 }}>
                        <Box
                          sx={{
                            width: 34,
                            height: 34,
                            borderRadius: '50%',
                            backgroundColor: '#ECFDF5',
                            border: '1.5px solid #059669',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.85rem',
                            fontWeight: 900,
                            color: '#059669',
                          }}
                        >
                          UPI
                        </Box>
                        <Box sx={{ textAlign: 'left' }}>
                          <Typography variant="body2" sx={{ fontWeight: 900, color: '#0F172A', fontSize: '0.94rem', lineHeight: 1.2 }}>
                            BHIM / Any Other UPI App
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.72rem', display: 'block' }}>
                            CRED • Amazon Pay • Navi • iMobile
                          </Typography>
                        </Box>
                      </Box>
                      <Chip
                        label={`₹${totalAmount.toLocaleString('en-IN')}`}
                        size="small"
                        sx={{
                          backgroundColor: '#D1FAE5',
                          color: '#065F46',
                          fontWeight: 900,
                          fontSize: '0.8rem',
                          height: 26,
                        }}
                      />
                    </Button>
                  </Stack>

                  {/* Guaranteed 100% Success Direct Number & UPI Box */}
                  <Box
                    sx={{
                      p: { xs: 2, sm: 2.5 },
                      mb: 2,
                      borderRadius: 3,
                      backgroundColor: '#FEF2F2',
                      border: '2px solid #EF4444',
                      boxShadow: '0 4px 14px rgba(239, 68, 68, 0.12)',
                      textAlign: 'left',
                    }}
                  >
                    {/* Big Eye-Catching "FAILED?" Banner */}
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        mb: 1.5,
                        pb: 1.2,
                        borderBottom: '2px dashed #FCA5A5',
                        flexWrap: 'wrap',
                        gap: 1,
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                          sx={{
                            backgroundColor: '#DC2626',
                            color: '#FFFFFF',
                            px: 1.5,
                            py: 0.4,
                            borderRadius: 2,
                            fontWeight: 900,
                            fontSize: { xs: '1.25rem', sm: '1.45rem' },
                            letterSpacing: '0.04em',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.6,
                            boxShadow: '0 2px 6px rgba(220, 38, 38, 0.35)',
                          }}
                        >
                          ⚠️ FAILED?
                        </Box>
                        <Box>
                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: 900,
                              color: '#991B1B',
                              fontSize: { xs: '1.05rem', sm: '1.2rem' },
                              lineHeight: 1.15,
                            }}
                          >
                            Payment Failed? (பணம் செலுத்த முடியவில்லையா?)
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#B91C1C', fontWeight: 700, fontSize: '0.74rem' }}>
                            கவலை வேண்டாம்! நேரடி GPay / PhonePe மூலம் 100% செலுத்தலாம்:
                          </Typography>
                        </Box>
                      </Box>
                      <Chip
                        label="100% SUCCESS"
                        size="small"
                        sx={{
                          backgroundColor: '#16A34A',
                          color: '#FFFFFF',
                          fontWeight: 900,
                          fontSize: '0.72rem',
                          height: 24,
                        }}
                      />
                    </Box>

                    <Typography variant="body2" sx={{ color: '#450A0A', fontSize: '0.84rem', mb: 1.2, fontWeight: 600 }}>
                      உங்கள் GPay அல்லது PhonePe ஆப்பைத் திறந்து, கீழே உள்ள <strong>மொபைல் எண்</strong> அல்லது <strong>UPI ID</strong>-க்கு நேரடியாக <strong>₹{totalAmount.toLocaleString('en-IN')}</strong> அனுப்பிவிடலாம்:
                    </Typography>
                    <Stack spacing={1.2}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          backgroundColor: '#FFFFFF',
                          p: 1.2,
                          px: 1.5,
                          borderRadius: 2,
                          border: '1.5px solid #FECACA',
                        }}
                      >
                        <Box>
                          <Typography variant="caption" sx={{ color: '#64748B', display: 'block', fontSize: '0.7rem', fontWeight: 800 }}>
                            நேரடி GPAY / PHONEPE எண் (Sri Venkateshwaran)
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 900, color: '#0B132B', fontSize: '1.1rem' }}>
                            80567 04353
                          </Typography>
                        </Box>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={handleCopyPhone}
                          startIcon={<ContentCopyIcon sx={{ fontSize: 14 }} />}
                          sx={{
                            backgroundColor: copiedPhone ? '#15803D' : '#DC2626',
                            color: '#FFFFFF',
                            fontWeight: 800,
                            fontSize: '0.75rem',
                            textTransform: 'none',
                            borderRadius: 1.5,
                            py: 0.5,
                            px: 1.5,
                            '&:hover': {
                              backgroundColor: copiedPhone ? '#166534' : '#B91C1C',
                            },
                          }}
                        >
                          {copiedPhone ? '✓ Copied!' : 'Copy Number'}
                        </Button>
                      </Box>

                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          backgroundColor: '#FFFFFF',
                          p: 1.2,
                          px: 1.5,
                          borderRadius: 2,
                          border: '1.5px solid #FECACA',
                        }}
                      >
                        <Box sx={{ minWidth: 0, mr: 1 }}>
                          <Typography variant="caption" sx={{ color: '#64748B', display: 'block', fontSize: '0.7rem', fontWeight: 800 }}>
                            நேரடி UPI ID ({UPI_CONFIG.bankName})
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 900, color: '#0B132B', fontSize: '0.86rem', wordBreak: 'break-all' }}>
                            {UPI_CONFIG.upiId}
                          </Typography>
                        </Box>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={handleCopyUpi}
                          startIcon={<ContentCopyIcon sx={{ fontSize: 14 }} />}
                          sx={{
                            backgroundColor: copiedUpi ? '#15803D' : '#0B132B',
                            color: '#FFA000',
                            fontWeight: 800,
                            fontSize: '0.75rem',
                            textTransform: 'none',
                            borderRadius: 1.5,
                            py: 0.5,
                            px: 1.5,
                            flexShrink: 0,
                            '&:hover': {
                              backgroundColor: '#1E293B',
                            },
                          }}
                        >
                          {copiedUpi ? '✓ Copied!' : 'Copy UPI ID'}
                        </Button>
                      </Box>
                    </Stack>
                    <Box
                      sx={{
                        mt: 1.5,
                        p: 1,
                        borderRadius: 1.5,
                        backgroundColor: '#FEF3C7',
                        border: '1px solid #FCD34D',
                      }}
                    >
                      <Typography variant="caption" sx={{ color: '#92400E', fontWeight: 800, display: 'block', fontSize: '0.74rem', lineHeight: 1.4 }}>
                        👉 பணம் செலுத்தியவுடன் GPay / PhonePe-ல் கிடைக்கும் <strong>12-Digit UPI Ref / UTR</strong> எண்ணை கீழே பதிவிட்டு <strong>"Confirm Order"</strong> அழுத்தவும்!
                      </Typography>
                    </Box>
                  </Box>

                  {/* 12-Digit UTR Input Box */}
                  <Box sx={{ mt: 1.5, textAlign: 'left' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: '#0B132B' }}>
                        Enter 12-Digit UPI Ref / UTR No <span style={{ color: '#DC2626' }}>*</span>
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: 800,
                          fontSize: '0.72rem',
                          color: utrNumber.length === 12 ? '#15803D' : '#64748B',
                        }}
                      >
                        {utrNumber.length}/12 Digits {utrNumber.length === 12 ? '✔ Valid' : ''}
                      </Typography>
                    </Box>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="e.g. 627875967624"
                      value={utrNumber}
                      onChange={(e) => {
                        const numericOnly = e.target.value.replace(/\D/g, '').slice(0, 12)
                        setUtrNumber(numericOnly)
                        setErrorMsg('')
                      }}
                      helperText="Found in Google Pay / PhonePe transaction receipt (UPI Transaction ID)"
                      inputProps={{
                        maxLength: 12,
                        inputMode: 'numeric',
                        pattern: '[0-9]*',
                      }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <CheckCircleIcon sx={{ color: utrNumber.length === 12 ? '#16A34A' : '#CBD5E1', fontSize: 18 }} />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: 2,
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          '& fieldset': {
                            borderColor: utrNumber.length === 12 ? '#16A34A' : undefined,
                            borderWidth: utrNumber.length === 12 ? '2px' : undefined,
                          },
                        },
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
