import React from 'react'
import {
  Box,
  Container,
  Grid,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Button,
  Divider,
  Stack,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import RemoveIcon from '@mui/icons-material/Remove'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined'

export default function CartPage({
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onContinueShopping,
  onProceedToPayment,
}) {
  // Calculations
  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = cart.reduce((sum, item) => sum + item.product.discountPrice * item.quantity, 0)
  
  // Realistic discount rule (e.g. ₹150 discount if subtotal > 1500)
  const discount = subtotal > 1500 ? 150 : (subtotal > 800 ? 50 : 0)
  const totalAmount = cart.length === 0 ? 0 : Math.max(0, subtotal - discount)

  return (
    <Box sx={{ py: { xs: 3, md: 5 }, backgroundColor: '#F8FAFC', minHeight: '80vh' }}>
      <Container maxWidth="xl">
        {/* Header */}
        <Box sx={{ mb: 3.5 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              color: '#0F172A',
              fontSize: { xs: '1.6rem', md: '2.1rem' },
              mb: 0.5,
            }}
          >
            Your Cart
          </Typography>
          <Typography variant="body1" sx={{ color: '#64748B', fontSize: '0.95rem' }}>
            Review your items and proceed to checkout
          </Typography>
        </Box>

        {cart.length === 0 ? (
          <Paper
            elevation={0}
            sx={{
              p: 6,
              textAlign: 'center',
              borderRadius: 3,
              border: '1px dashed #CBD5E1',
              backgroundColor: '#FFFFFF',
            }}
          >
            <ShoppingBagOutlinedIcon sx={{ fontSize: 64, color: '#94A3B8', mb: 2 }} />
            <Typography variant="h6" sx={{ color: '#0F172A', fontWeight: 700, mb: 1 }}>
              Your cart is currently empty
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748B', mb: 3 }}>
              Explore our wide range of premium Diwali crackers and fill your celebration with light!
            </Typography>
            <Button
              variant="contained"
              onClick={onContinueShopping}
              sx={{
                backgroundColor: '#FFA000',
                color: '#0B132B',
                fontWeight: 700,
                px: 3.5,
                py: 1.2,
                borderRadius: 2,
                '&:hover': { backgroundColor: '#FF8F00' },
              }}
            >
              Start Shopping
            </Button>
          </Paper>
        ) : (
          <Grid container spacing={3.5}>
            {/* Left Items Table */}
            <Grid item xs={12} lg={8}>
              <Paper
                elevation={0}
                sx={{
                  borderRadius: 3,
                  border: '1px solid #E2E8F0',
                  overflow: 'hidden',
                  backgroundColor: '#FFFFFF',
                  mb: 3,
                }}
              >
                <TableContainer>
                  <Table sx={{ minWidth: 600 }}>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: '#F8FAFC' }}>
                        <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.85rem' }}>
                          Product
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.85rem' }}>
                          Price
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700, color: '#475569', fontSize: '0.85rem' }}>
                          Quantity
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.85rem' }}>
                          Total
                        </TableCell>
                        <TableCell align="center" sx={{ width: 60 }}></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {cart.map((item) => {
                        const itemTotal = item.product.discountPrice * item.quantity
                        return (
                          <TableRow key={item.product.id} hover>
                            {/* Product Info */}
                            <TableCell>
                              <Stack direction="row" spacing={2} alignItems="center">
                                <Box
                                  component="img"
                                  src={item.product.image}
                                  alt={item.product.name}
                                  sx={{
                                    width: 58,
                                    height: 58,
                                    borderRadius: 2,
                                    objectFit: 'cover',
                                    border: '1px solid #E2E8F0',
                                    flexShrink: 0,
                                  }}
                                />
                                <Box>
                                  <Typography
                                    variant="subtitle2"
                                    sx={{ fontWeight: 700, color: '#0F172A', fontSize: '0.92rem' }}
                                  >
                                    {item.product.name}
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: '#64748B' }}>
                                    {item.product.pieces || 'Standard Box'}
                                  </Typography>
                                </Box>
                              </Stack>
                            </TableCell>

                            {/* Price */}
                            <TableCell sx={{ fontWeight: 600, color: '#0F172A', fontSize: '0.92rem' }}>
                              ₹{item.product.discountPrice}
                            </TableCell>

                            {/* Quantity Controls */}
                            <TableCell align="center">
                              <Box
                                sx={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  backgroundColor: '#F8FAFC',
                                  border: '1px solid #E2E8F0',
                                  borderRadius: 2,
                                  px: 0.5,
                                  py: 0.2,
                                }}
                              >
                                <IconButton
                                  size="small"
                                  onClick={() => onUpdateQuantity(item.product.id, -1)}
                                  disabled={item.quantity <= 1}
                                  sx={{ p: 0.5 }}
                                >
                                  <RemoveIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    px: 1.8,
                                    fontWeight: 700,
                                    fontSize: '0.88rem',
                                    minWidth: 20,
                                    textAlign: 'center',
                                  }}
                                >
                                  {item.quantity}
                                </Typography>
                                <IconButton
                                  size="small"
                                  onClick={() => onUpdateQuantity(item.product.id, 1)}
                                  sx={{ p: 0.5 }}
                                >
                                  <AddIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                              </Box>
                            </TableCell>

                            {/* Line Total */}
                            <TableCell sx={{ fontWeight: 700, color: '#0F172A', fontSize: '0.95rem' }}>
                              ₹{itemTotal}
                            </TableCell>

                            {/* Delete Action */}
                            <TableCell align="center">
                              <IconButton
                                size="small"
                                onClick={() => onRemoveItem(item.product.id)}
                                sx={{
                                  color: '#EF4444',
                                  '&:hover': { backgroundColor: '#FEE2E2' },
                                }}
                              >
                                <DeleteOutlinedIcon sx={{ fontSize: 20 }} />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>

              {/* Continue Shopping Button */}
              <Button
                variant="outlined"
                startIcon={<ArrowBackIcon />}
                onClick={onContinueShopping}
                sx={{
                  borderColor: '#CBD5E1',
                  color: '#475569',
                  fontWeight: 600,
                  borderRadius: 2,
                  px: 2.5,
                  py: 1,
                  '&:hover': {
                    borderColor: '#94A3B8',
                    backgroundColor: '#F1F5F9',
                  },
                }}
              >
                Continue Shopping
              </Button>
            </Grid>

            {/* Right Order Summary Card */}
            <Grid item xs={12} lg={4}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  border: '1px solid #E2E8F0',
                  backgroundColor: '#FFFFFF',
                  position: 'sticky',
                  top: 90,
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 800,
                    color: '#0F172A',
                    mb: 2.5,
                    fontSize: '1.2rem',
                  }}
                >
                  Order Summary
                </Typography>

                <Stack spacing={2} sx={{ mb: 2.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ color: '#64748B' }}>
                      Subtotal ({totalItemsCount} items)
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                      ₹{subtotal.toLocaleString('en-IN')}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ color: '#64748B' }}>
                      Discount
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#16A34A' }}>
                      - ₹{discount}
                    </Typography>
                  </Box>

                </Stack>

                <Divider sx={{ my: 2 }} />

                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    mb: 3,
                  }}
                >
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0F172A' }}>
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

                <Button
                  variant="contained"
                  fullWidth
                  endIcon={<ChevronRightIcon />}
                  onClick={onProceedToPayment}
                  sx={{
                    backgroundColor: '#FFA000',
                    color: '#0B132B',
                    fontWeight: 900,
                    fontSize: '0.92rem',
                    py: 1.1,
                    borderRadius: 2,
                    boxShadow: '0 3px 10px rgba(255, 160, 0, 0.3)',
                    mb: 2.5,
                    textTransform: 'none',
                    '&:hover': {
                      backgroundColor: '#FF8F00',
                    },
                  }}
                >
                  Proceed to Payment →
                </Button>

                {/* Security Tag */}
                <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
                  <LockOutlinedIcon sx={{ fontSize: 16, color: '#64748B' }} />
                  <Typography variant="caption" sx={{ color: '#64748B', fontSize: '0.78rem' }}>
                    Your information is 100% secure and encrypted
                  </Typography>
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        )}
      </Container>
    </Box>
  )
}
