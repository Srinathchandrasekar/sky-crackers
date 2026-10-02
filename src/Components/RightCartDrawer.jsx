import React from 'react'
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Button,
  Divider,
  Stack,
  Avatar,
  Badge,
  Paper,
  Chip,
  Tooltip,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import DeleteIcon from '@mui/icons-material/Delete'
import AddIcon from '@mui/icons-material/Add'
import RemoveIcon from '@mui/icons-material/Remove'
import ShoppingCartCheckoutIcon from '@mui/icons-material/ShoppingCartCheckout'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'

export default function RightCartDrawer({
  open,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onProceedToOrder,
}) {
  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = cart.reduce((sum, item) => sum + item.product.discountPrice * item.quantity, 0)
  const originalSubtotal = cart.reduce(
    (sum, item) => sum + (item.product.originalPrice || item.product.discountPrice * 5) * item.quantity,
    0
  )
  const savings = Math.max(0, originalSubtotal - subtotal)

  // Calculations strictly based on items (Zero delivery fee!)
  const festivalDiscount = 0
  const totalAmount = cart.length === 0 ? 0 : subtotal

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 430, md: 440 },
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#FFFFFF',
          boxShadow: '-8px 0 35px rgba(0, 0, 0, 0.25)',
        },
      }}
    >
      {/* Top Header - Clean, balanced size */}
      <Box
        sx={{
          px: 2.2,
          py: 1.8,
          backgroundColor: '#0B132B',
          color: '#FFFFFF',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '2.5px solid #FFA000',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Badge badgeContent={totalItemsCount} color="warning">
            <AutoAwesomeIcon sx={{ color: '#FFA000', fontSize: 24 }} />
          </Badge>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, fontSize: '1.05rem', lineHeight: 1.2 }}>
              Your Crackers Cart
            </Typography>
            <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '0.78rem' }}>
              {cart.length} distinct item(s) • {totalItemsCount} boxes total
            </Typography>
          </Box>
        </Box>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            color: '#94A3B8',
            '&:hover': { color: '#FFFFFF', backgroundColor: 'rgba(255,255,255,0.1)' },
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Cart Items List - Clean, compact, not over-zoomed */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 1.8 }}>
        {cart.length === 0 ? (
          <Box sx={{ py: 8, textAlign: 'center' }}>
            <Box
              sx={{
                width: 70,
                height: 70,
                borderRadius: '50%',
                backgroundColor: '#F1F5F9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <ShoppingCartCheckoutIcon sx={{ fontSize: 38, color: '#94A3B8' }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A', mb: 0.5, fontSize: '1.05rem' }}>
              Your cart is empty
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748B', px: 2, mb: 2.5, fontSize: '0.85rem' }}>
              Select crackers from the catalog to add items into your booking parcel.
            </Typography>
            <Button
              variant="outlined"
              size="small"
              onClick={onClose}
              sx={{
                borderColor: '#0B132B',
                color: '#0B132B',
                fontWeight: 700,
                borderRadius: 2,
                px: 2.5,
                py: 0.8,
                fontSize: '0.85rem',
                textTransform: 'none',
              }}
            >
              Browse Crackers Catalog
            </Button>
          </Box>
        ) : (
          <Stack spacing={1.5}>
            {cart.map((item) => (
              <Paper
                key={item.product.id}
                elevation={0}
                sx={{
                  p: 1.5,
                  borderRadius: 2.5,
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  backgroundColor: '#FFFFFF',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: '#FFA000',
                  },
                }}
              >
                {/* Product Image Thumbnail - Clean 64px */}
                <Avatar
                  src={item.product.image}
                  variant="rounded"
                  sx={{
                    width: 64,
                    height: 64,
                    borderRadius: 2,
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    flexShrink: 0,
                  }}
                />

                {/* Product Information - Compact & Clear */}
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 800,
                      color: '#0F172A',
                      fontSize: '0.94rem',
                      lineHeight: 1.25,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {item.product.name}
                  </Typography>

                  {/* Tamil Name */}
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#B45309',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      display: 'block',
                      mt: 0.2,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {item.product.nameTamil || item.product.tamilName || ''}
                  </Typography>

                  {/* Packing & Unit Price */}
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#64748B',
                      display: 'block',
                      mt: 0.3,
                      fontWeight: 600,
                      fontSize: '0.75rem',
                    }}
                  >
                    {item.product.pieces || '1 Box'} • ₹{item.product.discountPrice} each
                  </Typography>

                  {/* Quantity Stepper Controls */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.8 }}>
                    <Box
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        border: '1px solid #CBD5E1',
                        borderRadius: 1.8,
                        px: 0.6,
                        py: 0.15,
                        backgroundColor: '#F8FAFC',
                      }}
                    >
                      <IconButton
                        size="small"
                        onClick={() => onUpdateQuantity(item.product.id, -1)}
                        sx={{ p: 0.3, color: '#334155' }}
                      >
                        <RemoveIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                      <Typography variant="body2" sx={{ px: 1.2, fontWeight: 900, fontSize: '0.88rem', color: '#0B132B' }}>
                        {item.quantity}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => onUpdateQuantity(item.product.id, 1)}
                        sx={{ p: 0.3, color: '#334155' }}
                      >
                        <AddIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Box>

                    <Tooltip title="Remove item">
                      <IconButton
                        size="small"
                        onClick={() => onRemoveItem(item.product.id)}
                        sx={{ color: '#94A3B8', '&:hover': { color: '#EF4444' }, p: 0.5 }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>

                {/* Price Column */}
                <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 900, color: '#0F172A', fontSize: '1.08rem' }}>
                    ₹{item.product.discountPrice * item.quantity}
                  </Typography>
                  {item.product.originalPrice > item.product.discountPrice && (
                    <Typography
                      variant="caption"
                      sx={{ color: '#94A3B8', textDecoration: 'line-through', display: 'block', fontSize: '0.78rem' }}
                    >
                      ₹{item.product.originalPrice * item.quantity}
                    </Typography>
                  )}
                  <Chip
                    label="80% OFF"
                    size="small"
                    sx={{
                      backgroundColor: '#FEF3C7',
                      color: '#B45309',
                      fontWeight: 800,
                      fontSize: '0.65rem',
                      height: 18,
                      mt: 0.4,
                    }}
                  />
                </Box>
              </Paper>
            ))}
          </Stack>
        )}
      </Box>

      {/* Bottom Summary Section & Produce Order CTA */}
      {cart.length > 0 && (
        <Box
          sx={{
            p: 2.2,
            backgroundColor: '#F8FAFC',
            borderTop: '1.5px solid #E2E8F0',
            boxShadow: '0 -4px 16px rgba(0,0,0,0.04)',
          }}
        >
          <Stack spacing={1} sx={{ mb: 1.8 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 600, fontSize: '0.88rem' }}>
                Selected Crackers ({totalItemsCount} boxes)
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 800, fontSize: '0.94rem', color: '#0F172A' }}>
                ₹{subtotal}
              </Typography>
            </Box>



            {savings > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#EA580C' }}>
                <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.8rem' }}>
                  Total 80% Direct Factory Savings
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 900, fontSize: '0.85rem' }}>
                  Save ₹{savings}
                </Typography>
              </Box>
            )}

            <Divider sx={{ my: 0.6 }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 900, color: '#0B132B', fontSize: '1.05rem' }}>
                Total Booking Amount
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 900, color: '#0B132B', fontSize: '1.45rem' }}>
                ₹{totalAmount}
              </Typography>
            </Box>
          </Stack>

          {/* Proceed / Produce Order Button - Compact & Sleek */}
          <Button
            variant="contained"
            fullWidth
            onClick={() => {
              onClose()
              onProceedToOrder()
            }}
            sx={{
              backgroundColor: '#FFA000',
              color: '#0B132B',
              fontWeight: 900,
              fontSize: '0.94rem',
              py: 1.1,
              borderRadius: 2,
              boxShadow: '0 3px 12px rgba(255, 160, 0, 0.35)',
              textTransform: 'none',
              letterSpacing: '0.01em',
              '&:hover': { backgroundColor: '#FF8F00', boxShadow: '0 4px 16px rgba(255, 143, 0, 0.45)' },
            }}
          >
            Produce Order (₹{totalAmount}) →
          </Button>
        </Box>
      )}
    </Drawer>
  )
}
