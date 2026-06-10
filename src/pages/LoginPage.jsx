import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Box, Button, TextField, Typography,
  Alert, InputAdornment, IconButton,
  FormControlLabel, Checkbox
} from '@mui/material'
import EmailIcon from '@mui/icons-material/Email'
import LockIcon from '@mui/icons-material/Lock'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'

function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = () => {
    if (!email || !password) {
      setError('Please enter both email and password')
      return
    }
    if (!email.includes('@')) {
      setError('Please enter a valid email address')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    setError('')
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      navigate('/dashboard')
    }, 1500)
  }

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      backgroundColor: '#0f1117',
    }}>
      {/* Left side */}
      <Box sx={{
        flex: 1.2,
        display: { xs: 'none', md: 'flex' },
        flexDirection: 'column',
        justifyContent: 'center',
        p: 8,
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(145deg, #1a1d2e 0%, #0f1117 100%)',
        borderRight: '1px solid rgba(124,58,237,0.2)'
      }}>
        {/* Decorative blobs */}
        <Box sx={{
          position: 'absolute', top: '10%', left: '60%',
          width: 300, height: 300, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />
        <Box sx={{
          position: 'absolute', bottom: '15%', left: '20%',
          width: 250, height: 250, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        {/* Logo */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 8 }}>
          <Box sx={{
            width: 44, height: 44,
            borderRadius: 2,
            background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold', fontSize: 22, color: 'white'
          }}>
            T
          </Box>
          <Typography variant="h5" fontWeight="bold" color="white">
            TaskFlow
          </Typography>
        </Box>

        <Typography variant="h2" fontWeight="bold" color="white"
          lineHeight={1.15} mb={3} sx={{ fontSize: { md: 38, lg: 46 } }}>
          Your team's<br />
          <Box component="span" sx={{
            background: 'linear-gradient(90deg, #7c3aed, #3b82f6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            work hub.
          </Box>
        </Typography>

        <Typography variant="body1" sx={{
          color: 'rgba(255,255,255,0.55)', mb: 6,
          lineHeight: 1.8, maxWidth: 380, fontSize: 16
        }}>
          Plan, track and manage your team's work in one place. Stay aligned, move fast.
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {[
            'Kanban boards for visual task tracking',
            'Real-time notifications and updates',
            'Role-based access for your team',
            'Powerful dashboard and analytics'
          ].map((item, i) => (
            <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <CheckCircleIcon sx={{ color: '#7c3aed', fontSize: 20 }} />
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.65)', fontSize: 14 }}>
                {item}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Stats row */}
        <Box sx={{
          display: 'flex', gap: 4, mt: 8,
          pt: 4, borderTop: '1px solid rgba(255,255,255,0.08)'
        }}>
          {[['500+', 'Teams'], ['10k+', 'Tasks done'], ['99%', 'Uptime']].map(([num, label]) => (
            <Box key={label}>
              <Typography variant="h5" fontWeight="bold" color="white">{num}</Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)' }}>{label}</Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Right side — form */}
      <Box sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        p: { xs: 3, md: 6 },
        backgroundColor: '#0f1117'
      }}>
        <Box sx={{ width: '100%', maxWidth: 400 }}>

          {/* Mobile logo */}
          <Box sx={{
            display: { xs: 'flex', md: 'none' },
            alignItems: 'center', gap: 1.5, mb: 4
          }}>
            <Box sx={{
              width: 36, height: 36, borderRadius: 2,
              background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
              display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: 'white', fontWeight: 'bold'
            }}>T</Box>
            <Typography variant="h6" fontWeight="bold" color="white">TaskFlow</Typography>
          </Box>

          <Typography variant="h4" fontWeight="bold" color="white" mb={0.8}>
            Welcome back
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.45)', mb: 4 }}>
            Sign in to continue to TaskFlow
          </Typography>

          {error && (
            <Alert severity="error" sx={{
              mb: 3, borderRadius: 2,
              backgroundColor: 'rgba(239,68,68,0.12)',
              border: '1px solid rgba(239,68,68,0.3)',
              color: '#fca5a5'
            }}>{error}</Alert>
          )}

          {/* Email */}
          <Typography variant="body2" fontWeight={500}
            sx={{ color: 'rgba(255,255,255,0.7)', mb: 1 }}>
            Email address
          </Typography>
          <TextField
            fullWidth
            placeholder="you@example.com"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
            sx={{
              mb: 3,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                backgroundColor: 'rgba(255,255,255,0.05)',
                color: 'white',
                '& fieldset': { borderColor: 'rgba(255,255,255,0.12)' },
                '&:hover fieldset': { borderColor: 'rgba(124,58,237,0.5)' },
                '&.Mui-focused fieldset': { borderColor: '#7c3aed' },
              },
              '& input::placeholder': { color: 'rgba(255,255,255,0.25)' },
              '& input': { color: 'white' }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EmailIcon sx={{ color: 'rgba(255,255,255,0.3)', fontSize: 20 }} />
                </InputAdornment>
              )
            }}
          />

          {/* Password */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" fontWeight={500}
              sx={{ color: 'rgba(255,255,255,0.7)' }}>
              Password
            </Typography>
            <Typography variant="body2"
              sx={{ color: '#7c3aed', cursor: 'pointer',
                '&:hover': { textDecoration: 'underline' }
              }}>
              Forgot password?
            </Typography>
          </Box>
          <TextField
            fullWidth
            placeholder="••••••••"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
            sx={{
              mb: 2,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                backgroundColor: 'rgba(255,255,255,0.05)',
                color: 'white',
                '& fieldset': { borderColor: 'rgba(255,255,255,0.12)' },
                '&:hover fieldset': { borderColor: 'rgba(124,58,237,0.5)' },
                '&.Mui-focused fieldset': { borderColor: '#7c3aed' },
              },
              '& input::placeholder': { color: 'rgba(255,255,255,0.25)' },
              '& input': { color: 'white' }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockIcon sx={{ color: 'rgba(255,255,255,0.3)', fontSize: 20 }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                    {showPassword
                      ? <VisibilityOffIcon sx={{ color: 'rgba(255,255,255,0.3)', fontSize: 20 }} />
                      : <VisibilityIcon sx={{ color: 'rgba(255,255,255,0.3)', fontSize: 20 }} />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />

          <FormControlLabel
            control={
              <Checkbox size="small" checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                sx={{ color: 'rgba(255,255,255,0.3)',
                  '&.Mui-checked': { color: '#7c3aed' }
                }}
              />
            }
            label={
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                Remember me for 30 days
              </Typography>
            }
            sx={{ mb: 3 }}
          />

          <Button
            fullWidth variant="contained" size="large"
            onClick={handleLogin} disabled={loading}
            sx={{
              py: 1.6, fontSize: 15, fontWeight: 'bold',
              borderRadius: 2, textTransform: 'none',
              background: loading
                ? 'rgba(124,58,237,0.4)'
                : 'linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)',
              boxShadow: '0 4px 20px rgba(124,58,237,0.35)',
              mb: 3,
              '&:hover': {
                background: 'linear-gradient(135deg, #6d28d9 0%, #2563eb 100%)',
                boxShadow: '0 6px 25px rgba(124,58,237,0.5)',
              }
            }}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </Button>

          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.45)' }}>
              Don't have an account?{' '}
              <Link to="/signup" style={{
                color: '#7c3aed', fontWeight: 600,
                textDecoration: 'none'
              }}>
                Create account
              </Link>
            </Typography>
          </Box>

        </Box>
      </Box>
    </Box>
  )
}

export default LoginPage