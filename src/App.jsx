import React, { useState, useEffect } from 'react'
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
import OrderSuccessModal from './Components/OrderSuccessModal'
import RightCartDrawer from './Components/RightCartDrawer'
import OrderPlacementModal from './Components/OrderPlacementModal'
import OrderDetailsModal from './Components/OrderDetailsModal'
import Footer from './Components/Footer'
import HomePage from './Pages/HomePage'
import CrackersListPage from './Pages/CrackersListPage'
import CartPage from './Pages/CartPage'
import CustomerDetailsPage from './Pages/CustomerDetailsPage'
import CheckoutPage from './Pages/CheckoutPage'
import AdminPanelPage from './Pages/AdminPanelPage'
import PersonOrdersPage from './Pages/PersonOrdersPage'

function App() {
  const [activePage, setActivePage] = useState('home')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [cart, setCart] = useState([])
  const [customerData, setCustomerData] = useState(null)
  const [selectedPerson, setSelectedPerson] = useState(null)

  // Drawer & Modals state
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false)
  const [orderModalOpen, setOrderModalOpen] = useState(false)
  const [orderDetailsOpen, setOrderDetailsOpen] = useState(false)
  const [brochureOpen, setBrochureOpen] = useState(false)
  const [orderSuccessOpen, setOrderSuccessOpen] = useState(false)
  const [placedOrderDetails, setPlacedOrderDetails] = useState(null)

  // Handle mobile browser hardware back button navigation with stepped page hierarchy
  useEffect(() => {
    const isAnyModalOpen =
      cartDrawerOpen ||
      orderModalOpen ||
      orderDetailsOpen ||
      brochureOpen ||
      orderSuccessOpen

    // Push history state whenever modal opens or user navigates away from home
    if (isAnyModalOpen || activePage !== 'home') {
      window.history.pushState({ modalOpen: isAnyModalOpen, page: activePage }, '')
    }

    const handlePopState = () => {
      // Step 1: Close active modals first
      if (orderDetailsOpen) {
        setOrderDetailsOpen(false)
      } else if (orderModalOpen) {
        setOrderModalOpen(false)
      } else if (cartDrawerOpen) {
        setCartDrawerOpen(false)
      } else if (brochureOpen) {
        setBrochureOpen(false)
      } else if (orderSuccessOpen) {
        setOrderSuccessOpen(false)
      } else if (activePage === 'checkout') {
        // Step 2: Checkout -> Cart
        setActivePage('cart')
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } else if (activePage === 'cart') {
        // Step 3: Cart -> Crackers
        setActivePage('crackers')
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } else if (activePage === 'person-page') {
        // Step 4: Person Hub -> Crackers
        setActivePage('crackers')
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } else if (activePage === 'crackers' || activePage === 'admin') {
        // Step 5: Crackers / Admin -> Home
        setActivePage('home')
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [
    cartDrawerOpen,
    orderModalOpen,
    orderDetailsOpen,
    brochureOpen,
    orderSuccessOpen,
    activePage,
  ])

  // Cart restore handler with merging (preserves newly selected crackers)
  const handleRestoreCart = (items) => {
    if (!Array.isArray(items) || items.length === 0) return
    setCart((prevCart) => {
      const merged = [...prevCart]
      items.forEach((newItem) => {
        const idx = merged.findIndex(
          (i) =>
            i.product.id === newItem.product.id ||
            i.product.sno === newItem.product.sno ||
            i.product.name.toLowerCase() === newItem.product.name.toLowerCase()
        )
        if (idx > -1) {
          merged[idx] = {
            ...merged[idx],
            quantity: merged[idx].quantity + newItem.quantity,
          }
        } else {
          merged.push(newItem)
        }
      })
      return merged
    })
  }

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

  // Open dedicated Person / Customer Hub Page
  const [personPreviousPage, setPersonPreviousPage] = useState('crackers')
  const handleOpenPersonPage = (person, fromPage = activePage) => {
    if (person) {
      setSelectedPerson(person)
      setCustomerData((prev) => ({
        ...prev,
        fullName: person.customerName || person.fullName || prev?.fullName || '',
        mobileNumber: person.mobileNumber || person.customerPhone || person.phone || prev?.mobileNumber || '',
        address: person.address || person.deliveryAddress || prev?.address || '',
      }))
    }
    setPersonPreviousPage(fromPage === 'person-page' ? 'crackers' : fromPage)
    setOrderDetailsOpen(false)
    setActivePage('person-page')
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
              onOpenPersonPage={(person) => handleOpenPersonPage(person, 'admin')}
            />
          )}

          {activePage === 'person-page' && (
            <PersonOrdersPage
              person={selectedPerson}
              cart={cart}
              onUpdateCartQuantity={handleUpdateQuantity}
              onRemoveCartItem={handleRemoveItem}
              onAddProducts={() => {
                setActivePage('crackers')
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              onCheckoutCart={() => {
                if (selectedPerson) {
                  setCustomerData((prev) => ({
                    ...prev,
                    fullName: selectedPerson.customerName || selectedPerson.fullName || prev?.fullName || '',
                    mobileNumber: selectedPerson.mobileNumber || selectedPerson.customerPhone || selectedPerson.phone || prev?.mobileNumber || '',
                    address: selectedPerson.address || selectedPerson.deliveryAddress || prev?.address || '',
                  }))
                }
                setActivePage('checkout')
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              onBack={() => {
                setActivePage(personPreviousPage || 'crackers')
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
            />
          )}
        </Box>

        {/* Floating Quick Cart Action Button (Bottom-Right) - Styled like Produce Order button */}
        {cartCount > 0 && activePage !== 'admin' && activePage !== 'checkout' && activePage !== 'cart' && (
          <Fab
            variant="extended"
            onClick={() => setCartDrawerOpen(true)}
            sx={{
              position: 'fixed',
              bottom: { xs: 20, md: 32 },
              right: { xs: 20, md: 32 },
              zIndex: 1200,
              backgroundColor: '#FFA000',
              color: '#0B132B',
              fontWeight: 900,
              px: 3,
              py: 1.6,
              borderRadius: '32px',
              border: 'none',
              boxShadow: '0 8px 30px rgba(255, 160, 0, 0.45)',
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              '&:hover': {
                backgroundColor: '#FF8F00',
                transform: 'scale(1.04)',
              },
              transition: 'all 0.25s ease',
            }}
          >
            <Badge badgeContent={cartCount} color="error">
              <ShoppingCartIcon sx={{ color: '#0B132B' }} />
            </Badge>
            <Typography variant="body2" sx={{ fontWeight: 900, color: '#0B132B', fontSize: '0.94rem' }}>
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
          onRestoreCart={handleRestoreCart}
        />

        {/* Bottom Features Banner & Footer (Normal scroll flow) */}
        <FeaturesBanner
          isFrozen={false}
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
          onRestoreCart={handleRestoreCart}
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
          onOpenPersonPage={(cust) => handleOpenPersonPage(cust, 'crackers')}
        />

        {/* Professional Footer with Compliance Policies & Contact Details for Razorpay */}
        <Footer
          onNavigate={(page) => {
            setActivePage(page)
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
          onOpenBrochure={() => setBrochureOpen(true)}
        />
      </Box>
    </ThemeProvider>
  )
}

export default App
