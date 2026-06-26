import { useState } from 'react'
import Sidebar from './Sidebar'
import { THEME } from '../theme'
import { useMediaQuery } from '@mui/material'
import MenuIcon from '@mui/icons-material/Menu'
import { Box, Typography } from '@mui/material'

function Layout({ children }) {
  const [expanded, setExpanded] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const isMobile = useMediaQuery('(max-width:899px)')

  return (
    <div style={{ display: 'flex', backgroundColor: THEME.colors.mainBg, minHeight: '100vh' }}>

      {/* ── Desktop sidebar (unchanged) ── */}
      {!isMobile && (
        <Sidebar expanded={expanded} setExpanded={setExpanded} />
      )}

      {/* ── Mobile overlay backdrop ── */}
      {isMobile && mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: 'fixed', inset: 0,
            backgroundColor: 'rgba(0,0,0,0.45)',
            zIndex: 150,
          }}
        />
      )}

      {/* ── Mobile drawer (slide in from left) ── */}
      {isMobile && (
        <div style={{
          position: 'fixed', top: 0, left: 0,
          transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.28s cubic-bezier(.4,0,.2,1)',
          zIndex: 200,
          height: '100vh',
          overflowY: 'auto',
          display: 'flex',
        }}>
          <Sidebar
            expanded={true}
            setExpanded={() => {}}
            onMobileClose={() => setMobileOpen(false)}
            isMobile={true}
          />
        </div>
      )}

      {/* ── Main content ── */}
      <div style={{
        flex: 1,
        marginLeft: isMobile ? 0 : (expanded ? '240px' : '72px'),
        minHeight: '100vh',
        backgroundColor: THEME.colors.mainBg,
        display: 'flex',
        flexDirection: 'column',
      }}>

        {/* Mobile top bar */}
        {isMobile && (
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            px: 2,
            py: 1.5,
            backgroundColor: THEME.colors.sidebarBg,
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
            position: 'sticky',
            top: 0,
            zIndex: 100,
          }}>
            {/* Hamburger */}
            <Box
              onClick={() => setMobileOpen(true)}
              sx={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 38, height: 38, borderRadius: 2,
                cursor: 'pointer',
                color: 'white',
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' },
              }}
            >
              <MenuIcon fontSize="small" />
            </Box>

            {/* Logo */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{
                width: 30, height: 30, borderRadius: 1.5,
                background: '#ffffff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: THEME.colors.sidebarBg, fontWeight: 'bold', fontSize: 15,
              }}>D</Box>
              <Typography fontWeight="bold" sx={{ color: 'white', fontSize: 16, letterSpacing: 0.5 }}>
                DoIT
              </Typography>
            </Box>
          </Box>
        )}

        {children}
      </div>
    </div>
  )
}

export default Layout