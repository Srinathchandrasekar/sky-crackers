import React from 'react'
import { Box, Container, Typography, Stack } from '@mui/material'
import VerifiedOutlinedIcon from '@mui/icons-material/VerifiedOutlined'
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined'
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined'

export default function FeaturesBanner({ isFrozen = false }) {
  const features = [
    {
      icon: <VerifiedOutlinedIcon sx={{ color: '#FFA000', fontSize: 24 }} />,
      title: 'Premium Quality',
      subtitle: 'Best Products',
    },
    {
      icon: <ShieldOutlinedIcon sx={{ color: '#FFA000', fontSize: 24 }} />,
      title: 'Safe & Secure',
      subtitle: 'Shipping',
    },
    {
      icon: <LocalShippingOutlinedIcon sx={{ color: '#FFA000', fontSize: 24 }} />,
      title: 'Delivery Available',
      subtitle: 'All Over Tamil Nadu',
    },
  ]

  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: '#070D1F',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        py: { xs: 2, md: 2.2 },
        color: '#FFFFFF',
        mt: 'auto',
        position: 'relative',
        zIndex: 5,
      }}
    >
      <Container maxWidth="xl">
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: { xs: 'center', sm: 'space-around', md: 'space-evenly' },
            gap: { xs: 2.5, sm: 3, md: 4 },
          }}
        >
          {features.map((item, index) => (
            <Stack key={index} direction="row" spacing={1.5} alignItems="center">
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 160, 0, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {item.icon}
              </Box>
              <Box>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    color: '#FFFFFF',
                    lineHeight: 1.2,
                  }}
                >
                  {item.title}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: 'rgba(255, 255, 255, 0.65)',
                    fontSize: '0.74rem',
                    display: 'block',
                  }}
                >
                  {item.subtitle}
                </Typography>
              </Box>
            </Stack>
          ))}
        </Box>
      </Container>
    </Box>
  )
}
