import React, { useState } from 'react'
import {
  Box,
  Container,
  Grid,
  Typography,
  Link,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Chip,
  IconButton,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import PhoneIcon from '@mui/icons-material/Phone'
import EmailIcon from '@mui/icons-material/Email'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser'
import LocalShippingIcon from '@mui/icons-material/LocalShipping'
import PolicyIcon from '@mui/icons-material/Policy'
import SecurityIcon from '@mui/icons-material/Security'
import WhatsAppIcon from '@mui/icons-material/WhatsApp'

const policiesData = {
  about: {
    title: 'About Sky Fire Crackers',
    content: (
      <Box sx={{ lineHeight: 1.8 }}>
        <Typography variant="body1" paragraph>
          <strong>Sky Fire Crackers</strong> is a premier licensed fireworks manufacturer and wholesale distributor based directly in Sivakasi, the fireworks capital of India. We are committed to brightening your Diwali and festive celebrations with genuine, premium quality, and eco-friendly green crackers.
        </Typography>
        <Typography variant="body1" paragraph>
          Our mission is to eliminate middlemen margins and provide factory-direct wholesale pricing (up to 80% discount) to families and retailers across Tamil Nadu and South India. All products are tested for safety, low smoke emission, and vibrant acoustic-visual performance in accordance with national safety standards.
        </Typography>
        <Box sx={{ mt: 2, p: 2, bgcolor: '#F8FAFC', borderRadius: 2, border: '1px solid #E2E8F0' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0B132B', mb: 1 }}>
            Enterprise & Merchant Details:
          </Typography>
          <Typography variant="body2"><strong>Entity / Merchant Name:</strong> Sri Venkateshwaran / Sky Fire Crackers</Typography>
          <Typography variant="body2"><strong>Registered Location:</strong> No 68, Virudhunagar Road, Anaikottam, Sivakasi - 626 130, Tamil Nadu, India</Typography>
          <Typography variant="body2"><strong>Product Standards:</strong> 100% Certified Green Crackers (CSIR-NEERI Approved)</Typography>
          <Typography variant="body2"><strong>Compliance:</strong> Indian Explosives Act & PESO Guidelines</Typography>
        </Box>
      </Box>
    ),
  },
  terms: {
    title: 'Terms & Conditions',
    content: (
      <Box sx={{ lineHeight: 1.8 }}>
        <Typography variant="body2" paragraph>
          <strong>1. Acceptance of Terms:</strong> By accessing and placing an order on Sky Fire Crackers (<code>sky-crackers-silk.vercel.app</code>), you acknowledge and agree to comply with and be bound by the following terms and conditions.
        </Typography>
        <Typography variant="body2" paragraph>
          <strong>2. Age Requirement & Safety:</strong> In compliance with the Indian Explosives Act, all customers placing an order must be at least 18 years of age. Fireworks must be stored in a cool, dry place away from heat and must be ignited under direct adult supervision in open outdoor spaces.
        </Typography>
        <Typography variant="body2" paragraph>
          <strong>3. Wholesale Festive Booking:</strong> As per Supreme Court guidelines regarding the seasonal dispatch of fireworks, our platform serves as an online catalog and festival booking service. All orders are packed and dispatched directly from our licensed wholesale facility in Sivakasi.
        </Typography>
        <Typography variant="body2" paragraph>
          <strong>4. Pricing and Product Representation:</strong> While we strive for absolute accuracy, fireworks packaging designs and brand labels may vary slightly based on seasonal factory batches while maintaining identical chemical composition, size, and burst quality. All listed prices are wholesale rates with maximum discounts applied.
        </Typography>
        <Typography variant="body2" paragraph>
          <strong>5. Legal Jurisdiction:</strong> Any dispute, claim, or controversy arising out of transactions on this platform shall be governed by the laws of India and subject to the exclusive jurisdiction of the competent courts in Sivakasi, Tamil Nadu.
        </Typography>
      </Box>
    ),
  },
  privacy: {
    title: 'Privacy Policy',
    content: (
      <Box sx={{ lineHeight: 1.8 }}>
        <Typography variant="body2" paragraph>
          <strong>1. Information We Collect:</strong> When you book or purchase fireworks through our platform, we collect essential customer information including your Full Name, Mobile Phone Number, Delivery Address (Door No, Street, Area, City, District, PIN Code), and Email Address.
        </Typography>
        <Typography variant="body2" paragraph>
          <strong>2. Purpose of Information Collection:</strong> Customer details are strictly utilized to:
          <ul>
            <li>Process, assemble, and pack your festival fireworks order accurately.</li>
            <li>Coordinate regional lorry transport and parcel hub delivery.</li>
            <li>Send order confirmation, digital tax invoices, and real-time delivery status updates.</li>
          </ul>
        </Typography>
        <Typography variant="body2" paragraph>
          <strong>3. Payment Information Security:</strong> All digital transactions (UPI, Credit/Debit Cards, Net Banking) are securely routed through <strong>Razorpay Payment Gateway</strong>, a Reserve Bank of India (RBI) authorized payment aggregator. We do NOT capture, store, or have access to your bank passwords, CVVs, or UPI PINs. Communication is protected via bank-grade 256-bit SSL encryption.
        </Typography>
        <Typography variant="body2" paragraph>
          <strong>4. Non-Disclosure & Data Protection:</strong> We do NOT sell, rent, trade, or share your contact numbers or personal information with any third-party marketing firms. Your information is protected under industry standard data security safeguards.
        </Typography>
      </Box>
    ),
  },
  shipping: {
    title: 'Shipping & Delivery Policy',
    content: (
      <Box sx={{ lineHeight: 1.8 }}>
        <Typography variant="body2" paragraph>
          <strong>1. Dispatch Origin:</strong> All consignments are packed and dispatched directly from our central fireworks warehouse located at No 68, Virudhunagar Road, Anaikottam, Sivakasi - 626 130.
        </Typography>
        <Typography variant="body2" paragraph>
          <strong>2. Transportation Method & Delivery Charge Concept:</strong> Due to safety regulations governing the transport of pyrotechnic products, fireworks are transported via authorized and licensed regional parcel transport services. Consignments are dispatched to the customer door or nearest transport parcel office. <strong>Actual transport delivery charges are To-Pay at the time of delivery upon collecting the parcel.</strong>
        </Typography>
        <Typography variant="body2" paragraph>
          <strong>3. Delivery Timelines:</strong>
          <ul>
            <li><strong>Tamil Nadu:</strong> 2 to 4 business days.</li>
            <li><strong>Other South Indian States:</strong> 3 to 6 business days.</li>
          </ul>
        </Typography>
      </Box>
    ),
  },
  refund: {
    title: 'Refund & Cancellation Policy',
    content: (
      <Box sx={{ lineHeight: 1.8 }}>
        <Typography variant="body2" paragraph>
          <strong>1. Cancellation Before Dispatch:</strong> Customers can cancel their booking free of charge at any time before the order has been handed over to the transport carrier by contacting our support team at <strong>+91 95971 67401 / +91 80567 04353</strong> or email <strong>skyfirecrackers@gmail.com</strong> with your Order Number.
        </Typography>
        <Typography variant="body2" paragraph>
          <strong>2. Damaged or Defective Items:</strong> While we ensure supreme multi-layer packaging, in the rare event of transit carton damage or missing items, contact our customer support team within 48 hours of receipt via WhatsApp (+91 95971 67401 / +91 80567 04353). Upon verification, we will provide an immediate free product replacement or issue a full refund.
        </Typography>
        <Typography variant="body2" paragraph>
          <strong>3. Refund Processing Timelines:</strong> Approved refunds are automatically credited back to the original source account via Razorpay within <strong>5 to 7 business working days</strong>.
        </Typography>
      </Box>
    ),
  },
  contact: {
    title: 'Contact Us & Customer Support',
    content: (
      <Box sx={{ lineHeight: 1.8 }}>
        <Typography variant="body1" paragraph>
          We are always happy to assist you with wholesale price inquiries, festival booking, corporate gift orders, or payment queries.
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, p: 1.5, bgcolor: '#F8FAFC', borderRadius: 2 }}>
            <LocationOnIcon sx={{ color: '#D97706', mt: 0.3 }} />
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0B132B' }}>
                Factory Outlet & Registered Address:
              </Typography>
              <Typography variant="body2" sx={{ color: '#475569' }}>
                Sky Fire Crackers (Sri Venkateshwaran)<br />
                No 68, Virudhunagar Road, Anaikottam,<br />
                Sivakasi - 626 130, Virudhunagar District, Tamil Nadu, India.
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, bgcolor: '#F8FAFC', borderRadius: 2 }}>
            <PhoneIcon sx={{ color: '#16A34A' }} />
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0B132B' }}>
                Customer Helpline (Call & Support):
              </Typography>
              <Typography variant="body2" sx={{ color: '#475569' }}>
                <strong>+91 95971 67401</strong> (Primary) | <strong>+91 80567 04353</strong>
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, bgcolor: '#F8FAFC', borderRadius: 2 }}>
            <WhatsAppIcon sx={{ color: '#25D366' }} />
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0B132B' }}>
                WhatsApp Fast Support (Priority):
              </Typography>
              <Typography variant="body2" sx={{ color: '#475569' }}>
                <strong>+91 95971 67401</strong> / <strong>+91 80567 04353</strong>
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, bgcolor: '#F8FAFC', borderRadius: 2 }}>
            <EmailIcon sx={{ color: '#2563EB' }} />
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0B132B' }}>
                Official Email Address:
              </Typography>
              <Typography variant="body2" sx={{ color: '#475569' }}>
                skyfirecrackers@gmail.com
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, bgcolor: '#F8FAFC', borderRadius: 2 }}>
            <AccessTimeIcon sx={{ color: '#9333EA' }} />
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0B132B' }}>
                Operating Working Hours:
              </Typography>
              <Typography variant="body2" sx={{ color: '#475569' }}>
                Monday to Sunday: 8:00 AM – 10:00 PM IST (Active during all festive seasons)
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    ),
  },
}

export default function Footer({ onNavigate, onOpenBrochure, onOpenOffers }) {
  const [activePolicy, setActivePolicy] = useState(null)

  const handleOpenPolicy = (policyKey) => {
    setActivePolicy(policyKey)
  }

  const handleClosePolicy = () => {
    setActivePolicy(null)
  }

  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: '#070C1E',
        color: '#E2E8F0',
        pt: { xs: 5, md: 7 },
        pb: 4,
        borderTop: '3px solid #FFA000',
        mt: 'auto',
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          {/* Column 1: Brand & About */}
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
              <Box
                sx={{
                  width: 38,
                  height: 38,
                  borderRadius: '50%',
                  bgcolor: '#FFA000',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  color: '#070C1E',
                  fontSize: '1.2rem',
                }}
              >
                🎆
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 900, color: '#FFA000', lineHeight: 1.1 }}>
                  Sky Fire Crackers
                </Typography>
                <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600 }}>
                  Direct Sivakasi Wholesale Factory Outlet
                </Typography>
              </Box>
            </Box>

            <Typography variant="body2" sx={{ color: '#94A3B8', lineHeight: 1.7, mb: 2 }}>
              Tamil Nadu’s most trusted wholesale online cracker portal. 100% genuine Sivakasi fireworks, CSIR-NEERI certified green crackers, safe packing, and fast regional transport delivery across South India.
            </Typography>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <Chip
                icon={<VerifiedUserIcon sx={{ fontSize: 16, color: '#10B981 !important' }} />}
                label="100% Genuine Sivakasi"
                size="small"
                sx={{ bgcolor: 'rgba(16, 185, 129, 0.1)', color: '#34D399', fontWeight: 700, fontSize: '0.72rem' }}
              />
              <Chip
                icon={<SecurityIcon sx={{ fontSize: 16, color: '#38BDF8 !important' }} />}
                label="Razorpay Secure"
                size="small"
                sx={{ bgcolor: 'rgba(56, 189, 248, 0.1)', color: '#38BDF8', fontWeight: 700, fontSize: '0.72rem' }}
              />
              <Chip
                icon={<LocalShippingIcon sx={{ fontSize: 16, color: '#FBBF24 !important' }} />}
                label="Transport Delivery"
                size="small"
                sx={{ bgcolor: 'rgba(251, 191, 36, 0.1)', color: '#FBBF24', fontWeight: 700, fontSize: '0.72rem' }}
              />
            </Box>
          </Grid>

          {/* Column 2: Quick Links */}
          <Grid item xs={6} sm={4} md={2}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#FFA000', mb: 2 }}>
              Quick Links
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
              <Link
                component="button"
                onClick={() => onNavigate?.('home')}
                sx={{ color: '#CBD5E1', textAlign: 'left', textDecoration: 'none', fontSize: '0.88rem', '&:hover': { color: '#FFA000' } }}
              >
                Home
              </Link>
              <Link
                component="button"
                onClick={() => onNavigate?.('crackers')}
                sx={{ color: '#CBD5E1', textAlign: 'left', textDecoration: 'none', fontSize: '0.88rem', '&:hover': { color: '#FFA000' } }}
              >
                Price List 2026
              </Link>
              <Link
                component="button"
                onClick={onOpenBrochure}
                sx={{ color: '#CBD5E1', textAlign: 'left', textDecoration: 'none', fontSize: '0.88rem', '&:hover': { color: '#FFA000' } }}
              >
                Download PDF Price List
              </Link>
              <Link
                component="button"
                onClick={() => onNavigate?.('crackers')}
                sx={{ color: '#CBD5E1', textAlign: 'left', textDecoration: 'none', fontSize: '0.88rem', '&:hover': { color: '#FFA000' } }}
              >
                Shop Crackers
              </Link>
              <Link
                component="button"
                onClick={() => onNavigate?.('admin')}
                sx={{ color: '#94A3B8', textAlign: 'left', textDecoration: 'none', fontSize: '0.82rem', '&:hover': { color: '#FFA000' } }}
              >
                Admin Login
              </Link>
            </Box>
          </Grid>

          {/* Column 3: Legal & Razorpay Compliance */}
          <Grid item xs={6} sm={4} md={3}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#FFA000', mb: 2 }}>
              Legal & Policies
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.2 }}>
              <Link
                component="button"
                onClick={() => handleOpenPolicy('about')}
                sx={{ color: '#CBD5E1', textAlign: 'left', textDecoration: 'none', fontSize: '0.88rem', '&:hover': { color: '#FFA000' } }}
              >
                About Our Enterprise
              </Link>
              <Link
                component="button"
                onClick={() => handleOpenPolicy('terms')}
                sx={{ color: '#CBD5E1', textAlign: 'left', textDecoration: 'none', fontSize: '0.88rem', '&:hover': { color: '#FFA000' } }}
              >
                Terms & Conditions
              </Link>
              <Link
                component="button"
                onClick={() => handleOpenPolicy('privacy')}
                sx={{ color: '#CBD5E1', textAlign: 'left', textDecoration: 'none', fontSize: '0.88rem', '&:hover': { color: '#FFA000' } }}
              >
                Privacy Policy
              </Link>
              <Link
                component="button"
                onClick={() => handleOpenPolicy('shipping')}
                sx={{ color: '#CBD5E1', textAlign: 'left', textDecoration: 'none', fontSize: '0.88rem', '&:hover': { color: '#FFA000' } }}
              >
                Shipping & Delivery Policy
              </Link>
              <Link
                component="button"
                onClick={() => handleOpenPolicy('refund')}
                sx={{ color: '#CBD5E1', textAlign: 'left', textDecoration: 'none', fontSize: '0.88rem', '&:hover': { color: '#FFA000' } }}
              >
                Refund & Cancellation Policy
              </Link>
            </Box>
          </Grid>

          {/* Column 4: Registered Contact Info */}
          <Grid item xs={12} sm={4} md={3}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#FFA000', mb: 2 }}>
              Direct Factory Contact
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <LocationOnIcon sx={{ color: '#FFA000', fontSize: 20, mt: 0.2 }} />
                <Typography variant="body2" sx={{ color: '#CBD5E1', fontSize: '0.82rem', lineHeight: 1.5 }}>
                  <strong>Sky Fire Crackers</strong><br />
                  No 68, Virudhunagar Road, Anaikottam,<br />
                  Sivakasi - 626 130, Tamil Nadu, India.
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <PhoneIcon sx={{ color: '#10B981', fontSize: 18 }} />
                <Typography variant="body2" sx={{ color: '#CBD5E1', fontSize: '0.84rem' }}>
                  <a href="tel:+919597167401" style={{ color: '#CBD5E1', textDecoration: 'none' }}>
                    <strong>+91 95971 67401</strong>
                  </a>
                  {' / '}
                  <a href="tel:+918056704353" style={{ color: '#CBD5E1', textDecoration: 'none' }}>
                    <strong>+91 80567 04353</strong>
                  </a>
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <WhatsAppIcon sx={{ color: '#25D366', fontSize: 18 }} />
                <Typography variant="body2" sx={{ color: '#CBD5E1', fontSize: '0.84rem' }}>
                  <a href="https://wa.me/919597167401" target="_blank" rel="noopener noreferrer" style={{ color: '#34D399', textDecoration: 'none', fontWeight: 700 }}>
                    WhatsApp: +91 95971 67401
                  </a>
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <EmailIcon sx={{ color: '#38BDF8', fontSize: 18 }} />
                <Typography variant="body2" sx={{ color: '#CBD5E1', fontSize: '0.84rem' }}>
                  <a href="mailto:skyfirecrackers@gmail.com" style={{ color: '#CBD5E1', textDecoration: 'none' }}>
                    skyfirecrackers@gmail.com
                  </a>
                </Typography>
              </Box>

              <Button
                variant="outlined"
                size="small"
                onClick={() => handleOpenPolicy('contact')}
                sx={{
                  borderColor: '#FFA000',
                  color: '#FFA000',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  textTransform: 'none',
                  mt: 0.5,
                  '&:hover': {
                    borderColor: '#FF8F00',
                    backgroundColor: 'rgba(255, 160, 0, 0.08)',
                  },
                }}
              >
                View Full Contact & Hours →
              </Button>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 4, borderColor: 'rgba(255, 255, 255, 0.1)' }} />

        {/* Payment Methods and Security Banner */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 2,
            mb: 3,
            p: 2,
            borderRadius: 2,
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SecurityIcon sx={{ color: '#10B981', fontSize: 20 }} />
            <Typography variant="body2" sx={{ color: '#94A3B8', fontSize: '0.8rem' }}>
              <strong>100% Secure Checkout:</strong> Online Payment (UPI, Google Pay, PhonePe, Cards, Net Banking)
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip label="UPI" size="small" sx={{ bgcolor: '#1E293B', color: '#F1F5F9', fontWeight: 800, fontSize: '0.7rem' }} />
            <Chip label="Google Pay" size="small" sx={{ bgcolor: '#1E293B', color: '#F1F5F9', fontWeight: 800, fontSize: '0.7rem' }} />
            <Chip label="PhonePe" size="small" sx={{ bgcolor: '#1E293B', color: '#F1F5F9', fontWeight: 800, fontSize: '0.7rem' }} />
            <Chip label="RuPay" size="small" sx={{ bgcolor: '#1E293B', color: '#F1F5F9', fontWeight: 800, fontSize: '0.7rem' }} />
            <Chip label="Visa / MasterCard" size="small" sx={{ bgcolor: '#1E293B', color: '#F1F5F9', fontWeight: 800, fontSize: '0.7rem' }} />
            <Chip label="Net Banking" size="small" sx={{ bgcolor: '#1E293B', color: '#F1F5F9', fontWeight: 800, fontSize: '0.7rem' }} />
          </Box>
        </Box>

        {/* Copyright Simple */}
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2" sx={{ color: '#94A3B8', fontWeight: 600, fontSize: '0.82rem' }}>
            © 2026 all rights sky fire crackers
          </Typography>
        </Box>
      </Container>

      {/* Interactive Legal Policy Dialog */}
      <Dialog
        open={Boolean(activePolicy)}
        onClose={handleClosePolicy}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: 1,
            border: '2px solid #FFA000',
          },
        }}
      >
        <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E2E8F0' }}>
          <Typography variant="h6" sx={{ fontWeight: 900, color: '#0B132B' }}>
            {activePolicy ? policiesData[activePolicy]?.title : ''}
          </Typography>
          <IconButton onClick={handleClosePolicy} size="small" sx={{ color: '#64748B' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3, mt: 1 }}>
          {activePolicy ? policiesData[activePolicy]?.content : null}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #E2E8F0' }}>
          <Button
            onClick={handleClosePolicy}
            variant="contained"
            sx={{
              backgroundColor: '#0B132B',
              color: '#FFFFFF',
              fontWeight: 800,
              textTransform: 'none',
              borderRadius: 2,
              px: 3,
              '&:hover': {
                backgroundColor: '#1E293B',
              },
            }}
          >
            I Understand & Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
