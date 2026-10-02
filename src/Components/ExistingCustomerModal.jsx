import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  Button,
  Stack,
  Alert,
  Divider,
  Chip,
  IconButton,
  CircularProgress,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined'
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import VpnKeyOutlinedIcon from '@mui/icons-material/VpnKeyOutlined'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'

export default function ExistingCustomerModal({
  open,
  onClose,
  mobileNumber,
  lookupResult,
  isLoading,
  onApplyDemoData,
  onApplyCustomerData,
}) {
  const customer = lookupResult?.customer

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: 'hidden',
          boxShadow: '0 20px 40px rgba(11, 19, 43, 0.25)',
          border: '1px solid #E2E8F0',
        },
      }}
    >
      {/* Festive Navy Header */}
      <Box
        sx={{
          backgroundColor: '#0B132B',
          color: '#FFFFFF',
          px: 3,
          py: 2.2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '2px solid #FFA000',
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 160, 0, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ShieldOutlinedIcon sx={{ color: '#FFA000', fontSize: 22 }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.05rem', lineHeight: 1.2 }}>
              Customer Profile Lookup
            </Typography>
            <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.78rem' }}>
              Database & Local Session
            </Typography>
          </Box>
        </Stack>

        <IconButton onClick={onClose} size="small" sx={{ color: '#94A3B8', '&:hover': { color: '#FFFFFF' } }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <DialogContent sx={{ p: { xs: 2.5, sm: 3.5 }, backgroundColor: '#FAFCFE' }}>
        {/* Loading State */}
        {isLoading ? (
          <Box sx={{ py: 5, textAlign: 'center' }}>
            <CircularProgress size={36} sx={{ color: '#FFA000', mb: 2 }} />
            <Typography variant="body1" sx={{ fontWeight: 700, color: '#0F172A' }}>
              Searching Customer Database...
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B' }}>
              Looking up account details for +91 {mobileNumber}
            </Typography>
          </Box>
        ) : (
          <>
            {/* Mobile Number Badge */}
            <Box
              sx={{
                p: 2,
                mb: 2.5,
                borderRadius: 2,
                backgroundColor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 1,
              }}
            >
              <Box>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, display: 'block' }}>
                  Queried Mobile Number
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 700, color: '#0F172A', letterSpacing: '0.04em' }}>
                  +91 {mobileNumber || 'XXXXXXXXXX'}
                </Typography>
              </Box>

              {lookupResult?.exists ? (
                <Chip
                  size="small"
                  icon={<CheckCircleOutlinedIcon sx={{ '&&': { color: '#16A34A', fontSize: 16 } }} />}
                  label="Profile Found"
                  sx={{
                    backgroundColor: '#ECFDF5',
                    color: '#065F46',
                    fontWeight: 700,
                    fontSize: '0.72rem',
                    border: '1px solid #A7F3D0',
                  }}
                />
              ) : (
                <Chip
                  size="small"
                  icon={<InfoOutlinedIcon sx={{ '&&': { color: '#2563EB', fontSize: 16 } }} />}
                  label="New Customer"
                  sx={{
                    backgroundColor: '#EFF6FF',
                    color: '#1E40AF',
                    fontWeight: 700,
                    fontSize: '0.72rem',
                    border: '1px solid #BFDBFE',
                  }}
                />
              )}
            </Box>

            {lookupResult?.exists && customer ? (
              <>
                <Box
                  sx={{
                    p: 2.2,
                    mb: 2.5,
                    borderRadius: 2,
                    backgroundColor: '#FFFFFF',
                    border: '1.5px solid #A7F3D0',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.08)',
                  }}
                >
                  <Typography variant="caption" sx={{ color: '#059669', fontWeight: 800, display: 'block', mb: 1.5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Saved Customer Profile
                  </Typography>

                  <Stack spacing={1.2}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ color: '#64748B' }}>Customer Name:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 800, color: '#0F172A' }}>
                        {customer.customerName || customer.CustomerName || lookupResult.maskedName}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ color: '#64748B' }}>Primary Mobile:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                        +91 {customer.mobileNumber || mobileNumber}
                      </Typography>
                    </Box>

                    {(customer.city || customer.district) && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ color: '#64748B' }}>Location:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                          {customer.city ? `${customer.city}, ` : ''}{customer.district || customer.state || 'Tamil Nadu'}
                        </Typography>
                      </Box>
                    )}

                    {customer.pinCode && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ color: '#64748B' }}>PIN Code:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                          {customer.pinCode}
                        </Typography>
                      </Box>
                    )}
                  </Stack>

                  <Button
                    variant="contained"
                    fullWidth
                    onClick={() => {
                      if (onApplyCustomerData) onApplyCustomerData(customer)
                      onClose()
                    }}
                    startIcon={<CheckCircleIcon />}
                    sx={{
                      mt: 2,
                      backgroundColor: '#16A34A',
                      color: '#FFFFFF',
                      fontWeight: 800,
                      py: 1.2,
                      borderRadius: 2,
                      boxShadow: '0 4px 14px rgba(22, 163, 74, 0.35)',
                      textTransform: 'none',
                      '&:hover': {
                        backgroundColor: '#15803D',
                      },
                    }}
                  >
                    ✓ Use My Saved Address & Auto-fill
                  </Button>
                </Box>
              </>
            ) : (
              <Alert
                severity="info"
                sx={{
                  mb: 2.5,
                  borderRadius: 2,
                  backgroundColor: '#EFF6FF',
                  border: '1px solid #BFDBFE',
                  color: '#1E40AF',
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>
                  New Customer Registration
                </Typography>
                <Typography variant="caption" sx={{ color: '#1E40AF', display: 'block', lineHeight: 1.5 }}>
                  No existing account found for +91 {mobileNumber}. Please fill in your delivery details in the form to save your profile.
                </Typography>
              </Alert>
            )}

            {/* Architecture Overview */}
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                backgroundColor: '#FFFFFF',
                border: '1px dashed #CBD5E1',
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', display: 'block', mb: 1, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Secure Booking Guarantee
              </Typography>

              <Stack spacing={1}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <CheckCircleOutlinedIcon sx={{ color: '#16A34A', fontSize: 17 }} />
                  <Typography variant="body2" sx={{ color: '#334155', fontSize: '0.82rem' }}>
                    Customer details automatically save to database and local session
                  </Typography>
                </Stack>

                <Stack direction="row" spacing={1.5} alignItems="center">
                  <VpnKeyOutlinedIcon sx={{ color: '#FFA000', fontSize: 17 }} />
                  <Typography variant="body2" sx={{ color: '#334155', fontSize: '0.82rem' }}>
                    Orders can be tracked instantly by 10-digit mobile number
                  </Typography>
                </Stack>
              </Stack>
            </Box>
          </>
        )}
      </DialogContent>

      <Divider />

      <DialogActions sx={{ p: 2, backgroundColor: '#FFFFFF', gap: 1.5, justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <Button
          onClick={() => {
            if (onApplyDemoData) onApplyDemoData()
            onClose()
          }}
          startIcon={<AutoAwesomeIcon sx={{ fontSize: 18 }} />}
          variant="outlined"
          sx={{
            borderColor: '#FFA000',
            color: '#B45309',
            fontWeight: 700,
            textTransform: 'none',
            borderRadius: 2,
            '&:hover': {
              borderColor: '#FF8F00',
              backgroundColor: 'rgba(255, 160, 0, 0.08)',
            },
          }}
        >
          Autofill Sample Test Data
        </Button>

        <Button
          onClick={onClose}
          variant="contained"
          sx={{
            backgroundColor: '#0B132B',
            color: '#FFFFFF',
            fontWeight: 700,
            textTransform: 'none',
            borderRadius: 2,
            px: 3,
            '&:hover': {
              backgroundColor: '#1C2541',
            },
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )
}
