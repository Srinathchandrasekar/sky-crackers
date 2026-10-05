import React, { useState } from 'react'
import {
  Menu,
  MenuItem,
  Typography,
  Box,
  Button,
  Divider,
  Avatar,
  Chip,
  Stack,
  Dialog,
  DialogContent,
  IconButton,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import PersonIcon from '@mui/icons-material/Person'
import PhoneIcon from '@mui/icons-material/Phone'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import LogoutIcon from '@mui/icons-material/Logout'
import VerifiedIcon from '@mui/icons-material/Verified'

export default function CustomerProfileMenu({
  customer,
  anchorEl,
  open,
  onClose,
  onLogout,
  onOpenOrderDetails,
}) {
  if (!customer) return null

  const displayName = customer.fullName || customer.customerName || 'Valued Customer'
  const displayPhone = customer.mobileNumber || ''
  const displayAddress = customer.address || [customer.doorNumber, customer.streetName, customer.area, customer.city, customer.district, customer.pincode].filter(Boolean).join(', ')

  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      PaperProps={{
        sx: {
          width: 320,
          p: 1.5,
          borderRadius: 3,
          boxShadow: '0 12px 36px rgba(0, 0, 0, 0.2)',
          border: '1px solid #E2E8F0',
        },
      }}
    >
      {/* Profile Header */}
      <Box sx={{ p: 1.5, textAlign: 'center', backgroundColor: '#F8FAFC', borderRadius: 2, mb: 1.5 }}>
        <Avatar
          sx={{
            width: 52,
            height: 52,
            margin: '0 auto 8px auto',
            backgroundColor: '#0B132B',
            color: '#FFA000',
            fontWeight: 900,
            fontSize: '1.25rem',
            border: '2px solid #FFA000',
          }}
        >
          {displayName.charAt(0).toUpperCase()}
        </Avatar>

        <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#0F172A', lineHeight: 1.2 }}>
          {displayName}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mt: 0.5 }}>
          <Chip
            size="small"
            icon={<VerifiedIcon sx={{ fontSize: '13px !important', color: '#16A34A !important' }} />}
            label={`+91 ${displayPhone}`}
            sx={{
              backgroundColor: '#DCFCE7',
              color: '#166534',
              fontWeight: 800,
              fontSize: '0.72rem',
              height: 22,
            }}
          />
        </Box>
      </Box>

      {/* Address Details from Database */}
      <Box sx={{ px: 1, mb: 1.5 }}>
        <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748B', display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.3 }}>
          <LocationOnIcon sx={{ fontSize: 13, color: '#FFA000' }} />
          DELIVERY ADDRESS (DATABASE)
        </Typography>
        <Typography variant="body2" sx={{ color: '#1E293B', fontSize: '0.8rem', lineHeight: 1.4 }}>
          {displayAddress || 'Tamil Nadu, India'}
        </Typography>
      </Box>

      <Divider sx={{ my: 1 }} />

      {/* Action: My Orders */}
      <MenuItem
        onClick={() => {
          onClose()
          if (onOpenOrderDetails) onOpenOrderDetails()
        }}
        sx={{
          borderRadius: 1.5,
          py: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 1.2,
          fontWeight: 700,
          color: '#0B132B',
          '&:hover': { backgroundColor: '#F1F5F9' },
        }}
      >
        <ReceiptLongIcon sx={{ color: '#FFA000', fontSize: 20 }} />
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
            My Orders (என் ஆர்டர்கள்)
          </Typography>
          <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.7rem' }}>
            Check booking status & invoices
          </Typography>
        </Box>
      </MenuItem>

      <Divider sx={{ my: 1 }} />

      {/* Action: Log Out */}
      <MenuItem
        onClick={() => {
          onClose()
          onLogout()
        }}
        sx={{
          borderRadius: 1.5,
          py: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 1.2,
          color: '#DC2626',
          fontWeight: 800,
          '&:hover': { backgroundColor: '#FEE2E2' },
        }}
      >
        <LogoutIcon sx={{ fontSize: 19 }} />
        <Typography variant="body2" sx={{ fontWeight: 900 }}>
          Log Out (வெளியேறு)
        </Typography>
      </MenuItem>
    </Menu>
  )
}
