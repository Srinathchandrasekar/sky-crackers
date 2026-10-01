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
}) {
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
              Customer Verification
            </Typography>
            <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.78rem' }}>
              Secure Database Lookup
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
              Querying SQL Database...
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B' }}>
              Checking customer presence for mobile number +91 {mobileNumber}
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
                  label="Registered Customer"
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

            {lookupResult?.exists ? (
              <>
                {/* Masked Data Display (Prevents personal info exposure) */}
                <Box
                  sx={{
                    p: 2,
                    mb: 2.5,
                    borderRadius: 2,
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                  }}
                >
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, display: 'block', mb: 1, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Masked Account Summary (SQL Record Match)
                  </Typography>

                  <Stack spacing={1}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ color: '#64748B' }}>Account Holder:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                        {lookupResult.maskedName}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ color: '#64748B' }}>Phone Link:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                        {lookupResult.maskedMobile}
                      </Typography>
                    </Box>

                    {lookupResult.cityHint && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" sx={{ color: '#64748B' }}>Registered Region:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                          {lookupResult.cityHint}
                        </Typography>
                      </Box>
                    )}
                  </Stack>
                </Box>

                {/* Privacy & Verification Disclosure */}
                <Alert
                  severity="info"
                  sx={{
                    mb: 2.5,
                    borderRadius: 2,
                    backgroundColor: '#EFF6FF',
                    border: '1px solid #BFDBFE',
                    color: '#1E3A8A',
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                    Zero Personal Data Exposure
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#1E40AF', display: 'block', lineHeight: 1.5 }}>
                    In accordance with strict security standards, full address details are not exposed without verified 2-Factor Authentication.
                    External SMS OTP services are currently pending live gateway integration. You may enter or update your address in the form below.
                  </Typography>
                </Alert>
              </>
            ) : (
              <Alert
                severity="success"
                sx={{
                  mb: 2.5,
                  borderRadius: 2,
                  backgroundColor: '#ECFDF5',
                  border: '1px solid #A7F3D0',
                  color: '#065F46',
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                  Welcome New Customer!
                </Typography>
                <Typography variant="caption" sx={{ color: '#047857', display: 'block', lineHeight: 1.5 }}>
                  No previous profile exists for +91 {mobileNumber}. Please fill out your delivery details to complete your Diwali crackers booking.
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
                Secure Booking Architecture
              </Typography>

              <Stack spacing={1}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <CheckCircleOutlinedIcon sx={{ color: '#16A34A', fontSize: 17 }} />
                  <Typography variant="body2" sx={{ color: '#334155', fontSize: '0.82rem' }}>
                    Real-time SQL lookup executed via parameterized query
                  </Typography>
                </Stack>

                <Stack direction="row" spacing={1.5} alignItems="center">
                  <VpnKeyOutlinedIcon sx={{ color: '#FFA000', fontSize: 17 }} />
                  <Typography variant="body2" sx={{ color: '#334155', fontSize: '0.82rem' }}>
                    Cryptographic session tokens protect subsequent order updates
                  </Typography>
                </Stack>

                <Stack direction="row" spacing={1.5} alignItems="center">
                  <AutoAwesomeIcon sx={{ color: '#6366F1', fontSize: 17 }} />
                  <Typography variant="body2" sx={{ color: '#334155', fontSize: '0.82rem' }}>
                    No personal or address information is stored in localStorage
                  </Typography>
                </Stack>
              </Stack>
            </Box>
          </>
        )}
      </DialogContent>

      <Divider />

      <DialogActions sx={{ p: 2.5, backgroundColor: '#FFFFFF', gap: 1.5, justifyContent: 'space-between' }}>
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
          Continue to Form
        </Button>
      </DialogActions>
    </Dialog>
  )
}
