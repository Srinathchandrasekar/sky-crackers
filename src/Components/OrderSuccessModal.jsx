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
import { cleanAddressDisplay } from '../utils/addressUtils'

export default function OrderSuccessModal({
  open,
  orderDetails,
  onClose,
  onContinueShopping,
  onViewOrderDetails,
}) {
  if (!orderDetails) return null

  const pStatus = (orderDetails.paymentStatus || '').toLowerCase()
  const isPaid =
    orderDetails.isPaid ||
    pStatus === 'completed' ||
    pStatus === 'paid' ||
    pStatus === 'received' ||
    pStatus === 'verified'

  const isWhatsApp =
    orderDetails.paymentMethod?.toLowerCase().includes('whatsapp')

  const isPendingVerification =
    !isPaid &&
    !isWhatsApp &&
    (pStatus === 'pending verification' ||
      pStatus === 'verification in progress' ||
      Boolean(orderDetails.utrNumber))

  const isSavedBooking = !isPaid && !isWhatsApp && !isPendingVerification

  // Accurately compute real items total so modal never shows wrong database defaults
  const computedTotal = (orderDetails.items || []).reduce((sum, item) => {
    const qty = Number(item.quantity || 1)
    const price = Number(item.product?.discountPrice ?? item.unitPrice ?? 0)
    return sum + (price * qty)
  }, 0)
  const displayTotal = computedTotal > 0 ? computedTotal : Number(orderDetails.total || 0)

  const handleDownloadInvoice = () => {
    downloadStructuredInvoice({
      ...orderDetails,
      total: displayTotal,
      subtotal: displayTotal,
      paymentStatus: isPaid ? 'Completed' : (isPendingVerification ? 'Pending Verification' : 'Pending'),
      paymentMethod: orderDetails.paymentMethod || (isPaid ? 'Direct UPI' : (isPendingVerification ? 'Direct UPI (Pending Verification)' : 'Pending')),
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
        {/* Animated Celebration / Verification Icon */}
        <Box
          sx={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            backgroundColor: isPaid ? '#DCFCE7' : isPendingVerification ? '#E0F2FE' : '#FEF3C7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px auto',
            boxShadow: isPaid
              ? '0 0 20px rgba(34, 197, 94, 0.3)'
              : isPendingVerification
              ? '0 0 20px rgba(2, 132, 199, 0.3)'
              : '0 0 20px rgba(245, 158, 11, 0.3)',
          }}
        >
          <CheckCircleIcon sx={{ fontSize: 46, color: isPaid ? '#16A34A' : isPendingVerification ? '#0284C7' : '#D97706' }} />
        </Box>

        <Chip
          icon={<AutoAwesomeIcon sx={{ color: '#15803D !important', fontSize: 16 }} />}
          label="ORDER ENQUIRY PLACED SUCCESSFULLY"
          sx={{
            backgroundColor: '#DCFCE7',
            color: '#15803D',
            fontWeight: 900,
            fontSize: '0.75rem',
            border: '1px solid #86EFAC',
            mb: 1.2,
          }}
        />

        <Typography variant="h5" sx={{ fontWeight: 900, color: '#0F172A', mb: 1, fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
          Your Order Enquiry Placed Successfully! 💥
        </Typography>

        {/* 24 Hours Team Contact Highlight Card */}
        <Box
          sx={{
            p: 1.8,
            mb: 2.2,
            borderRadius: 2.5,
            backgroundColor: '#FEF3C7',
            border: '2px solid #F59E0B',
            textAlign: 'center',
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#92400E', fontSize: { xs: '0.88rem', sm: '0.96rem' }, mb: 0.4 }}>
            📞 After 24 hours-குள்ள Sky Crackers Team will contact you!
          </Typography>
          <Typography variant="caption" sx={{ color: '#78350F', fontWeight: 700, display: 'block', fontSize: { xs: '0.76rem', sm: '0.82rem' }, lineHeight: 1.45 }}>
            உங்கள் பட்டாசு பட்டியல் பெறப்பட்டது. அடுத்த 24 மணி நேரத்திற்குள் சிவகாசி அலுவலகத்திலிருந்து (+91 80567 04353) உங்களை அழைத்து பார்சல் பேக்கிங் & டெலிவரி விபரங்களை உறுதி செய்வோம்!
          </Typography>
        </Box>

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
                Payment Status:
              </Typography>
              <Chip
                size="small"
                icon={isPaid ? <CheckCircleIcon sx={{ fontSize: '13px !important' }} /> : undefined}
                label={isPaid ? 'Payment Received (Paid)' : isPendingVerification ? '⏳ Verification in Progress' : isWhatsApp ? 'WhatsApp Enquiry (Pending)' : 'Online Payment (Pending / Pay Later)'}
                sx={{
                  backgroundColor: isPaid ? '#DCFCE7' : isPendingVerification ? '#E0F2FE' : isWhatsApp ? '#E0F2FE' : '#FEF3C7',
                  color: isPaid ? '#15803D' : isPendingVerification ? '#0369A1' : isWhatsApp ? '#0369A1' : '#B45309',
                  fontWeight: 900,
                  fontSize: '0.72rem',
                  border: isPendingVerification ? '1px solid #BAE6FD' : 'none',
                }}
              />
            </Box>

            {orderDetails.utrNumber && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700 }}>
                  UPI Ref / UTR:
                </Typography>
                <Chip
                  size="small"
                  label={orderDetails.utrNumber}
                  sx={{
                    backgroundColor: '#EFF6FF',
                    color: '#1E40AF',
                    fontWeight: 800,
                    fontSize: '0.72rem',
                    border: '1px solid #BFDBFE',
                  }}
                />
              </Box>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, mt: 0.3 }}>
                Shipping To:
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F172A', textAlign: 'right', maxWidth: '65%', fontSize: '0.82rem' }}>
                <strong>{orderDetails.customer?.name}</strong> (+91 {orderDetails.customer?.phone})<br />
                {cleanAddressDisplay(orderDetails.customer?.address)}
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
                ₹{displayTotal.toLocaleString('en-IN')}
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
              Check in My Orders (என் ஆர்டர்கள்)
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
