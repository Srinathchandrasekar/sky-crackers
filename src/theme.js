import { createTheme } from '@mui/material/styles'

export const theme = createTheme({
  palette: {
    primary: {
      main: '#0B132B',
      dark: '#070D1F',
      light: '#1C2541',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#FFA000',
      light: '#FFB74D',
      dark: '#FF8F00',
      contrastText: '#1A1A1A',
    },
    success: {
      main: '#16A34A',
      contrastText: '#FFFFFF',
    },
    warning: {
      main: '#F59E0B',
    },
    background: {
      default: '#F8FAFC',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#0F172A',
      secondary: '#64748B',
    },
  },
  typography: {
    fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
    h1: {
      fontWeight: 800,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontWeight: 700,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontWeight: 700,
    },
    h4: {
      fontWeight: 700,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
    button: {
      fontWeight: 600,
      textTransform: 'none',
      letterSpacing: '0.01em',
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
        containedSecondary: {
          backgroundColor: '#FFA000',
          color: '#1A1A1A',
          fontWeight: 700,
          '&:hover': {
            backgroundColor: '#FF8F00',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
          border: '1px solid #E2E8F0',
        },
      },
    },
  },
})
