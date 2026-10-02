import React, { useState } from 'react'
import {
  ThemeProvider,
  CssBaseline,
  Box,
  Fab,
  Badge,
  Typography,
} from '@mui/material'
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import { theme } from './theme'
import Navbar from './Components/Navbar'
import FeaturesBanner from './Components/FeaturesBanner'
import BrochureModal from './Components/BrochureModal'
import OffersModal from './Components/OffersModal'
import OrderSuccessModal from './Components/OrderSuccessModal'
import RightCartDrawer from './Components/RightCartDrawer'
import OrderPlacementModal from './Components/OrderPlacementModal'
import OrderDetailsModal from './Components/OrderDetailsModal'
import HomePage from './Pages/HomePage'
import CrackersListPage from './Pages/CrackersListPage'
import CartPage from './Pages/CartPage'
import CustomerDetailsPage from './Pages/CustomerDetailsPage'
import CheckoutPage from './Pages/CheckoutPage'
import AdminPanelPage from './Pages/AdminPanelPage'

function App() {
  const [activePage, setActivePage] = useState('home')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [cart, setCart] = useState([])
  const [customerData, setCustomerData] = useState(null)

  // Drawer & Modals state
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false)
  const [orderModalOpen, setOrderModalOpen] = useState(false)
  const [orderDetailsOpen, setOrderDetailsOpen] = useState(false)
  const [brochureOpen, setBrochureOpen] = useState(false)
  const [offersOpen, setOffersOpen] = useState(false)
  const [orderSuccessOpen, setOrderSuccessOpen] = useState(false)
  const [placedOrderDetails, setPlacedOrderDetails] = useState(null)

  // Cart total items count
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)
  const cartSubtotal = cart.reduce(
    (sum, item) => sum + item.product.discountPrice * item.quantity,
    0
  )

  // Add to cart handler - automatically opens right-side cart drawer
  const handleAddToCart = (product, quantity = 1) => {
    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((item) => item.product.id === product.id)
      if (existingIndex > -1) {
        const newCart = [...prevCart]
        newCart[existingIndex] = {
          ...newCart[existingIndex],
          quantity: newCart[existingIndex].quantity + quantity,
        }
        return newCart
      } else {
        return [...prevCart, { product, quantity }]
      }
    })
    // Update cart badge quietly without popping drawer open
  }

  // Update item quantity in cart
  const handleUpdateQuantity = (productId, delta) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta
            return newQty > 0 ? { ...item, quantity: newQty } : null
          }
          return item
        })
        .filter(Boolean)
    )
  }

  // Remove item from cart
  const handleRemoveItem = (productId) => {
    setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId))
  }

  // Handle Category select from Home page
  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId)
    setActivePage('crackers')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Order Placement callback
  const handlePlaceOrder = (orderSummary) => {
    setPlacedOrderDetails(orderSummary)
    setOrderSuccessOpen(true)
    setCart([])
  }

  // Order success continue shopping
  const handleOrderFinished = () => {
    setOrderSuccessOpen(false)
    setCart([]) // Clear cart after successful order
    setActivePage('crackers')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#F8FAFC',
          position: 'relative',
        }}
      >
        {/* Navigation Bar */}
        <Navbar
          activePage={activePage}
          setActivePage={(page) => {
            setActivePage(page)
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
          cartCount={cartCount}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onOpenBrochure={() => setBrochureOpen(true)}
          onOpenCart={() => setCartDrawerOpen(true)}
          onOpenOrderDetails={() => setOrderDetailsOpen(true)}
        />

        {/* Dynamic Page Content */}
        <Box component="main" sx={{ flexGrow: 1 }}>
          {activePage === 'home' && (
            <HomePage
              onShopNow={() => {
                setActivePage('crackers')
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              onCategorySelect={handleCategorySelect}
              onOpenBrochure={() => setBrochureOpen(true)}
            />
          )}

          {activePage === 'crackers' && (
            <CrackersListPage
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              cart={cart}
              onAddToCart={handleAddToCart}
              onUpdateQuantity={handleUpdateQuantity}
              onOpenCart={() => setCartDrawerOpen(true)}
            />
          )}

          {activePage === 'cart' && (
            <CartPage
              cart={cart}
              onUpdateQuantity={handleUpdateQuantity}
              onRemoveItem={handleRemoveItem}
              onContinueShopping={() => {
                setActivePage('crackers')
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              onProceedToPayment={() => {
                setOrderModalOpen(true)
              }}
            />
          )}

          {activePage === 'customer-details' && (
            <CustomerDetailsPage
              cart={cart}
              customerData={customerData}
              onBack={() => {
                setActivePage('cart')
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              onContinue={(data) => {
                setCustomerData(data)
                setActivePage('checkout')
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
            />
          )}

          {activePage === 'checkout' && (
            <CheckoutPage
              cart={cart}
              customerData={customerData}
              onBackToCart={() => {
                setActivePage('crackers')
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              onPlaceOrder={handlePlaceOrder}
            />
          )}

          {activePage === 'admin' && (
            <AdminPanelPage
              onExitAdmin={() => {
                setActivePage('home')
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
            />
          )}
        </Box>

        {/* Floating Quick Cart Action Button (Bottom-Right) */}
        {cartCount > 0 && activePage !== 'admin' && (
          <Fab
            variant="extended"
            onClick={() => setCartDrawerOpen(true)}
            sx={{
              position: 'fixed',
              bottom: { xs: 20, md: 32 },
              right: { xs: 20, md: 32 },
              zIndex: 1200,
              backgroundColor: '#0B132B',
              color: '#FFA000',
              fontWeight: 800,
              px: 3,
              py: 1.6,
              borderRadius: '32px',
              border: '2px solid #FFA000',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.45)',
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              '&:hover': {
                backgroundColor: '#162244',
                transform: 'scale(1.04)',
              },
              transition: 'all 0.25s ease',
            }}
          >
            <Badge badgeContent={cartCount} color="error">
              <ShoppingCartIcon sx={{ color: '#FFA000' }} />
            </Badge>
            <Typography variant="body2" sx={{ fontWeight: 800, color: '#FFFFFF' }}>
              View Cart (₹{cartSubtotal})
            </Typography>
          </Fab>
        )}

        {/* Right-Side Slide-out Drawer Cart */}
        <RightCartDrawer
          open={cartDrawerOpen}
          onClose={() => setCartDrawerOpen(false)}
          cart={cart}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          onProceedToOrder={() => setOrderModalOpen(true)}
        />

        {/* Order Placement Modal (Phone Verification & DB Save) */}
        <OrderPlacementModal
          open={orderModalOpen}
          onClose={() => setOrderModalOpen(false)}
          cart={cart}
          onOrderSuccess={handlePlaceOrder}
          onProceedToCheckout={(custData) => {
            setCustomerData(custData)
            setOrderModalOpen(false)
            setActivePage('checkout')
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
          onRestoreCart={(items) => setCart(items)}
        />

        {/* Bottom Features Banner & Footer (Normal scroll flow) */}
        <FeaturesBanner
          isFrozen={false}
          onOpenOffers={() => setOffersOpen(true)}
        />

        {/* Modals & Dialogs */}
        <BrochureModal
          open={brochureOpen}
          onClose={() => setBrochureOpen(false)}
          onShopNow={() => {
            setActivePage('crackers')
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
        />

        <OffersModal
          open={offersOpen}
          onClose={() => setOffersOpen(false)}
          onApplyCoupon={(code) => {
            // Coupon logic
          }}
        />

        <OrderSuccessModal
          open={orderSuccessOpen}
          orderDetails={placedOrderDetails}
          onClose={() => setOrderSuccessOpen(false)}
          onContinueShopping={handleOrderFinished}
          onViewOrderDetails={() => {
            setOrderSuccessOpen(false)
            setOrderDetailsOpen(true)
          }}
        />

        <OrderDetailsModal
          open={orderDetailsOpen}
          onClose={() => setOrderDetailsOpen(false)}
          initialMobile={placedOrderDetails?.customer?.phone || customerData?.mobileNumber || ''}
          cart={cart}
          onRestoreCart={(items) => setCart(items)}
          onOpenShop={(cust) => {
            if (cust) setCustomerData(cust)
            setOrderDetailsOpen(false)
            setActivePage('crackers')
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
          onProceedToCheckout={(cust) => {
            if (cust) setCustomerData(cust)
            setOrderDetailsOpen(false)
            setActivePage('checkout')
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
        />
      </Box>
    </ThemeProvider>
  )
}

export default App
