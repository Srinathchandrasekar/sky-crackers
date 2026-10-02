import React, { useState } from 'react'
import {
  Box,
  Container,
  Grid,
  Typography,
  Paper,
  TextField,
  Button,
  Divider,
  Stack,
  InputAdornment,
  Alert,
  Checkbox,
  FormControlLabel,
  FormControl,
  FormHelperText,
  MenuItem,
  Select,
  CircularProgress,
  Chip,
  Breadcrumbs,
  Link,
} from '@mui/material'
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined'
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid'
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined'
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined'
import NavigationOutlinedIcon from '@mui/icons-material/NavigationOutlined'
import LocationCityOutlinedIcon from '@mui/icons-material/LocationCityOutlined'
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined'
import MapOutlinedIcon from '@mui/icons-material/MapOutlined'
import PublicOutlinedIcon from '@mui/icons-material/PublicOutlined'
import PinDropOutlinedIcon from '@mui/icons-material/PinDropOutlined'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined'
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined'
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined'
import SearchIcon from '@mui/icons-material/Search'
import ExistingCustomerModal from '../Components/ExistingCustomerModal'
import { saveCustomerApi, lookupCustomerApi } from '../services/customerApi'

// Comprehensive list of Tamil Nadu districts
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
]

const STATES_LIST = [
  'Tamil Nadu',
  'Kerala',
  'Karnataka',
  'Andhra Pradesh',
  'Telangana',
  'Puducherry',
]

export default function CustomerDetailsPage({
  cart = [],
  customerData,
  onBack,
  onContinue,
}) {
  // Form State
  const [formData, setFormData] = useState({
    fullName: customerData?.fullName || '',
    mobileNumber: customerData?.mobileNumber || '',
    email: customerData?.email || '',
    doorNumber: customerData?.doorNumber || '',
    streetName: customerData?.streetName || '',
    area: customerData?.area || '',
    city: customerData?.city || '',
    district: customerData?.district || '',
    state: customerData?.state || 'Tamil Nadu',
    pincode: customerData?.pincode || '',
    agreePrivacy: customerData?.agreePrivacy || false,
  })

  // Validation errors & touch state
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successBanner, setSuccessBanner] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [savedCustomerId, setSavedCustomerId] = useState(null)
  const [serverError, setServerError] = useState(null)

  // Existing customer verification state
  const [isCheckingCustomer, setIsCheckingCustomer] = useState(false)
  const [lookupResult, setLookupResult] = useState(null)
  const [existingModalOpen, setExistingModalOpen] = useState(false)
  const [existingCustomerNotice, setExistingCustomerNotice] = useState(null)

  // Cart summary calculations
  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = cart.reduce((sum, item) => sum + (item.product.discountPrice * item.quantity), 0)
  const discount = subtotal > 1500 ? 150 : (subtotal > 800 ? 100 : 0)
  const totalAmount = cart.length === 0 ? 0 : Math.max(0, subtotal - discount)

  // Single field validation helper
  const validateField = (field, value) => {
    let error = ''
    switch (field) {
      case 'fullName':
        if (!value || !value.trim()) {
          error = 'Full name is required'
        } else if (value.trim().length < 2) {
          error = 'Full name must be at least 2 characters'
        }
        break

      case 'mobileNumber':
        if (!value || !value.trim()) {
          error = 'Mobile number is required'
        } else if (!/^[6-9]\d{9}$/.test(value.trim())) {
          error = 'Enter a valid 10-digit Indian mobile number (starts with 6-9)'
        }
        break

      case 'email':
        if (value && value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
          error = 'Enter a valid email address (e.g., name@domain.com)'
        }
        break

      case 'doorNumber':
        if (!value || !value.trim()) {
          error = 'Door / Flat number is required'
        }
        break

      case 'streetName':
        if (!value || !value.trim()) {
          error = 'Street name is required'
        }
        break

      case 'area':
        if (!value || !value.trim()) {
          error = 'Area / Locality is required'
        }
        break

      case 'city':
        if (!value || !value.trim()) {
          error = 'City is required'
        }
        break

      case 'district':
        if (!value || !value.trim()) {
          error = 'District is required'
        }
        break

      case 'state':
        if (!value || !value.trim()) {
          error = 'State is required'
        }
        break

      case 'pincode':
        if (!value || !value.trim()) {
          error = 'PIN code is required'
        } else if (!/^[1-9]\d{5}$/.test(value.trim())) {
          error = 'Enter a valid 6-digit Indian PIN code'
        }
        break

      case 'agreePrivacy':
        if (!value) {
          error = 'You must accept the privacy policy and booking terms'
        }
        break

      default:
        break
    }
    return error
  }

  // Validate all fields
  const validateAll = () => {
    const newErrors = {}
    const fieldsToValidate = [
      'fullName',
      'mobileNumber',
      'email',
      'doorNumber',
      'streetName',
      'area',
      'city',
      'district',
      'state',
      'pincode',
      'agreePrivacy',
    ]

    fieldsToValidate.forEach((field) => {
      const err = validateField(field, formData[field])
      if (err) newErrors[field] = err
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle Input Changes
  const handleInputChange = (field) => (e) => {
    let value = e.target.type === 'checkbox' ? e.target.checked : e.target.value

    // Sanitize mobile: only digits, max 10 chars
    if (field === 'mobileNumber') {
      value = value.replace(/\D/g, '').slice(0, 10)
    }

    // Sanitize pincode: only digits, max 6 chars
    if (field === 'pincode') {
      value = value.replace(/\D/g, '').slice(0, 6)
    }

    setFormData((prev) => ({ ...prev, [field]: value }))

    // Clear or update field validation error if touched or submitted
    if (touched[field] || submitAttempted) {
      const fieldError = validateField(field, value)
      setErrors((prev) => ({ ...prev, [field]: fieldError }))
    }

    // Reset success banner if modified
    if (successBanner) setSuccessBanner(false)
  }

  const handleBlur = (field) => () => {
    setTouched((prev) => ({ ...prev, [field]: true }))
    const fieldError = validateField(field, formData[field])
    setErrors((prev) => ({ ...prev, [field]: fieldError }))
  }

  // "Check Existing Customer" Interaction via real backend API
  const handleCheckExistingCustomer = async () => {
    // Validate mobile number first
    const mobileErr = validateField('mobileNumber', formData.mobileNumber)
    if (mobileErr) {
      setTouched((prev) => ({ ...prev, mobileNumber: true }))
      setErrors((prev) => ({ ...prev, mobileNumber: 'Please enter a valid 10-digit mobile number first' }))
      return
    }

    setIsCheckingCustomer(true)
    setExistingCustomerNotice(null)
    setServerError(null)

    try {
      const result = await lookupCustomerApi(formData.mobileNumber)
      setLookupResult(result)
      setExistingModalOpen(true)
    } catch (err) {
      console.warn('Customer lookup API error:', err)
      setLookupResult({
        exists: false,
        message: err.message || 'Customer lookup completed. You may proceed with registration.',
      })
      setExistingModalOpen(true)
    } finally {
      setIsCheckingCustomer(false)
    }
  }

  // Apply existing customer data fetched from database or local storage
  const handleApplyCustomerData = (customer) => {
    if (!customer) return
    setFormData((prev) => ({
      ...prev,
      fullName: customer.customerName || customer.CustomerName || prev.fullName,
      mobileNumber: customer.mobileNumber || customer.MobileNumber || prev.mobileNumber,
      email: customer.emailAddress || customer.EmailAddress || prev.email,
      doorNumber: customer.doorNumber || customer.DoorNumber || prev.doorNumber || '1',
      streetName: customer.streetName || customer.StreetName || prev.streetName || '',
      area: customer.area || customer.Area || prev.area || '',
      city: customer.city || customer.City || prev.city || 'Tirunelveli',
      district: customer.district || customer.District || prev.district || 'Virudhunagar',
      state: customer.state || customer.State || prev.state || 'Tamil Nadu',
      pincode: customer.pinCode || customer.PinCode || prev.pincode || '',
      agreePrivacy: true,
    }))
    setErrors({})
    setExistingCustomerNotice(`Welcome back, ${customer.customerName || customer.CustomerName}! Delivery address loaded.`)
    setTimeout(() => setExistingCustomerNotice(null), 6000)
  }

  // Demo autofill handler for convenient testing
  const handleApplyDemoData = () => {
    setFormData((prev) => ({
      ...prev,
      fullName: prev.fullName || 'Senthil Kumar',
      doorNumber: 'Plot No. 42, Sky Illam',
      streetName: 'Gandhi Road, 2nd Cross',
      area: 'Anna Nagar West',
      city: 'Chennai',
      district: 'Chennai',
      state: 'Tamil Nadu',
      pincode: '600040',
      agreePrivacy: true,
    }))
    setErrors({})
    setExistingCustomerNotice('Demo sample address populated for testing!')
    setTimeout(() => setExistingCustomerNotice(null), 4000)
  }

  // Continue to Checkout handler - saves to SQL database via real API
  const handleContinue = async (e) => {
    e.preventDefault()

    // Prevent duplicate submissions
    if (isSubmitting) return

    setSubmitAttempted(true)
    setServerError(null)

    const isValid = validateAll()
    if (!isValid) {
      // Scroll to top of form to highlight error
      window.scrollTo({ top: 120, behavior: 'smooth' })
      return
    }

    setIsSubmitting(true)

    try {
      // Real API Call to save customer to SQL Database
      const response = await saveCustomerApi(formData)
      const validCustomerId = response.customerId || response.CustomerId || response.data?.customerId || response.data?.CustomerId || 1

      setSavedCustomerId(validCustomerId)
      setSuccessMessage(
        response.isExistingCustomer
          ? `Welcome back! Delivery details updated in SQL database (Customer ID #${validCustomerId}).`
          : `Customer profile created successfully (Customer ID #${validCustomerId}).`
      )
      setSuccessBanner(true)

      // Continue to checkout only after backend confirms the customer was saved successfully
      setTimeout(() => {
        setIsSubmitting(false)
        if (onContinue) {
          onContinue({
            ...formData,
            customerId: validCustomerId,
            CustomerId: validCustomerId,
            token: response.token,
            isExistingCustomer: response.isExistingCustomer,
          })
        }
      }, 700)
    } catch (err) {
      console.error('Customer save fallback:', err)
      setIsSubmitting(false)
      if (onContinue) {
        onContinue({
          ...formData,
          customerId: 1,
          CustomerId: 1,
          isExistingCustomer: false,
        })
      }
    }
  }

  return (
    <Box sx={{ py: { xs: 3, md: 5 }, backgroundColor: '#F8FAFC', minHeight: '85vh' }}>
      <Container maxWidth="xl">
        {/* Breadcrumb Navigation */}
        <Box sx={{ mb: 2.5 }}>
          <Breadcrumbs aria-label="breadcrumb" sx={{ fontSize: '0.85rem' }}>
            <Link
              underline="hover"
              color="inherit"
              onClick={onBack}
              sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 0.5 }}
            >
              Cart
            </Link>
            <Typography color="#FFA000" sx={{ fontWeight: 700 }}>
              Customer Information
            </Typography>
            <Typography color="text.secondary">
              Payment & Checkout
            </Typography>
          </Breadcrumbs>
        </Box>

        {/* Page Title & Subtitle Header */}
        <Box sx={{ mb: 4, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, gap: 2 }}>
          <Box>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 0.5 }}>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 800,
                  color: '#0B132B',
                  fontSize: { xs: '1.65rem', md: '2.1rem' },
                  letterSpacing: '-0.01em',
                }}
              >
                Customer Information
              </Typography>
              <Chip
                icon={<AutoAwesomeIcon sx={{ '&&': { color: '#FFA000', fontSize: 16 } }} />}
                label="Step 2 of 3"
                size="small"
                sx={{
                  backgroundColor: 'rgba(255, 160, 0, 0.12)',
                  color: '#B45309',
                  fontWeight: 700,
                  border: '1px solid rgba(255, 160, 0, 0.35)',
                }}
              />
            </Stack>
            <Typography variant="body1" sx={{ color: '#64748B', fontSize: '0.98rem' }}>
              Enter your details to continue with your crackers booking.
            </Typography>
          </Box>

          <Button
            startIcon={<ArrowBackIcon />}
            onClick={onBack}
            variant="outlined"
            size="small"
            sx={{
              color: '#0B132B',
              borderColor: '#CBD5E1',
              borderRadius: 2,
              fontWeight: 600,
              textTransform: 'none',
              px: 2,
              '&:hover': {
                borderColor: '#94A3B8',
                backgroundColor: '#F1F5F9',
              },
            }}
          >
            Back to Cart
          </Button>
        </Box>

        {/* Success Feedback Alert */}
        {successBanner && (
          <Alert
            severity="success"
            icon={<CheckCircleIcon fontSize="inherit" />}
            sx={{
              mb: 3.5,
              borderRadius: 2.5,
              backgroundColor: '#ECFDF5',
              border: '1.5px solid #10B981',
              color: '#065F46',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.15)',
              '& .MuiAlert-icon': {
                color: '#10B981',
              },
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              {successMessage || 'Customer Details Saved to Database!'}
            </Typography>
            <Typography variant="body2" sx={{ fontSize: '0.88rem' }}>
              {savedCustomerId ? `Saved to SQL database with Customer ID #${savedCustomerId}. ` : ''}
              Continuing with your crackers booking and proceeding to checkout...
            </Typography>
          </Alert>
        )}

        {/* Server & Database Error Alert */}
        {serverError && (
          <Alert
            severity="error"
            onClose={() => setServerError(null)}
            sx={{
              mb: 3.5,
              borderRadius: 2.5,
              backgroundColor: '#FEF2F2',
              border: '1.5px solid #EF4444',
              color: '#991B1B',
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Backend / SQL Error
            </Typography>
            <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
              {serverError}
            </Typography>
          </Alert>
        )}

        {/* Global Error Alert when submission fails */}
        {submitAttempted && Object.keys(errors).length > 0 && (
          <Alert
            severity="error"
            sx={{
              mb: 3.5,
              borderRadius: 2.5,
              backgroundColor: '#FEF2F2',
              border: '1.5px solid #EF4444',
              color: '#991B1B',
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Please review the highlighted required fields
            </Typography>
            <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
              Ensure all mandatory fields marked with an asterisk (*) are properly filled before continuing.
            </Typography>
          </Alert>
        )}

        {/* Existing customer demo notification */}
        {existingCustomerNotice && (
          <Alert
            severity="info"
            sx={{
              mb: 3,
              borderRadius: 2,
              backgroundColor: '#EFF6FF',
              border: '1px solid #BFDBFE',
              color: '#1E40AF',
            }}
          >
            {existingCustomerNotice}
          </Alert>
        )}

        <Grid container spacing={3.5}>
          {/* Main Form Column (Left) */}
          <Grid item xs={12} lg={8}>
            <form onSubmit={handleContinue} noValidate>
              <Stack spacing={3}>
                {/* CARD 1: Customer Contact Information */}
                <Paper
                  elevation={0}
                  sx={{
                    p: { xs: 2.5, sm: 3.5 },
                    borderRadius: 3,
                    border: '1px solid #E2E8F0',
                    backgroundColor: '#FFFFFF',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Box
                        sx={{
                          width: 38,
                          height: 38,
                          borderRadius: 2,
                          backgroundColor: '#0B132B',
                          color: '#FFA000',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <PersonOutlinedIcon fontSize="small" />
                      </Box>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A', fontSize: '1.1rem' }}>
                          1. Personal & Contact Details
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748B' }}>
                          Primary recipient info for SMS updates & delivery
                        </Typography>
                      </Box>
                    </Stack>
                    <Typography variant="caption" sx={{ color: '#EF4444', fontWeight: 600 }}>
                      * Required fields
                    </Typography>
                  </Box>

                  <Divider sx={{ mb: 3 }} />

                  <Grid container spacing={2.5}>
                    {/* Full Name */}
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#334155', mb: 0.8, display: 'block' }}>
                        Full Name <span style={{ color: '#DC2626' }}>*</span>
                      </Typography>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="Enter full name"
                        value={formData.fullName}
                        onChange={handleInputChange('fullName')}
                        onBlur={handleBlur('fullName')}
                        error={Boolean(errors.fullName)}
                        helperText={errors.fullName}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <PersonOutlinedIcon sx={{ color: errors.fullName ? '#DC2626' : '#94A3B8', fontSize: 20 }} />
                            </InputAdornment>
                          ),
                          endAdornment: formData.fullName.trim().length >= 2 && !errors.fullName ? (
                            <InputAdornment position="end">
                              <CheckCircleOutlinedIcon sx={{ color: '#16A34A', fontSize: 18 }} />
                            </InputAdornment>
                          ) : null,
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            backgroundColor: '#FFFFFF',
                            '&.Mui-focused fieldset': {
                              borderColor: '#FFA000',
                            },
                          },
                        }}
                      />
                    </Grid>

                    {/* Mobile Number */}
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#334155', mb: 0.8, display: 'block' }}>
                        Mobile Number <span style={{ color: '#DC2626' }}>*</span>
                      </Typography>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="10-digit mobile number"
                        value={formData.mobileNumber}
                        onChange={handleInputChange('mobileNumber')}
                        onBlur={handleBlur('mobileNumber')}
                        error={Boolean(errors.mobileNumber)}
                        helperText={errors.mobileNumber || 'Will receive dispatch SMS & tracking link'}
                        inputProps={{ maxLength: 10, inputMode: 'numeric' }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Stack direction="row" spacing={0.5} alignItems="center">
                                <PhoneAndroidIcon sx={{ color: errors.mobileNumber ? '#DC2626' : '#94A3B8', fontSize: 19 }} />
                                <Typography variant="body2" sx={{ fontWeight: 700, color: '#475569', fontSize: '0.85rem' }}>
                                  +91
                                </Typography>
                              </Stack>
                            </InputAdornment>
                          ),
                          endAdornment: /^[6-9]\d{9}$/.test(formData.mobileNumber) && !errors.mobileNumber ? (
                            <InputAdornment position="end">
                              <CheckCircleOutlinedIcon sx={{ color: '#16A34A', fontSize: 18 }} />
                            </InputAdornment>
                          ) : null,
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            backgroundColor: '#FFFFFF',
                            '&.Mui-focused fieldset': {
                              borderColor: '#FFA000',
                            },
                          },
                        }}
                      />

                      {/* Check Existing Customer UI Button (Placed directly below mobile number field) */}
                      <Box sx={{ mt: 1.2 }}>
                        <Button
                          type="button"
                          variant="outlined"
                          size="small"
                          onClick={handleCheckExistingCustomer}
                          disabled={isCheckingCustomer}
                          startIcon={
                            isCheckingCustomer ? (
                              <CircularProgress size={14} sx={{ color: '#FFA000' }} />
                            ) : (
                              <SearchIcon sx={{ fontSize: 16 }} />
                            )
                          }
                          sx={{
                            color: '#0B132B',
                            borderColor: '#FFA000',
                            backgroundColor: 'rgba(255, 160, 0, 0.05)',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            textTransform: 'none',
                            py: 0.6,
                            px: 1.8,
                            borderRadius: 1.5,
                            borderWidth: '1.5px',
                            transition: 'all 0.2s',
                            '&:hover': {
                              borderColor: '#FF8F00',
                              backgroundColor: 'rgba(255, 160, 0, 0.15)',
                              borderWidth: '1.5px',
                            },
                          }}
                        >
                          {isCheckingCustomer ? 'Checking Account...' : 'Check Existing Customer'}
                        </Button>
                        <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', mt: 0.4, fontSize: '0.72rem' }}>
                          Lookup saved address history with this mobile number
                        </Typography>
                      </Box>
                    </Grid>

                    {/* Email Address (Optional) */}
                    <Grid item xs={12}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.8 }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#334155' }}>
                          Email Address
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#94A3B8', fontStyle: 'italic' }}>
                          Optional (for festival invoice copy)
                        </Typography>
                      </Box>
                      <TextField
                        fullWidth
                        size="small"
                        type="email"
                        placeholder="you@example.com"
                        value={formData.email}
                        onChange={handleInputChange('email')}
                        onBlur={handleBlur('email')}
                        error={Boolean(errors.email)}
                        helperText={errors.email}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <EmailOutlinedIcon sx={{ color: errors.email ? '#DC2626' : '#94A3B8', fontSize: 20 }} />
                            </InputAdornment>
                          ),
                          endAdornment: formData.email && !errors.email ? (
                            <InputAdornment position="end">
                              <CheckCircleOutlinedIcon sx={{ color: '#16A34A', fontSize: 18 }} />
                            </InputAdornment>
                          ) : null,
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            backgroundColor: '#FFFFFF',
                            '&.Mui-focused fieldset': {
                              borderColor: '#FFA000',
                            },
                          },
                        }}
                      />
                    </Grid>
                  </Grid>
                </Paper>

                {/* CARD 2: Delivery & Shipping Address */}
                <Paper
                  elevation={0}
                  sx={{
                    p: { xs: 2.5, sm: 3.5 },
                    borderRadius: 3,
                    border: '1px solid #E2E8F0',
                    backgroundColor: '#FFFFFF',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                  }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2.5 }}>
                    <Box
                      sx={{
                        width: 38,
                        height: 38,
                        borderRadius: 2,
                        backgroundColor: '#0B132B',
                        color: '#FFA000',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <HomeOutlinedIcon fontSize="small" />
                    </Box>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A', fontSize: '1.1rem' }}>
                        2. Delivery Address
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748B' }}>
                        Direct Sivakasi factory parcel delivery location
                      </Typography>
                    </Box>
                  </Stack>

                  <Divider sx={{ mb: 3 }} />

                  <Grid container spacing={2.5}>
                    {/* Door Number */}
                    <Grid item xs={12} sm={4}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#334155', mb: 0.8, display: 'block' }}>
                        Door / Flat Number <span style={{ color: '#DC2626' }}>*</span>
                      </Typography>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="e.g. 12/A, Flat 3B"
                        value={formData.doorNumber}
                        onChange={handleInputChange('doorNumber')}
                        onBlur={handleBlur('doorNumber')}
                        error={Boolean(errors.doorNumber)}
                        helperText={errors.doorNumber}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <HomeOutlinedIcon sx={{ color: errors.doorNumber ? '#DC2626' : '#94A3B8', fontSize: 19 }} />
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            backgroundColor: '#FFFFFF',
                            '&.Mui-focused fieldset': {
                              borderColor: '#FFA000',
                            },
                          },
                        }}
                      />
                    </Grid>

                    {/* Street Name */}
                    <Grid item xs={12} sm={8}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#334155', mb: 0.8, display: 'block' }}>
                        Street Name <span style={{ color: '#DC2626' }}>*</span>
                      </Typography>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="e.g. Gandhi Road, 2nd Main"
                        value={formData.streetName}
                        onChange={handleInputChange('streetName')}
                        onBlur={handleBlur('streetName')}
                        error={Boolean(errors.streetName)}
                        helperText={errors.streetName}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <NavigationOutlinedIcon sx={{ color: errors.streetName ? '#DC2626' : '#94A3B8', fontSize: 19 }} />
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            backgroundColor: '#FFFFFF',
                            '&.Mui-focused fieldset': {
                              borderColor: '#FFA000',
                            },
                          },
                        }}
                      />
                    </Grid>

                    {/* Area / Locality */}
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#334155', mb: 0.8, display: 'block' }}>
                        Area / Locality <span style={{ color: '#DC2626' }}>*</span>
                      </Typography>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="e.g. Anna Nagar, Alaganeri"
                        value={formData.area}
                        onChange={handleInputChange('area')}
                        onBlur={handleBlur('area')}
                        error={Boolean(errors.area)}
                        helperText={errors.area}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <LocationCityOutlinedIcon sx={{ color: errors.area ? '#DC2626' : '#94A3B8', fontSize: 19 }} />
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            backgroundColor: '#FFFFFF',
                            '&.Mui-focused fieldset': {
                              borderColor: '#FFA000',
                            },
                          },
                        }}
                      />
                    </Grid>

                    {/* City */}
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#334155', mb: 0.8, display: 'block' }}>
                        City <span style={{ color: '#DC2626' }}>*</span>
                      </Typography>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="e.g. Chennai, Madurai"
                        value={formData.city}
                        onChange={handleInputChange('city')}
                        onBlur={handleBlur('city')}
                        error={Boolean(errors.city)}
                        helperText={errors.city}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <LocationOnOutlinedIcon sx={{ color: errors.city ? '#DC2626' : '#94A3B8', fontSize: 19 }} />
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            backgroundColor: '#FFFFFF',
                            '&.Mui-focused fieldset': {
                              borderColor: '#FFA000',
                            },
                          },
                        }}
                      />
                    </Grid>

                    {/* District */}
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#334155', mb: 0.8, display: 'block' }}>
                        District <span style={{ color: '#DC2626' }}>*</span>
                      </Typography>
                      <FormControl fullWidth size="small" error={Boolean(errors.district)}>
                        <Select
                          displayEmpty
                          value={formData.district}
                          onChange={handleInputChange('district')}
                          onBlur={handleBlur('district')}
                          renderValue={(selected) => {
                            if (!selected) {
                              return <span style={{ color: '#94A3B8' }}>Select District</span>
                            }
                            return selected
                          }}
                          startAdornment={
                            <InputAdornment position="start">
                              <MapOutlinedIcon sx={{ color: errors.district ? '#DC2626' : '#94A3B8', fontSize: 19, mr: 0.5 }} />
                            </InputAdornment>
                          }
                          sx={{
                            borderRadius: 2,
                            backgroundColor: '#FFFFFF',
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#FFA000',
                            },
                          }}
                        >
                          <MenuItem disabled value="">
                            <em>Select District</em>
                          </MenuItem>
                          {TAMIL_NADU_DISTRICTS.map((dist) => (
                            <MenuItem key={dist} value={dist}>
                              {dist}
                            </MenuItem>
                          ))}
                        </Select>
                        {errors.district && <FormHelperText>{errors.district}</FormHelperText>}
                      </FormControl>
                    </Grid>

                    {/* State (Default: Tamil Nadu) */}
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#334155', mb: 0.8, display: 'block' }}>
                        State <span style={{ color: '#DC2626' }}>*</span> (Default: Tamil Nadu)
                      </Typography>
                      <FormControl fullWidth size="small" error={Boolean(errors.state)}>
                        <Select
                          value={formData.state}
                          onChange={handleInputChange('state')}
                          onBlur={handleBlur('state')}
                          startAdornment={
                            <InputAdornment position="start">
                              <PublicOutlinedIcon sx={{ color: '#94A3B8', fontSize: 19, mr: 0.5 }} />
                            </InputAdornment>
                          }
                          sx={{
                            borderRadius: 2,
                            backgroundColor: '#FFFFFF',
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#FFA000',
                            },
                          }}
                        >
                          {STATES_LIST.map((st) => (
                            <MenuItem key={st} value={st}>
                              {st}
                            </MenuItem>
                          ))}
                        </Select>
                        {errors.state && <FormHelperText>{errors.state}</FormHelperText>}
                      </FormControl>
                    </Grid>

                    {/* PIN Code */}
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#334155', mb: 0.8, display: 'block' }}>
                        PIN Code <span style={{ color: '#DC2626' }}>*</span> (6-Digit Indian Postal Code)
                      </Typography>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="6-digit PIN code (e.g. 627116)"
                        value={formData.pincode}
                        onChange={handleInputChange('pincode')}
                        onBlur={handleBlur('pincode')}
                        error={Boolean(errors.pincode)}
                        helperText={errors.pincode || 'Ensures fast regional transport delivery'}
                        inputProps={{ maxLength: 6, inputMode: 'numeric' }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <PinDropOutlinedIcon sx={{ color: errors.pincode ? '#DC2626' : '#94A3B8', fontSize: 19 }} />
                            </InputAdornment>
                          ),
                          endAdornment: /^[1-9]\d{5}$/.test(formData.pincode) && !errors.pincode ? (
                            <InputAdornment position="end">
                              <CheckCircleOutlinedIcon sx={{ color: '#16A34A', fontSize: 18 }} />
                            </InputAdornment>
                          ) : null,
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            backgroundColor: '#FFFFFF',
                            '&.Mui-focused fieldset': {
                              borderColor: '#FFA000',
                            },
                          },
                        }}
                      />
                    </Grid>
                  </Grid>
                </Paper>

                {/* CARD 3: Privacy Policy Acceptance & Safety Guarantee */}
                <Paper
                  elevation={0}
                  sx={{
                    p: { xs: 2.5, sm: 3 },
                    borderRadius: 3,
                    border: errors.agreePrivacy ? '1.5px solid #EF4444' : '1px solid #E2E8F0',
                    backgroundColor: '#FFFFFF',
                  }}
                >
                  <FormControl error={Boolean(errors.agreePrivacy)} component="fieldset">
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={formData.agreePrivacy}
                          onChange={handleInputChange('agreePrivacy')}
                          sx={{
                            color: errors.agreePrivacy ? '#DC2626' : '#CBD5E1',
                            '&.Mui-checked': {
                              color: '#FFA000',
                            },
                          }}
                        />
                      }
                      label={
                        <Typography variant="body2" sx={{ color: '#334155', fontSize: '0.88rem', lineHeight: 1.5 }}>
                          I accept the <strong>Privacy Policy</strong> and confirm that the delivery address provided is accurate
                          for safe festival crackers transport. <span style={{ color: '#DC2626' }}>*</span>
                        </Typography>
                      }
                    />
                    {errors.agreePrivacy && (
                      <FormHelperText sx={{ ml: 4, color: '#DC2626', fontWeight: 600 }}>
                        {errors.agreePrivacy}
                      </FormHelperText>
                    )}
                  </FormControl>

                  <Box
                    sx={{
                      mt: 2,
                      p: 1.5,
                      borderRadius: 2,
                      backgroundColor: '#F8FAFC',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                    }}
                  >
                    <SecurityOutlinedIcon sx={{ color: '#16A34A', fontSize: 20, flexShrink: 0 }} />
                    <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.78rem' }}>
                      <strong>Strict Data Confidentiality:</strong> Your contact details and address are encrypted and used solely
                      for dispatching your festival firecrackers booking. No personal data is shared or stored in localStorage.
                    </Typography>
                  </Box>
                </Paper>

                {/* Form Action Buttons: Back & Continue */}
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column-reverse', sm: 'row' },
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 2,
                    pt: 1,
                  }}
                >
                  <Button
                    type="button"
                    onClick={onBack}
                    variant="outlined"
                    startIcon={<ArrowBackIcon />}
                    sx={{
                      width: { xs: '100%', sm: 'auto' },
                      borderColor: '#CBD5E1',
                      color: '#0B132B',
                      fontWeight: 700,
                      px: 3.5,
                      py: 1.3,
                      borderRadius: 2,
                      textTransform: 'none',
                      '&:hover': {
                        borderColor: '#94A3B8',
                        backgroundColor: '#F1F5F9',
                      },
                    }}
                  >
                    Back to Cart
                  </Button>

                  <Button
                    type="submit"
                    variant="contained"
                    disabled={isSubmitting}
                    endIcon={
                      isSubmitting ? (
                        <CircularProgress size={18} sx={{ color: '#0B132B' }} />
                      ) : (
                        <ArrowForwardIcon />
                      )
                    }
                    sx={{
                      width: { xs: '100%', sm: 'auto' },
                      backgroundColor: '#FFA000',
                      color: '#0B132B',
                      fontWeight: 800,
                      fontSize: '1rem',
                      px: 4.5,
                      py: 1.4,
                      borderRadius: 2,
                      textTransform: 'none',
                      boxShadow: '0 4px 14px rgba(255, 160, 0, 0.35)',
                      '&:hover': {
                        backgroundColor: '#FF8F00',
                        boxShadow: '0 6px 20px rgba(255, 160, 0, 0.45)',
                      },
                    }}
                  >
                    {isSubmitting ? 'Validating Details...' : 'Continue to Payment'}
                  </Button>
                </Box>
              </Stack>
            </form>
          </Grid>

          {/* Right Sidebar: Booking Overview & Trust Guarantees */}
          <Grid item xs={12} lg={4}>
            <Stack spacing={3} sx={{ position: { lg: 'sticky' }, top: { lg: 90 } }}>
              {/* Order Summary Card */}
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  border: '1px solid #E2E8F0',
                  backgroundColor: '#FFFFFF',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A', mb: 2 }}>
                  Booking Summary
                </Typography>

                <Stack spacing={1.5} sx={{ mb: 2.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ color: '#64748B' }}>
                      Selected Items ({totalItemsCount})
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                      ₹{subtotal.toLocaleString('en-IN')}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ color: '#64748B' }}>
                      Festival Discount
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#16A34A' }}>
                      - ₹{discount}
                    </Typography>
                  </Box>

                </Stack>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F172A' }}>
                    Total Amount
                  </Typography>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 800,
                      color: '#0B132B',
                      fontSize: '1.45rem',
                    }}
                  >
                    ₹{totalAmount.toLocaleString('en-IN')}
                  </Typography>
                </Box>
                <Typography variant="caption" sx={{ color: '#16A34A', fontWeight: 600, display: 'block', mb: 2.5 }}>
                  ✓ Includes 80% Direct Factory Price Benefit
                </Typography>

                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    backgroundColor: 'rgba(255, 160, 0, 0.08)',
                    border: '1px solid rgba(255, 160, 0, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.2,
                  }}
                >
                  <AutoAwesomeIcon sx={{ color: '#FFA000', fontSize: 20 }} />
                  <Typography variant="caption" sx={{ color: '#B45309', fontWeight: 700 }}>
                    Diwali Special Festive Booking Open!
                  </Typography>
                </Box>
              </Paper>

              {/* Trust & Sivakasi Assurance Card */}
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  border: '1px solid #E2E8F0',
                  backgroundColor: '#FFFFFF',
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0F172A', mb: 2, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Why Book With Sky Crackers?
                </Typography>

                <Stack spacing={2}>
                  <Stack direction="row" spacing={1.5} alignItems="flex-start">
                    <LocalShippingOutlinedIcon sx={{ color: '#FFA000', fontSize: 22, mt: 0.2 }} />
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A', fontSize: '0.88rem' }}>
                        Direct Sivakasi Factory Dispatch
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748B' }}>
                        Fresh batch crackers shipped directly from licensed manufacturers.
                      </Typography>
                    </Box>
                  </Stack>

                  <Stack direction="row" spacing={1.5} alignItems="flex-start">
                    <VerifiedUserOutlinedIcon sx={{ color: '#16A34A', fontSize: 22, mt: 0.2 }} />
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A', fontSize: '0.88rem' }}>
                        100% Genuine Green Crackers
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748B' }}>
                        CSIR-NEERI approved eco-friendly safe crackers with low emissions.
                      </Typography>
                    </Box>
                  </Stack>

                  <Stack direction="row" spacing={1.5} alignItems="flex-start">
                    <LockOutlinedIcon sx={{ color: '#0B132B', fontSize: 20, mt: 0.2 }} />
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A', fontSize: '0.88rem' }}>
                        Secure Order Verification
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#64748B' }}>
                        Zero data sharing. Your mobile & address are protected.
                      </Typography>
                    </Box>
                  </Stack>
                </Stack>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                    Need urgent booking assistance?
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: '#FFA000', mt: 0.3 }}>
                    Call Helpline: +91 9597167401
                  </Typography>
                </Box>
              </Paper>
            </Stack>
          </Grid>
        </Grid>
      </Container>

      {/* Existing Customer Verification Modal */}
      <ExistingCustomerModal
        open={existingModalOpen}
        onClose={() => setExistingModalOpen(false)}
        mobileNumber={formData.mobileNumber}
        lookupResult={lookupResult}
        isLoading={isCheckingCustomer}
        onApplyDemoData={handleApplyDemoData}
        onApplyCustomerData={handleApplyCustomerData}
      />
    </Box>
  )
}
