import React from 'react'
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardActionArea,
  Stack,
  Chip,
  Paper,
} from '@mui/material'
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined'
import heroFireworksImg from '../assets/hero_fireworks.jpg'
import discount80Img from '../assets/discount_80_off.png'
import sparklersImg from '../assets/sparklers.jpg'
import flowerPotImg from '../assets/flowerpot.jpg'
import rocketsImg from '../assets/rockets.jpg'
import chakkarImg from '../assets/chakkar.jpg'
import bombsImg from '../assets/bombs.jpg'
import giftBoxImg from '../assets/giftbox.jpg'
import { STORE_INFO } from '../data/crackersData'

export default function HomePage({ onShopNow, onCategorySelect, onOpenBrochure }) {
  const categoryCards = [
    { id: 'sparklers', name: 'Sparklers', count: '10 Items', image: sparklersImg },
    { id: 'flowerpots', name: 'Flowerpots', count: '7 Items', image: flowerPotImg },
    { id: 'ground_chakkaras', name: 'Ground Chakkaras', count: '5 Items', image: chakkarImg },
    { id: 'sound_crackers', name: 'Sound Crackers', count: '10 Items', image: bombsImg },
    { id: 'fountain_items', name: 'Fountain & Fancy', count: '24 Items', image: flowerPotImg },
    { id: 'sky_shots', name: 'Sky Shots', count: '11 Items', image: rocketsImg },
    { id: 'gift_boxes', name: 'Gift Boxes', count: '4 Items', image: giftBoxImg },
    { id: 'new_arrivals', name: 'New Arrivals', count: '8 Items', image: rocketsImg },
  ]

  return (
    <Box sx={{ width: '100%' }}>
      {/* 1. Hero Section */}
      <Box
        sx={{
          position: 'relative',
          minHeight: { xs: 460, md: 560 },
          display: 'flex',
          alignItems: 'center',
          backgroundImage: `linear-gradient(90deg, rgba(11, 19, 43, 0.95) 0%, rgba(11, 19, 43, 0.8) 50%, rgba(11, 19, 43, 0.35) 100%), url(${heroFireworksImg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center right',
          color: '#FFFFFF',
          overflow: 'hidden',
          py: { xs: 6, md: 8 },
        }}
      >
        <Container maxWidth="xl">
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: { xs: 4, md: 2 },
              width: '100%',
            }}
          >
            {/* Left Content Column */}
            <Box sx={{ maxWidth: { xs: '100%', md: 540, lg: 620 }, zIndex: 2, flexShrink: 0 }}>
              {/* Tagline Pill */}
              <Box sx={{ mb: 2.5, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                <Chip
                  icon={<AutoAwesomeIcon sx={{ color: '#FFA000 !important', fontSize: 16 }} />}
                  label="80% OFF • SIVAKASI DIRECT SALE"
                  sx={{
                    backgroundColor: 'rgba(255, 160, 0, 0.2)',
                    color: '#FFA000',
                    fontWeight: 800,
                    fontSize: { xs: '0.72rem', sm: '0.82rem' },
                    border: '1px solid rgba(255, 160, 0, 0.4)',
                    backdropFilter: 'blur(4px)',
                    height: 28,
                  }}
                />
                <Chip
                  icon={<LocalShippingOutlinedIcon sx={{ color: '#FFFFFF !important', fontSize: 16 }} />}
                  label="DELIVERY ALL OVER TAMIL NADU"
                  sx={{
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: { xs: '0.72rem', sm: '0.8rem' },
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    height: 28,
                  }}
                />
              </Box>

              {/* Main Title */}
              <Typography
                variant="h1"
                sx={{
                  fontSize: { xs: '1.9rem', sm: '2.6rem', md: '3.1rem' },
                  fontWeight: 900,
                  lineHeight: 1.15,
                  mb: 1.5,
                  color: '#FFFFFF',
                  letterSpacing: '-0.02em',
                }}
              >
                Celebrate with{' '}
                <Box
                  component="span"
                  sx={{
                    background: 'linear-gradient(135deg, #FFA000 0%, #FFD54F 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    display: 'inline',
                  }}
                >
                  Light & Joy
                </Box>
              </Typography>

              {/* Tamil Subtitle & 2026 Collection */}
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  color: '#FFA000',
                  fontSize: { xs: '1.15rem', md: '1.45rem' },
                  mb: 0.5,
                }}
              >
                Sky Fire Crackers பட்டாசு கடை • Price List 2026
              </Typography>

              <Typography
                variant="body1"
                sx={{
                  color: 'rgba(255, 255, 255, 0.85)',
                  fontSize: { xs: '0.92rem', md: '1.05rem' },
                  letterSpacing: '0.04em',
                  mb: 3.5,
                }}
              >
                சிவகாசி விலைக்கு நேரடி விற்பனை &nbsp;•&nbsp; Wholesale & Retail Available
              </Typography>

              {/* Action Buttons */}
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 1.5, sm: 2 }} sx={{ maxWidth: { xs: '100%', sm: 520 } }}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<ShoppingCartIcon />}
                  onClick={onShopNow}
                  sx={{
                    backgroundColor: '#FFA000',
                    color: '#0B132B',
                    fontWeight: 900,
                    fontSize: { xs: '0.92rem', md: '1rem' },
                    px: { xs: 3, md: 4 },
                    py: { xs: 1.3, md: 1.5 },
                    borderRadius: 2.5,
                    boxShadow: '0 8px 24px rgba(255, 160, 0, 0.4)',
                    textTransform: 'none',
                    letterSpacing: '0.01em',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: '#FF8F00',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 12px 28px rgba(255, 160, 0, 0.5)',
                    },
                  }}
                >
                  Shop 91 Crackers Now
                </Button>

                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<DescriptionOutlinedIcon />}
                  onClick={onOpenBrochure}
                  sx={{
                    color: '#FFA000',
                    borderColor: '#FFA000',
                    borderWidth: '1.5px',
                    fontWeight: 800,
                    fontSize: { xs: '0.92rem', md: '1rem' },
                    px: { xs: 2.5, md: 3.5 },
                    py: { xs: 1.3, md: 1.5 },
                    borderRadius: 2.5,
                    backdropFilter: 'blur(4px)',
                    backgroundColor: 'rgba(255, 160, 0, 0.08)',
                    textTransform: 'none',
                    '&:hover': {
                      borderColor: '#FFB300',
                      backgroundColor: 'rgba(255, 160, 0, 0.18)',
                      transform: 'translateY(-2px)',
                    },
                  }}
                >
                  Download PDF Price List
                </Button>
              </Stack>
            </Box>

            {/* Right: 3D 80% OFF Showcase Badge Placed in Circled Fireworks Area */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                position: 'relative',
                zIndex: 2,
                mr: { xs: 0, md: 3, lg: 6, xl: 8 },
              }}
            >
              <Box
                sx={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  animation: 'floatBadge 4s ease-in-out infinite',
                  '@keyframes floatBadge': {
                    '0%': { transform: 'translateY(0px) rotate(0deg)' },
                    '50%': { transform: 'translateY(-14px) rotate(1.5deg)' },
                    '100%': { transform: 'translateY(0px) rotate(0deg)' },
                  },
                }}
              >
                {/* Radial Glow Behind 3D Badge */}
                <Box
                  sx={{
                    position: 'absolute',
                    width: '120%',
                    height: '120%',
                    borderRadius: '50%',
                    background:
                      'radial-gradient(circle, rgba(255, 160, 0, 0.55) 0%, rgba(229, 57, 53, 0.28) 45%, transparent 70%)',
                    filter: 'blur(40px)',
                    zIndex: 0,
                    pointerEvents: 'none',
                  }}
                />

                {/* 3D 80% OFF Image */}
                <Box
                  component="img"
                  src={discount80Img}
                  alt="80% OFF Sivakasi Wholesale Crackers"
                  sx={{
                    position: 'relative',
                    zIndex: 1,
                    width: { xs: 240, sm: 300, md: 360, lg: 410 },
                    maxWidth: '100%',
                    height: 'auto',
                    objectFit: 'contain',
                    filter:
                      'drop-shadow(0 20px 35px rgba(0, 0, 0, 0.75)) drop-shadow(0 0 30px rgba(255, 160, 0, 0.5))',
                    transition: 'transform 0.3s ease',
                    cursor: 'pointer',
                    '&:hover': {
                      transform: 'scale(1.08) rotate(-1deg)',
                    },
                  }}
                  onClick={onShopNow}
                />
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* 2. Shop by Category Section */}
      <Box sx={{ py: { xs: 5, md: 7 }, backgroundColor: '#F8FAFC' }}>
        <Container maxWidth="xl">
          <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 1.5 }}>
            <Box>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 800,
                  color: '#0F172A',
                  fontSize: { xs: '1.6rem', md: '2.1rem' },
                  mb: 0.5,
                }}
              >
                Shop by Category
              </Typography>
              <Typography variant="body1" sx={{ color: '#64748B', fontSize: '0.95rem' }}>
                Explore our full 91 items range with 80% Sivakasi factory discounts
              </Typography>
            </Box>

            <Button
              variant="contained"
              onClick={onShopNow}
              sx={{
                backgroundColor: '#FFA000',
                color: '#0B132B',
                fontWeight: 900,
                fontSize: { xs: '0.84rem', sm: '0.94rem' },
                px: { xs: 2.2, sm: 3 },
                py: { xs: 1, sm: 1.2 },
                borderRadius: 2.5,
                boxShadow: '0 4px 14px rgba(255, 160, 0, 0.35)',
                textTransform: 'none',
                whiteSpace: 'nowrap',
                '&:hover': {
                  backgroundColor: '#FF8F00',
                  boxShadow: '0 6px 20px rgba(255, 160, 0, 0.45)',
                },
              }}
            >
              View All 91 Products →
            </Button>
          </Box>

          {/* Category Cards Uniform Grid */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: 'repeat(2, 1fr)',
                sm: 'repeat(4, 1fr)',
                md: 'repeat(8, 1fr)',
              },
              gap: 2,
              alignItems: 'stretch',
            }}
          >
            {categoryCards.map((cat) => (
              <Card
                key={cat.id}
                sx={{
                  borderRadius: 3,
                  border: '1px solid #E2E8F0',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  backgroundColor: '#FFFFFF',
                  textAlign: 'center',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                  '&:hover': {
                    transform: 'translateY(-6px)',
                    boxShadow: '0 12px 24px rgba(0, 0, 0, 0.1)',
                    borderColor: '#FFA000',
                    '& .cat-name': {
                      color: '#FFA000',
                    },
                  },
                }}
                onClick={() => onCategorySelect(cat.id)}
              >
                <CardActionArea
                  sx={{
                    p: 1.8,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-start',
                    alignItems: 'center',
                  }}
                >
                  {/* Fixed 1:1 Aspect Ratio Square Image */}
                  <Box
                    sx={{
                      width: '100%',
                      aspectRatio: '1 / 1',
                      position: 'relative',
                      mb: 1.5,
                      borderRadius: 2,
                      overflow: 'hidden',
                      backgroundColor: '#F1F5F9',
                    }}
                  >
                    <Box
                      component="img"
                      src={cat.image}
                      alt={cat.name}
                      sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transition: 'transform 0.4s ease',
                        '&:hover': {
                          transform: 'scale(1.08)',
                        },
                      }}
                    />
                  </Box>

                  {/* Title with fixed height for 1 or 2 lines */}
                  <Typography
                    className="cat-name"
                    variant="subtitle2"
                    sx={{
                      fontWeight: 700,
                      color: '#0F172A',
                      fontSize: '0.88rem',
                      lineHeight: 1.25,
                      height: 40,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                      transition: 'color 0.2s ease',
                      width: '100%',
                    }}
                  >
                    {cat.name}
                  </Typography>

                  {/* Count Tag */}
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#FFA000',
                      fontWeight: 700,
                      fontSize: '0.74rem',
                      display: 'block',
                      mt: 0.5,
                    }}
                  >
                    {cat.count}
                  </Typography>
                </CardActionArea>
              </Card>
            ))}
          </Box>
        </Container>
      </Box>
    </Box>
  )
}
