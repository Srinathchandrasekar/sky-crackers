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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import ReceiptIcon from '@mui/icons-material/Receipt'
import VisibilityIcon from '@mui/icons-material/Visibility'
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag'
import { downloadStructuredInvoice } from '../utils/invoiceGenerator'

export default function OrderSuccessModal({
  open,
  orderDetails,
  onClose,
  onContinueShopping,
  onViewOrderDetails,
}) {
  if (!orderDetails) return null

  const isSavedBooking =
    orderDetails.paymentStatus?.toLowerCase() === 'pending' ||
    orderDetails.paymentMethod?.toLowerCase().includes('saved') ||
    orderDetails.paymentMethod?.toLowerCase().includes('pending') ||
    orderDetails.paymentMethod?.toLowerCase().includes('pay later')

  const handleDownloadInvoice = () => {
    downloadStructuredInvoice({
      ...orderDetails,
      paymentStatus: isSavedBooking ? 'Pending' : 'Completed',
      paymentMethod: isSavedBooking ? 'Online Payment (Pending)' : 'Online Payment (Razorpay)',
    })
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3.5,
          overflow: 'hidden',
          backgroundColor: '#FFFFFF',
        },
      }}
    >
      <DialogContent sx={{ p: { xs: 2.5, sm: 3.5 }, textAlign: 'center' }}>
        {/* Animated Celebration Icon */}
        <Box
          sx={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            backgroundColor: '#DCFCE7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px auto',
            boxShadow: '0 0 20px rgba(34, 197, 94, 0.3)',
          }}
        >
          <CheckCircleIcon sx={{ fontSize: 46, color: '#16A34A' }} />
        </Box>

        <Chip
          icon={<AutoAwesomeIcon sx={{ color: '#B45309 !important', fontSize: 16 }} />}
          label={isSavedBooking ? 'BOOKING SAVED IN DATABASE' : 'ORDER PLACED SUCCESSFULLY'}
          sx={{
            backgroundColor: '#FEF3C7',
            color: '#B45309',
            fontWeight: 800,
            fontSize: '0.72rem',
            mb: 1.2,
          }}
        />

        <Typography variant="h5" sx={{ fontWeight: 900, color: '#0F172A', mb: 0.5, fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
          {isSavedBooking ? 'Booking Saved Successfully! 🎉' : 'Thank You for Your Order! 🎉'}
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748B', mb: 2.5, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
          {isSavedBooking
            ? 'Your crackers booking has been safely stored in our database. You can review items anytime in Order Details!'
            : 'Your crackers package is being packed with certified Sivakasi safety standards and will be dispatched within 24 hours.'}
        </Typography>

        {/* Order Summary Paper */}
        <Paper
          elevation={0}
          sx={{
            backgroundColor: '#F8FAFC',
            border: '1.5px solid #E2E8F0',
            borderRadius: 2.5,
            p: 2,
            textAlign: 'left',
            mb: 2.5,
          }}
        >
          <Stack spacing={1.2}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700 }}>
                Order Number:
              </Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#0B132B', fontFamily: 'monospace' }}>
                {orderDetails.orderId}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700 }}>
                Payment Method:
              </Typography>
              <Chip
                size="small"
                label={isSavedBooking ? 'Online Payment (Pending / Pay Later)' : (orderDetails.paymentMethod || 'Online Payment')}
                sx={{
                  backgroundColor: isSavedBooking ? '#FEF3C7' : '#DCFCE7',
                  color: isSavedBooking ? '#B45309' : '#15803D',
                  fontWeight: 800,
                  fontSize: '0.72rem',
                }}
              />
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, mt: 0.3 }}>
                Shipping To:
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A', textAlign: 'right', maxWidth: '65%', fontSize: '0.82rem' }}>
                <strong>{orderDetails.customer?.name}</strong> (+91 {orderDetails.customer?.phone})<br />
                {orderDetails.customer?.address}
              </Typography>
            </Box>

            {/* Saved Items Preview */}
            {orderDetails.items && orderDetails.items.length > 0 && (
              <>
                <Divider sx={{ my: 0.5 }} />
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#0B132B', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <ShoppingBagIcon sx={{ fontSize: 14, color: '#FFA000' }} />
                  Saved Cart Items ({orderDetails.items.length} Products, {orderDetails.items.reduce((sum, i) => sum + i.quantity, 0)} Boxes):
                </Typography>

                <TableContainer sx={{ maxHeight: 140, overflowY: 'auto', backgroundColor: '#FFFFFF', borderRadius: 1.5, border: '1px solid #E2E8F0' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ backgroundColor: '#F1F5F9' }}>
                        <TableCell sx={{ fontSize: '0.72rem', fontWeight: 700, py: 0.5 }}>Product</TableCell>
                        <TableCell align="center" sx={{ fontSize: '0.72rem', fontWeight: 700, py: 0.5 }}>Qty</TableCell>
                        <TableCell align="right" sx={{ fontSize: '0.72rem', fontWeight: 700, py: 0.5 }}>Amount</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {orderDetails.items.map((item, idx) => {
                        const name = item.product?.name || item.productName || 'Crackers Item'
                        const price = item.product?.discountPrice || item.unitPrice || 0
                        return (
                          <TableRow key={idx}>
                            <TableCell sx={{ fontSize: '0.75rem', fontWeight: 600, py: 0.5 }}>
                              {name}
                            </TableCell>
                            <TableCell align="center" sx={{ fontSize: '0.75rem', py: 0.5 }}>
                              {item.quantity} box
                            </TableCell>
                            <TableCell align="right" sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#16A34A', py: 0.5 }}>
                              ₹{price * item.quantity}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}

            <Divider sx={{ my: 0.5 }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                Total {isSavedBooking ? 'Booking Amount' : 'Paid'}
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 900, color: '#0B132B' }}>
                ₹{orderDetails.total}
              </Typography>
            </Box>
          </Stack>
        </Paper>

        {/* Action Buttons */}
        <Stack spacing={1.5}>
          {/* Primary Button to Open Order Details */}
          {onViewOrderDetails && (
            <Button
              variant="contained"
              fullWidth
              startIcon={<VisibilityIcon />}
              onClick={onViewOrderDetails}
              sx={{
                backgroundColor: '#0B132B',
                color: '#FFA000',
                fontWeight: 900,
                py: 1.2,
                borderRadius: 2,
                fontSize: { xs: '0.85rem', sm: '0.95rem' },
                '&:hover': {
                  backgroundColor: '#1A2A56',
                },
              }}
            >
              Check in Order Details (ஆர்டர் விபரங்கள்)
            </Button>
          )}

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="center">
            <Button
              variant="outlined"
              fullWidth
              startIcon={<ReceiptIcon />}
              onClick={handleDownloadInvoice}
              sx={{
                borderColor: '#CBD5E1',
                color: '#0F172A',
                fontWeight: 700,
                py: 1,
                borderRadius: 2,
                fontSize: '0.85rem',
              }}
            >
              Download Invoice
            </Button>
            <Button
              variant="contained"
              fullWidth
              onClick={onContinueShopping}
              sx={{
                backgroundColor: '#FFA000',
                color: '#0B132B',
                fontWeight: 800,
                py: 1,
                borderRadius: 2,
                fontSize: '0.85rem',
                '&:hover': {
                  backgroundColor: '#FF8F00',
                },
              }}
            >
              Continue Shopping
            </Button>
          </Stack>
        </Stack>
      </DialogContent>
    </Dialog>
  )
}
