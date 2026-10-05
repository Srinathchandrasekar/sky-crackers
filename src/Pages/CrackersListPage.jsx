import React, { useState, useMemo, useEffect } from 'react'
import {
  Box,
  Container,
  Grid,
  Typography,
  Card,
  CardMedia,
  CardContent,
  Button,
  IconButton,
  Slider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
  Rating,
  Chip,
  Paper,
  Divider,
  Snackbar,
  Alert,
  TextField,
  InputAdornment,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import CloseIcon from '@mui/icons-material/Close'
import AddIcon from '@mui/icons-material/Add'
import RemoveIcon from '@mui/icons-material/Remove'
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import FlareIcon from '@mui/icons-material/Flare'
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment'
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch'
import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked'
import CrisisAlertIcon from '@mui/icons-material/CrisisAlert'
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import WifiIcon from '@mui/icons-material/Wifi'
import WifiOffIcon from '@mui/icons-material/WifiOff'
import { CATEGORIES, CRACKERS_DATA } from '../data/crackersData'
import { getProductsApi, getCategoriesApi } from '../services/api'
import sparklersImg from '../assets/sparklers.jpg'
import flowerPotImg from '../assets/flowerpot.jpg'
import rocketsImg from '../assets/rockets.jpg'
import chakkarImg from '../assets/chakkar.jpg'
import bombsImg from '../assets/bombs.jpg'
import giftBoxImg from '../assets/giftbox.jpg'

function getCategoryFallbackImage(slug) {
  switch (slug) {
    case 'sparklers':
      return sparklersImg
    case 'flowerpots':
    case 'fountain_items':
      return flowerPotImg
    case 'ground_chakkaras':
      return chakkarImg
    case 'sound_crackers':
    case 'paper_bombs':
      return bombsImg
    case 'gift_boxes':
      return giftBoxImg
    case 'sky_shots':
    case 'rockets':
      return rocketsImg
    default:
      return sparklersImg
  }
}

export default function CrackersListPage({
  selectedCategory = 'all',
  setSelectedCategory,
  searchQuery = '',
  setSearchQuery,
  onAddToCart,
  cart = [],
  onUpdateQuantity,
  onOpenCart,
}) {
  const [priceRange, setPriceRange] = useState([10, 5000])
  const [appliedPriceRange, setAppliedPriceRange] = useState([10, 5000])
  const [sortBy, setSortBy] = useState('popular')
  const [itemQuantities, setItemQuantities] = useState({})
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [lastAddedName, setLastAddedName] = useState('')
  const [localSearch, setLocalSearch] = useState(searchQuery || '')

  const currentSearch = setSearchQuery ? (searchQuery || '') : localSearch
  const handleSearchChange = (val) => {
    setLocalSearch(val)
    if (setSearchQuery) setSearchQuery(val)
  }

  // Live Backend API Data States
  const [productsList, setProductsList] = useState(CRACKERS_DATA)
  const [categoriesList, setCategoriesList] = useState(CATEGORIES)
  const [isLiveConnected, setIsLiveConnected] = useState(false)
  const [loadingApi, setLoadingApi] = useState(true)

  useEffect(() => {
    let active = true
    async function fetchApiData() {
      try {
        const [pData, cData] = await Promise.allSettled([
          getProductsApi(),
          getCategoriesApi(),
        ])

        if (active && pData.status === 'fulfilled' && Array.isArray(pData.value) && pData.value.length > 0) {
          const mapped = pData.value.map((p) => {
            const local = CRACKERS_DATA.find(
              (cd) => (p.sku && cd.sku === p.sku) || cd.sno === p.sno || cd.name.toLowerCase() === (p.englishName || '').toLowerCase()
            )
            return {
              id: `p-${p.productId || p.sno}`,
              productId: p.productId || p.sno,
              sno: p.sno,
              sku: p.sku || `sfc-${p.sno}`,
              name: p.englishName || (local ? local.name : ''),
              nameTamil: (local && local.tamilName) ? local.tamilName : (p.tamilName || p.englishName || ''),
              category: p.categorySlug || (local ? local.category : 'all'),
              categorySlug: p.categorySlug || (local ? local.category : 'all'),
              categoryName: p.categoryName || (local ? local.category : 'All Crackers'),
              originalPrice: Number(p.actualRate || p.discountPrice || p.originalPrice || (local ? local.discountPrice : 0)),
              discountPrice: Number(p.actualRate || p.discountPrice || (local ? local.discountPrice : 0)),
              discountPercent: 0,
              pieces: p.pieces || (local ? local.pieces : '1 Box'),
              rating: Number(p.rating) || (local ? local.rating : 4.8),
              reviews: p.reviewsCount || (local ? local.reviews : 120),
              image: (local && local.image) ? local.image : getCategoryFallbackImage(p.categorySlug),
              description: p.description || (local ? local.description : p.englishName),
            }
          })
          setProductsList(mapped)
          setIsLiveConnected(true)
        }

        if (active && cData.status === 'fulfilled' && Array.isArray(cData.value) && cData.value.length > 0) {
          const totalCount = pData.status === 'fulfilled' ? pData.value.length : 81
          const mappedCats = [
            { id: 'all', name: 'All Crackers', count: totalCount, icon: 'auto_awesome' },
            ...cData.value.map((c) => ({
              id: c.slug,
              name: c.name,
              count: c.productsCount,
              icon: c.icon || 'auto_awesome',
            })),
          ]
          setCategoriesList(mappedCats)
        }
      } catch (err) {
        console.warn('Backend API connection warning, using local dataset:', err)
      } finally {
        if (active) setLoadingApi(false)
      }
    }
    fetchApiData()
    return () => {
      active = false
    }
  }, [])

  // Map category icons
  const getCategoryIcon = (iconName, isSelected) => {
    const iconColor = isSelected ? '#FFFFFF' : '#64748B'
    switch (iconName) {
      case 'flare':
        return <FlareIcon sx={{ color: iconColor, fontSize: 18 }} />
      case 'local_fire_department':
        return <LocalFireDepartmentIcon sx={{ color: iconColor, fontSize: 18 }} />
      case 'rocket_launch':
        return <RocketLaunchIcon sx={{ color: iconColor, fontSize: 18 }} />
      case 'radio_button_checked':
        return <RadioButtonCheckedIcon sx={{ color: iconColor, fontSize: 18 }} />
      case 'crisis_alert':
        return <CrisisAlertIcon sx={{ color: iconColor, fontSize: 18 }} />
      case 'card_giftcard':
        return <CardGiftcardIcon sx={{ color: iconColor, fontSize: 18 }} />
      default:
        return <AutoAwesomeIcon sx={{ color: iconColor, fontSize: 18 }} />
    }
  }

  // Handle quantity changes per item
  const handleQuantityChange = (id, delta) => {
    setItemQuantities((prev) => {
      const current = prev[id] || 1
      const updated = Math.max(1, current + delta)
      return { ...prev, [id]: updated }
    })
  }

  const getItemQuantity = (id) => itemQuantities[id] || 1

  // Handle Add To Cart
  const handleAdd = (product) => {
    const qty = getItemQuantity(product.id)
    onAddToCart(product, qty)
    setLastAddedName(product.name)
    setSnackbarOpen(true)
  }

  // Dynamic category product counts
  const categoryCounts = useMemo(() => {
    const counts = { all: productsList.length }
    const norm = (s) => (s || '').toLowerCase().replace(/[-_\s]+/g, '')
    productsList.forEach((p) => {
      const c1 = p.category || ''
      const c2 = p.categorySlug || ''
      const n1 = norm(c1)
      const n2 = norm(c2)
      if (c1) counts[c1] = (counts[c1] || 0) + 1
      if (c2 && c2 !== c1) counts[c2] = (counts[c2] || 0) + 1
      if (n1) counts[n1] = (counts[n1] || 0) + 1
      if (n2 && n2 !== n1) counts[n2] = (counts[n2] || 0) + 1
    })
    return counts
  }, [productsList])

  // Filter & Sort crackers with resilient normalization
  const filteredCrackers = useMemo(() => {
    const norm = (s) => (s || '').toLowerCase().replace(/[-_\s]+/g, '')
    const selectedNorm = norm(selectedCategory)
    const effectiveSearch = (currentSearch || '').trim().toLowerCase()

    return productsList.filter((product) => {
      // 1. Resilient Category Filter
      if (selectedNorm && selectedNorm !== 'all') {
        if (selectedNorm === 'newarrivals') {
          const isExplicit = norm(product.category) === 'newarrivals' || norm(product.categorySlug) === 'newarrivals'
          const isFeatured = (product.sno && product.sno > 75) || (product.rating && product.rating >= 4.7)
          if (!isExplicit && !isFeatured) return false
        } else {
          const prodCat = norm(product.category)
          const prodSlug = norm(product.categorySlug)
          const prodName = norm(product.categoryName)
          const matches =
            prodCat === selectedNorm ||
            prodSlug === selectedNorm ||
            prodName === selectedNorm ||
            prodCat.includes(selectedNorm) ||
            selectedNorm.includes(prodCat)
          if (!matches) return false
        }
      }

      // 2. Comprehensive Search Filter (English name, Tamil name, S.No, SKU, Category)
      if (effectiveSearch) {
        const nameEn = (product.name || '').toLowerCase()
        const nameTa = (product.nameTamil || product.tamilName || '').toLowerCase()
        const snoStr = String(product.sno || '')
        const skuStr = (product.sku || '').toLowerCase()
        const catStr = (product.category || product.categoryName || '').toLowerCase()

        const matchesSearch =
          nameEn.includes(effectiveSearch) ||
          nameTa.includes(effectiveSearch) ||
          snoStr === effectiveSearch ||
          skuStr.includes(effectiveSearch) ||
          catStr.includes(effectiveSearch)

        if (!matchesSearch) return false
      }

      // 3. Price range filter
      const price = Number(product.discountPrice) || 0
      if (
        price < appliedPriceRange[0] ||
        price > appliedPriceRange[1]
      ) {
        return false
      }

      return true
    }).sort((a, b) => {
      if (sortBy === 'price_asc') return a.discountPrice - b.discountPrice
      if (sortBy === 'price_desc') return b.discountPrice - a.discountPrice
      if (sortBy === 'rating') return b.rating - a.rating
      if (sortBy === 'discount') return b.discountPercent - a.discountPercent
      return 0 // 'popular' maintains default order
    })
  }, [productsList, selectedCategory, currentSearch, appliedPriceRange, sortBy])

  const normHelper = (s) => (s || '').toLowerCase().replace(/[-_\s]+/g, '')
  const currentCategoryObj = categoriesList.find((c) => normHelper(c.id) === normHelper(selectedCategory)) || categoriesList[0]

  return (
    <Box sx={{ pt: { xs: 1.5, md: 3 }, pb: { xs: 12, md: 14 }, backgroundColor: '#F8FAFC', minHeight: '80vh', width: '100%' }}>
      <Container maxWidth={false} sx={{ px: { xs: 1.25, sm: 2.5, md: 3.5, lg: 4 } }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: 'flex-start', gap: 2.5, width: '100%' }}>
          {/* Left Sidebar Filter - Sticky on Scroll (Desktop only) */}
          <Box
            sx={{
              display: { xs: 'none', md: 'block' },
              width: { md: 250, lg: 260 },
              flexShrink: 0,
              position: 'sticky',
              top: 85,
              zIndex: 10,
              alignSelf: 'flex-start',
            }}
          >
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: 3,
                border: '1px solid #E2E8F0',
                backgroundColor: '#FFFFFF',
                maxHeight: 'calc(100vh - 105px)',
                overflowY: 'auto',
                boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                '&::-webkit-scrollbar': { width: 4 },
                '&::-webkit-scrollbar-thumb': { backgroundColor: '#CBD5E1', borderRadius: 2 },
              }}
            >
              {/* Category List */}
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 800,
                  color: '#0F172A',
                  mb: 1.5,
                  fontSize: '1.05rem',
                }}
              >
                Categories
              </Typography>

              <List disablePadding sx={{ mb: 3 }}>
                {categoriesList.map((cat) => {
                  const isSelected = normHelper(selectedCategory) === normHelper(cat.id)
                  const count = cat.id === 'all'
                    ? productsList.length
                    : (categoryCounts[cat.id] ?? categoryCounts[normHelper(cat.id)] ?? cat.count ?? 0)
                  return (
                    <ListItem key={cat.id} disablePadding sx={{ mb: 0.8 }}>
                      <ListItemButton
                        onClick={() => setSelectedCategory(cat.id)}
                        sx={{
                          borderRadius: 2,
                          py: 1,
                          px: 1.5,
                          backgroundColor: isSelected ? '#FFA000' : 'transparent',
                          color: isSelected ? '#FFFFFF' : '#1E293B',
                          boxShadow: isSelected ? '0 4px 12px rgba(255, 160, 0, 0.35)' : 'none',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            backgroundColor: isSelected ? '#FFA000' : 'rgba(255, 160, 0, 0.08)',
                          },
                        }}
                      >
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          {getCategoryIcon(cat.icon, isSelected)}
                        </ListItemIcon>
                        <ListItemText
                          primary={cat.name}
                          primaryTypographyProps={{
                            fontWeight: isSelected ? 700 : 500,
                            fontSize: '0.88rem',
                          }}
                        />
                        <Typography
                          variant="caption"
                          sx={{
                            fontWeight: 700,
                            color: isSelected ? '#FFFFFF' : '#94A3B8',
                            fontSize: '0.75rem',
                            ml: 1,
                          }}
                        >
                          {count}
                        </Typography>
                      </ListItemButton>
                    </ListItem>
                  )
                })}
              </List>

              <Divider sx={{ my: 2.5 }} />

              {/* Price Range Filter */}
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 800,
                  color: '#0F172A',
                  mb: 1,
                  fontSize: '1.05rem',
                }}
              >
                Price Range
              </Typography>

              <Box sx={{ px: 1, mb: 1 }}>
                <Slider
                  value={priceRange}
                  min={10}
                  max={5000}
                  step={10}
                  onChange={(e, val) => setPriceRange(val)}
                  sx={{
                    color: '#FFA000',
                    '& .MuiSlider-thumb': {
                      boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                    },
                  }}
                />
              </Box>

              <Typography
                variant="body2"
                sx={{
                  color: '#475569',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  mb: 2,
                }}
              >
                ₹ {priceRange[0]} - ₹ {priceRange[1]}
              </Typography>

              <Button
                variant="contained"
                fullWidth
                onClick={() => setAppliedPriceRange([...priceRange])}
                sx={{
                  backgroundColor: '#FFA000',
                  color: '#0B132B',
                  fontWeight: 700,
                  py: 1,
                  borderRadius: 2,
                  boxShadow: 'none',
                  '&:hover': {
                    backgroundColor: '#FF8F00',
                  },
                }}
              >
                Apply
              </Button>
            </Paper>
          </Box>

          {/* Right Product Section */}
          <Box sx={{ flexGrow: 1, minWidth: 0, width: '100%' }}>
            {/* Mobile Category Pills Bar (Horizontal Scroll) */}
            <Box
              sx={{
                display: { xs: 'flex', md: 'none' },
                overflowX: 'auto',
                py: 0.8,
                px: 0.2,
                mb: 2,
                gap: 1,
                whiteSpace: 'nowrap',
                '&::-webkit-scrollbar': { display: 'none' },
                msOverflowStyle: 'none',
                scrollbarWidth: 'none',
              }}
            >
              {categoriesList.map((cat) => {
                const isSelected = normHelper(selectedCategory) === normHelper(cat.id)
                const count = cat.id === 'all'
                  ? productsList.length
                  : (categoryCounts[cat.id] ?? categoryCounts[normHelper(cat.id)] ?? cat.count ?? 0)
                return (
                  <Chip
                    key={cat.id}
                    icon={getCategoryIcon(cat.icon, isSelected)}
                    label={`${cat.name} (${count})`}
                    onClick={() => setSelectedCategory(cat.id)}
                    sx={{
                      borderRadius: '50px',
                      fontWeight: isSelected ? 800 : 600,
                      fontSize: '0.78rem',
                      height: 32,
                      px: 0.6,
                      backgroundColor: isSelected ? '#FFA000' : '#FFFFFF',
                      color: isSelected ? '#0B132B' : '#334155',
                      border: isSelected ? '1.5px solid #FFA000' : '1px solid #CBD5E1',
                      boxShadow: isSelected ? '0 2px 8px rgba(255, 160, 0, 0.35)' : 'none',
                      flexShrink: 0,
                      '& .MuiChip-icon': {
                        color: isSelected ? '#0B132B !important' : '#64748B !important',
                      },
                    }}
                  />
                )
              })}
            </Box>

            {/* Header with Title, Count & Search Box */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: 'space-between',
                alignItems: { xs: 'stretch', sm: 'center' },
                gap: 1.5,
                mb: 2.5,
              }}
            >
              <Box>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 800,
                    color: '#0F172A',
                    fontSize: { xs: '1.25rem', md: '1.75rem' },
                  }}
                >
                  {currentCategoryObj.name}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.4, flexWrap: 'wrap' }}>
                  <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 500, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                    Showing {filteredCrackers.length} products
                  </Typography>
                  {isLiveConnected ? (
                    <Chip
                      icon={<WifiIcon sx={{ fontSize: '13px !important' }} />}
                      label={`SQL Server (${productsList.length})`}
                      size="small"
                      color="success"
                      variant="outlined"
                      sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700 }}
                    />
                  ) : (
                    <Chip
                      icon={<WifiOffIcon sx={{ fontSize: '13px !important' }} />}
                      label={loadingApi ? "Loading DB..." : "Catalog Active"}
                      size="small"
                      color="warning"
                      variant="outlined"
                      sx={{ height: 20, fontSize: '0.68rem', fontWeight: 600 }}
                    />
                  )}
                </Box>
              </Box>

              {/* Responsive Crackers Search Bar */}
              <Box sx={{ width: { xs: '100%', sm: 280, md: 340 } }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search crackers (English, தமிழ், S.No)..."
                  value={currentSearch}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: '#FFA000', fontSize: 20 }} />
                      </InputAdornment>
                    ),
                    endAdornment: currentSearch ? (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => handleSearchChange('')}>
                          <CloseIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </InputAdornment>
                    ) : null,
                  }}
                  sx={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: 2,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      fontSize: '0.85rem',
                      '& fieldset': { borderColor: '#E2E8F0' },
                      '&:hover fieldset': { borderColor: '#FFA000' },
                      '&.Mui-focused fieldset': { borderColor: '#FFA000' },
                    },
                  }}
                />
              </Box>
            </Box>

            {/* Empty State */}
            {filteredCrackers.length === 0 && (
              <Box
                sx={{
                  p: { xs: 4, sm: 6 },
                  textAlign: 'center',
                  backgroundColor: '#FFFFFF',
                  borderRadius: 3,
                  border: '1px dashed #CBD5E1',
                }}
              >
                <Typography variant="h6" sx={{ color: '#64748B', mb: 1, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                  No crackers found matching your criteria.
                </Typography>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setSelectedCategory('all')
                    handleSearchChange('')
                    setPriceRange([10, 5000])
                    setAppliedPriceRange([10, 5000])
                  }}
                  sx={{ mt: 1, borderColor: '#FFA000', color: '#0B132B' }}
                >
                  Reset All Filters
                </Button>
              </Box>
            )}

            {/* Product Cards Grid - 2 columns on mobile */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: 'repeat(2, 1fr)',
                  sm: 'repeat(2, 1fr)',
                  md: 'repeat(3, 1fr)',
                  lg: 'repeat(4, 1fr)',
                  xl: 'repeat(5, 1fr)',
                },
                gap: { xs: 1.25, sm: 2 },
              }}
            >
              {filteredCrackers.map((product) => {
                const inCartItem = cart.find(
                  (ci) =>
                    ci.product.id === product.id ||
                    ci.product.productId === product.productId ||
                    ci.product.sno === product.sno
                )
                const inCartQty = inCartItem ? inCartItem.quantity : 0
                const currentQty = getItemQuantity(product.id)

                return (
                  <Card
                    key={product.id}
                    elevation={0}
                    sx={{
                      borderRadius: 3,
                      border: inCartQty > 0 ? '2px solid #FFA000' : '1px solid #E2E8F0',
                      overflow: 'hidden',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      position: 'relative',
                      backgroundColor: '#FFFFFF',
                      boxShadow: inCartQty > 0 ? '0 8px 22px rgba(255, 160, 0, 0.2)' : 'none',
                      transition: 'all 0.25s ease',
                      '&:hover': {
                        transform: 'translateY(-3px)',
                        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                      },
                    }}
                  >
                    {/* S.No Badge on Top Left */}
                    <Chip
                      label={`#${product.sno}`}
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: { xs: 6, sm: 8 },
                        left: { xs: 6, sm: 8 },
                        zIndex: 2,
                        backgroundColor: 'rgba(11, 19, 43, 0.9)',
                        color: '#FFA000',
                        fontWeight: 800,
                        fontSize: { xs: '0.68rem', sm: '0.76rem' },
                        height: { xs: 20, sm: 24 },
                        backdropFilter: 'blur(4px)',
                      }}
                    />

                    {inCartQty > 0 && (
                      <Chip
                        icon={<CheckCircleIcon sx={{ fontSize: { xs: '11px !important', sm: '13px !important' }, color: '#0B132B !important' }} />}
                        label={`In Cart (${inCartQty})`}
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: { xs: 6, sm: 8 },
                          right: { xs: 6, sm: 8 },
                          zIndex: 2,
                          backgroundColor: '#FFA000',
                          color: '#0B132B',
                          fontWeight: 900,
                          fontSize: { xs: '0.64rem', sm: '0.74rem' },
                          height: { xs: 20, sm: 24 },
                          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                        }}
                      />
                    )}

                    {/* Product Image - Compact Ratio */}
                    <Box
                      sx={{
                        pt: '62%',
                        position: 'relative',
                        backgroundColor: '#F1F5F9',
                        overflow: 'hidden',
                      }}
                    >
                      <Box
                        component="img"
                        src={product.image}
                        alt={product.name}
                        onError={(e) => {
                          e.currentTarget.onerror = null
                          e.currentTarget.src = sparklersImg
                        }}
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          transition: 'transform 0.4s ease',
                          '&:hover': {
                            transform: 'scale(1.06)',
                          },
                        }}
                      />
                    </Box>

                    {/* Card Body */}
                    <CardContent sx={{ p: { xs: 1.2, sm: 1.8 }, pb: { xs: '10px !important', sm: '14px !important' }, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                      <Typography
                        variant="subtitle1"
                        sx={{
                          fontWeight: 800,
                          color: '#0F172A',
                          fontSize: { xs: '0.84rem', sm: '1.05rem' },
                          lineHeight: 1.25,
                          height: { xs: 34, sm: 38 },
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        {product.name}
                      </Typography>

                      {/* Tamil Name */}
                      <Typography
                        variant="caption"
                        sx={{
                          color: '#B45309',
                          fontWeight: 700,
                          fontSize: { xs: '0.7rem', sm: '0.82rem' },
                          display: 'block',
                          mb: { xs: 0.5, sm: 1 },
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {product.nameTamil || product.tamilName || ''}
                      </Typography>

                      {/* Packing & Price Row */}
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'baseline',
                          mb: { xs: 1, sm: 1.5 },
                        }}
                      >
                        <Chip
                          size="small"
                          label={product.pieces || '1 Box'}
                          sx={{
                            height: { xs: 18, sm: 22 },
                            fontSize: { xs: '0.64rem', sm: '0.72rem' },
                            fontWeight: 700,
                            backgroundColor: '#F1F5F9',
                            color: '#475569',
                          }}
                        />

                        <Box sx={{ textAlign: 'right' }}>
                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: 900,
                              color: '#16A34A',
                              fontSize: { xs: '1.05rem', sm: '1.35rem' },
                              lineHeight: 1,
                            }}
                          >
                            ₹{product.discountPrice}
                          </Typography>
                        </Box>
                      </Box>

                      <Box sx={{ mt: 'auto' }}>
                        {inCartQty > 0 ? (
                          /* Interactive In-Cart State */
                          <Box>
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                backgroundColor: '#FFFBEB',
                                border: '1.5px solid #FDE68A',
                                borderRadius: 2,
                                mb: 0.8,
                                px: { xs: 0.5, sm: 1 },
                                py: { xs: 0.2, sm: 0.4 },
                              }}
                            >
                              <IconButton
                                size="small"
                                onClick={() => onUpdateQuantity && onUpdateQuantity(product.id, -1)}
                                sx={{ p: { xs: 0.2, sm: 0.4 }, color: '#B45309' }}
                              >
                                <RemoveIcon sx={{ fontSize: { xs: 13, sm: 16 } }} />
                              </IconButton>
                              <Typography variant="body2" sx={{ fontWeight: 900, color: '#92400E', fontSize: { xs: '0.78rem', sm: '0.92rem' } }}>
                                {inCartQty} in Cart
                              </Typography>
                              <IconButton
                                size="small"
                                onClick={() => onUpdateQuantity && onUpdateQuantity(product.id, 1)}
                                sx={{ p: { xs: 0.2, sm: 0.4 }, color: '#B45309' }}
                              >
                                <AddIcon sx={{ fontSize: { xs: 13, sm: 16 } }} />
                              </IconButton>
                            </Box>

                            <Button
                              variant="contained"
                              fullWidth
                              startIcon={<ShoppingCartIcon sx={{ fontSize: { xs: '13px !important', sm: '16px !important' } }} />}
                              onClick={() => (onOpenCart ? onOpenCart() : handleAdd(product))}
                              sx={{
                                backgroundColor: '#0B132B',
                                color: '#FFA000',
                                fontWeight: 800,
                                fontSize: { xs: '0.74rem', sm: '0.85rem' },
                                py: { xs: 0.5, sm: 0.7 },
                                borderRadius: 2,
                                textTransform: 'none',
                                '&:hover': {
                                  backgroundColor: '#1E293B',
                                },
                              }}
                            >
                              View Cart →
                            </Button>
                          </Box>
                        ) : (
                          /* Initial Add to Cart State */
                          <Box>
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: '#F8FAFC',
                                border: '1px solid #E2E8F0',
                                borderRadius: 2,
                                mb: 0.8,
                                py: { xs: 0.2, sm: 0.3 },
                              }}
                            >
                              <IconButton
                                size="small"
                                onClick={() => handleQuantityChange(product.id, -1)}
                                disabled={currentQty <= 1}
                                sx={{ p: { xs: 0.3, sm: 0.5 } }}
                              >
                                <RemoveIcon sx={{ fontSize: { xs: 14, sm: 18 } }} />
                              </IconButton>
                              <Typography
                                variant="body2"
                                sx={{
                                  px: { xs: 1, sm: 2 },
                                  fontWeight: 800,
                                  fontSize: { xs: '0.82rem', sm: '0.96rem' },
                                  minWidth: 20,
                                  textAlign: 'center',
                                }}
                              >
                                {currentQty}
                              </Typography>
                              <IconButton
                                size="small"
                                onClick={() => handleQuantityChange(product.id, 1)}
                                sx={{ p: { xs: 0.3, sm: 0.5 } }}
                              >
                                <AddIcon sx={{ fontSize: { xs: 14, sm: 18 } }} />
                              </IconButton>
                            </Box>

                            <Button
                              variant="contained"
                              fullWidth
                              startIcon={<ShoppingCartIcon sx={{ fontSize: { xs: '14px !important', sm: '18px !important' } }} />}
                              onClick={() => handleAdd(product)}
                              sx={{
                                backgroundColor: '#FFA000',
                                color: '#0B132B',
                                fontWeight: 900,
                                fontSize: { xs: '0.76rem', sm: '0.92rem' },
                                py: { xs: 0.65, sm: 0.9 },
                                borderRadius: 2,
                                boxShadow: '0 2px 8px rgba(255, 160, 0, 0.3)',
                                textTransform: 'none',
                                '&:hover': {
                                  backgroundColor: '#FF8F00',
                                  boxShadow: '0 4px 12px rgba(255, 160, 0, 0.45)',
                                },
                              }}
                            >
                              Add to Cart
                            </Button>
                          </Box>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                )
              })}
            </Box>
          </Box>
        </Box>
      </Container>

      {/* Mobile Sticky Floating Cart Bar */}
      {cart.length > 0 && (
        <Paper
          elevation={8}
          sx={{
            display: { xs: 'flex', md: 'none' },
            position: 'fixed',
            bottom: 14,
            left: 14,
            right: 14,
            zIndex: 1100,
            backgroundColor: '#0B132B',
            color: '#FFFFFF',
            borderRadius: 3.5,
            p: 1.2,
            px: 2,
            alignItems: 'center',
            justifyContent: 'space-between',
            border: '2px solid #FFA000',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)',
          }}
        >
          <Box onClick={onOpenCart} sx={{ cursor: 'pointer' }}>
            <Typography variant="caption" sx={{ color: '#FFA000', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.7rem' }}>
              {cart.reduce((s, i) => s + i.quantity, 0)} Items Added
            </Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 900, lineHeight: 1.1, fontSize: '1.1rem' }}>
              ₹{cart.reduce((s, i) => s + (i.product.discountPrice || 0) * i.quantity, 0)}
            </Typography>
          </Box>

          <Button
            variant="contained"
            onClick={onOpenCart}
            startIcon={<ShoppingCartIcon sx={{ fontSize: 16 }} />}
            sx={{
              backgroundColor: '#FFA000',
              color: '#0B132B',
              fontWeight: 900,
              fontSize: '0.84rem',
              py: 0.7,
              px: 2,
              borderRadius: 2.5,
              textTransform: 'none',
              '&:hover': { backgroundColor: '#FF8F00' },
            }}
          >
            View Cart →
          </Button>
        </Paper>
      )}

      {/* Snackbar feedback */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={2500}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ bottom: { xs: 75, md: 80 } }}
      >
        <Alert
          icon={<CheckCircleIcon fontSize="inherit" />}
          severity="success"
          sx={{ width: '100%', fontWeight: 600, backgroundColor: '#0B132B', color: '#FFFFFF' }}
        >
          Added <strong>{lastAddedName}</strong> to cart!
        </Alert>
      </Snackbar>
    </Box>
  )
}
