import React from 'react'
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Button,
  IconButton,
  Badge,
  Container,
  useTheme,
  useMediaQuery,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Chip,
} from '@mui/material'
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'
import MenuIcon from '@mui/icons-material/Menu'
import CloseIcon from '@mui/icons-material/Close'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import StorefrontIcon from '@mui/icons-material/Storefront'
import HomeIcon from '@mui/icons-material/Home'
import PhoneIcon from '@mui/icons-material/Phone'
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import { getHealthApi } from '../services/api'

export default function Navbar({
  activePage,
  setActivePage,
  cartCount,
  searchQuery,
  setSearchQuery,
  onOpenBrochure,
  onOpenCart,
  onOpenOrderDetails,
}) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const [apiStatus, setApiStatus] = React.useState('checking')

  React.useEffect(() => {
    let mounted = true
    getHealthApi()
      .then((res) => {
        if (mounted && res && res.status === 'healthy') {
          setApiStatus('live')
        }
      })
      .catch(() => {
        if (mounted) setApiStatus('offline')
      })
    return () => {
      mounted = false
    }
  }, [])

  const handleNavClick = (page) => {
    setActivePage(page)
    setMobileOpen(false)
  }

  const navLinks = [
    { id: 'home', label: 'Home', icon: <HomeIcon fontSize="small" /> },
    {
      id: 'brochure',
      label: 'Brochure',
      icon: <DescriptionOutlinedIcon fontSize="small" />,
      onClick: () => {
        onOpenBrochure()
        setMobileOpen(false)
      },
    },
    { id: 'crackers', label: 'Crackers', icon: <StorefrontIcon fontSize="small" /> },
    {
      id: 'orders',
      label: 'Order Details',
      icon: <ReceiptLongIcon fontSize="small" />,
      onClick: () => {
        if (onOpenOrderDetails) onOpenOrderDetails()
        setMobileOpen(false)
      },
    },
    { id: 'admin', label: 'Admin', icon: <LockOutlinedIcon fontSize="small" /> },
  ]

  return (
    <AppBar
      position="sticky"
      sx={{
        backgroundColor: '#0B132B',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        zIndex: 1100,
      }}
    >
      <Container maxWidth={false} sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
        <Toolbar disableGutters sx={{ minHeight: { xs: 64, md: 72 }, gap: 2 }}>
          {/* Brand Logo */}
          <Box
            onClick={() => handleNavClick('home')}
            sx={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              textDecoration: 'none',
              userSelect: 'none',
              gap: 1.5,
              mr: { xs: 1, md: 4 },
            }}
          >
            <Box
              sx={{
                width: { xs: 36, sm: 42 },
                height: { xs: 36, sm: 42 },
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #FFA000 0%, #FF6F00 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 15px rgba(255, 160, 0, 0.6)',
                flexShrink: 0,
              }}
            >
              <AutoAwesomeIcon sx={{ color: '#0B132B', fontSize: { xs: 20, sm: 26 } }} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography
                  variant="h6"
                  component="div"
                  sx={{
                    fontWeight: 800,
                    fontSize: { xs: '0.95rem', sm: '1.2rem', md: '1.4rem' },
                    letterSpacing: '0.02em',
                    color: '#FFFFFF',
                    lineHeight: 1.1,
                    whiteSpace: 'nowrap',
                  }}
                >
                  Sky Fire Crackers
                </Typography>
                {apiStatus === 'live' ? (
                  <Chip
                    label="LIVE"
                    size="small"
                    sx={{
                      display: { xs: 'none', sm: 'inline-flex' },
                      backgroundColor: 'rgba(34, 197, 94, 0.2)',
                      color: '#4ADE80',
                      border: '1px solid rgba(74, 222, 128, 0.4)',
                      fontWeight: 800,
                      fontSize: '0.62rem',
                      height: 18,
                    }}
                  />
                ) : apiStatus === 'offline' ? (
                  <Chip
                    label="OFFLINE"
                    size="small"
                    sx={{
                      display: { xs: 'none', sm: 'inline-flex' },
                      backgroundColor: 'rgba(239, 68, 68, 0.2)',
                      color: '#F87171',
                      border: '1px solid rgba(248, 113, 113, 0.4)',
                      fontWeight: 800,
                      fontSize: '0.62rem',
                      height: 18,
                    }}
                  />
                ) : null}
              </Box>
              <Typography
                variant="caption"
                sx={{
                  color: '#FFA000',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  fontSize: { xs: '0.58rem', sm: '0.65rem' },
                  display: 'block',
                  whiteSpace: 'nowrap',
                }}
              >
                பட்டாசு கடை • 80% OFF
              </Typography>
            </Box>
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          {/* Order Helpline (Centered) */}
          <Box
            component="a"
            href="tel:9597167401"
            sx={{
              display: { xs: 'none', md: 'flex' },
              alignItems: 'center',
              gap: 1.2,
              textDecoration: 'none',
              px: 2.2,
              py: 0.9,
              borderRadius: '28px',
              backgroundColor: 'rgba(255, 160, 0, 0.15)',
              border: '1.5px solid rgba(255, 160, 0, 0.45)',
              transition: 'all 0.25s ease',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
              '&:hover': {
                backgroundColor: 'rgba(255, 160, 0, 0.25)',
                borderColor: '#FFA000',
                transform: 'translateY(-1px)',
                boxShadow: '0 4px 16px rgba(255, 160, 0, 0.35)',
              },
            }}
          >
            <Box
              sx={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                backgroundColor: '#FFA000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 0 10px rgba(255, 160, 0, 0.5)',
              }}
            >
              <PhoneIcon sx={{ color: '#0B132B', fontSize: 19 }} />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
              <Typography
                variant="body2"
                sx={{
                  color: 'rgba(255, 255, 255, 0.92)',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                }}
              >
                Order Helpline:
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: '#FFA000',
                  fontWeight: 900,
                  fontSize: '1.15rem',
                  letterSpacing: '0.03em',
                }}
              >
                9597167401
              </Typography>
            </Box>
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          {/* Desktop Nav Links (Right) */}
          {!isMobile && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {navLinks.map((link) => {
                const isActive = activePage === link.id
                return (
                  <Button
                    key={link.id}
                    onClick={link.onClick ? link.onClick : () => handleNavClick(link.id)}
                    sx={{
                      color: isActive ? '#FFA000' : 'rgba(255,255,255,0.85)',
                      fontWeight: isActive ? 700 : 500,
                      fontSize: '0.95rem',
                      px: 2,
                      py: 0.8,
                      position: 'relative',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        color: '#FFA000',
                        backgroundColor: 'rgba(255, 160, 0, 0.08)',
                      },
                      ...(isActive && {
                        '&::after': {
                          content: '""',
                          position: 'absolute',
                          bottom: 2,
                          left: '20%',
                          right: '20%',
                          height: '3px',
                          backgroundColor: '#FFA000',
                          borderRadius: '2px',
                        },
                      }),
                    }}
                  >
                    {link.label}
                  </Button>
                )
              })}

              {/* Cart Button */}
              <Button
                onClick={() => (onOpenCart ? onOpenCart() : handleNavClick('cart'))}
                sx={{
                  color: activePage === 'cart' ? '#FFA000' : 'rgba(255,255,255,0.85)',
                  fontWeight: activePage === 'cart' ? 700 : 500,
                  fontSize: '0.95rem',
                  px: 2,
                  py: 0.8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  position: 'relative',
                  '&:hover': {
                    color: '#FFA000',
                    backgroundColor: 'rgba(255, 160, 0, 0.08)',
                  },
                  ...(activePage === 'cart' && {
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      bottom: 2,
                      left: '20%',
                      right: '20%',
                      height: '3px',
                      backgroundColor: '#FFA000',
                      borderRadius: '2px',
                    },
                  }),
                }}
              >
                <span>Cart</span>
                <Badge
                  badgeContent={cartCount}
                  sx={{
                    '& .MuiBadge-badge': {
                      backgroundColor: '#E53935',
                      color: '#FFFFFF',
                      fontWeight: 700,
                      fontSize: '0.75rem',
                    },
                  }}
                >
                  <ShoppingCartIcon sx={{ fontSize: 20 }} />
                </Badge>
              </Button>
            </Box>
          )}

          {/* Mobile menu and cart trigger */}
          {isMobile && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton
                component="a"
                href="tel:9597167401"
                sx={{ color: '#FFA000', p: { xs: 0.8, sm: 1 }, mr: 0.5 }}
                title="Call 9597167401"
              >
                <PhoneIcon sx={{ fontSize: { xs: 20, sm: 22 } }} />
              </IconButton>
              <IconButton
                onClick={() => (onOpenCart ? onOpenCart() : handleNavClick('cart'))}
                sx={{ color: '#FFFFFF', mr: 0.5, p: { xs: 0.8, sm: 1 } }}
              >
                <Badge
                  badgeContent={cartCount}
                  sx={{
                    '& .MuiBadge-badge': {
                      backgroundColor: '#E53935',
                      color: '#FFFFFF',
                      fontSize: '0.7rem',
                      height: 18,
                      minWidth: 18,
                    },
                  }}
                >
                  <ShoppingCartIcon sx={{ fontSize: { xs: 22, sm: 24 } }} />
                </Badge>
              </IconButton>
              <IconButton
                onClick={() => setMobileOpen(true)}
                sx={{ color: '#FFFFFF', p: { xs: 0.8, sm: 1 } }}
              >
                <MenuIcon sx={{ fontSize: { xs: 24, sm: 26 } }} />
              </IconButton>
            </Box>
          )}
        </Toolbar>
      </Container>

      {/* Mobile Drawer */}
      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        sx={{
          zIndex: 1400,
          '& .MuiDrawer-paper': {
            width: 285,
            backgroundColor: '#0B132B !important',
            color: '#FFFFFF !important',
            p: 2.2,
            boxShadow: '-8px 0 35px rgba(0, 0, 0, 0.5)',
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#FFA000' }}>
            SkyFire Crackers
          </Typography>
          <IconButton onClick={() => setMobileOpen(false)} sx={{ color: '#FFFFFF' }}>
            <CloseIcon />
          </IconButton>
        </Box>
        <List>
          {navLinks.map((link) => (
            <ListItem key={link.id} disablePadding sx={{ mb: 1 }}>
              <ListItemButton
                onClick={link.onClick ? link.onClick : () => handleNavClick(link.id)}
                sx={{
                  borderRadius: 2.5,
                  py: 1.2,
                  px: 2,
                  backgroundColor: activePage === link.id ? 'rgba(255, 160, 0, 0.2)' : 'transparent',
                  color: activePage === link.id ? '#FFA000' : '#E2E8F0',
                  border: activePage === link.id ? '1px solid rgba(255, 160, 0, 0.4)' : '1px solid transparent',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 160, 0, 0.15)',
                    color: '#FFA000',
                  },
                }}
              >
                <Box sx={{ mr: 2, display: 'flex', color: activePage === link.id ? '#FFA000' : '#94A3B8' }}>{link.icon}</Box>
                <ListItemText
                  primary={link.label}
                  primaryTypographyProps={{
                    fontWeight: activePage === link.id ? 800 : 600,
                    fontSize: '0.95rem',
                    color: 'inherit',
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
          <ListItem disablePadding sx={{ mb: 1 }}>
            <ListItemButton
              onClick={() => handleNavClick('cart')}
              sx={{
                borderRadius: 2.5,
                py: 1.2,
                px: 2,
                backgroundColor: activePage === 'cart' ? 'rgba(255, 160, 0, 0.2)' : 'transparent',
                color: activePage === 'cart' ? '#FFA000' : '#E2E8F0',
                border: activePage === 'cart' ? '1px solid rgba(255, 160, 0, 0.4)' : '1px solid transparent',
                '&:hover': {
                  backgroundColor: 'rgba(255, 160, 0, 0.15)',
                  color: '#FFA000',
                },
              }}
            >
              <Box sx={{ mr: 2, display: 'flex', color: activePage === 'cart' ? '#FFA000' : '#94A3B8' }}>
                <ShoppingCartIcon fontSize="small" />
              </Box>
              <ListItemText
                primary={`Cart (${cartCount} items)`}
                primaryTypographyProps={{
                  fontWeight: activePage === 'cart' ? 800 : 600,
                  fontSize: '0.95rem',
                  color: 'inherit',
                }}
              />
            </ListItemButton>
          </ListItem>
        </List>

        {/* Mobile Helpline */}
        <Box
          component="a"
          href="tel:9597167401"
          sx={{
            mt: 'auto',
            p: 2,
            borderRadius: 2.5,
            backgroundColor: 'rgba(255, 160, 0, 0.15)',
            border: '1.5px solid rgba(255, 160, 0, 0.4)',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
          }}
        >
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              backgroundColor: '#FFA000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <PhoneIcon sx={{ color: '#0B132B', fontSize: 22 }} />
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.75)', display: 'block', fontSize: '0.78rem', fontWeight: 600 }}>
              Order Helpline
            </Typography>
            <Typography variant="body1" sx={{ color: '#FFA000', fontWeight: 900, fontSize: '1.12rem', letterSpacing: '0.02em' }}>
              9597167401
            </Typography>
          </Box>
        </Box>
      </Drawer>
    </AppBar>
  )
}
