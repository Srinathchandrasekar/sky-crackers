import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogActions,
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
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  MenuItem,
  Container,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import CloseIcon from '@mui/icons-material/Close'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import EditIcon from '@mui/icons-material/Edit'
import PersonIcon from '@mui/icons-material/Person'
import PhoneIcon from '@mui/icons-material/Phone'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import HistoryIcon from '@mui/icons-material/History'
import HowToRegIcon from '@mui/icons-material/HowToReg'
import AccountCircleIcon from '@mui/icons-material/AccountCircle'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import ContactPhoneIcon from '@mui/icons-material/ContactPhone'
import LocalShippingIcon from '@mui/icons-material/LocalShipping'
import ShoppingCartCheckoutIcon from '@mui/icons-material/ShoppingCartCheckout'
import BookmarkAddedIcon from '@mui/icons-material/BookmarkAdded'
import DownloadIcon from '@mui/icons-material/Download'
import { downloadStructuredInvoice } from '../utils/invoiceGenerator'
import { lookupCustomerApi, saveCustomerApi, createOrderApi } from '../services/api'
import { CRACKERS_DATA } from '../data/crackersData'

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
  'Kancheepuram',
  'Kanyakumari',
  'Karur',
  'Krishnagiri',
  'Madurai',
  'Mayiladuthurai',
  'Nagapattinam',
  'Namakkal',
  'Nilgiris',
  'Perambalur',
  'Pudukkottai',
  'Ramanathapuram',
  'Ranipet',
  'Salem',
  'Sivaganga',
  'Tenkasi',
  'Thanjavur',
  'Theni',
  'Thoothukudi',
  'Tiruchirappalli',
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

export default function OrderPlacementModal({
  open,
  onClose,
  cart,
  onOrderSuccess,
  onProceedToCheckout,
  onRestoreCart,
}) {
  // Tabs: 0 = "Already Have Account", 1 = "New Customer (Create Account)"
  const [activeTab, setActiveTab] = useState(0)

  // Mobile number & lookup state
  const [mobileNumber, setMobileNumber] = useState('')
  const [lookupLoading, setLookupLoading] = useState(false)
  const [lookupDone, setLookupDone] = useState(false)
  const [lookupServerError, setLookupServerError] = useState(false)
  const [isExistingCustomer, setIsExistingCustomer] = useState(false)
  const [previousOrders, setPreviousOrders] = useState([])
  const [cartRestoredNotice, setCartRestoredNotice] = useState('')

  // Customer form fields (Proper Structured Details)
  const [customerId, setCustomerId] = useState(null)
  const [customerName, setCustomerName] = useState('')
  const [alternatePhone, setAlternatePhone] = useState('')
  const [emailAddress, setEmailAddress] = useState('')
  const [address, setAddress] = useState('')
  const [landmark, setLandmark] = useState('')
  const [city, setCity] = useState('')
  const [district, setDistrict] = useState('')
  const [pinCode, setPinCode] = useState('')

  // Edit address toggle for existing customers
  const [isEditingAddress, setIsEditingAddress] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const [duplicateNotice, setDuplicateNotice] = useState('')

  // Calculations based strictly on selected items (Zero delivery charges!)
  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = cart.reduce((sum, item) => sum + item.product.discountPrice * item.quantity, 0)
  const festivalDiscount = 0
  const totalAmount = cart.length === 0 ? 0 : subtotal

  // Clear all states cleanly on modal close
  const clearFormState = () => {
    setActiveTab(0)
    setMobileNumber('')
    setLookupLoading(false)
    setLookupDone(false)
    setLookupServerError(false)
    setIsExistingCustomer(false)
    setPreviousOrders([])
    setCustomerId(null)
    setCustomerName('')
    setAlternatePhone('')
    setEmailAddress('')
    setAddress('')
    setLandmark('')
    setCity('')
    setDistrict('')
    setPinCode('')
    setIsEditingAddress(false)
    setSubmitLoading(false)
    setFormError('')
    setDuplicateNotice('')
    setCartRestoredNotice('')
  }

  useEffect(() => {
    if (!open) {
      clearFormState()
    } else {
      setFormError('')
      setDuplicateNotice('')
    }
  }, [open])

  const handleModalClose = () => {
    clearFormState()
    if (onClose) onClose()
  }

  // Handle Tab switch
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue)
    setFormError('')
    setDuplicateNotice('')
    if (newValue === 1) {
      setIsEditingAddress(true)
    }
  }

  // Handle switching to clean New Customer account creation
  const handleCreateNewAccount = () => {
    setIsExistingCustomer(false)
    setCustomerId(null)
    setPreviousOrders([])
    setCustomerName('')
    setAlternatePhone('')
    setEmailAddress('')
    setAddress('')
    setLandmark('')
    setCity('')
    setDistrict('')
    setPinCode('')
    setIsEditingAddress(true)
    setActiveTab(1)
    setFormError('')
    setDuplicateNotice('')
  }

  // Handle mobile number input
  const handleMobileChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 10)
    setMobileNumber(val)
    setFormError('')
    setDuplicateNotice('')

    if (val.length === 10) {
      handleLookup(val)
    } else {
      setLookupDone(false)
      setIsExistingCustomer(false)
      setCustomerId(null)
      if (activeTab === 0) {
        setCustomerName('')
        setPreviousOrders([])
      }
    }
  }

  // Lookup customer by 10-digit mobile number from SQL Server database
  const handleLookup = async (phone) => {
    setLookupLoading(true)
    setFormError('')
    setDuplicateNotice('')
    try {
      const res = await lookupCustomerApi(phone)
      setLookupDone(true)

      if (res && res.exists && res.customer) {
        setLookupServerError(false)
        setIsExistingCustomer(true)
        setCustomerId(res.customer.customerId)
        setCustomerName(res.customer.customerName || '')
        setAddress(
          res.customer.address ||
          `${res.customer.doorNumber || ''}, ${res.customer.streetName || ''}, ${res.customer.area || ''}`
            .trim()
            .replace(/^,\s*|,\s*$/g, '')
        )
        setCity(res.customer.city || '')
        setDistrict(res.customer.district || '')
        setPinCode(res.customer.pinCode || '')
        setEmailAddress(res.customer.emailAddress || '')
        setPreviousOrders(res.previousOrders || [])

        if (activeTab === 1) {
          setDuplicateNotice(
            `Account already registered for +91 ${phone} (${res.customer.customerName})! Saved address loaded from database.`
          )
          setIsEditingAddress(true)
        } else {
          setIsEditingAddress(false)
        }
      } else {
        // Customer profile not found or cloud server 500 error
        setIsExistingCustomer(false)
        setCustomerId(null)
        setPreviousOrders([])
        setLookupServerError(Boolean(res?.serverError))

        if (res?.serverError) {
          setFormError(`Cloud database returned HTTP 500. Your profile exists in SQL Server, but the MonsterASP backend needs SkyCrackers_Backend_Deploy.zip extracted. You can enter your delivery address below to complete your order immediately!`)
        } else if (activeTab === 0) {
          setFormError(`No registered profile found for +91 ${phone}. Please switch to "New Customer" to register your delivery address.`)
        }
        setIsEditingAddress(true)
      }
    } catch (err) {
      console.warn('Customer lookup error:', err)
      setLookupDone(true)
      setIsExistingCustomer(false)
      setCustomerId(null)
      setLookupServerError(true)
      setIsEditingAddress(true)
    } finally {
      setLookupLoading(false)
    }
  }

  // Restore crackers from a previous saved order into active shopping cart
  const handleRestoreOrderItems = (order) => {
    if (!order || !order.items || order.items.length === 0) return
    const restored = order.items.map((item) => {
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
          originalPrice: Math.round(item.unitPrice * 5),
          discountPrice: item.unitPrice,
        },
        quantity: item.quantity,
      }
    })

    if (onRestoreCart) {
      onRestoreCart(restored)
      setCartRestoredNotice(`✅ Loaded ${restored.length} crackers from saved Order #${order.orderNumber} into your cart!`)
    }
  }

  // Handle final order submission
  const handleConfirmOrder = async () => {
    setFormError('')

    if (!mobileNumber || mobileNumber.length !== 10) {
      setFormError('Please enter a valid 10-digit Primary Mobile Number.')
      return
    }

    if (!customerName || !customerName.trim()) {
      setFormError('Customer Full Name is required.')
      return
    }

    if (!address || !address.trim()) {
      setFormError('Delivery Address (Door No, Building, Street Name) is required.')
      return
    }

    if (!city || !city.trim()) {
      setFormError('City / Town is required.')
      return
    }

    if (!district || !district.trim()) {
      setFormError('Please select your District.')
      return
    }

    if (!pinCode || pinCode.trim().length !== 6) {
      setFormError('Please provide a valid 6-digit PIN code.')
      return
    }

    setSubmitLoading(true)

    try {
      const fullDeliveryAddress = `${address.trim()}${landmark.trim() ? `, Landmark: ${landmark.trim()}` : ''}, ${city.trim()}, ${district.trim()} - ${pinCode.trim()}`

      // 1. Save or update customer record in SQL Server
      const customerPayload = {
        CustomerName: customerName.trim(),
        customerName: customerName.trim(),
        fullName: customerName.trim(),
        MobileNumber: mobileNumber.trim(),
        mobileNumber: mobileNumber.trim(),
        emailAddress: emailAddress?.trim() || null,
        address: fullDeliveryAddress,
        doorNumber: address.trim().split(',')[0] || address.trim(),
        streetName: address.trim(),
        area: landmark.trim() || city.trim(),
        city: city.trim(),
        district: district.trim(),
        state: 'Tamil Nadu',
        pinCode: pinCode.trim(),
      }

      let savedCustomerId = customerId
      try {
        const custRes = await saveCustomerApi(customerPayload)
        savedCustomerId = custRes?.data?.customerId || custRes?.customerId || savedCustomerId || 1
      } catch (saveErr) {
        console.warn('Customer save warning (non-blocking if customerId known):', saveErr)
        if (!savedCustomerId) {
          throw saveErr
        }
      }

      const custData = {
        customerId: savedCustomerId,
        CustomerId: savedCustomerId,
        fullName: customerName.trim(),
        customerName: customerName.trim(),
        mobileNumber: mobileNumber.trim(),
        alternatePhone: alternatePhone.trim(),
        address: fullDeliveryAddress,
        doorNumber: address.trim().split(',')[0] || address.trim(),
        streetName: address.trim(),
        area: landmark.trim() || city.trim(),
        city: city.trim(),
        district: district.trim(),
        state: 'Tamil Nadu',
        pinCode: pinCode.trim(),
        pincode: pinCode.trim(),
        emailAddress: emailAddress?.trim() || null,
      }

      if (onProceedToCheckout) {
        onProceedToCheckout(custData)
      } else if (onOrderSuccess) {
        // Fallback: direct order creation if checkout page is not wired
        const orderItems = cart.map((item) => ({
          productId: item.product.productId || Number(String(item.product.id).replace('p-', '')) || item.product.sno || 1,
          productName: item.product.name,
          quantity: item.quantity,
          unitPrice: item.product.discountPrice,
          totalPrice: item.product.discountPrice * item.quantity,
        }))

        const orderPayload = {
          customerId: savedCustomerId,
          subTotal: subtotal,
          discountAmount: festivalDiscount,
          deliveryFee: 0,
          totalAmount: totalAmount,
          paymentMode: 'Net Banking / UPI / Card',
          deliveryAddress: fullDeliveryAddress,
          items: orderItems,
        }

        const orderRes = await createOrderApi(orderPayload)

        const orderSummary = {
          orderId: orderRes?.orderId || Date.now(),
          orderNumber: orderRes?.orderNumber || `SFC-${Date.now().toString().slice(-6)}`,
          customer: {
            customerName: customerName.trim(),
            mobileNumber: mobileNumber.trim(),
            alternatePhone: alternatePhone.trim(),
            address: fullDeliveryAddress,
            city: city.trim(),
            district: district.trim(),
            pinCode: pinCode.trim(),
          },
          items: cart,
          subtotal: subtotal,
          discount: festivalDiscount,
          delivery: 0,
          total: totalAmount,
          paymentStatus: 'Pending Verification / Direct Wholesale',
          date: new Date().toISOString(),
        }

        onOrderSuccess(orderSummary)
      }
      if (onClose) onClose()
    } catch (err) {
      console.error('Failed to submit order to SQL Server:', err)
      setFormError('Failed to save customer details to database. Please check connection and try again.')
    } finally {
      setSubmitLoading(false)
    }
  }

  return (
    <Dialog
      fullScreen
      open={open}
      onClose={handleModalClose}
      sx={{
        '& .MuiDialog-paper': {
          backgroundColor: '#F8FAFC',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        },
      }}
    >
      {/* Festive Fullscreen Dialog Header */}
      <Box
        sx={{
          backgroundColor: '#0B132B',
          color: '#FFFFFF',
          px: { xs: 1.5, sm: 3, md: 4 },
          py: { xs: 1.2, sm: 1.6 },
          position: 'relative',
          borderBottom: '3px solid #FFA000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1.5,
          boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
          zIndex: 10,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 1.5 }, minWidth: 0, flex: 1 }}>
          <Button
            variant="contained"
            startIcon={<ArrowBackIcon />}
            onClick={handleModalClose}
            sx={{
              backgroundColor: '#FFA000',
              color: '#0B132B',
              fontWeight: 800,
              fontSize: { xs: '0.8rem', sm: '0.9rem' },
              borderRadius: 2,
              px: { xs: 1.2, sm: 2 },
              py: { xs: 0.6, sm: 0.8 },
              textTransform: 'none',
              boxShadow: '0 2px 10px rgba(255, 160, 0, 0.4)',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              '&:hover': { backgroundColor: '#FF8F00' },
            }}
          >
            Back
          </Button>

          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 800,
                color: '#FFA000',
                lineHeight: 1.2,
                fontSize: { xs: '0.88rem', sm: '1.15rem' },
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: { xs: 'normal', sm: 'nowrap' },
              }}
            >
              Customer Order Placement
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: '#94A3B8',
                display: { xs: 'none', sm: 'block' },
                fontSize: '0.78rem',
              }}
            >
              Direct Sivakasi Booking & Transport Parcel Delivery
            </Typography>
          </Box>
        </Box>

        <IconButton
          onClick={handleModalClose}
          size="small"
          sx={{
            color: 'rgba(255, 255, 255, 0.7)',
            '&:hover': { color: '#FFFFFF', backgroundColor: 'rgba(255,255,255,0.1)' },
            flexShrink: 0,
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Fullscreen Dialog Content */}
      <DialogContent sx={{ p: { xs: 2, sm: 3, md: 4 }, backgroundColor: '#F8FAFC', flexGrow: 1, overflowY: 'auto' }}>
        <Container maxWidth="xl" disableGutters>
          {/* Error Alert */}
          {formError && (
            <Alert severity="warning" sx={{ mb: 2.5, borderRadius: 2 }}>
              {formError}
            </Alert>
          )}

          {/* Duplicate Notice */}
          {duplicateNotice && (
            <Alert severity="success" icon={<CheckCircleIcon />} sx={{ mb: 2.5, borderRadius: 2 }}>
              {duplicateNotice}
            </Alert>
          )}

          <Grid container spacing={3.5}>
            {/* Left Column: Customer Tabs & Forms (7.5 cols) */}
            <Grid item xs={12} lg={7.5}>
              {/* Double Tabs Navigation */}
              <Paper elevation={0} sx={{ mb: 2.5, borderRadius: 2.5, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                <Tabs
                  value={activeTab}
                  onChange={handleTabChange}
                  variant="fullWidth"
                  sx={{
                    minHeight: 48,
                    backgroundColor: '#FFFFFF',
                    '& .MuiTab-root': {
                      minHeight: 48,
                      textTransform: 'none',
                      fontWeight: 700,
                      fontSize: '0.92rem',
                    },
                    '& .Mui-selected': {
                      color: '#B45309 !important',
                      fontWeight: 800,
                    },
                    '& .MuiTabs-indicator': {
                      backgroundColor: '#FFA000',
                      height: 3,
                    },
                  }}
                >
                  <Tab
                    icon={<PersonIcon fontSize="small" />}
                    iconPosition="start"
                    label="Already Have Account (Login by Phone)"
                  />
                  <Tab
                    icon={<HowToRegIcon fontSize="small" />}
                    iconPosition="start"
                    label="New Customer (Create Account)"
                  />
                </Tabs>
              </Paper>

              {/* TAB 0: ALREADY HAVE ACCOUNT */}
        {activeTab === 0 && (
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', mb: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0B132B', mb: 0.5 }}>
              Registered Customer Login
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748B', mb: 2 }}>
              Enter your 10-digit mobile number to automatically retrieve and bind your saved name & delivery address from SQL database!
            </Typography>

            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={8}>
                <TextField
                  fullWidth
                  size="small"
                  label="10-Digit Mobile Number"
                  placeholder="e.g. 9876543210"
                  value={mobileNumber}
                  onChange={handleMobileChange}
                  InputProps={{
                    startAdornment: (
                      <Box component="span" sx={{ color: '#64748B', mr: 1, fontWeight: 700 }}>
                        +91
                      </Box>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Button
                  variant="contained"
                  fullWidth
                  disabled={mobileNumber.length !== 10 || lookupLoading}
                  onClick={() => handleLookup(mobileNumber)}
                  sx={{
                    borderRadius: 2,
                    py: 1,
                    textTransform: 'none',
                    fontWeight: 800,
                    backgroundColor: '#0B132B',
                    color: '#FFA000',
                    '&:hover': { backgroundColor: '#1A2A56' },
                  }}
                >
                  {lookupLoading ? <CircularProgress size={20} sx={{ color: '#FFA000' }} /> : 'Search Customer'}
                </Button>
              </Grid>
            </Grid>

            {/* Found Account Details & Address Binding */}
            {lookupDone && isExistingCustomer && (
              <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #E2E8F0' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
                  <Chip
                    icon={<CheckCircleIcon sx={{ fontSize: '15px !important' }} />}
                    label={`Verified Account: ${customerName}`}
                    color="success"
                    sx={{ fontWeight: 800 }}
                  />
                  {!isEditingAddress && (
                    <Button
                      size="small"
                      startIcon={<EditIcon fontSize="small" />}
                      onClick={() => setIsEditingAddress(true)}
                      sx={{
                        textTransform: 'none',
                        fontWeight: 700,
                        color: '#B45309',
                        backgroundColor: '#FEF3C7',
                        borderRadius: 1.5,
                        px: 1.5,
                        '&:hover': { backgroundColor: '#FDE68A' },
                      }}
                    >
                      ✏️ Edit / Change Address
                    </Button>
                  )}
                </Box>

                {!isEditingAddress ? (
                  <Box sx={{ p: 2, backgroundColor: '#F8FAFC', borderRadius: 2, border: '1px solid #E2E8F0' }}>
                    <Typography variant="body2" sx={{ color: '#334155', mb: 0.5 }}>
                      <strong>Customer Name:</strong> {customerName}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#334155', mb: 0.5 }}>
                      <strong>Primary Phone:</strong> +91 {mobileNumber}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#334155', mb: 0.5 }}>
                      <strong>Delivery Address:</strong> {address}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#334155' }}>
                      <strong>City & PIN:</strong> {city} {district && `(${district})`} - {pinCode}
                    </Typography>
                  </Box>
                ) : (
                  /* Editable Address Inputs */
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Customer Full Name"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        required
                      />
                      <TextField
                        fullWidth
                        size="small"
                        label="Email Address (Optional)"
                        value={emailAddress}
                        onChange={(e) => setEmailAddress(e.target.value)}
                      />
                    </Box>
                    <TextField
                      fullWidth
                      size="small"
                      multiline
                      minRows={2}
                      label="Delivery Address (Door No, Building, Street Name)"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      required
                    />
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2 }}>
                      <TextField
                        fullWidth
                        size="small"
                        label="City / Town"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        required
                      />
                      <TextField
                        fullWidth
                        select
                        size="small"
                        label="District"
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        required
                      >
                        <MenuItem value="">
                          <em>Select District</em>
                        </MenuItem>
                        {TAMIL_NADU_DISTRICTS.map((dist) => (
                          <MenuItem key={dist} value={dist}>
                            {dist}
                          </MenuItem>
                        ))}
                      </TextField>
                      <TextField
                        fullWidth
                        size="small"
                        label="6-Digit PIN Code"
                        value={pinCode}
                        onChange={(e) => setPinCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        required
                      />
                    </Box>
                  </Box>
                )}

                {/* Cart restored notice */}
                {cartRestoredNotice && (
                  <Alert severity="success" sx={{ mt: 1.5, borderRadius: 2 }}>
                    {cartRestoredNotice}
                  </Alert>
                )}

                {/* Quick restore banner if cart is empty and user has past orders */}
                {previousOrders.length > 0 && cart.length === 0 && (
                  <Alert
                    severity="info"
                    sx={{ mt: 1.5, borderRadius: 2 }}
                    action={
                      <Button
                        color="inherit"
                        size="small"
                        variant="contained"
                        onClick={() => handleRestoreOrderItems(previousOrders[0])}
                        sx={{ fontWeight: 800, backgroundColor: '#0284C7', color: '#FFFFFF', textTransform: 'none' }}
                      >
                        Load Saved Items into Cart
                      </Button>
                    }
                  >
                    Found your saved booking (#{previousOrders[0].orderNumber}) with {previousOrders[0].items?.length || 0} products!
                  </Alert>
                )}

                {/* Past Orders History Accordion */}
                {previousOrders.length > 0 && (
                  <Accordion elevation={0} sx={{ mt: 2, border: '1px solid #E2E8F0', borderRadius: '8px !important' }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <HistoryIcon fontSize="small" sx={{ color: '#0284C7' }} />
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#0369A1' }}>
                          Previous Orders History ({previousOrders.length} bookings)
                        </Typography>
                      </Stack>
                    </AccordionSummary>
                    <AccordionDetails sx={{ pt: 0 }}>
                      <Stack spacing={1.5}>
                        {previousOrders.map((po) => (
                          <Box
                            key={po.orderNumber}
                            sx={{
                              p: 1.5,
                              borderRadius: 2,
                              backgroundColor: '#F8FAFC',
                              border: '1px solid #E2E8F0',
                            }}
                          >
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0B132B' }}>
                                  #{po.orderNumber}
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#64748B' }}>
                                  {po.items?.length || 0} Products • {new Date(po.createdAt).toLocaleDateString()}
                                </Typography>
                              </Box>
                              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#16A34A' }}>
                                ₹{po.totalAmount}
                              </Typography>
                            </Box>

                            {/* Show order items list */}
                            {po.items && po.items.length > 0 && (
                              <Box sx={{ mt: 1, pt: 1, borderTop: '1px dashed #E2E8F0' }}>
                                <Typography variant="caption" sx={{ color: '#475569', fontWeight: 600, display: 'block', mb: 0.8 }}>
                                  Crackers: {po.items.map((i) => `${i.productName} (x${i.quantity})`).join(', ')}
                                </Typography>
                                <Stack direction="row" spacing={1.5} sx={{ mt: 0.8 }} flexWrap="wrap">
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    startIcon={<ShoppingCartCheckoutIcon sx={{ fontSize: 16 }} />}
                                    onClick={() => handleRestoreOrderItems(po)}
                                    sx={{
                                      textTransform: 'none',
                                      fontWeight: 800,
                                      fontSize: '0.75rem',
                                      color: '#0369A1',
                                      borderColor: '#7DD3FC',
                                      backgroundColor: '#FFFFFF',
                                      '&:hover': { backgroundColor: '#E0F2FE' },
                                    }}
                                  >
                                    Load These Crackers into Cart
                                  </Button>
                                  <Button
                                    size="small"
                                    variant="contained"
                                    startIcon={<DownloadIcon sx={{ fontSize: 16 }} />}
                                    onClick={() => {
                                      const orderForInvoice = {
                                        ...po,
                                        customerName: po.customerName || customerName || 'Valued Customer',
                                        customerPhone: po.customerPhone || mobileNumber || '',
                                        deliveryAddress: po.deliveryAddress || address || `${city} ${district}`.trim() || 'Tamil Nadu, India',
                                      }
                                      downloadStructuredInvoice(orderForInvoice)
                                    }}
                                    sx={{
                                      textTransform: 'none',
                                      fontWeight: 800,
                                      fontSize: '0.75rem',
                                      backgroundColor: '#FFA000',
                                      color: '#0B132B',
                                      '&:hover': { backgroundColor: '#FF8F00' },
                                    }}
                                  >
                                    Download Invoice (பில் டவுன்லோட்)
                                  </Button>
                                </Stack>
                              </Box>
                            )}
                          </Box>
                        ))}
                      </Stack>
                    </AccordionDetails>
                  </Accordion>
                )}
              </Box>
            )}

            {/* NOT FOUND OR SERVER ERROR ALERT */}
            {lookupDone && !isExistingCustomer && mobileNumber.length === 10 && (
              <Box sx={{ mt: 2.5, p: 2.5, backgroundColor: lookupServerError ? '#FEF2F2' : '#FFFBEB', borderRadius: 2.5, border: lookupServerError ? '1px solid #FECACA' : '1px solid #FDE68A' }}>
                <Stack spacing={1.5} alignItems="flex-start">
                  <Alert severity={lookupServerError ? "error" : "warning"} icon={<WarningAmberIcon />} sx={{ width: '100%', borderRadius: 2 }}>
                    {lookupServerError ? (
                      <span><strong>Cloud Server Error (HTTP 500):</strong> Your profile exists in the SQL Server, but the MonsterASP backend needs the latest build uploaded (<code>SkyCrackers_Backend_Deploy.zip</code>). You can enter your delivery address below to complete your order now!</span>
                    ) : (
                      <span><strong>You don't have an account!</strong> No registered profile found for <strong>+91 {mobileNumber}</strong> in our database.</span>
                    )}
                  </Alert>
                  <Typography variant="body2" sx={{ color: lookupServerError ? '#991B1B' : '#92400E' }}>
                    Click below to fill in your delivery address and confirm your booking.
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<HowToRegIcon />}
                    onClick={handleCreateNewAccount}
                    sx={{
                      backgroundColor: lookupServerError ? '#DC2626' : '#B45309',
                      color: '#FFFFFF',
                      fontWeight: 800,
                      textTransform: 'none',
                      borderRadius: 2,
                      px: 2.5,
                      '&:hover': { backgroundColor: lookupServerError ? '#B91C1C' : '#92400E' },
                    }}
                  >
                    Enter Delivery Details Now →
                  </Button>
                </Stack>
              </Box>
            )}
          </Paper>
        )}

        {/* TAB 1: NEW CUSTOMER (CREATE ACCOUNT - PROPER STRUCTURED DETAILS) */}
        {activeTab === 1 && (
          <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF', mb: 3 }}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0B132B' }}>
                New Customer Registration & Parcel Booking
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748B' }}>
                Please provide accurate contact and transport delivery details for direct Sivakasi dispatch.
              </Typography>
            </Box>

            {/* SECTION 1: CONTACT DETAILS */}
            <Box sx={{ mb: 3 }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                <ContactPhoneIcon sx={{ color: '#FFA000', fontSize: 20 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0B132B' }}>
                  1. Contact Information (தொடர்பு விவரங்கள்)
                </Typography>
              </Stack>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Customer Full Name"
                  placeholder="e.g. S. Muthu Kumar"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  helperText="Primary recipient name for parcel receipt"
                  required
                />
                <TextField
                  fullWidth
                  size="small"
                  label="10-Digit Mobile / WhatsApp Number"
                  placeholder="e.g. 9876543210"
                  value={mobileNumber}
                  onChange={handleMobileChange}
                  helperText="Required for booking confirmation & transport updates"
                  InputProps={{
                    startAdornment: (
                      <Box component="span" sx={{ color: '#64748B', mr: 1, fontWeight: 700 }}>
                        +91
                      </Box>
                    ),
                  }}
                  required
                />
                <TextField
                  fullWidth
                  size="small"
                  label="Alternate Mobile Number (Optional)"
                  placeholder="e.g. 9443123456"
                  value={alternatePhone}
                  onChange={(e) => setAlternatePhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  helperText="Optional backup contact number"
                />
                <TextField
                  fullWidth
                  size="small"
                  label="Email Address (Optional)"
                  placeholder="e.g. customer@gmail.com"
                  value={emailAddress}
                  onChange={(e) => setEmailAddress(e.target.value)}
                  helperText="Optional for digital invoice copy"
                />
              </Box>
            </Box>

            <Divider sx={{ my: 2.5 }} />

            {/* SECTION 2: DELIVERY ADDRESS */}
            <Box>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                <LocalShippingIcon sx={{ color: '#FFA000', fontSize: 20 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0B132B' }}>
                  2. Parcel Delivery Address (பார்சல் அனுப்ப வேண்டிய முழு முகவரி)
                </Typography>
              </Stack>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  multiline
                  minRows={2}
                  label="Full Delivery Address (Door No, Building, Street Name)"
                  placeholder="e.g. No. 14/2, Anna Nagar Main Road, Sivakasi West"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  helperText="Provide full street address to avoid transport delivery delays"
                  required
                />
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Landmark / Area (Optional)"
                    placeholder="e.g. Near Bus Stand, Opp. Indian Bank"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                  />
                  <TextField
                    fullWidth
                    size="small"
                    label="City / Town"
                    placeholder="e.g. Madurai"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                  />
                </Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                  <TextField
                    fullWidth
                    select
                    size="small"
                    label="District"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    SelectProps={{
                      MenuProps: {
                        PaperProps: {
                          sx: {
                            maxHeight: 280,
                            borderRadius: 2,
                            boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
                          },
                        },
                      },
                    }}
                    required
                  >
                    <MenuItem value="">
                      <em>Select District</em>
                    </MenuItem>
                    {TAMIL_NADU_DISTRICTS.map((dist) => (
                      <MenuItem key={dist} value={dist}>
                        {dist}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    fullWidth
                    size="small"
                    label="6-Digit Postal PIN Code"
                    placeholder="e.g. 625001"
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    helperText="6-digit Indian Postal PIN code"
                    required
                  />
                </Box>
              </Box>
            </Box>
          </Paper>
        )}
      </Grid>

      {/* Right Column: Booking Order Summary & Crackers Table (4.5 cols) */}
      <Grid item xs={12} lg={4.5}>
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            borderRadius: 3,
            border: '1px solid #E2E8F0',
            backgroundColor: '#FFFFFF',
            position: { lg: 'sticky' },
            top: 20,
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0B132B' }}>
              Booking Order Summary
            </Typography>
            <Chip
              size="small"
              label={`${cart.length} Distinct Crackers (${totalItemsCount} Boxes)`}
              sx={{ fontWeight: 800, backgroundColor: '#0B132B', color: '#FFA000' }}
            />
          </Box>

          <TableContainer sx={{ maxHeight: 380, mb: 2 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, backgroundColor: '#F8FAFC' }}>Cracker Item</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, backgroundColor: '#F8FAFC' }}>Qty</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, backgroundColor: '#F8FAFC' }}>Price</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, backgroundColor: '#F8FAFC' }}>Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {cart.map((item) => (
                  <TableRow key={item.product.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {item.product.image && (
                          <Box
                            component="img"
                            src={item.product.image}
                            alt={item.product.name}
                            sx={{ width: 36, height: 36, borderRadius: 1, objectFit: 'cover' }}
                          />
                        )}
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.85rem' }}>
                            {item.product.name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748B' }}>
                            {item.product.pieces || '1 Box'}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>
                      {item.quantity}
                    </TableCell>
                    <TableCell align="right">₹{item.product.discountPrice}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, color: '#16A34A' }}>
                      ₹{item.product.discountPrice * item.quantity}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pricing Breakdown (No Delivery Charges!) */}
          <Box sx={{ p: 2, backgroundColor: '#F8FAFC', borderRadius: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.8 }}>
              <Typography variant="body2" sx={{ color: '#64748B' }}>
                Items Subtotal ({totalItemsCount} boxes)
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                ₹{subtotal}
              </Typography>
            </Box>

            <Divider sx={{ my: 1.5 }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#0B132B' }}>
                Total Order Booking Amount
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 900, color: '#0B132B' }}>
                ₹{totalAmount}
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  </Container>
</DialogContent>

      {/* Dialog Footer Actions */}
      <DialogActions sx={{ p: 2.5, backgroundColor: '#FFFFFF', borderTop: '1px solid #E2E8F0', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5 }}>
        <Button onClick={handleModalClose} sx={{ color: '#64748B', textTransform: 'none', fontWeight: 600 }}>
          Cancel & Close
        </Button>

        {activeTab === 0 ? (
          isExistingCustomer && lookupDone ? (
            <Button
              variant="contained"
              disabled={submitLoading || cart.length === 0}
              onClick={handleConfirmOrder}
              startIcon={submitLoading ? <CircularProgress size={16} sx={{ color: '#FFFFFF' }} /> : <CheckCircleIcon fontSize="small" />}
              sx={{
                background: 'linear-gradient(135deg, #15803D 0%, #16A34A 100%)',
                color: '#FFFFFF',
                fontWeight: 900,
                fontSize: { xs: '0.86rem', sm: '0.94rem' },
                px: { xs: 2.2, sm: 3.5 },
                py: { xs: 1, sm: 1.2 },
                borderRadius: '24px',
                boxShadow: '0 4px 16px rgba(22, 163, 74, 0.4)',
                textTransform: 'none',
                letterSpacing: '0.02em',
                transition: 'all 0.25s ease',
                '&:hover': {
                  background: 'linear-gradient(135deg, #166534 0%, #15803D 100%)',
                  boxShadow: '0 6px 22px rgba(22, 163, 74, 0.55)',
                  transform: 'translateY(-1px)',
                },
              }}
            >
              {submitLoading ? 'Saving & Proceeding...' : `Confirm & Proceed to Payment (₹${totalAmount}) →`}
            </Button>
          ) : (
            <Button
              variant="contained"
              disabled={lookupLoading || (mobileNumber.length !== 10 && !lookupDone)}
              onClick={() => {
                if (lookupDone && !isExistingCustomer) {
                  handleCreateNewAccount()
                } else if (mobileNumber.length === 10) {
                  handleLookup(mobileNumber)
                }
              }}
              startIcon={lookupDone && !isExistingCustomer ? <HowToRegIcon fontSize="small" /> : undefined}
              sx={{
                backgroundColor: lookupDone && !isExistingCustomer ? '#B45309' : '#0B132B',
                color: lookupDone && !isExistingCustomer ? '#FFFFFF' : '#FFA000',
                fontWeight: 800,
                fontSize: { xs: '0.84rem', sm: '0.9rem' },
                px: { xs: 2, sm: 2.8 },
                py: { xs: 0.9, sm: 1.1 },
                borderRadius: 2,
                textTransform: 'none',
                '&:hover': { backgroundColor: lookupDone && !isExistingCustomer ? '#92400E' : '#1A2A56' },
              }}
            >
              {lookupLoading ? (
                <CircularProgress size={18} sx={{ color: '#FFA000' }} />
              ) : lookupDone && !isExistingCustomer ? (
                'Create New Account Now →'
              ) : (
                'Search Customer to Proceed'
              )}
            </Button>
          )
        ) : (
          <Button
            variant="contained"
            disabled={submitLoading || cart.length === 0}
            onClick={handleConfirmOrder}
            startIcon={submitLoading ? <CircularProgress size={16} sx={{ color: '#FFFFFF' }} /> : <CheckCircleIcon fontSize="small" />}
            sx={{
              background: 'linear-gradient(135deg, #15803D 0%, #16A34A 100%)',
              color: '#FFFFFF',
              fontWeight: 900,
              fontSize: { xs: '0.86rem', sm: '0.94rem' },
              px: { xs: 2.2, sm: 3.5 },
              py: { xs: 1, sm: 1.2 },
              borderRadius: '24px',
              boxShadow: '0 4px 16px rgba(22, 163, 74, 0.4)',
              textTransform: 'none',
              letterSpacing: '0.02em',
              transition: 'all 0.25s ease',
              '&:hover': {
                background: 'linear-gradient(135deg, #166534 0%, #15803D 100%)',
                boxShadow: '0 6px 22px rgba(22, 163, 74, 0.55)',
                transform: 'translateY(-1px)',
              },
            }}
          >
            {submitLoading ? 'Saving Customer...' : `Save Details & Proceed to Payment (₹${totalAmount}) →`}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}
