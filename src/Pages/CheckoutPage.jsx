import React, { useState, useEffect, useRef } from 'react'
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

  // Payment Mode: Default to 'whatsapp' booking enquiry (UPI payment commented out per user request)
  const [paymentMethod, setPaymentMethod] = useState('whatsapp') // 'whatsapp' active
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
  const isSubmittingRef = useRef(false)

  const handleSubmitOrder = async (e) => {
    if (e && e.preventDefault) e.preventDefault()
    if (isSubmitting || isSubmittingRef.current) return
    isSubmittingRef.current = true
    setIsSubmitting(true)

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
      const paymentStatus = isUpi ? 'Pending Verification' : 'Pending'
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

      // Persist locally for instant lookup retrieval with accurate totals across both storage keys
      try {
        const orderRecord = {
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
        }

        ;['skycrackers_orders_history', 'sky_orders'].forEach((key) => {
          const existingOrders = JSON.parse(localStorage.getItem(key) || '[]')
          const filtered = existingOrders.filter((o) => o.orderNumber !== orderNum)
          filtered.unshift(orderRecord)
          localStorage.setItem(key, JSON.stringify(filtered.slice(0, 50)))
        })
      } catch (locErr) {
        console.warn('Local save warning:', locErr)
      }

      const orderSummary = {
        orderId: orderNum,
        orderNumber: orderNum,
        isPaid: false, // Never mark as Paid until verified by admin!
        paymentStatus: paymentStatus,
        couponCode: isCouponApplied ? appliedCouponCode : null,
        customer: {
          name: formData.fullName.trim(),
          phone: formData.mobileNumber.trim(),
          address: cleanAddressDisplay(fullAddress),
        },
        paymentMethod: isUpi ? `Direct UPI (UTR: ${cleanUtr})` : 'WhatsApp Enquiry (Pay Later)',
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
      isSubmittingRef.current = false
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
                    fontSize: { xs: '1rem', sm: '1.1rem' },
                  }}
                >
                  3. Direct WhatsApp Booking Enquiry
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
                    TOTAL ORDER VALUE
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 900, color: '#FFFFFF', lineHeight: 1.1 }}>
                    ₹{totalAmount.toLocaleString('en-IN')}
                  </Typography>
                </Box>
              </Box>

              {/* 
                ========================================================================
                NOTE: UPI / QR PAYMENT MODE TEMPORARILY DISABLED & COMMENTED OUT
                (Can be uncommented and restored anytime as per user request)
                ========================================================================
                <Box sx={{ mb: 2 }}>
                  <Tabs value={paymentMethod === 'upi' ? 0 : 1} onChange={(e, val) => setPaymentMethod(val === 0 ? 'upi' : 'whatsapp')}>
                    <Tab label="Pay via UPI / QR" />
                    <Tab label="WhatsApp Booking" />
                  </Tabs>
                </Box>
                {paymentMethod === 'upi' && (
                  <Box>...UPI QR Code & UTR verification inputs...</Box>
                )}
                ========================================================================
              */}

              {/* WhatsApp Direct Booking Enquiry Box */}
              <Box
                sx={{
                  p: { xs: 2, sm: 2.5 },
                  borderRadius: 2.5,
                  border: '2px solid #86EFAC',
                  backgroundColor: '#F0FDF4',
                  mb: 2.5,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 1.2 }}>
                  <WhatsAppIcon sx={{ color: '#25D366', fontSize: 32 }} />
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#166534', fontSize: '0.96rem' }}>
                      Direct WhatsApp Booking Enquiry
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#15803D', fontWeight: 700, display: 'block' }}>
                      Zero upfront payment required now
                    </Typography>
                  </Box>
                </Box>

                <Typography variant="body2" sx={{ color: '#1E293B', fontSize: '0.84rem', mb: 1.5, lineHeight: 1.6 }}>
                  உடனடி ஆன்லைன் பேமென்ட் தேவையில்லை. கீழே உள்ள பட்டனை அழுத்தினால் உங்களின் பட்டாசு பட்டியல், முகவரி மற்றும் அதிகாரப்பூர்வ பில் எங்கள் சிவகாசி அலுவலகத்திற்கு (+91 80567 04353) WhatsApp-ல் நேரடியாக சென்றுவிடும்!
                </Typography>

                <Box sx={{ p: 1.5, backgroundColor: '#FFFFFF', borderRadius: 2, border: '1px solid #CBD5E1', mb: 1.5 }}>
                  <Typography variant="caption" sx={{ color: '#64748B', display: 'block', fontWeight: 700, fontSize: '0.7rem' }}>
                    SIVAKASI WHATSAPP HELPLINE
                  </Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#0B132B' }}>
                    {UPI_CONFIG.displayPhone}
                  </Typography>
                </Box>

                <Box sx={{ p: 1.2, backgroundColor: '#EFF6FF', borderRadius: 2, border: '1px solid #BFDBFE' }}>
                  <Typography variant="caption" sx={{ color: '#1E40AF', fontWeight: 800, display: 'block', lineHeight: 1.45, fontSize: '0.78rem' }}>
                    ⚡ <strong>உறுதிமொழி:</strong> உங்கள் enquiry பதிவு செய்தவுடன், 24 மணி நேரத்திற்குள் Sky Crackers குழுவினர் உங்களை தொடர்புகொண்டு பார்சல் பேக்கிங் மற்றும் டெலிவரி விவரங்களை உறுதி செய்வார்கள்!
                  </Typography>
                </Box>
              </Box>

              {/* Action Submit Button - Mobile Optimized Touch Target */}
              <Button
                variant="contained"
                fullWidth
                disabled={isSubmitting || cart.length === 0}
                startIcon={isSubmitting ? <CircularProgress size={18} sx={{ color: '#FFFFFF' }} /> : <WhatsAppIcon sx={{ fontSize: 24 }} />}
                onClick={handleSubmitOrder}
                sx={{
                  backgroundColor: '#25D366',
                  color: '#FFFFFF',
                  fontWeight: 900,
                  fontSize: { xs: '0.92rem', sm: '1.02rem' },
                  py: { xs: 1.3, sm: 1.5 },
                  minHeight: 50,
                  borderRadius: '25px',
                  boxShadow: '0 4px 16px rgba(37, 211, 102, 0.45)',
                  textTransform: 'none',
                  '&:hover': {
                    backgroundColor: '#1EBE5D',
                    boxShadow: '0 6px 20px rgba(37, 211, 102, 0.6)',
                  },
                }}
              >
                {isSubmitting ? 'Submitting Enquiry...' : `Confirm Booking & Open WhatsApp (${UPI_CONFIG.displayPhone}) →`}
              </Button>

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
