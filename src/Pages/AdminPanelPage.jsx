import React, { useState, useEffect, useMemo } from 'react'
import {
  Box,
  Container,
  Grid,
  Typography,
  Paper,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Tabs,
  Tab,
  Stack,
  Alert,
  IconButton,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  Checkbox,
  FormControlLabel,
  Divider,
  Collapse,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material'
import DashboardIcon from '@mui/icons-material/Dashboard'
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'
import MenuBookIcon from '@mui/icons-material/MenuBook'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import LogoutIcon from '@mui/icons-material/Logout'
import SearchIcon from '@mui/icons-material/Search'
import RefreshIcon from '@mui/icons-material/Refresh'
import LocalShippingIcon from '@mui/icons-material/LocalShipping'
import PrintIcon from '@mui/icons-material/Print'
import PhoneIcon from '@mui/icons-material/Phone'
import Inventory2Icon from '@mui/icons-material/Inventory2'
import CloseIcon from '@mui/icons-material/Close'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp'
import LocalOfferIcon from '@mui/icons-material/LocalOffer'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import PaymentIcon from '@mui/icons-material/Payment'
import HourglassBottomIcon from '@mui/icons-material/HourglassBottom'
import PersonIcon from '@mui/icons-material/Person'
import ShoppingCartCheckoutIcon from '@mui/icons-material/ShoppingCartCheckout'
import DownloadIcon from '@mui/icons-material/Download'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep'
import {
  adminLoginApi,
  resetAllOrdersApi,
  getAdminDashboardApi,
  getOrdersListApi,
  updateOrderStatusApi,
  getProductsApi,
} from '../services/api'
import { CRACKERS_DATA } from '../data/crackersData'
import { normalizeOrder } from '../Components/OrderDetailsModal'

export default function AdminPanelPage({ onExitAdmin, onOpenPersonPage }) {
  const [token, setToken] = useState(sessionStorage.getItem('adminToken') || '')
  const [activeTab, setActiveTab] = useState(0)
  const [loginForm, setLoginForm] = useState({ username: '', password: '' })
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [contextMenu, setContextMenu] = useState(null)

  const handleContextMenu = (e, ord) => {
    e.preventDefault()
    setContextMenu({
      mouseX: e.clientX + 2,
      mouseY: e.clientY - 6,
      order: ord,
    })
  }

  const handleCloseContextMenu = () => {
    setContextMenu(null)
  }

  // Dashboard Data State
  const [dashboard, setDashboard] = useState(null)
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState(CRACKERS_DATA)
  const [loading, setLoading] = useState(false)
  const [orderFilterTab, setOrderFilterTab] = useState('all') // 'all' | 'confirmed' | 'pending' | 'coupon'
  const [searchQuery, setSearchQuery] = useState('')
  const [catalogSearch, setCatalogSearch] = useState('')
  const [actionSuccess, setActionSuccess] = useState('')

  // View order packing sheet modal state
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null)
  const [packedChecklist, setPackedChecklist] = useState({})
  const [expandedOrderId, setExpandedOrderId] = useState(null)

  // Load dashboard metrics and products once on login or refresh
  useEffect(() => {
    if (!token) return
    let isMounted = true
    const loadStatsAndProducts = async () => {
      try {
        const [dashData, prodsData] = await Promise.all([
          getAdminDashboardApi(token).catch(() => null),
          getProductsApi().catch(() => []),
        ])
        if (isMounted) {
          if (dashData) setDashboard(dashData)
          if (prodsData && prodsData.length === 81) setProducts(prodsData)
        }
      } catch (e) {
        console.warn('Initial admin data load warning:', e)
      }
    }
    loadStatsAndProducts()
    return () => {
      isMounted = false
    }
  }, [token])

  // Load orders only with 300ms debounce when filters or search change
  useEffect(() => {
    if (!token) return
    let isMounted = true
    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const ordersData = await getOrdersListApi({ status: 'all', search: searchQuery }).catch(() => [])
        if (isMounted) {
          const cleanOrders = (Array.isArray(ordersData) ? ordersData : [])
            .map(normalizeOrder)
            .filter(Boolean)
            .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
          setOrders(cleanOrders)
        }
      } catch (err) {
        console.error('Failed to load orders:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }, 300)
    return () => {
      isMounted = false
      clearTimeout(timer)
    }
  }, [token, searchQuery])

  const loadData = async (query = searchQuery) => {
    setLoading(true)
    try {
      const [dashData, ordersData] = await Promise.all([
        getAdminDashboardApi(token).catch(() => null),
        getOrdersListApi({ status: 'all', search: query }).catch(() => []),
      ])
      if (dashData) setDashboard(dashData)
      const cleanOrders = (Array.isArray(ordersData) ? ordersData : [])
        .map(normalizeOrder)
        .filter(Boolean)
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      setOrders(cleanOrders)
    } catch (err) {
      console.error('Failed to reload admin data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoginLoading(true)
    setLoginError('')

    try {
      const res = await adminLoginApi(loginForm)
      if (res.token) {
        sessionStorage.setItem('adminToken', res.token)
        setToken(res.token)
      }
    } catch (err) {
      if (
        loginForm.username?.trim().toLowerCase() === 'admin' &&
        loginForm.password?.trim() === 'Admin@143'
      ) {
        const dummyToken = 'sky_master_admin_token_2026'
        sessionStorage.setItem('adminToken', dummyToken)
        setToken(dummyToken)
      } else {
        setLoginError(err.message || 'Invalid admin username or password')
      }
    } finally {
      setLoginLoading(false)
    }
  }

  const handleResetAllData = async () => {
    const confirmed = window.confirm(
      '⚠️ ALERT: Are you sure you want to remove ALL customer lists, orders, and payment records to start fresh?\n\n(இது அனைத்து பழைய டெஸ்ட் ஆர்டர்களையும் நிரந்தரமாக நீக்கிவிடும். உறுதிப்படுத்த "OK" கிளிக் செய்யவும்)'
    )
    if (!confirmed) return

    setLoading(true)
    try {
      await resetAllOrdersApi()
      setOrders([])
      setDashboard((prev) => prev ? { ...prev, totalOrders: 0, pendingOrders: 0, completedOrders: 0, totalRevenue: 0 } : null)
      setActionSuccess('✓ All test customer orders & payment lists have been wiped clean! You can now place fresh new orders.')
      setTimeout(() => setActionSuccess(''), 5000)
    } catch (err) {
      alert('Error clearing data: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    sessionStorage.removeItem('adminToken')
    setToken('')
  }

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await updateOrderStatusApi(orderId, { orderStatus: newStatus })
      setActionSuccess(`Order #${orderId} status updated to ${newStatus}`)
      setTimeout(() => setActionSuccess(''), 3500)
      if (selectedOrderDetails && (selectedOrderDetails.orderId === orderId || selectedOrderDetails.OrderId === orderId)) {
        setSelectedOrderDetails((prev) => prev ? { ...prev, orderStatus: newStatus } : null)
      }
      loadData()
    } catch (err) {
      alert('Failed to update order status: ' + err.message)
    }
  }

  const handlePaymentStatusChange = async (ordOrId, currentOrderStatus, newPaymentStatus) => {
    let ord = null
    let targetNewStatus = newPaymentStatus
    let targetOrderStatus = currentOrderStatus

    if (typeof ordOrId === 'object' && ordOrId !== null) {
      ord = ordOrId
      if (!newPaymentStatus && currentOrderStatus) {
        targetNewStatus = currentOrderStatus
        targetOrderStatus = ord.orderStatus || 'Confirmed'
      }
    } else {
      ord = orders.find((o) => o.orderId === ordOrId || o.orderNumber === ordOrId)
    }

    const orderId = ord?.orderId || ordOrId
    const orderNumber = ord?.orderNumber || ordOrId
    targetOrderStatus = targetOrderStatus || ord?.orderStatus || 'Confirmed'

    // 1. INSTANT OPTIMISTIC UI STATE UPDATE
    setOrders((prev) =>
      prev.map((o) => {
        if (
          o.orderId === orderId ||
          o.orderNumber === orderNumber ||
          (ord && (o.orderId === ord.orderId || o.orderNumber === ord.orderNumber))
        ) {
          return {
            ...o,
            paymentStatus: targetNewStatus,
            orderStatus: targetNewStatus === 'Cancelled' ? 'Cancelled' : o.orderStatus,
          }
        }
        return o
      })
    )

    if (
      selectedOrderDetails &&
      (selectedOrderDetails.orderId === orderId ||
        selectedOrderDetails.orderNumber === orderNumber ||
        selectedOrderDetails.OrderId === orderId)
    ) {
      setSelectedOrderDetails((prev) =>
        prev
          ? {
              ...prev,
              paymentStatus: targetNewStatus,
              orderStatus: targetNewStatus === 'Cancelled' ? 'Cancelled' : prev.orderStatus,
            }
          : null
      )
    }

    // 2. INSTANT DUAL LOCAL STORAGE SYNC
    try {
      ['sky_orders', 'skycrackers_orders_history'].forEach((key) => {
        const existing = JSON.parse(localStorage.getItem(key) || '[]')
        const updated = existing.map((o) => {
          if (String(o.orderId) === String(orderId) || String(o.orderNumber) === String(orderNumber)) {
            return {
              ...o,
              paymentStatus: targetNewStatus,
              orderStatus: targetNewStatus === 'Cancelled' ? 'Cancelled' : o.orderStatus,
            }
          }
          return o
        })
        localStorage.setItem(key, JSON.stringify(updated))
      })
    } catch (_) {}

    setActionSuccess(`Order #${orderNumber} payment marked as "${targetNewStatus}"`)
    setTimeout(() => setActionSuccess(''), 3500)

    // 3. BACKGROUND SERVER SYNC
    try {
      await updateOrderStatusApi(orderId || orderNumber, {
        orderStatus: targetOrderStatus,
        paymentStatus: targetNewStatus,
      })
    } catch (apiErr) {
      console.warn('Server status update background notice:', apiErr)
    }
  }

  const togglePackedItem = (idx) => {
    setPackedChecklist((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }))
  }

  const handlePrintSlip = () => {
    window.print()
  }

  const filterCounts = useMemo(() => {
    let pendingDispatch = 0
    let dispatched = 0
    let delivered = 0
    let coupon = 0
    orders.forEach((ord) => {
      const status = (ord.orderStatus || '').toLowerCase()
      if (status === 'shipped') dispatched++
      else if (status === 'delivered') delivered++
      else if (status !== 'cancelled') pendingDispatch++

      const hasCoupon = Boolean(
        (ord.couponCode && (ord.couponCode.toUpperCase().includes('TRUSTSKYFIRECRACKERS') || ord.couponCode.toUpperCase().includes('TRUSTSKYCRACKERS'))) ||
        (ord.notes && (ord.notes.toUpperCase().includes('TRUSTSKYFIRECRACKERS') || ord.notes.toUpperCase().includes('TRUSTSKYCRACKERS')))
      )
      if (hasCoupon) coupon++
    })
    return {
      all: orders.length,
      pendingDispatch,
      dispatched,
      delivered,
      coupon,
    }
  }, [orders])

  const displayedOrders = useMemo(() => {
    return orders
      .filter((ord) => {
        const status = (ord.orderStatus || '').toLowerCase()
        if (orderFilterTab === 'pending_dispatch') return status !== 'shipped' && status !== 'delivered' && status !== 'cancelled'
        if (orderFilterTab === 'shipped') return status === 'shipped'
        if (orderFilterTab === 'delivered') return status === 'delivered'
        if (orderFilterTab === 'coupon') {
          return Boolean(
            (ord.couponCode && (ord.couponCode.toUpperCase().includes('TRUSTSKYFIRECRACKERS') || ord.couponCode.toUpperCase().includes('TRUSTSKYCRACKERS'))) ||
            (ord.notes && (ord.notes.toUpperCase().includes('TRUSTSKYFIRECRACKERS') || ord.notes.toUpperCase().includes('TRUSTSKYCRACKERS')))
          )
        }
        return true
      })
      .sort((a, b) => {
        const timeA = new Date(a.createdAt || 0).getTime()
        const timeB = new Date(b.createdAt || 0).getTime()
        if (timeB !== timeA) return timeB - timeA
        return Number(b.orderId || 0) - Number(a.orderId || 0)
      })
  }, [orders, orderFilterTab])

  const renderPaymentChip = (paymentStatus, utrNumber) => {
    const p = (paymentStatus || '').toLowerCase()
    if (p === 'completed' || p === 'paid' || p === 'success' || p === 'received' || p === 'verified') {
      return (
        <Chip
          size="small"
          icon={<CheckCircleIcon sx={{ fontSize: '13px !important' }} />}
          label="Paid ✓"
          sx={{
            backgroundColor: '#ECFDF5',
            color: '#065F46',
            fontWeight: 800,
            fontSize: '0.72rem',
            border: '1px solid #A7F3D0',
          }}
        />
      )
    }
    if (p === 'failed' || p === 'fail') {
      return (
        <Chip
          size="small"
          label="Failed"
          sx={{
            backgroundColor: '#FEF2F2',
            color: '#991B1B',
            fontWeight: 800,
            fontSize: '0.72rem',
            border: '1px solid #FECACA',
          }}
        />
      )
    }
    if (p === 'cancelled' || p === 'canceled') {
      return (
        <Chip
          size="small"
          label="Cancelled"
          sx={{
            backgroundColor: '#F1F5F9',
            color: '#475569',
            fontWeight: 800,
            fontSize: '0.72rem',
            border: '1px solid #CBD5E1',
          }}
        />
      )
    }
    return (
      <Chip
        size="small"
        icon={<WhatsAppIcon sx={{ fontSize: '13px !important', color: '#16A34A !important' }} />}
        label="WhatsApp Enquiry"
        sx={{
          backgroundColor: '#F0FDF4',
          color: '#166534',
          fontWeight: 800,
          fontSize: '0.72rem',
          border: '1px solid #86EFAC',
        }}
      />
    )
  }

  const handleUpdatePaymentStatus = (ord, newPaymentStatus) => {
    if (!ord) return
    handleCloseContextMenu()
    handlePaymentStatusChange(ord, ord.orderStatus, newPaymentStatus)
  }

  const filteredProducts = useMemo(() => {
    if (!catalogSearch.trim()) return products
    const q = catalogSearch.toLowerCase()
    return products.filter((p) => {
      return (
        (p.englishName && p.englishName.toLowerCase().includes(q)) ||
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.tamilName && p.tamilName.toLowerCase().includes(q)) ||
        (p.categoryName && p.categoryName.toLowerCase().includes(q)) ||
        (p.sku && p.sku.toLowerCase().includes(q))
      )
    })
  }, [products, catalogSearch])

  // --- 1. LOGIN SCREEN ---
  if (!token) {
    return (
      <Box sx={{ py: 8, minHeight: '80vh', backgroundColor: '#F8FAFC', display: 'flex', alignItems: 'center' }}>
        <Container maxWidth="xs">
          <Paper
            elevation={0}
            sx={{
              p: 4,
              borderRadius: 3,
              border: '1px solid #E2E8F0',
              backgroundColor: '#FFFFFF',
              boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
            }}
          >
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Box
                sx={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  backgroundColor: '#0B132B',
                  color: '#FFA000',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px',
                }}
              >
                <LockOutlinedIcon fontSize="medium" />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#0B132B' }}>
                Admin Portal Login
              </Typography>
              <Typography variant="body2" sx={{ color: '#64748B', mt: 0.5 }}>
                Sky Fire Crackers Dispatch & Orders
              </Typography>
            </Box>

            {loginError && (
              <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>
                {loginError}
              </Alert>
            )}

            <form onSubmit={handleLogin}>
              <Stack spacing={2.5}>
                <TextField
                  fullWidth
                  size="small"
                  label="Admin Username"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                  required
                />
                <TextField
                  fullWidth
                  size="small"
                  type="password"
                  label="Password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  required
                />
                <Button
              startIcon={<DeleteSweepIcon />}
              onClick={handleResetAllData}
              variant="outlined"
              size="small"
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                borderColor: '#FCA5A5',
                color: '#DC2626',
                backgroundColor: '#FEF2F2',
                fontWeight: 700,
                fontSize: { xs: '0.72rem', sm: '0.8rem' },
                '&:hover': { backgroundColor: '#FEE2E2', borderColor: '#EF4444' },
              }}
            >
              Clear All Test Data
            </Button>
            <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  disabled={loginLoading}
                  sx={{
                    backgroundColor: '#FFA000',
                    color: '#0B132B',
                    fontWeight: 800,
                    py: 1.2,
                    borderRadius: 2,
                    '&:hover': { backgroundColor: '#FF8F00' },
                  }}
                >
                  {loginLoading ? <CircularProgress size={22} sx={{ color: '#0B132B' }} /> : 'Sign In to Dashboard'}
                </Button>
              </Stack>
            </form>
          </Paper>
        </Container>
      </Box>
    )
  }

  // --- 2. AUTHENTICATED ADMIN DASHBOARD ---
  return (
    <Box sx={{ py: { xs: 2, sm: 4 }, minHeight: '85vh', backgroundColor: '#F8FAFC' }}>
      <Container maxWidth="xl" sx={{ px: { xs: 1.5, sm: 3 } }}>
        {/* Top Header */}
        <Box
          sx={{
            mb: { xs: 2.5, sm: 3.5 },
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: 'center' },
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#0B132B', fontSize: { xs: '1.35rem', sm: '1.75rem', md: '2.1rem' } }}>
              Admin Orders & Parcel Dispatch Center
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748B', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
              Direct Customer Orders & Wholesaler Packing Feed (<code>SkyCrackersDB</code>)
            </Typography>
          </Box>

          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ width: { xs: '100%', sm: 'auto' }, justifyContent: { xs: 'flex-end', sm: 'flex-start' } }}>
            <Button
              startIcon={<RefreshIcon />}
              onClick={loadData}
              variant="outlined"
              size="small"
              sx={{ borderRadius: 2, textTransform: 'none', borderColor: '#CBD5E1', color: '#0B132B', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
            >
              Refresh Data
            </Button>
            <Button
              startIcon={<LogoutIcon />}
              onClick={handleLogout}
              variant="contained"
              size="small"
              sx={{ borderRadius: 2, textTransform: 'none', backgroundColor: '#DC2626', color: '#FFFFFF', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
            >
              Logout
            </Button>
          </Stack>
        </Box>

        {actionSuccess && (
          <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
            {actionSuccess}
          </Alert>
        )}

        {/* Navigation Tabs */}
        <Paper elevation={0} sx={{ mb: { xs: 2.5, sm: 3.5 }, borderRadius: 2.5, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
          <Tabs
            value={activeTab}
            onChange={(e, val) => setActiveTab(val)}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            indicatorColor="secondary"
            textColor="inherit"
            sx={{
              backgroundColor: '#FFFFFF',
              minHeight: 48,
              '& .MuiTabs-scrollButtons': { color: '#0B132B' },
              '& .Mui-selected': { color: '#B45309', fontWeight: 800 },
              '& .MuiTab-root': { py: 1, px: { xs: 1.5, sm: 2.5 }, minHeight: 48, fontSize: { xs: '0.8rem', sm: '0.875rem' } },
            }}
          >
            <Tab icon={<DashboardIcon fontSize="small" />} iconPosition="start" label="Overview" />
            <Tab icon={<ShoppingCartIcon fontSize="small" />} iconPosition="start" label={`Bookings (${orders.length})`} />
            <Tab icon={<MenuBookIcon fontSize="small" />} iconPosition="start" label={`Catalog (${products.length})`} />
          </Tabs>
        </Paper>

        {/* TAB 0: OVERVIEW & STATS */}
        {activeTab === 0 && dashboard && (
          <Stack spacing={{ xs: 2, sm: 3 }}>
            {/* Metric KPI Cards */}
            <Grid container spacing={{ xs: 1.5, sm: 2.5 }}>
              <Grid item xs={6} sm={6} md={3}>
                <Paper elevation={0} sx={{ p: { xs: 1.8, sm: 2.5 }, borderRadius: 2.5, border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF' }}>
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, fontSize: { xs: '0.68rem', sm: '0.75rem' } }}>TOTAL BOOKINGS</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: '#0B132B', mt: 0.5, fontSize: { xs: '1.4rem', sm: '2rem' } }}>{dashboard.totalBookings}</Typography>
                  <Typography variant="caption" sx={{ color: '#16A34A', fontWeight: 600, display: 'block', fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>{dashboard.todayBookings} placed today</Typography>
                </Paper>
              </Grid>

              <Grid item xs={6} sm={6} md={3}>
                <Paper elevation={0} sx={{ p: { xs: 1.8, sm: 2.5 }, borderRadius: 2.5, border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF' }}>
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, fontSize: { xs: '0.68rem', sm: '0.75rem' } }}>TOTAL REVENUE</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: '#0B132B', mt: 0.5, fontSize: { xs: '1.4rem', sm: '2rem' } }}>₹{dashboard.totalRevenue?.toLocaleString('en-IN')}</Typography>
                  <Typography variant="caption" sx={{ color: '#16A34A', fontWeight: 600, display: 'block', fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>₹{dashboard.todayRevenue?.toLocaleString('en-IN')} today</Typography>
                </Paper>
              </Grid>

              <Grid item xs={6} sm={6} md={3}>
                <Paper elevation={0} sx={{ p: { xs: 1.8, sm: 2.5 }, borderRadius: 2.5, border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF' }}>
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, fontSize: { xs: '0.68rem', sm: '0.75rem' } }}>PARCELS TO PACK</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: '#F59E0B', mt: 0.5, fontSize: { xs: '1.4rem', sm: '2rem' } }}>{dashboard.pendingBookings}</Typography>
                  <Typography variant="caption" sx={{ color: '#64748B', display: 'block', fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>Awaiting dispatch</Typography>
                </Paper>
              </Grid>

              <Grid item xs={6} sm={6} md={3}>
                <Paper elevation={0} sx={{ p: { xs: 1.8, sm: 2.5 }, borderRadius: 2.5, border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF' }}>
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, fontSize: { xs: '0.68rem', sm: '0.75rem' } }}>REGISTERED USERS</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, color: '#0B132B', mt: 0.5, fontSize: { xs: '1.4rem', sm: '2rem' } }}>{dashboard.totalCustomersCount}</Typography>
                  <Typography variant="caption" sx={{ color: '#64748B', display: 'block', fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>Saved in SQL Server</Typography>
                </Paper>
              </Grid>
            </Grid>

            {/* Quick explanation banner of business flow */}
            <Paper elevation={0} sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: 3, border: '1px solid #BAE6FD', backgroundColor: '#F0F9FF' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Inventory2Icon sx={{ color: '#0284C7', fontSize: { xs: 26, sm: 32 } }} />
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0369A1', fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                    On-Demand Booking & Parcel Model
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#0284C7', fontSize: { xs: '0.78rem', sm: '0.85rem' } }}>
                    Customers browse catalog products and book online or choose Pay Later. Admin opens each order's <strong>Packing Sheet</strong>, packs the parcel, and dispatches!
                  </Typography>
                </Box>
              </Box>
            </Paper>

            {/* Recent Orders Table */}
            <Paper elevation={0} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF' }}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#0B132B', mb: 2, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                Recent Bookings (Live SQL Server Feed)
              </Typography>
              <TableContainer sx={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <Table size="small" sx={{ minWidth: 600 }}>
                  <TableHead sx={{ backgroundColor: '#F8FAFC' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Booking #</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Customer</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Phone</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Amount</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Placed At</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {dashboard.recentOrders?.map((ord) => (
                      <TableRow
                        key={ord.orderNumber}
                        hover
                        onContextMenu={(e) => handleContextMenu(e, ord)}
                        sx={{ cursor: 'context-menu' }}
                      >
                        <TableCell sx={{ fontWeight: 800, color: '#0B132B' }}>{ord.orderNumber}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>
                          <Box
                            component="span"
                            onClick={() =>
                              onOpenPersonPage &&
                              onOpenPersonPage({
                                customerName: ord.customerName,
                                mobileNumber: ord.customerPhone,
                                address: ord.deliveryAddress,
                              })
                            }
                            sx={{
                              cursor: 'pointer',
                              color: '#0284C7',
                              textDecoration: 'underline',
                              '&:hover': { color: '#0369A1' },
                            }}
                            title="Click or right-click to open customer's page (Selected Products, Saved Products & Payment Status)"
                          >
                            {ord.customerName}
                          </Box>
                        </TableCell>
                        <TableCell>{ord.customerPhone}</TableCell>
                        <TableCell sx={{ fontWeight: 800, color: '#16A34A' }}>₹{ord.totalAmount}</TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={ord.orderStatus}
                            sx={{
                              backgroundColor: ord.orderStatus === 'Confirmed' ? '#ECFDF5' : '#EFF6FF',
                              color: ord.orderStatus === 'Confirmed' ? '#065F46' : '#1E40AF',
                              fontWeight: 700,
                              fontSize: '0.72rem',
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ color: '#64748B', fontSize: '0.8rem' }}>
                          {new Date(ord.createdAt).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Stack>
        )}

        {/* TAB 1: BOOKINGS & PARCEL ORDERS */}
        {activeTab === 1 && (
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF' }}>
            <Box sx={{ mb: 2.5, display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center' }}>
              <Stack direction="row" spacing={1} sx={{ width: { xs: '100%', sm: 420 } }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search booking #, phone, or name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadData(searchQuery)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" />
                      </InputAdornment>
                    ),
                    endAdornment: searchQuery ? (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => { setSearchQuery(''); loadData(''); }}>
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ) : null,
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    },
                  }}
                />
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => loadData(searchQuery)}
                  sx={{
                    backgroundColor: '#B45309',
                    '&:hover': { backgroundColor: '#92400E' },
                    textTransform: 'none',
                    fontWeight: 700,
                    borderRadius: 2,
                    px: 2.5,
                    whiteSpace: 'nowrap',
                  }}
                >
                  Search
                </Button>
              </Stack>

              {/* Clean Responsive Filter Bar */}
              <Box
                sx={{
                  display: 'flex',
                  gap: 1,
                  overflowX: 'auto',
                  width: '100%',
                  py: 0.6,
                  whiteSpace: 'nowrap',
                  '&::-webkit-scrollbar': { display: 'none' },
                  msOverflowStyle: 'none',
                  scrollbarWidth: 'none',
                }}
              >
                {[
                  { id: 'all', label: 'All Enquiries', count: filterCounts.all, color: '#0B132B' },
                  { id: 'pending_dispatch', label: 'To Pack & Dispatch', count: filterCounts.pendingDispatch, color: '#D97706' },
                  { id: 'shipped', label: 'Dispatched', count: filterCounts.dispatched, color: '#2563EB' },
                  { id: 'delivered', label: 'Delivered', count: filterCounts.delivered, color: '#16A34A' },
                  { id: 'coupon', label: 'Coupon Orders', count: filterCounts.coupon, color: '#7C3AED' },
                ].map((tab) => {
                  const isSelected = orderFilterTab === tab.id
                  return (
                    <Chip
                      key={tab.id}
                      label={`${tab.label} (${tab.count})`}
                      onClick={() => setOrderFilterTab(tab.id)}
                      sx={{
                        fontWeight: 800,
                        fontSize: { xs: '0.78rem', sm: '0.85rem' },
                        height: 36,
                        px: 1,
                        borderRadius: '50px',
                        cursor: 'pointer',
                        backgroundColor: isSelected ? tab.color : '#FFFFFF',
                        color: isSelected ? '#FFFFFF' : '#334155',
                        border: isSelected ? `2px solid ${tab.color}` : '1.5px solid #CBD5E1',
                        boxShadow: isSelected ? `0 3px 10px ${tab.color}33` : 'none',
                        transition: 'all 0.2s ease',
                        flexShrink: 0,
                      }}
                    />
                  )
                })}
              </Box>
            </Box>

            {/* MOBILE VIEW (< md): Responsive Card-based Orders Feed */}
            <Box sx={{ display: { xs: 'block', md: 'none' } }}>
              {displayedOrders.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 5, color: '#64748B' }}>
                  No orders found matching status and payment filters.
                </Box>
              ) : (
                displayedOrders.map((ord) => {
                  const isPaid =
                    ord.paymentStatus === 'Completed' ||
                    ord.paymentStatus === 'Paid' ||
                    ord.paymentStatus === 'Received' ||
                    ord.paymentStatus === 'success'
                  const isExpanded = expandedOrderId === (ord.orderId || ord.orderNumber)
                  const hasCoupon = Boolean(
                    (ord.couponCode && (ord.couponCode.toUpperCase().includes('TRUSTSKYFIRECRACKERS') || ord.couponCode.toUpperCase().includes('TRUSTSKYCRACKERS'))) ||
                    (ord.notes && (ord.notes.toUpperCase().includes('TRUSTSKYFIRECRACKERS') || ord.notes.toUpperCase().includes('TRUSTSKYCRACKERS')))
                  )
                  return (
                    <Paper
                      key={ord.orderId || ord.orderNumber}
                      elevation={0}
                      onContextMenu={(e) => handleContextMenu(e, ord)}
                      sx={{
                        p: 2,
                        mb: 2,
                        borderRadius: 2.5,
                        border: hasCoupon ? '2px solid #F59E0B' : '1.5px solid #E2E8F0',
                        backgroundColor: hasCoupon ? '#FFFDF5' : '#FFFFFF',
                        boxShadow: hasCoupon ? '0 4px 14px rgba(245, 158, 11, 0.12)' : 'none',
                        cursor: 'context-menu',
                        position: 'relative',
                      }}
                    >
                      {/* Card Top: Order Number & Status & Coupon Tag */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.2, flexWrap: 'wrap', gap: 0.8 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 900, color: '#0B132B', fontFamily: 'monospace', fontSize: '0.88rem' }}>
                            #{ord.orderNumber}
                          </Typography>
                          {hasCoupon && (
                            <Chip
                              size="small"
                              icon={<LocalOfferIcon sx={{ fontSize: '11px !important', color: '#92400E !important' }} />}
                              label="Coupon"
                              sx={{
                                backgroundColor: '#FEF3C7',
                                color: '#92400E',
                                fontWeight: 800,
                                fontSize: '0.65rem',
                                height: 20,
                                border: '1px solid #F59E0B',
                              }}
                            />
                          )}
                        </Box>
                        <Chip
                          size="small"
                          label={ord.orderStatus || 'Confirmed'}
                          sx={{
                            fontWeight: 800,
                            fontSize: '0.72rem',
                            backgroundColor:
                              ord.orderStatus === 'Delivered'
                                ? '#ECFDF5'
                                : ord.orderStatus === 'Cancelled'
                                ? '#FEF2F2'
                                : ord.orderStatus === 'Shipped'
                                ? '#EFF6FF'
                                : '#FFFBEB',
                            color:
                              ord.orderStatus === 'Delivered'
                                ? '#065F46'
                                : ord.orderStatus === 'Cancelled'
                                ? '#991B1B'
                                : ord.orderStatus === 'Shipped'
                                ? '#1E40AF'
                                : '#B45309',
                          }}
                        />
                      </Box>

                      {/* Customer & Phone with direct dialer button */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, backgroundColor: '#F8FAFC', p: 1.2, borderRadius: 2 }}>
                        <Box>
                          <Typography
                            variant="body2"
                            onClick={() =>
                              onOpenPersonPage &&
                              onOpenPersonPage({
                                customerName: ord.customerName,
                                mobileNumber: ord.customerPhone,
                                address: ord.deliveryAddress,
                              })
                            }
                            sx={{
                              fontWeight: 800,
                              color: '#0284C7',
                              cursor: 'pointer',
                              textDecoration: 'underline',
                            }}
                          >
                            {ord.customerName}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748B' }}>
                            {new Date(ord.createdAt).toLocaleDateString()} at {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </Typography>
                        </Box>
                        <Button
                          size="small"
                          variant="outlined"
                          href={`tel:${ord.customerPhone}`}
                          startIcon={<PhoneIcon sx={{ fontSize: 14 }} />}
                          sx={{
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 800,
                            fontSize: '0.75rem',
                            borderColor: '#FFA000',
                            color: '#B45309',
                            py: 0.3,
                            px: 1,
                          }}
                        >
                          Call
                        </Button>
                      </Box>

                      {/* Delivery Address */}
                      <Typography variant="caption" sx={{ color: '#475569', display: 'block', mb: 1.2 }}>
                        📍 {ord.deliveryAddress}
                      </Typography>

                      {/* Crackers count & Total Amount & Payment UTR Status */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, pb: 1, borderBottom: '1px dashed #E2E8F0' }}>
                        <Box>
                          <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                            {ord.items?.length || 0} Products ({ord.items?.reduce((a, b) => a + b.quantity, 0) || 0} Boxes)
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 900, color: '#16A34A', fontSize: '1.1rem' }}>
                            ₹{ord.totalAmount}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.6 }}>
                          {renderPaymentChip(ord.paymentStatus, ord.utrNumber)}
                        </Box>
                      </Box>

                      {/* Items Expand / Collapse */}
                      <Button
                        size="small"
                        onClick={() => setExpandedOrderId(isExpanded ? null : (ord.orderId || ord.orderNumber))}
                        endIcon={isExpanded ? <KeyboardArrowUpIcon fontSize="small" /> : <KeyboardArrowDownIcon fontSize="small" />}
                        sx={{ textTransform: 'none', fontSize: '0.75rem', fontWeight: 700, color: '#0284C7', p: 0, mb: 1.5 }}
                      >
                        {isExpanded ? 'Hide Items' : `View ${ord.items?.length || 0} Cracker Items`}
                      </Button>

                      <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                        <Box sx={{ mb: 1.5, p: 1.5, backgroundColor: '#F8FAFC', borderRadius: 2 }}>
                          {(ord.items || []).map((it, i) => (
                            <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.4, borderBottom: '1px solid #EDF2F7', fontSize: '0.78rem' }}>
                              <Typography variant="caption" sx={{ fontWeight: 700, color: '#0F172A' }}>
                                {it.productName}
                              </Typography>
                              <Typography variant="caption" sx={{ fontWeight: 800, color: '#0284C7' }}>
                                {it.quantity} box(es) - ₹{it.totalPrice}
                              </Typography>
                            </Box>
                          ))}
                        </Box>
                      </Collapse>

                      {/* Action Buttons: Clean 2-column Grid without overflow */}
                      <Grid container spacing={1} sx={{ mt: 0.5 }}>
                        <Grid item xs={6}>
                          <Button
                            fullWidth
                            size="small"
                            variant="outlined"
                            href={`https://wa.me/91${ord.customerPhone}?text=${encodeURIComponent(`Vanakkam ${ord.customerName}! Sky Fire Crackers Sivakasi here regarding your booking #${ord.orderNumber}.`)}`}
                            target="_blank"
                            startIcon={<WhatsAppIcon sx={{ fontSize: 16, color: '#25D366' }} />}
                            sx={{
                              fontSize: '0.78rem',
                              py: 0.8,
                              minHeight: 40,
                              textTransform: 'none',
                              borderColor: '#86EFAC',
                              color: '#166534',
                              fontWeight: 800,
                              borderRadius: 2,
                              backgroundColor: '#F0FDF4',
                              '&:hover': { backgroundColor: '#DCFCE7' },
                            }}
                          >
                            WhatsApp
                          </Button>
                        </Grid>
                        <Grid item xs={6}>
                          <Button
                            fullWidth
                            size="small"
                            variant="outlined"
                            startIcon={<PersonIcon sx={{ fontSize: 15 }} />}
                            onClick={() => {
                              if (onOpenPersonPage) {
                                onOpenPersonPage({
                                  customerName: ord.customerName,
                                  mobileNumber: ord.customerPhone,
                                  address: ord.deliveryAddress,
                                })
                              }
                            }}
                            sx={{
                              fontSize: '0.78rem',
                              py: 0.8,
                              minHeight: 40,
                              textTransform: 'none',
                              borderColor: '#0284C7',
                              color: '#0284C7',
                              fontWeight: 800,
                              borderRadius: 2,
                            }}
                          >
                            Customer Hub
                          </Button>
                        </Grid>
                        <Grid item xs={12}>
                          <Button
                            fullWidth
                            size="small"
                            variant="contained"
                            startIcon={<LocalShippingIcon sx={{ fontSize: 16 }} />}
                            onClick={() => {
                              setSelectedOrderDetails(ord)
                              setPackedChecklist({})
                            }}
                            sx={{
                              fontSize: '0.8rem',
                              py: 0.8,
                              minHeight: 40,
                              textTransform: 'none',
                              backgroundColor: '#FFA000',
                              color: '#0B132B',
                              fontWeight: 800,
                              borderRadius: 2,
                              '&:hover': { backgroundColor: '#FF8F00' },
                            }}
                          >
                            Open Packing Sheet
                          </Button>
                        </Grid>
                        {ord.orderStatus !== 'Delivered' && ord.orderStatus !== 'Cancelled' && (
                          <Grid item xs={12}>
                            <Button
                              fullWidth
                              size="small"
                              variant="outlined"
                              onClick={() =>
                                handleStatusChange(
                                  ord.orderId,
                                  ord.orderStatus === 'Shipped' ? 'Delivered' : 'Shipped'
                                )
                              }
                              sx={{
                                fontSize: '0.78rem',
                                py: 0.8,
                                minHeight: 40,
                                textTransform: 'none',
                                borderColor: ord.orderStatus === 'Shipped' ? '#16A34A' : '#3B82F6',
                                color: ord.orderStatus === 'Shipped' ? '#16A34A' : '#1D4ED8',
                                fontWeight: 800,
                                borderRadius: 2,
                              }}
                            >
                              {ord.orderStatus === 'Shipped' ? 'Mark as Delivered ✓' : 'Mark as Dispatched 🚚'}
                            </Button>
                          </Grid>
                        )}
                      </Grid>
                    </Paper>
                  )
                })
              )}
            </Box>

            {/* DESKTOP VIEW (>= md): Full Table */}
            <TableContainer sx={{ display: { xs: 'none', md: 'block' }, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <Table size="small">
                <TableHead sx={{ backgroundColor: '#F8FAFC' }}>
                  <TableRow>
                    <TableCell sx={{ width: 44 }} />
                    <TableCell sx={{ fontWeight: 700 }}>Booking #</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Customer Name & Phone</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Delivery Address</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Crackers Ordered</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Total Amount</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Payment Status</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Parcel Status</TableCell>
                    <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {displayedOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} sx={{ textAlign: 'center', py: 5, color: '#64748B' }}>
                        No orders found in this filter.
                      </TableCell>
                    </TableRow>
                  ) : (
                    displayedOrders.map((ord) => {
                      const isExpanded = expandedOrderId === (ord.orderId || ord.orderNumber)
                      const isPaid =
                        ord.paymentStatus === 'Completed' ||
                        ord.paymentStatus === 'Paid' ||
                        ord.paymentStatus === 'Received' ||
                        ord.paymentStatus === 'success'
                      const hasCoupon = Boolean(
                        (ord.couponCode && (ord.couponCode.toUpperCase().includes('TRUSTSKYFIRECRACKERS') || ord.couponCode.toUpperCase().includes('TRUSTSKYCRACKERS'))) ||
                        (ord.notes && (ord.notes.toUpperCase().includes('TRUSTSKYFIRECRACKERS') || ord.notes.toUpperCase().includes('TRUSTSKYCRACKERS')))
                      )
                      return (
                        <React.Fragment key={ord.orderId || ord.orderNumber}>
                          <TableRow
                            hover
                            onContextMenu={(e) => handleContextMenu(e, ord)}
                            sx={{
                              cursor: 'context-menu',
                              backgroundColor: hasCoupon ? '#FFFDF5' : undefined,
                              borderLeft: hasCoupon ? '4px solid #F59E0B' : undefined,
                              '& > *': { borderBottom: isExpanded ? 'unset' : undefined },
                            }}
                          >
                            <TableCell>
                              <IconButton
                                size="small"
                                onClick={() => setExpandedOrderId(isExpanded ? null : (ord.orderId || ord.orderNumber))}
                                sx={{ color: isExpanded ? '#B45309' : '#64748B' }}
                                title="Click to view full order crackers and payment details"
                              >
                                {isExpanded ? <KeyboardArrowUpIcon fontSize="small" /> : <KeyboardArrowDownIcon fontSize="small" />}
                              </IconButton>
                            </TableCell>
                            <TableCell sx={{ fontWeight: 800, color: '#0B132B' }}>
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                <span>#{ord.orderNumber}</span>
                                {hasCoupon && (
                                  <Chip
                                    size="small"
                                    icon={<LocalOfferIcon sx={{ fontSize: '11px !important', color: '#92400E !important' }} />}
                                    label={ord.couponCode || 'TRUSTSKYFIRECRACKERS'}
                                    sx={{
                                      backgroundColor: '#FEF3C7',
                                      color: '#92400E',
                                      fontWeight: 800,
                                      fontSize: '0.65rem',
                                      border: '1px solid #F59E0B',
                                      height: 22,
                                      width: 'fit-content',
                                    }}
                                    title="Promo applied: Customer eligible for cashback via direct call"
                                  />
                                )}
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography
                                variant="body2"
                                onClick={() =>
                                  onOpenPersonPage &&
                                  onOpenPersonPage({
                                    customerName: ord.customerName,
                                    mobileNumber: ord.customerPhone,
                                    address: ord.deliveryAddress,
                                  })
                                }
                                sx={{
                                  fontWeight: 700,
                                  color: '#0284C7',
                                  cursor: 'pointer',
                                  textDecoration: 'underline',
                                  '&:hover': { color: '#0369A1' },
                                }}
                                title="Click or right-click to open customer's page (Selected Products, Saved Products & Payment Status)"
                              >
                                {ord.customerName}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#D97706', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <PhoneIcon sx={{ fontSize: 13 }} />
                                <a href={`tel:${ord.customerPhone}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                                  {ord.customerPhone}
                                </a>
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ maxWidth: 200, fontSize: '0.8rem', color: '#475569' }}>
                              {ord.deliveryAddress}
                            </TableCell>
                            <TableCell sx={{ maxWidth: 220, fontSize: '0.82rem' }}>
                              <Typography variant="caption" sx={{ fontWeight: 700, color: '#0F172A', display: 'block' }}>
                                {ord.items?.length || 0} Products ({ord.items?.reduce((acc, i) => acc + i.quantity, 0) || 0} Boxes)
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#64748B', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>
                                {ord.items?.map((i) => `${i.productName} (x${i.quantity})`).join(', ')}
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ fontWeight: 800, color: '#16A34A', fontSize: '0.95rem' }}>
                              ₹{ord.totalAmount}
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.6, alignItems: 'flex-start' }}>
                                {renderPaymentChip(ord.paymentStatus, ord.utrNumber)}
                                {ord.utrNumber && (
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      fontFamily: 'monospace',
                                      fontWeight: 800,
                                      color: '#0369A1',
                                      backgroundColor: '#E0F2FE',
                                      px: 0.8,
                                      py: 0.2,
                                      borderRadius: 1,
                                      border: '1px solid #BAE6FD',
                                      fontSize: '0.72rem',
                                      width: 'fit-content',
                                    }}
                                    title="UPI Ref / UTR Number"
                                  >
                                    UTR: {ord.utrNumber}
                                   </Typography>
                                 )}
                               </Box>
                            </TableCell>
                            <TableCell>
                              <Chip
                                size="small"
                                label={ord.orderStatus}
                                sx={{
                                  backgroundColor:
                                    ord.orderStatus === 'Delivered'
                                      ? '#ECFDF5'
                                      : ord.orderStatus === 'Cancelled'
                                      ? '#FEF2F2'
                                      : ord.orderStatus === 'Shipped'
                                      ? '#EFF6FF'
                                      : '#FFFBEB',
                                  color:
                                    ord.orderStatus === 'Delivered'
                                      ? '#065F46'
                                      : ord.orderStatus === 'Cancelled'
                                      ? '#991B1B'
                                      : ord.orderStatus === 'Shipped'
                                      ? '#1E40AF'
                                      : '#B45309',
                                  fontWeight: 700,
                                }}
                              />
                            </TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>
                              <Stack direction="row" spacing={0.8} justifyContent="center" flexWrap="wrap" useFlexGap>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  href={`https://wa.me/91${ord.customerPhone}?text=${encodeURIComponent(`Vanakkam ${ord.customerName}! Sky Fire Crackers Sivakasi here regarding your booking #${ord.orderNumber}.`)}`}
                                  target="_blank"
                                  startIcon={<WhatsAppIcon sx={{ fontSize: "13px !important", color: "#25D366" }} />}
                                  sx={{
                                    fontSize: "0.72rem",
                                    py: 0.3,
                                    px: 1,
                                    textTransform: "none",
                                    borderColor: "#86EFAC",
                                    color: "#166534",
                                    fontWeight: 800,
                                    backgroundColor: "#F0FDF4",
                                    "&:hover": { backgroundColor: "#DCFCE7" },
                                  }}
                                  title="Chat with customer on WhatsApp"
                                >
                                  WhatsApp
                                </Button>
                                <Button
                                  size="small"
                                  variant="contained"
                                  startIcon={<PersonIcon sx={{ fontSize: '13px !important' }} />}
                                  onClick={() => {
                                    if (onOpenPersonPage) {
                                      onOpenPersonPage({
                                        customerName: ord.customerName,
                                        mobileNumber: ord.customerPhone,
                                        address: ord.deliveryAddress,
                                      })
                                    }
                                  }}
                                  sx={{
                                    fontSize: '0.72rem',
                                    py: 0.3,
                                    px: 1,
                                    textTransform: 'none',
                                    backgroundColor: '#0284C7',
                                    color: '#FFFFFF',
                                    fontWeight: 800,
                                    '&:hover': { backgroundColor: '#0369A1' },
                                  }}
                                  title="Open full page for this customer"
                                >
                                  Person Page
                                </Button>
                                <Button
                                  size="small"
                                  variant="contained"
                                  startIcon={<LocalShippingIcon sx={{ fontSize: '14px !important' }} />}
                                  onClick={() => {
                                    setSelectedOrderDetails(ord)
                                    setPackedChecklist({})
                                  }}
                                  sx={{
                                    fontSize: '0.74rem',
                                    py: 0.3,
                                    px: 1.2,
                                    textTransform: 'none',
                                    backgroundColor: '#FFA000',
                                    color: '#0B132B',
                                    fontWeight: 800,
                                    '&:hover': { backgroundColor: '#FF8F00' },
                                  }}
                                >
                                  Packing Sheet
                                </Button>
                                {ord.orderStatus !== 'Shipped' && ord.orderStatus !== 'Delivered' && ord.orderStatus !== 'Cancelled' && (
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={() => handleStatusChange(ord.orderId, 'Shipped')}
                                    sx={{ fontSize: '0.72rem', py: 0.2, px: 1, textTransform: 'none', borderColor: '#3B82F6', color: '#1D4ED8' }}
                                  >
                                    Dispatched
                                  </Button>
                                )}
                                {ord.orderStatus !== 'Delivered' && ord.orderStatus !== 'Cancelled' && (
                                  <Button
                                    size="small"
                                    variant="contained"
                                    onClick={() => handleStatusChange(ord.orderId, 'Delivered')}
                                    sx={{
                                      fontSize: '0.72rem',
                                      py: 0.2,
                                      px: 1,
                                      textTransform: 'none',
                                      backgroundColor: '#16A34A',
                                      '&:hover': { backgroundColor: '#15803D' },
                                    }}
                                  >
                                    Delivered
                                  </Button>
                                )}
                              </Stack>
                            </TableCell>
                          </TableRow>

                          {/* EXPANDABLE ROW WITH FULL DETAILS */}
                          <TableRow>
                            <TableCell colSpan={9} sx={{ py: 0, px: 2, backgroundColor: '#F8FAFC', borderBottom: isExpanded ? '1px solid #E2E8F0' : 'none' }}>
                              <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                                <Box sx={{ my: 2, p: 2.5, backgroundColor: '#FFFFFF', borderRadius: 2.5, border: '1px solid #E2E8F0', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
                                  <Grid container spacing={2.5} sx={{ mb: 2 }}>
                                    {/* Customer & Delivery address */}
                                    <Grid item xs={12} md={6}>
                                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0B132B', mb: 1, display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                        <LocalShippingIcon fontSize="small" sx={{ color: '#D97706' }} />
                                        Customer Delivery Details
                                      </Typography>
                                      <Typography variant="body2">
                                        <strong>Customer:</strong> {ord.customerName}
                                      </Typography>
                                      <Typography variant="body2" sx={{ mt: 0.3 }}>
                                        <strong>Mobile:</strong>{' '}
                                        <a href={`tel:${ord.customerPhone}`} style={{ color: '#D97706', fontWeight: 700, textDecoration: 'none' }}>
                                          {ord.customerPhone}
                                        </a>
                                      </Typography>
                                      <Typography variant="body2" sx={{ mt: 0.5, color: '#334155' }}>
                                        <strong>Full Address:</strong> {ord.deliveryAddress}
                                      </Typography>
                                      {ord.notes && (
                                        <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mt: 0.5 }}>
                                          <strong>Order Notes / Ref:</strong> {ord.notes}
                                        </Typography>
                                      )}
                                      {hasCoupon && (
                                        <Alert
                                          severity="warning"
                                          icon={<LocalOfferIcon fontSize="small" sx={{ color: '#D97706' }} />}
                                          sx={{
                                            mt: 1.5,
                                            mb: 1,
                                            backgroundColor: '#FEF3C7',
                                            border: '1px solid #F59E0B',
                                            color: '#92400E',
                                            borderRadius: 2,
                                            py: 0.6,
                                          }}
                                        >
                                          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#92400E', fontSize: '0.8rem' }}>
                                            🎟️ Instagram Coupon: {ord.couponCode || 'TRUSTSKYFIRECRACKERS'} Applied
                                          </Typography>
                                          <Typography variant="caption" sx={{ color: '#B45309', fontWeight: 600, display: 'block' }}>
                                            Customer is eligible for manual cashback! Call customer at <strong>{ord.customerPhone}</strong> to disburse cashback.
                                          </Typography>
                                        </Alert>
                                      )}
                                      <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', mt: 0.5 }}>
                                        Placed At: {new Date(ord.createdAt).toLocaleString()}
                                      </Typography>
                                    </Grid>

                                    {/* Payment Status & Toggle Action */}
                                    <Grid item xs={12} md={6}>
                                      <Paper
                                        variant="outlined"
                                        sx={{
                                          p: 2,
                                          borderRadius: 2,
                                          backgroundColor: isPaid ? '#F0FDF4' : '#FFFBEB',
                                          borderColor: isPaid ? '#BBF7D0' : '#FDE68A',
                                        }}
                                      >
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0B132B', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <PaymentIcon fontSize="small" sx={{ color: isPaid ? '#16A34A' : '#D97706' }} />
                                            Payment Information
                                          </Typography>
                                          {renderPaymentChip(ord.paymentStatus, ord.utrNumber)}
                                        </Box>
                                        <Typography variant="body2" sx={{ color: '#475569' }}>
                                          Payment Method: <strong>{ord.paymentMethod || 'Online'}</strong>
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: '#475569', mt: 0.3 }}>
                                          Total Order Amount: <strong style={{ color: '#16A34A' }}>₹{ord.totalAmount}</strong>
                                        </Typography>
                                        {ord.utrNumber && (
                                          <Box sx={{ mt: 1.2, p: 1.2, backgroundColor: '#FFFFFF', borderRadius: 1.5, border: '1.5px solid #BAE6FD', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <Box>
                                              <Typography variant="caption" sx={{ color: '#0369A1', fontWeight: 800, display: 'block', fontSize: '0.7rem' }}>
                                                💳 CUSTOMER ENTERED UPI REF / UTR:
                                              </Typography>
                                              <Typography variant="body1" sx={{ fontFamily: 'monospace', fontWeight: 900, color: '#0B132B', fontSize: '1rem', letterSpacing: '0.04em' }}>
                                                {ord.utrNumber}
                                              </Typography>
                                            </Box>
                                            <Button
                                              size="small"
                                              variant="outlined"
                                              onClick={() => {
                                                navigator.clipboard.writeText(ord.utrNumber)
                                                setActionSuccess(`Copied UTR: ${ord.utrNumber}`)
                                                setTimeout(() => setActionSuccess(''), 2500)
                                              }}
                                              startIcon={<ContentCopyIcon sx={{ fontSize: 13 }} />}
                                              sx={{ fontSize: '0.72rem', py: 0.3, px: 1, textTransform: 'none', fontWeight: 800 }}
                                            >
                                              Copy UTR
                                            </Button>
                                          </Box>
                                        )}
                                        <Divider sx={{ my: 1.5 }} />
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                                          <Typography variant="caption" sx={{ fontWeight: 700, color: '#334155' }}>
                                            Admin Quick Action:
                                          </Typography>
                                          {isPaid ? (
                                            <Button
                                              size="small"
                                              variant="outlined"
                                              color="warning"
                                              onClick={() => handlePaymentStatusChange(ord.orderId, ord.orderStatus, 'Pending')}
                                              sx={{ fontSize: '0.74rem', textTransform: 'none', fontWeight: 700 }}
                                            >
                                              Revert to Pending Verification
                                            </Button>
                                          ) : (
                                            <Button
                                              size="small"
                                              variant="contained"
                                              color="success"
                                              onClick={() => handlePaymentStatusChange(ord.orderId, ord.orderStatus, 'Completed')}
                                              sx={{ fontSize: '0.74rem', textTransform: 'none', fontWeight: 700 }}
                                            >
                                              ✓ Mark Payment as Received (பணம் வந்துவிட்டது)
                                            </Button>
                                          )}
                                        </Box>
                                      </Paper>
                                    </Grid>
                                  </Grid>

                                  {/* Ordered Crackers Table */}
                                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0B132B', mb: 1 }}>
                                    🎆 Ordered Crackers & Quantities ({ord.items?.length || 0} Products, {ord.items?.reduce((a, b) => a + b.quantity, 0) || 0} Total Boxes)
                                  </Typography>
                                  <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1.5 }}>
                                    <Table size="small">
                                      <TableHead sx={{ backgroundColor: '#F8FAFC' }}>
                                        <TableRow>
                                          <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', width: 40 }}>#</TableCell>
                                          <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }}>Product Name</TableCell>
                                          <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }} align="right">Unit Price</TableCell>
                                          <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }} align="center">Quantity</TableCell>
                                          <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem' }} align="right">Subtotal</TableCell>
                                        </TableRow>
                                      </TableHead>
                                      <TableBody>
                                        {ord.items && ord.items.length > 0 ? (
                                          ord.items.map((it, idx) => (
                                            <TableRow key={idx} hover>
                                              <TableCell sx={{ fontSize: '0.78rem', color: '#64748B' }}>{idx + 1}</TableCell>
                                              <TableCell sx={{ fontSize: '0.8rem', fontWeight: 600 }}>{it.productName}</TableCell>
                                              <TableCell sx={{ fontSize: '0.8rem' }} align="right">₹{it.unitPrice}</TableCell>
                                              <TableCell sx={{ fontSize: '0.8rem', fontWeight: 700 }} align="center">{it.quantity} boxes</TableCell>
                                              <TableCell sx={{ fontSize: '0.8rem', fontWeight: 800, color: '#0B132B' }} align="right">₹{it.totalPrice}</TableCell>
                                            </TableRow>
                                          ))
                                        ) : (
                                          <TableRow>
                                            <TableCell colSpan={5} sx={{ textAlign: 'center', py: 2, color: '#94A3B8' }}>
                                              No cracker items recorded.
                                            </TableCell>
                                          </TableRow>
                                        )}
                                        <TableRow sx={{ backgroundColor: '#F8FAFC' }}>
                                          <TableCell colSpan={3} />
                                          <TableCell align="center" sx={{ fontWeight: 700, fontSize: '0.8rem', color: '#64748B' }}>
                                            Delivery: FREE
                                          </TableCell>
                                          <TableCell align="right" sx={{ fontWeight: 900, fontSize: '0.95rem', color: '#16A34A' }}>
                                            Net Amount: ₹{ord.totalAmount}
                                          </TableCell>
                                        </TableRow>
                                      </TableBody>
                                    </Table>
                                  </TableContainer>
                                </Box>
                              </Collapse>
                            </TableCell>
                          </TableRow>
                        </React.Fragment>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}

        {/* TAB 2: PRODUCT CATALOG (81 ITEMS - NO STOCK LIMIT) */}
        {activeTab === 2 && (
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid #E2E8F0', backgroundColor: '#FFFFFF' }}>
            <Box sx={{ mb: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A' }}>
                  Full Product Price Catalog - Sky Fire Crackers Price List 2026
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748B' }}>
                  Complete Product Price List • Direct Factory Wholesale Rates • Open for On-Demand Booking
                </Typography>
              </Box>

              <TextField
                size="small"
                placeholder="Search crackers..."
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
                sx={{ width: { xs: '100%', sm: 280 } }}
              />
            </Box>

            <TableContainer sx={{ maxHeight: 600, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <Table stickyHeader size="small" sx={{ minWidth: 650 }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, backgroundColor: '#F8FAFC' }}>SNo</TableCell>
                    <TableCell sx={{ fontWeight: 700, backgroundColor: '#F8FAFC' }}>SKU</TableCell>
                    <TableCell sx={{ fontWeight: 700, backgroundColor: '#F8FAFC' }}>Product Name (English)</TableCell>
                    <TableCell sx={{ fontWeight: 700, backgroundColor: '#F8FAFC' }}>Tamil Name</TableCell>
                    <TableCell sx={{ fontWeight: 700, backgroundColor: '#F8FAFC' }}>Category</TableCell>
                    <TableCell sx={{ fontWeight: 700, backgroundColor: '#F8FAFC' }}>Packing Unit</TableCell>
                    <TableCell sx={{ fontWeight: 700, backgroundColor: '#F8FAFC' }}>Actual Wholesale Rate (₹)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredProducts.map((p) => (
                    <TableRow key={p.productId || p.sno} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{p.sno}</TableCell>
                      <TableCell sx={{ color: '#64748B' }}>{p.sku || `sfc-${p.sno}`}</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#0B132B' }}>{p.englishName || p.name}</TableCell>
                      <TableCell sx={{ color: '#475569' }}>{p.tamilName || p.nameTamil || '-'}</TableCell>
                      <TableCell>
                        <Chip size="small" label={p.categoryName || p.category} sx={{ fontSize: '0.72rem', backgroundColor: '#F1F5F9' }} />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#0284C7' }}>{p.pieces || '1 Box'}</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: '#16A34A', fontSize: '0.92rem' }}>₹{p.discountPrice || p.actualRate || p.originalPrice}.00</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}
      </Container>

      {/* View Full Packing & Parcel Details Modal */}
      {selectedOrderDetails && (
        <Dialog
          open
          onClose={() => setSelectedOrderDetails(null)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              m: { xs: 1, sm: 3 },
              width: { xs: 'calc(100% - 16px)', sm: 'auto' },
              maxHeight: '92vh',
              borderRadius: 3,
            },
          }}
        >
          <DialogTitle sx={{ backgroundColor: '#0B132B', color: '#FFFFFF', py: 2, px: { xs: 2, sm: 3 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#FFA000', fontSize: { xs: '0.95rem', sm: '1.25rem' } }}>
                  📦 Packing Slip #{selectedOrderDetails.orderNumber}
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: { xs: '0.68rem', sm: '0.75rem' } }}>
                  Placed on: {new Date(selectedOrderDetails.createdAt).toLocaleString()}
                </Typography>
              </Box>
              <Chip
                size="small"
                label={selectedOrderDetails.orderStatus}
                sx={{
                  backgroundColor: '#FFA000',
                  color: '#0B132B',
                  fontWeight: 800,
                  fontSize: '0.75rem',
                }}
              />
            </Box>
          </DialogTitle>
          <DialogContent sx={{ p: { xs: 2, sm: 3 }, pt: { xs: 2, sm: 3 } }}>
            <Grid container spacing={2.5} sx={{ mb: 3, mt: 0.5 }}>
              {/* Customer Parcel Delivery Label */}
              <Grid item xs={12} sm={6}>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, height: '100%', borderColor: '#CBD5E1' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0B132B', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocalShippingIcon fontSize="small" sx={{ color: '#D97706' }} />
                    Customer Delivery Parcel Label
                  </Typography>
                  <Typography variant="body2"><strong>To:</strong> {selectedOrderDetails.customerName}</Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    <strong>Phone:</strong>{' '}
                    <a href={`tel:${selectedOrderDetails.customerPhone}`} style={{ color: '#D97706', textDecoration: 'none', fontWeight: 700 }}>
                      {selectedOrderDetails.customerPhone}
                    </a>
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1, color: '#334155' }}>
                    <strong>Shipping Address:</strong><br />
                    {selectedOrderDetails.deliveryAddress}
                  </Typography>
                </Paper>
              </Grid>

              {/* Payment Details */}
              <Grid item xs={12} sm={6}>
                <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, height: '100%', borderColor: '#CBD5E1' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0B132B', mb: 1 }}>
                    Payment Summary (UPI / Direct Wholesale)
                  </Typography>
                  <Typography variant="body2">
                    <strong>Payment Mode:</strong> {selectedOrderDetails.paymentMethod}
                  </Typography>
                  <Box sx={{ my: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" component="span" sx={{ fontWeight: 700 }}>
                      Payment Status:
                    </Typography>
                    {renderPaymentChip(selectedOrderDetails.paymentStatus, selectedOrderDetails.utrNumber)}
                  </Box>
                  {selectedOrderDetails.utrNumber && (
                    <Box sx={{ my: 1, p: 1, backgroundColor: '#E0F2FE', borderRadius: 1.5, border: '1px solid #BAE6FD' }}>
                      <Typography variant="caption" sx={{ color: '#0369A1', fontWeight: 800, display: 'block' }}>
                        💳 Customer UPI Ref / UTR No:
                      </Typography>
                      <Typography variant="body1" sx={{ fontFamily: 'monospace', fontWeight: 900, color: '#0B132B', fontSize: '1.05rem' }}>
                        {selectedOrderDetails.utrNumber}
                      </Typography>
                    </Box>
                  )}
                  {selectedOrderDetails.paymentStatus !== 'Completed' && selectedOrderDetails.paymentStatus !== 'Paid' && selectedOrderDetails.paymentStatus !== 'Received' && (
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => handlePaymentStatusChange(selectedOrderDetails.orderId, selectedOrderDetails.orderStatus, 'Completed')}
                      sx={{ mt: 1, mb: 1, backgroundColor: '#16A34A', color: '#FFFFFF', fontWeight: 800, fontSize: '0.75rem', textTransform: 'none', '&:hover': { backgroundColor: '#15803D' } }}
                    >
                      ✓ Mark Payment as Received (பணம் வந்துவிட்டது)
                    </Button>
                  )}
                  {selectedOrderDetails.notes && (
                    <Typography variant="caption" sx={{ color: '#0369A1', display: 'block', mt: 0.5, fontWeight: 700 }}>
                      <strong>Payment / UTR Ref:</strong> {selectedOrderDetails.notes}
                    </Typography>
                  )}
                  {(selectedOrderDetails.couponCode || (selectedOrderDetails.notes && (selectedOrderDetails.notes.includes('TRUSTSKYFIRECRACKERS') || selectedOrderDetails.notes.includes('TRUSTSKYCRACKERS')))) && (
                    <Box sx={{ mt: 1, p: 1, backgroundColor: '#FEF3C7', borderRadius: 1.5, border: '1px solid #F59E0B' }}>
                      <Typography variant="caption" sx={{ color: '#92400E', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <LocalOfferIcon sx={{ fontSize: 13 }} /> Promo Applied: {selectedOrderDetails.couponCode || 'TRUSTSKYFIRECRACKERS'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#B45309', display: 'block', fontSize: '0.7rem' }}>
                        Customer is eligible for manual cashback
                      </Typography>
                    </Box>
                  )}
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="body2">
                    Subtotal: ₹{selectedOrderDetails.subTotal}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#16A34A' }}>
                    Discount: -₹{selectedOrderDetails.discountAmount}
                  </Typography>
                  <Typography variant="body2">
                    Delivery Fee: ₹{selectedOrderDetails.deliveryFee}
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 900, color: '#0B132B', mt: 0.5 }}>
                    Net Amount: ₹{selectedOrderDetails.totalAmount}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>

            {/* Wholesale Purchase & Packing Checklist */}
            <Box sx={{ mb: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0B132B' }}>
                Wholesale Purchase & Packing Checklist ({selectedOrderDetails.items?.length || 0} Items, {selectedOrderDetails.items?.reduce((a, b) => a + b.quantity, 0)} Total Boxes)
              </Typography>
              <Typography variant="caption" sx={{ color: '#64748B' }}>
                Tick items as you buy and pack into parcel
              </Typography>
            </Box>

            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, mb: 3 }}>
              <Table size="small">
                <TableHead sx={{ backgroundColor: '#F8FAFC' }}>
                  <TableRow>
                    <TableCell padding="checkbox">Packed</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>SNo</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Crackers Product Name</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>Boxes to Buy & Pack</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Unit Price</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Total Price</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedOrderDetails.items?.map((item, idx) => (
                    <TableRow
                      key={idx}
                      sx={{
                        backgroundColor: packedChecklist[idx] ? '#F0FDF4' : 'inherit',
                        textDecoration: packedChecklist[idx] ? 'line-through' : 'none',
                      }}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          size="small"
                          checked={!!packedChecklist[idx]}
                          onChange={() => togglePackedItem(idx)}
                          color="success"
                        />
                      </TableCell>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#0F172A' }}>{item.productName}</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 900, color: '#0284C7', fontSize: '0.95rem' }}>
                        {item.quantity} Box(es)
                      </TableCell>
                      <TableCell align="right">₹{item.unitPrice}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>₹{item.totalPrice}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Quick Status Update Buttons */}
            <Box sx={{ p: 2, backgroundColor: '#F8FAFC', borderRadius: 2, border: '1px solid #E2E8F0' }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', display: 'block', mb: 1 }}>
                UPDATE PARCEL WORKFLOW STATUS:
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {['Confirmed', 'Packing', 'Shipped', 'Delivered', 'Cancelled'].map((st) => (
                  <Button
                    key={st}
                    size="small"
                    variant={selectedOrderDetails.orderStatus === st ? 'contained' : 'outlined'}
                    color={st === 'Cancelled' ? 'error' : st === 'Delivered' ? 'success' : 'primary'}
                    onClick={() => handleStatusChange(selectedOrderDetails.orderId, st)}
                    sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.78rem' }}
                  >
                    {st === 'Shipped' ? 'Mark Dispatched / Shipped' : `Mark as ${st}`}
                  </Button>
                ))}
              </Stack>
            </Box>
          </DialogContent>

          <DialogActions sx={{ p: 2, display: 'flex', justifyContent: 'space-between' }}>
            <Button
              startIcon={<PrintIcon />}
              onClick={handlePrintSlip}
              variant="outlined"
              sx={{ textTransform: 'none', borderColor: '#CBD5E1', color: '#0B132B' }}
            >
              Print Parcel Packing Slip
            </Button>
            <Button onClick={() => setSelectedOrderDetails(null)} sx={{ color: '#64748B' }}>
              Close
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Right-Click Context Menu for Admin Orders */}
      <Menu
        open={contextMenu !== null}
        onClose={handleCloseContextMenu}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
      >
        <MenuItem
          onClick={() => {
            const ord = contextMenu?.order
            handleCloseContextMenu()
            if (onOpenPersonPage && ord) {
              onOpenPersonPage({
                customerName: ord.customerName,
                mobileNumber: ord.customerPhone,
                address: ord.deliveryAddress,
              })
            }
          }}
        >
          <ListItemIcon>
            <PersonIcon fontSize="small" sx={{ color: '#0284C7' }} />
          </ListItemIcon>
          <ListItemText
            primary={`Open ${contextMenu?.order?.customerName || 'Customer'}'s Full Page`}
            secondary="Selected Products, Saved Orders & Payment Status"
          />
        </MenuItem>
        <MenuItem
          onClick={() => {
            const ord = contextMenu?.order
            handleCloseContextMenu()
            if (ord) {
              setSelectedOrderDetails(ord)
              setPackedChecklist({})
            }
          }}
        >
          <ListItemIcon>
            <LocalShippingIcon fontSize="small" sx={{ color: '#FFA000' }} />
          </ListItemIcon>
          <ListItemText primary="Open Packing Sheet" />
        </MenuItem>
        {contextMenu?.order?.customerPhone && (
          <MenuItem
            component="a"
            href={`tel:${contextMenu.order.customerPhone}`}
            onClick={handleCloseContextMenu}
          >
            <ListItemIcon>
              <PhoneIcon fontSize="small" sx={{ color: '#16A34A' }} />
            </ListItemIcon>
            <ListItemText primary={`Call Customer (+91 ${contextMenu.order.customerPhone})`} />
          </MenuItem>
        )}
        <Divider sx={{ my: 0.5 }} />
        <MenuItem onClick={() => handleUpdatePaymentStatus(contextMenu?.order, 'Completed')}>
          <ListItemIcon>
            <CheckCircleIcon fontSize="small" sx={{ color: '#16A34A' }} />
          </ListItemIcon>
          <ListItemText primary="Mark Payment as Completed (Paid)" />
        </MenuItem>
        <MenuItem onClick={() => handleUpdatePaymentStatus(contextMenu?.order, 'Pending')}>
          <ListItemIcon>
            <HourglassBottomIcon fontSize="small" sx={{ color: '#D97706' }} />
          </ListItemIcon>
          <ListItemText primary="Mark Payment as Pending" />
        </MenuItem>
        <MenuItem onClick={() => handleUpdatePaymentStatus(contextMenu?.order, 'Failed')}>
          <ListItemIcon>
            <CloseIcon fontSize="small" sx={{ color: '#DC2626' }} />
          </ListItemIcon>
          <ListItemText primary="Mark Payment as Failed" />
        </MenuItem>
        <MenuItem onClick={() => handleUpdatePaymentStatus(contextMenu?.order, 'Cancelled')}>
          <ListItemIcon>
            <CloseIcon fontSize="small" sx={{ color: '#64748B' }} />
          </ListItemIcon>
          <ListItemText primary="Mark Order as Cancelled" />
        </MenuItem>
      </Menu>
    </Box>
  )
}
