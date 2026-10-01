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
} from '@mui/material'
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
  selectedCategory,
  setSelectedCategory,
  searchQuery,
  onAddToCart,
  cart = [],
  onUpdateQuantity,
  onOpenCart,
}) {
  const [priceRange, setPriceRange] = useState([10, 2100])
  const [appliedPriceRange, setAppliedPriceRange] = useState([10, 2100])
  const [sortBy, setSortBy] = useState('popular')
  const [itemQuantities, setItemQuantities] = useState({})
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [lastAddedName, setLastAddedName] = useState('')

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
              (cd) => cd.sno === p.sno || cd.name.toLowerCase() === (p.englishName || '').toLowerCase()
            )
            return {
              id: `p-${p.productId}`,
              productId: p.productId,
              sno: p.sno,
              sku: p.sku,
              name: p.englishName || (local ? local.name : ''),
              nameTamil: (local && local.tamilName) ? local.tamilName : (p.tamilName || ''),
              category: p.categorySlug,
              originalPrice: Number(p.originalPrice),
              discountPrice: Number(p.discountPrice),
              discountPercent: p.discountPercent || 80,
              pieces: p.pieces || (local ? local.pieces : '1 Box'),
              stock: p.stockQuantity,
              inStock: p.stockQuantity > 0,
              rating: Number(p.rating) || (local ? local.rating : 4.7),
              reviews: p.reviewsCount || (local ? local.reviews : 100),
              image: (local && local.image) ? local.image : getCategoryFallbackImage(p.categorySlug),
              description: p.description || (local ? local.description : p.englishName),
            }
          })
          setProductsList(mapped)
          setIsLiveConnected(true)
        }

        if (active && cData.status === 'fulfilled' && Array.isArray(cData.value) && cData.value.length > 0) {
          const totalCount = pData.status === 'fulfilled' ? pData.value.length : 91
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

  // Filter & Sort crackers
  const filteredCrackers = useMemo(() => {
    return productsList.filter((product) => {
      // Category filter
      if (selectedCategory !== 'all' && product.category !== selectedCategory) {
        return false
      }
      // Search filter
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase()
        const matchesName = product.name.toLowerCase().includes(query)
        const matchesCat = product.category.toLowerCase().includes(query)
        if (!matchesName && !matchesCat) return false
      }
      // Price range filter
      if (
        product.discountPrice < appliedPriceRange[0] ||
        product.discountPrice > appliedPriceRange[1]
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
  }, [productsList, selectedCategory, searchQuery, appliedPriceRange, sortBy])

  const currentCategoryObj = categoriesList.find((c) => c.id === selectedCategory) || categoriesList[0]

  return (
    <Box sx={{ pt: { xs: 2.5, md: 3 }, pb: { xs: 12, md: 14 }, backgroundColor: '#F8FAFC', minHeight: '80vh', width: '100%' }}>
      <Container maxWidth={false} sx={{ px: { xs: 1.5, sm: 2.5, md: 3.5, lg: 4 } }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: 'flex-start', gap: 2.5, width: '100%' }}>
          {/* Left Sidebar Filter - Sticky on Scroll */}
          <Box
            sx={{
              width: { xs: '100%', md: 250, lg: 260 },
              flexShrink: 0,
              position: { xs: 'relative', md: 'sticky' },
              top: { md: 85 },
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
                maxHeight: { md: 'calc(100vh - 105px)' },
                overflowY: { md: 'auto' },
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
                  const isSelected = selectedCategory === cat.id
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
                          {cat.count}
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
                  max={2100}
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
            {/* Header with Title, Count & Sort */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: 'space-between',
                alignItems: { xs: 'flex-start', sm: 'center' },
                gap: 1.5,
                mb: 3,
              }}
            >
              <Box>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 800,
                    color: '#0F172A',
                    fontSize: { xs: '1.4rem', md: '1.75rem' },
                  }}
                >
                  {currentCategoryObj.name}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 0.5 }}>
                  <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 500 }}>
                    Showing {filteredCrackers.length} products
                  </Typography>
                  {isLiveConnected ? (
                    <Chip
                      icon={<WifiIcon sx={{ fontSize: '14px !important' }} />}
                      label={`SQL Server Database (${productsList.length} Products)`}
                      size="small"
                      color="success"
                      variant="outlined"
                      sx={{ height: 22, fontSize: '0.72rem', fontWeight: 700 }}
                    />
                  ) : (
                    <Chip
                      icon={<WifiOffIcon sx={{ fontSize: '14px !important' }} />}
                      label={loadingApi ? "Loading from SQL Server..." : "Catalog Active"}
                      size="small"
                      color="warning"
                      variant="outlined"
                      sx={{ height: 22, fontSize: '0.72rem', fontWeight: 600 }}
                    />
                  )}
                </Box>
              </Box>

              <FormControl size="small" sx={{ minWidth: 160 }}>
                <InputLabel id="sort-select-label" sx={{ fontSize: '0.85rem' }}>
                  Sort by
                </InputLabel>
                <Select
                  labelId="sort-select-label"
                  id="sort-select"
                  value={sortBy}
                  label="Sort by"
                  onChange={(e) => setSortBy(e.target.value)}
                  sx={{
                    borderRadius: 2,
                    fontSize: '0.85rem',
                    backgroundColor: '#FFFFFF',
                  }}
                >
                  <MenuItem value="popular">Sort by: Popular</MenuItem>
                  <MenuItem value="price_asc">Price: Low to High</MenuItem>
                  <MenuItem value="price_desc">Price: High to Low</MenuItem>
                  <MenuItem value="rating">Highest Rated</MenuItem>
                  <MenuItem value="discount">Biggest Discount</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* Empty State */}
            {filteredCrackers.length === 0 && (
              <Box
                sx={{
                  p: 6,
                  textAlign: 'center',
                  backgroundColor: '#FFFFFF',
                  borderRadius: 3,
                  border: '1px dashed #CBD5E1',
                }}
              >
                <Typography variant="h6" sx={{ color: '#64748B', mb: 1 }}>
                  No crackers found matching your criteria.
                </Typography>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setSelectedCategory('all')
                    setPriceRange([50, 2000])
                    setAppliedPriceRange([50, 2000])
                  }}
                  sx={{ mt: 1, borderColor: '#FFA000', color: '#0B132B' }}
                >
                  Reset All Filters
                </Button>
              </Box>
            )}

            {/* Product Cards Grid */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: 'repeat(2, 1fr)',
                  md: 'repeat(3, 1fr)',
                  lg: 'repeat(4, 1fr)',
                  xl: 'repeat(5, 1fr)',
                },
                gap: 2,
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
                    {/* Discount & S.No Badges */}
                    <Chip
                      label={`${product.discountPercent}% OFF`}
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 8,
                        left: 8,
                        zIndex: 2,
                        backgroundColor: '#FFA000',
                        color: '#0B132B',
                        fontWeight: 900,
                        fontSize: '0.74rem',
                        height: 24,
                      }}
                    />

                    {inCartQty > 0 ? (
                      <Chip
                        icon={<CheckCircleIcon sx={{ fontSize: '13px !important', color: '#0B132B !important' }} />}
                        label={`In Cart (${inCartQty})`}
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          zIndex: 2,
                          backgroundColor: '#FFA000',
                          color: '#0B132B',
                          fontWeight: 900,
                          fontSize: '0.74rem',
                          height: 24,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                        }}
                      />
                    ) : (
                      <Chip
                        label={`#${product.sno}`}
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          zIndex: 2,
                          backgroundColor: 'rgba(11, 19, 43, 0.88)',
                          color: '#FFA000',
                          fontWeight: 800,
                          fontSize: '0.74rem',
                          height: 24,
                          backdropFilter: 'blur(4px)',
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
                    <CardContent sx={{ p: 1.8, pb: '14px !important', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                      <Typography
                        variant="subtitle1"
                        sx={{
                          fontWeight: 800,
                          color: '#0F172A',
                          fontSize: '1.05rem',
                          lineHeight: 1.2,
                          height: 38,
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
                          fontSize: '0.82rem',
                          display: 'block',
                          mb: 1,
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
                          mb: 1.5,
                        }}
                      >
                        <Chip
                          size="small"
                          label={product.pieces || '1 Box'}
                          sx={{
                            height: 22,
                            fontSize: '0.72rem',
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
                              fontSize: '1.35rem',
                              lineHeight: 1,
                            }}
                          >
                            ₹{product.discountPrice}
                          </Typography>
                          {product.originalPrice > product.discountPrice && (
                            <Typography
                              variant="caption"
                              sx={{
                                color: '#94A3B8',
                                textDecoration: 'line-through',
                                fontSize: '0.75rem',
                                display: 'block',
                              }}
                            >
                              ₹{product.originalPrice}
                            </Typography>
                          )}
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
                                mb: 1,
                                px: 1,
                                py: 0.4,
                              }}
                            >
                              <IconButton
                                size="small"
                                onClick={() => onUpdateQuantity && onUpdateQuantity(product.id, -1)}
                                sx={{ p: 0.4, color: '#B45309' }}
                              >
                                <RemoveIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                              <Typography variant="body2" sx={{ fontWeight: 900, color: '#92400E', fontSize: '0.92rem' }}>
                                {inCartQty} in Cart
                              </Typography>
                              <IconButton
                                size="small"
                                onClick={() => onUpdateQuantity && onUpdateQuantity(product.id, 1)}
                                sx={{ p: 0.4, color: '#B45309' }}
                              >
                                <AddIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Box>

                            <Button
                              variant="contained"
                              fullWidth
                              startIcon={<ShoppingCartIcon sx={{ fontSize: '16px !important' }} />}
                              onClick={() => (onOpenCart ? onOpenCart() : handleAdd(product))}
                              sx={{
                                backgroundColor: '#0B132B',
                                color: '#FFA000',
                                fontWeight: 800,
                                fontSize: '0.85rem',
                                py: 0.7,
                                borderRadius: 2,
                                textTransform: 'none',
                                '&:hover': {
                                  backgroundColor: '#1E293B',
                                },
                              }}
                            >
                              View in Cart →
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
                                mb: 1,
                                py: 0.3,
                              }}
                            >
                              <IconButton
                                size="small"
                                onClick={() => handleQuantityChange(product.id, -1)}
                                disabled={currentQty <= 1}
                                sx={{ p: 0.5 }}
                              >
                                <RemoveIcon sx={{ fontSize: 18 }} />
                              </IconButton>
                              <Typography
                                variant="body2"
                                sx={{
                                  px: 2,
                                  fontWeight: 800,
                                  fontSize: '0.96rem',
                                  minWidth: 26,
                                  textAlign: 'center',
                                }}
                              >
                                {currentQty}
                              </Typography>
                              <IconButton
                                size="small"
                                onClick={() => handleQuantityChange(product.id, 1)}
                                sx={{ p: 0.5 }}
                              >
                                <AddIcon sx={{ fontSize: 18 }} />
                              </IconButton>
                            </Box>

                            <Button
                              variant="contained"
                              fullWidth
                              startIcon={<ShoppingCartIcon sx={{ fontSize: '18px !important' }} />}
                              onClick={() => handleAdd(product)}
                              sx={{
                                backgroundColor: '#FFA000',
                                color: '#0B132B',
                                fontWeight: 900,
                                fontSize: '0.92rem',
                                py: 0.9,
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
