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
  IconButton,
  CircularProgress,
  Paper,
  InputAdornment,
  FormControl,
  Select,
  MenuItem,
  Chip,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import WhatsAppIcon from '@mui/icons-material/WhatsApp'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import PersonIcon from '@mui/icons-material/Person'
import VpnKeyIcon from '@mui/icons-material/VpnKey'
import { phoneAuthService } from '../services/phoneAuthService'
import { lookupCustomerApi, saveCustomerApi } from '../services/api'
import { formatStructuredAddress } from '../utils/addressUtils'

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

export default function CustomerLoginModal({
  open,
  onClose,
  onLoginSuccess,
  initialMobile = '',
}) {
  // Step: 1 = Enter Mobile, 2 = Enter OTP, 3 = New Customer Registration (if not found in DB)
  const [step, setStep] = useState(1)
  const [mobileNumber, setMobileNumber] = useState(initialMobile)
  const [enteredOtp, setEnteredOtp] = useState('')
  const [otpNotice, setOtpNotice] = useState('')
  const [countdown, setCountdown] = useState(60)
  const [isCounting, setIsCounting] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // New Customer Profile fields for DB save
  const [formData, setFormData] = useState({
    fullName: '',
    doorNumber: '',
    streetName: '',
    area: '',
    city: '',
    district: '',
    pincode: '',
  })

  useEffect(() => {
    if (initialMobile) {
      setMobileNumber(initialMobile.replace(/\D/g, '').slice(-10))
    }
  }, [initialMobile])

  // Countdown timer for resend OTP
  useEffect(() => {
    let timer = null
    if (isCounting && countdown > 0) {
      timer = setInterval(() => setCountdown((c) => c - 1), 1000)
    } else if (countdown === 0) {
      setIsCounting(false)
    }
    return () => {
      if (timer) clearInterval(timer)
    }
  }, [isCounting, countdown])

  const handleSendOtp = async () => {
    const cleanDigits = mobileNumber.replace(/\D/g, '').slice(-10)
    if (cleanDigits.length !== 10) {
      setErrorMsg('Please enter a valid 10-digit Indian mobile number.')
      return
    }

    setLoading(true)
    setErrorMsg('')
    try {
      const res = await phoneAuthService.sendOtp(cleanDigits)
      setStep(2)
      setCountdown(60)
      setIsCounting(true)
      if (res.otp) {
        setOtpNotice(`Your OTP is: ${res.otp}`)
      } else {
        setOtpNotice(res.message || 'OTP sent successfully to your mobile!')
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to send OTP. Please check your mobile number.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async () => {
    const cleanDigits = mobileNumber.replace(/\D/g, '').slice(-10)
    const cleanOtp = enteredOtp.trim()

    if (cleanOtp.length !== 6) {
      setErrorMsg('Please enter the 6-digit OTP.')
      return
    }

    setLoading(true)
    setErrorMsg('')

    try {
      // 1. Verify OTP with Phone Auth Service
      await phoneAuthService.verifyOtp(cleanDigits, cleanOtp)

      // 2. Query Cloud SQL Database (NO STATIC DATA)
      const lookup = await lookupCustomerApi(cleanDigits)

      if (lookup && lookup.exists && lookup.customer) {
        // Customer found in Database! Load full record
        const cust = lookup.customer
        const customerProfile = {
          customerId: cust.customerId || cust.CustomerId,
          fullName: cust.customerName || cust.CustomerName || 'Valued Customer',
          customerName: cust.customerName || cust.CustomerName || 'Valued Customer',
          mobileNumber: cleanDigits,
          doorNumber: cust.doorNumber || cust.DoorNumber || '',
          streetName: cust.streetName || cust.StreetName || '',
          area: cust.area || cust.Area || '',
          city: cust.city || cust.City || '',
          district: cust.district || cust.District || '',
          pincode: cust.pinCode || cust.PinCode || '',
          address: cust.address || cust.Address || '',
          isVerified: true,
        }

        // Persist session in localStorage
        localStorage.setItem('sky_logged_in_customer', JSON.stringify(customerProfile))
        localStorage.setItem('sky_current_customer', JSON.stringify(customerProfile))

        onLoginSuccess(customerProfile)
        handleClose()
      } else {
        // New customer verified! Proceed to save profile in database
        setStep(3)
        setErrorMsg('')
      }
    } catch (err) {
      setErrorMsg(err.message || 'Invalid OTP. Please check and try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveNewCustomer = async (e) => {
    if (e && e.preventDefault) e.preventDefault()

    if (!formData.fullName.trim()) {
      setErrorMsg('Please enter your full customer name.')
      return
    }
    if (!formData.city.trim() || !formData.district.trim() || !formData.pincode.trim()) {
      setErrorMsg('Please provide your city, district, and 6-digit PIN code for transport dispatch.')
      return
    }

    setLoading(true)
    setErrorMsg('')

    try {
      const cleanDigits = mobileNumber.replace(/\D/g, '').slice(-10)
      const fullAddr = formatStructuredAddress({
        doorNumber: formData.doorNumber,
        streetName: formData.streetName,
        area: formData.area,
        city: formData.city,
        district: formData.district,
        pincode: formData.pincode,
      })

      // Save directly to SQL Server database
      const saveRes = await saveCustomerApi({
        fullName: formData.fullName.trim(),
        customerName: formData.fullName.trim(),
        mobileNumber: cleanDigits,
        doorNumber: formData.doorNumber || '1',
        streetName: formData.streetName || 'Main Road',
        area: formData.area || formData.city,
        city: formData.city,
        district: formData.district,
        state: 'Tamil Nadu',
        pincode: formData.pincode,
        address: fullAddr,
        agreePrivacy: true,
      })

      const newId = saveRes?.customerId || saveRes?.CustomerId || Date.now()
      const newCustomerProfile = {
        customerId: newId,
        fullName: formData.fullName.trim(),
        customerName: formData.fullName.trim(),
        mobileNumber: cleanDigits,
        doorNumber: formData.doorNumber,
        streetName: formData.streetName,
        area: formData.area,
        city: formData.city,
        district: formData.district,
        pincode: formData.pincode,
        address: fullAddr,
        isVerified: true,
      }

      // Persist session in localStorage
      localStorage.setItem('sky_logged_in_customer', JSON.stringify(newCustomerProfile))
      localStorage.setItem('sky_current_customer', JSON.stringify(newCustomerProfile))

      onLoginSuccess(newCustomerProfile)
      handleClose()
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save profile to database. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setStep(1)
    setEnteredOtp('')
    setErrorMsg('')
    setOtpNotice('')
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3.5,
          overflow: 'hidden',
          backgroundColor: '#FFFFFF',
          border: '1.5px solid #FFA000',
          boxShadow: '0 20px 45px rgba(11, 19, 43, 0.25)',
        },
      }}
    >
      {/* Hidden Firebase Recaptcha Container */}
      <div id="recaptcha-container"></div>

      {/* Header */}
      <Box
        sx={{
          backgroundColor: '#0B132B',
          color: '#FFFFFF',
          p: 2.5,
          borderBottom: '3px solid #FFA000',
          position: 'relative',
        }}
      >
        <IconButton
          onClick={handleClose}
          size="small"
          sx={{
            position: 'absolute',
            right: 12,
            top: 12,
            color: '#CBD5E1',
            '&:hover': { color: '#FFFFFF' },
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              backgroundColor: '#FFA000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <LockOutlinedIcon sx={{ color: '#0B132B', fontSize: 20 }} />
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#FFFFFF', lineHeight: 1.2 }}>
              Customer Login / OTP
            </Typography>
            <Typography variant="caption" sx={{ color: '#FFA000', fontWeight: 700 }}>
              வாடிக்கையாளர் உள்நுழைவு • Free OTP
            </Typography>
          </Box>
        </Box>
      </Box>

      <DialogContent sx={{ p: 3 }}>
        {errorMsg && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2, fontSize: '0.82rem' }}>
            {errorMsg}
          </Alert>
        )}

        {/* STEP 1: Enter Mobile Number */}
        {step === 1 && (
          <Stack spacing={2.5}>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 800, color: '#0F172A', mb: 0.5 }}>
                Enter Your 10-Digit Mobile Number
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 1.5 }}>
                We will verify your mobile number with a 6-digit OTP to access your orders and profile.
              </Typography>

              <TextField
                fullWidth
                size="medium"
                placeholder="9876543210"
                value={mobileNumber}
                onChange={(e) => {
                  setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10))
                  setErrorMsg('')
                }}
                inputProps={{ maxLength: 10, inputMode: 'numeric' }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Typography sx={{ fontWeight: 800, color: '#0B132B', fontSize: '0.95rem' }}>
                        🇮🇳 +91
                      </Typography>
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <PhoneIphoneIcon sx={{ color: '#94A3B8' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  backgroundColor: '#F8FAFC',
                  borderRadius: 2,
                  '& .MuiOutlinedInput-root': { borderRadius: 2 },
                }}
              />
            </Box>

            <Button
              variant="contained"
              fullWidth
              size="large"
              disabled={loading || mobileNumber.length < 10}
              onClick={handleSendOtp}
              startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <VpnKeyIcon />}
              sx={{
                backgroundColor: '#0B132B',
                color: '#FFA000',
                fontWeight: 900,
                py: 1.3,
                borderRadius: 2,
                textTransform: 'none',
                fontSize: '0.95rem',
                '&:hover': { backgroundColor: '#1A2A56' },
              }}
            >
              {loading ? 'Sending OTP...' : 'Send 6-Digit OTP (OTP பெறுக)'}
            </Button>
          </Stack>
        )}

        {/* STEP 2: Enter 6-Digit OTP */}
        {step === 2 && (
          <Stack spacing={2.5}>
            {/* Visual SMS OTP Alert Banner */}
            {otpNotice && (
              <Alert
                icon={<CheckCircleIcon sx={{ color: '#15803D' }} />}
                sx={{
                  backgroundColor: '#DCFCE7',
                  color: '#166534',
                  borderRadius: 2,
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  border: '1.5px solid #86EFAC',
                }}
              >
                {otpNotice}
              </Alert>
            )}

            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 800, color: '#0F172A' }}>
                  Enter 6-Digit OTP
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                  Sent to +91 {mobileNumber}
                </Typography>
              </Box>

              <TextField
                fullWidth
                size="medium"
                placeholder="• • • • • •"
                value={enteredOtp}
                onChange={(e) => {
                  setEnteredOtp(e.target.value.replace(/\D/g, '').slice(0, 6))
                  setErrorMsg('')
                }}
                inputProps={{
                  maxLength: 6,
                  inputMode: 'numeric',
                  style: { letterSpacing: '0.3em', textAlign: 'center', fontSize: '1.25rem', fontWeight: 900 },
                }}
                sx={{
                  backgroundColor: '#F8FAFC',
                  borderRadius: 2,
                  '& .MuiOutlinedInput-root': { borderRadius: 2 },
                }}
              />
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" sx={{ color: '#64748B' }}>
                Didn't receive OTP?
              </Typography>
              <Button
                size="small"
                disabled={isCounting || loading}
                onClick={handleSendOtp}
                sx={{
                  textTransform: 'none',
                  fontWeight: 800,
                  color: isCounting ? '#94A3B8' : '#0B132B',
                  fontSize: '0.78rem',
                }}
              >
                {isCounting ? `Resend in ${countdown}s` : 'Resend OTP'}
              </Button>
            </Box>

            <Button
              variant="contained"
              fullWidth
              size="large"
              disabled={loading || enteredOtp.length !== 6}
              onClick={handleVerifyOtp}
              startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <CheckCircleIcon />}
              sx={{
                backgroundColor: '#16A34A',
                color: '#FFFFFF',
                fontWeight: 900,
                py: 1.3,
                borderRadius: 2,
                textTransform: 'none',
                fontSize: '0.95rem',
                '&:hover': { backgroundColor: '#15803D' },
              }}
            >
              {loading ? 'Verifying with Database...' : 'Verify & Login (உள்நுழைக)'}
            </Button>
          </Stack>
        )}

        {/* STEP 3: Complete Customer Profile & Save to SQL Server Database */}
        {step === 3 && (
          <Box component="form" onSubmit={handleSaveNewCustomer}>
            <Alert severity="info" sx={{ mb: 2, borderRadius: 2, fontSize: '0.8rem' }}>
              Mobile verified! Please enter your name & address for your invoice and transport delivery.
            </Alert>

            <Stack spacing={1.8}>
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#334155', mb: 0.5, display: 'block' }}>
                  Full Customer Name <span style={{ color: '#DC2626' }}>*</span>
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="e.g. Ramesh Kumar"
                  value={formData.fullName}
                  onChange={(e) => setFormData((p) => ({ ...p, fullName: e.target.value }))}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Box>

              <Grid container spacing={1.5}>
                <Grid item xs={4}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#334155', mb: 0.5, display: 'block' }}>
                    Door No
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="12/A"
                    value={formData.doorNumber}
                    onChange={(e) => setFormData((p) => ({ ...p, doorNumber: e.target.value }))}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </Grid>
                <Grid item xs={8}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#334155', mb: 0.5, display: 'block' }}>
                    Street Name / Area <span style={{ color: '#DC2626' }}>*</span>
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Gandhi Road"
                    value={formData.streetName}
                    onChange={(e) => setFormData((p) => ({ ...p, streetName: e.target.value }))}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </Grid>
              </Grid>

              <Grid container spacing={1.5}>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#334155', mb: 0.5, display: 'block' }}>
                    City / Town <span style={{ color: '#DC2626' }}>*</span>
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Coimbatore"
                    value={formData.city}
                    onChange={(e) => setFormData((p) => ({ ...p, city: e.target.value }))}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#334155', mb: 0.5, display: 'block' }}>
                    District <span style={{ color: '#DC2626' }}>*</span>
                  </Typography>
                  <FormControl fullWidth size="small">
                    <Select
                      displayEmpty
                      value={formData.district}
                      onChange={(e) => setFormData((p) => ({ ...p, district: e.target.value }))}
                      sx={{ borderRadius: 2 }}
                    >
                      <MenuItem disabled value="">
                        <em>Select District</em>
                      </MenuItem>
                      {TAMIL_NADU_DISTRICTS.map((d) => (
                        <MenuItem key={d} value={d}>
                          {d}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              <Box>
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#334155', mb: 0.5, display: 'block' }}>
                  6-Digit PIN Code <span style={{ color: '#DC2626' }}>*</span>
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="641001"
                  value={formData.pincode}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) }))
                  }
                  inputProps={{ maxLength: 6, inputMode: 'numeric' }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Box>

              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <CheckCircleIcon />}
                sx={{
                  backgroundColor: '#0B132B',
                  color: '#FFA000',
                  fontWeight: 900,
                  py: 1.3,
                  borderRadius: 2,
                  mt: 1,
                  textTransform: 'none',
                  fontSize: '0.95rem',
                  '&:hover': { backgroundColor: '#1A2A56' },
                }}
              >
                {loading ? 'Saving Profile in Database...' : 'Save & Login to Account'}
              </Button>
            </Stack>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  )
}
