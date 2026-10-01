import React from 'react'
import {
  Dialog,
  DialogContent,
  Typography,
  Box,
  Button,
  Stack,
  Divider,
  Chip,
  Paper,
} from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import LocalShippingIcon from '@mui/icons-material/LocalShipping'
import ReceiptIcon from '@mui/icons-material/Receipt'

export default function OrderSuccessModal({ open, orderDetails, onClose, onContinueShopping }) {
  if (!orderDetails) return null

  const handleDownloadInvoice = () => {
    const text = `========================================
SKYFIRE CRACKERS - OFFICIAL INVOICE
Direct From Sivakasi Factories
Order ID: ${orderDetails.orderId}
Date: ${new Date().toLocaleDateString()}
Customer: ${orderDetails.customer?.name || 'Valued Customer'}
Phone: ${orderDetails.customer?.phone || 'N/A'}
Delivery Address: ${orderDetails.customer?.address || 'N/A'}
Payment Mode: ${orderDetails.paymentMethod || 'UPI'}
========================================
ITEMS ORDERED:
${orderDetails.items?.map((item) => `- ${item.product.name} (x${item.quantity}) - ₹${item.product.discountPrice * item.quantity}`).join('\n')}

Subtotal: ₹${orderDetails.subtotal}
Discount: -₹${orderDetails.discount}
Delivery Charges: ₹${orderDetails.delivery}
TOTAL PAID: ₹${orderDetails.total}
========================================
Happy & Safe Celebrations!
SkyFire Crackers Sivakasi
========================================`

    const element = document.createElement('a')
    const file = new Blob([text], { type: 'text/plain' })
    element.href = URL.createObjectURL(file)
    element.download = `Invoice_${orderDetails.orderId}.txt`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogContent sx={{ p: { xs: 3, sm: 4 }, textAlign: 'center' }}>
        {/* Animated Celebration Icon */}
        <Box
          sx={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            backgroundColor: '#DCFCE7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px auto',
            boxShadow: '0 0 24px rgba(34, 197, 94, 0.35)',
          }}
        >
          <CheckCircleIcon sx={{ fontSize: 52, color: '#16A34A' }} />
        </Box>

        <Chip
          icon={<AutoAwesomeIcon sx={{ color: '#B45309 !important' }} />}
          label="ORDER PLACED SUCCESSFULLY"
          sx={{
            backgroundColor: '#FEF3C7',
            color: '#B45309',
            fontWeight: 800,
            fontSize: '0.75rem',
            mb: 1.5,
          }}
        />

        <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F172A', mb: 1 }}>
          Thank You for Your Order! 🎉
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748B', mb: 3 }}>
          Your crackers package is being packed with certified Sivakasi safety standards and will be dispatched within 24 hours.
        </Typography>

        <Paper
          elevation={0}
          sx={{
            backgroundColor: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: 2.5,
            p: 2.5,
            textAlign: 'left',
            mb: 3,
          }}
        >
          <Stack spacing={1.5}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                Order Number:
              </Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                {orderDetails.orderId}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                Payment Method:
              </Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                {orderDetails.paymentMethod}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                Shipping To:
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A', textAlign: 'right', maxWidth: '60%' }}>
                {orderDetails.customer?.name} ({orderDetails.customer?.phone})<br />
                {orderDetails.customer?.address}
              </Typography>
            </Box>

            <Divider />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F172A' }}>
                Total Paid
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#0B132B' }}>
                ₹{orderDetails.total}
              </Typography>
            </Box>
          </Stack>
        </Paper>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
          <Button
            variant="outlined"
            startIcon={<ReceiptIcon />}
            onClick={handleDownloadInvoice}
            sx={{
              borderColor: '#CBD5E1',
              color: '#0F172A',
              fontWeight: 600,
              py: 1.2,
              borderRadius: 2,
            }}
          >
            Download Invoice
          </Button>
          <Button
            variant="contained"
            onClick={onContinueShopping}
            sx={{
              backgroundColor: '#FFA000',
              color: '#0B132B',
              fontWeight: 700,
              py: 1.2,
              px: 3,
              borderRadius: 2,
              '&:hover': {
                backgroundColor: '#FF8F00',
              },
            }}
          >
            Continue Shopping
          </Button>
        </Stack>
      </DialogContent>
    </Dialog>
  )
}
