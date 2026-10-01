import React, { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Card,
  CardContent,
  Stack,
  Chip,
  IconButton,
  Snackbar,
  Alert,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import LocalOfferIcon from '@mui/icons-material/LocalOffer'
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined'

export default function OffersModal({ open, onClose, onApplyCoupon }) {
  const [copiedCode, setCopiedCode] = useState('')
  const [toastOpen, setToastOpen] = useState(false)

  const coupons = [
    {
      code: 'SKYFIRE10',
      title: 'Flat 10% Extra Discount',
      desc: 'Applicable on all orders above ₹2000. Limited festive stock!',
      badge: 'POPULAR',
      color: '#FFA000',
    },
    {
      code: 'DIWALI2026',
      title: 'Mega Savings ₹200 OFF',
      desc: 'Instant ₹200 rebate on all Gift Boxes & Combos above ₹1500.',
      badge: 'FESTIVE SPECIAL',
      color: '#E53935',
    },
    {
      code: 'FREESHIP',
      title: 'Free Express Shipping',
      desc: 'Free insured doorstep transport on all prepaid orders.',
      badge: 'ALL USERS',
      color: '#16A34A',
    },
  ]

  const handleCopy = (code) => {
    navigator.clipboard?.writeText(code)
    setCopiedCode(code)
    setToastOpen(true)
    if (onApplyCoupon) {
      onApplyCoupon(code)
    }
  }

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#0B132B',
            color: '#FFFFFF',
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center">
            <LocalOfferIcon sx={{ color: '#FFA000' }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Special Festive Coupons & Offers
            </Typography>
          </Stack>
          <IconButton onClick={onClose} sx={{ color: '#FFFFFF' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 3, backgroundColor: '#F8FAFC' }}>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {coupons.map((c) => (
              <Card
                key={c.code}
                sx={{
                  border: '1px dashed #CBD5E1',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: '#FFA000',
                    boxShadow: '0 4px 15px rgba(255, 160, 0, 0.15)',
                  },
                }}
              >
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Chip
                      label={c.badge}
                      size="small"
                      sx={{
                        backgroundColor: `${c.color}15`,
                        color: c.color,
                        fontWeight: 700,
                        fontSize: '0.68rem',
                      }}
                    />
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<ContentCopyIcon sx={{ fontSize: 16 }} />}
                      onClick={() => handleCopy(c.code)}
                      sx={{
                        borderColor: '#FFA000',
                        color: '#0B132B',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        py: 0.3,
                        px: 1.5,
                      }}
                    >
                      {copiedCode === c.code ? 'Copied!' : 'Apply Code'}
                    </Button>
                  </Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F172A' }}>
                    {c.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748B', fontSize: '0.82rem', mb: 1.5 }}>
                    {c.desc}
                  </Typography>
                  <Box
                    sx={{
                      backgroundColor: '#F1F5F9',
                      py: 0.8,
                      px: 1.5,
                      borderRadius: 1.5,
                      display: 'inline-block',
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      color: '#0B132B',
                      letterSpacing: '0.08em',
                    }}
                  >
                    {c.code}
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 2, borderTop: '1px solid #E2E8F0' }}>
          <Button onClick={onClose} sx={{ color: '#64748B' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={toastOpen}
        autoHideDuration={3000}
        onClose={() => setToastOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          icon={<CheckCircleOutlinedIcon fontSize="inherit" />}
          severity="success"
          sx={{ width: '100%', fontWeight: 600 }}
        >
          Coupon code <strong>{copiedCode}</strong> applied to your cart!
        </Alert>
      </Snackbar>
    </>
  )
}
