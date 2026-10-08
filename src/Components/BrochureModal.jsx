import React, { useState, useEffect, useRef, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  Typography,
  Box,
  Button,
  IconButton,
  Stack,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  InputAdornment,
  CircularProgress,
  ButtonGroup,
  Tooltip,
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import CloseIcon from '@mui/icons-material/Close'
import DownloadIcon from '@mui/icons-material/Download'
import ZoomInIcon from '@mui/icons-material/ZoomIn'
import ZoomOutIcon from '@mui/icons-material/ZoomOut'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import SearchIcon from '@mui/icons-material/Search'
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment'
import PhoneIcon from '@mui/icons-material/Phone'
import VerifiedIcon from '@mui/icons-material/Verified'
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf'
import TableChartIcon from '@mui/icons-material/TableChart'
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart'
import { CRACKERS_DATA, STORE_INFO } from '../data/crackersData'

export default function BrochureModal({ open, onClose, onShopNow }) {
  // View Mode: 'flyer' = Fullscreen Visual 5 Pages, 'table' = 90-item Searchable Table
  const [viewMode, setViewMode] = useState('flyer')
  const [scale, setScale] = useState(1.4)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [pdfError, setPdfError] = useState(false)
  const [filterText, setFilterText] = useState('')
  const canvasRefs = useRef([])

  // Download PDF flyer handler
  const handleDownloadPdf = () => {
    const link = document.createElement('a')
    link.href = '/SkyFire_Crackers_Price_List_2026.pdf'
    link.download = 'SkyFire_Crackers_Price_List_2026.pdf'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Filtered crackers for table view
  const displayedList = useMemo(() => {
    if (!filterText.trim()) return CRACKERS_DATA
    const q = filterText.toLowerCase()
    return CRACKERS_DATA.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        (item.tamilName && item.tamilName.toLowerCase().includes(q)) ||
        item.category.toLowerCase().includes(q) ||
        String(item.sno).includes(q)
    )
  }, [filterText])

  // Native Canvas PDF Rendering (Eliminates Browser PDF Reader UI)
  useEffect(() => {
    if (!open || viewMode !== 'flyer') return

    let isMounted = true

    async function renderPdfPages() {
      if (!window.pdfjsLib) {
        console.warn('pdfjsLib not ready on window')
        return
      }

      try {
        setPdfLoading(true)
        setPdfError(false)
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js'

        const loadingTask = window.pdfjsLib.getDocument('/SkyFire_Crackers_Price_List_2026.pdf')
        const pdf = await loadingTask.promise

        const numPages = pdf.numPages // 3 pages

        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
          if (!isMounted) break

          const page = await pdf.getPage(pageNum)
          const viewport = page.getViewport({ scale: scale })

          const canvas = canvasRefs.current[pageNum - 1]
          if (canvas) {
            const context = canvas.getContext('2d')
            canvas.height = viewport.height
            canvas.width = viewport.width

            const renderContext = {
              canvasContext: context,
              viewport: viewport,
            }
            await page.render(renderContext).promise
          }
        }
      } catch (err) {
        console.error('Error rendering PDF via canvas:', err)
        if (isMounted) setPdfError(true)
      } finally {
        if (isMounted) setPdfLoading(false)
      }
    }

    // Give browser brief tick to mount canvas elements
    const timer = setTimeout(renderPdfPages, 100)
    return () => {
      isMounted = false
      clearTimeout(timer)
    }
  }, [open, viewMode, scale])

  return (
    <Dialog
      fullScreen
      open={open}
      onClose={onClose}
      sx={{
        '& .MuiDialog-paper': {
          backgroundColor: '#0F172A',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        },
      }}
    >
      {/* Top Fullscreen Header with Back Button */}
      <Box
        sx={{
          backgroundColor: '#0B132B',
          color: '#FFFFFF',
          px: { xs: 2, sm: 3 },
          py: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '3px solid #FFA000',
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          zIndex: 10,
          flexWrap: 'wrap',
          gap: 1.5,
        }}
      >
        {/* Left: Back Button & Branding */}
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Button
            variant="contained"
            startIcon={<ArrowBackIcon />}
            onClick={onClose}
            sx={{
              backgroundColor: '#FFA000',
              color: '#0B132B',
              fontWeight: 900,
              fontSize: '0.92rem',
              borderRadius: 2,
              px: 2,
              py: 0.8,
              textTransform: 'none',
              boxShadow: '0 2px 10px rgba(255, 160, 0, 0.4)',
              '&:hover': { backgroundColor: '#FF8F00' },
            }}
          >
            ← Back to Shop
          </Button>

          <Box sx={{ display: { xs: 'none', md: 'block' } }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <LocalFireDepartmentIcon sx={{ color: '#FFA000', fontSize: 22 }} />
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#FFFFFF', fontSize: '1.05rem', lineHeight: 1.2 }}>
                Sky Fire Crackers • சிவகாசி பட்டாசு பிரசுரம் (Brochure)
              </Typography>
            </Stack>
            <Typography variant="caption" sx={{ color: '#94A3B8' }}>
              Official 2026 Price List • Up to 80% Direct Factory Wholesale Discount
            </Typography>
          </Box>
        </Stack>

        {/* Center: View Mode Toggle & Zoom Controls */}
        <Stack direction="row" spacing={1.5} alignItems="center">
          <ButtonGroup variant="outlined" size="small" sx={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
            <Button
              onClick={() => setViewMode('flyer')}
              startIcon={<PictureAsPdfIcon fontSize="small" />}
              sx={{
                color: viewMode === 'flyer' ? '#0B132B' : '#94A3B8',
                backgroundColor: viewMode === 'flyer' ? '#FFA000' : 'transparent',
                fontWeight: 800,
                textTransform: 'none',
                px: 1.8,
                '&:hover': {
                  backgroundColor: viewMode === 'flyer' ? '#FF8F00' : 'rgba(255,255,255,0.1)',
                },
              }}
            >
              3-Page Visual Flyer
            </Button>
            <Button
              onClick={() => setViewMode('table')}
              startIcon={<TableChartIcon fontSize="small" />}
              sx={{
                color: viewMode === 'table' ? '#0B132B' : '#94A3B8',
                backgroundColor: viewMode === 'table' ? '#FFA000' : 'transparent',
                fontWeight: 800,
                textTransform: 'none',
                px: 1.8,
                '&:hover': {
                  backgroundColor: viewMode === 'table' ? '#FF8F00' : 'rgba(255,255,255,0.1)',
                },
              }}
            >
              90-Item Price Table
            </Button>
          </ButtonGroup>

          {viewMode === 'flyer' && (
            <ButtonGroup variant="outlined" size="small" sx={{ display: { xs: 'none', sm: 'inline-flex' } }}>
              <Tooltip title="Zoom Out">
                <IconButton
                  size="small"
                  onClick={() => setScale((s) => Math.max(0.8, s - 0.2))}
                  sx={{ color: '#FFFFFF', borderColor: 'rgba(255,255,255,0.2)' }}
                >
                  <ZoomOutIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Button
                size="small"
                onClick={() => setScale(1.4)}
                sx={{ color: '#FFA000', fontWeight: 700, fontSize: '0.75rem', px: 1, minWidth: 50, textTransform: 'none' }}
              >
                {Math.round((scale / 1.4) * 100)}%
              </Button>
              <Tooltip title="Zoom In">
                <IconButton
                  size="small"
                  onClick={() => setScale((s) => Math.min(2.4, s + 0.2))}
                  sx={{ color: '#FFFFFF', borderColor: 'rgba(255,255,255,0.2)' }}
                >
                  <ZoomInIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </ButtonGroup>
          )}
        </Stack>

        {/* Right: Actions */}
        <Stack direction="row" spacing={1} alignItems="center">
          <Button
            variant="outlined"
            size="small"
            startIcon={<DownloadIcon />}
            onClick={handleDownloadPdf}
            sx={{
              borderColor: 'rgba(255,255,255,0.3)',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '0.82rem',
              textTransform: 'none',
              borderRadius: 2,
              '&:hover': { borderColor: '#FFA000', backgroundColor: 'rgba(255, 160, 0, 0.1)' },
            }}
          >
            Download PDF
          </Button>

          <Button
            variant="contained"
            size="small"
            startIcon={<ShoppingCartIcon />}
            onClick={() => {
              onClose()
              if (onShopNow) onShopNow()
            }}
            sx={{
              backgroundColor: '#16A34A',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '0.82rem',
              textTransform: 'none',
              borderRadius: 2,
              px: 2,
              '&:hover': { backgroundColor: '#15803D' },
            }}
          >
            Shop Crackers Now →
          </Button>
        </Stack>
      </Box>

      {/* Main Fullscreen Scroll Area */}
      <DialogContent sx={{ p: 0, flexGrow: 1, overflowY: 'auto', backgroundColor: '#1E293B' }}>
        {viewMode === 'flyer' ? (
          /* FLYER MODE: Native Canvas High-Res Rendering (Zero PDF Reader UI) */
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              py: 4,
              px: { xs: 1, sm: 3 },
              gap: 4,
            }}
          >
            {pdfLoading && (
              <Box sx={{ py: 10, textAlign: 'center' }}>
                <CircularProgress sx={{ color: '#FFA000', mb: 2 }} />
                <Typography variant="body1" sx={{ color: '#FFFFFF', fontWeight: 700 }}>
                  Loading 2026 Official Brochure Flyer...
                </Typography>
              </Box>
            )}

            {/* 3 Pages rendered cleanly as large high-res canvases */}
            {[1, 2, 3].map((pageNum) => (
              <Box
                key={pageNum}
                sx={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 2.5,
                  overflow: 'hidden',
                  boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  position: 'relative',
                  maxWidth: '100%',
                  display: pdfLoading ? 'none' : 'block',
                }}
              >
                {/* Page Number Ribbon */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    backgroundColor: 'rgba(11, 19, 43, 0.85)',
                    color: '#FFA000',
                    px: 1.5,
                    py: 0.5,
                    borderRadius: 1.5,
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    zIndex: 2,
                    backdropFilter: 'blur(4px)',
                  }}
                >
                  Page {pageNum} of 3
                </Box>
                <canvas
                  ref={(el) => (canvasRefs.current[pageNum - 1] = el)}
                  style={{
                    display: 'block',
                    maxWidth: '100%',
                    height: 'auto',
                  }}
                />
              </Box>
            ))}

            {/* Error or Fallback if canvas fails */}
            {pdfError && (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <Typography variant="h6" sx={{ color: '#EF4444', mb: 2 }}>
                  Unable to render flyer canvas. Please view via the Price Table or download PDF:
                </Typography>
                <Stack direction="row" spacing={2} justifyContent="center">
                  <Button variant="contained" onClick={() => setViewMode('table')} sx={{ backgroundColor: '#FFA000', color: '#0B132B' }}>
                    View 90-Item Price Table
                  </Button>
                  <Button variant="outlined" onClick={handleDownloadPdf} sx={{ color: '#FFFFFF', borderColor: '#FFFFFF' }}>
                    Download Official PDF
                  </Button>
                </Stack>
              </Box>
            )}

            {/* Bottom Floating Return Button */}
            <Box sx={{ pt: 2, pb: 4 }}>
              <Button
                variant="contained"
                size="large"
                startIcon={<ArrowBackIcon />}
                onClick={onClose}
                sx={{
                  backgroundColor: '#FFA000',
                  color: '#0B132B',
                  fontWeight: 900,
                  fontSize: '1rem',
                  py: 1.4,
                  px: 4,
                  borderRadius: 3,
                  boxShadow: '0 8px 25px rgba(255, 160, 0, 0.4)',
                  '&:hover': { backgroundColor: '#FF8F00' },
                }}
              >
                ← Return to Crackers Shop
              </Button>
            </Box>
          </Box>
        ) : (
          /* TABLE MODE: Fullscreen Interactive Searchable 90-Item Catalog Table */
          <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100%', backgroundColor: '#F8FAFC' }}>
            {/* Search Bar Bar */}
            <Box
              sx={{
                p: 2,
                backgroundColor: '#FFFFFF',
                borderBottom: '1px solid #E2E8F0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 2,
                position: 'sticky',
                top: 0,
                zIndex: 5,
              }}
            >
              <TextField
                size="small"
                placeholder="Search Tamil or English cracker name..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" sx={{ color: '#64748B' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{ width: { xs: '100%', sm: 380 } }}
              />
              <Typography variant="body2" sx={{ fontWeight: 800, color: '#334155' }}>
                Showing {displayedList.length} of {CRACKERS_DATA.length} Direct Sivakasi Factory Items
              </Typography>
            </Box>

            {/* Fullscreen Table */}
            <TableContainer sx={{ flexGrow: 1 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800, backgroundColor: '#0B132B', color: '#FFA000', width: 70 }}>
                      SNO
                    </TableCell>
                    <TableCell sx={{ fontWeight: 800, backgroundColor: '#0B132B', color: '#FFA000' }}>
                      Tamil Product Name
                    </TableCell>
                    <TableCell sx={{ fontWeight: 800, backgroundColor: '#0B132B', color: '#FFA000' }}>
                      English Product Name
                    </TableCell>
                    <TableCell sx={{ fontWeight: 800, backgroundColor: '#0B132B', color: '#FFA000' }}>
                      Packing Unit
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, backgroundColor: '#0B132B', color: '#FFA000', width: 140 }}>
                      Wholesale Price (₹)
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {displayedList.map((item) => (
                    <TableRow
                      key={item.id}
                      hover
                      sx={{
                        '&:nth-of-type(even)': { backgroundColor: '#F8FAFC' },
                        ...(item.category === 'gift_boxes' && { backgroundColor: '#FEF3C7 !important', fontWeight: 800 }),
                      }}
                    >
                      <TableCell sx={{ fontWeight: 800, color: '#64748B' }}>#{item.sno}</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: '#0F172A', fontSize: '1rem' }}>
                        {item.tamilName || '-'}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#334155', fontSize: '0.95rem' }}>
                        {item.name}
                      </TableCell>
                      <TableCell sx={{ color: '#0284C7', fontWeight: 700, fontSize: '0.85rem' }}>
                        {item.pieces || '1 Box'}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 900, color: '#16A34A', fontSize: '1.1rem' }}>
                        ₹{item.discountPrice}.00
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  )
}
