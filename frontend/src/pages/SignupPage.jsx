import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Box, Button, TextField, Typography,
  Alert, InputAdornment, IconButton, MenuItem
} from '@mui/material'
import EmailIcon from '@mui/icons-material/Email'
import LockIcon from '@mui/icons-material/Lock'
import PersonIcon from '@mui/icons-material/Person'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import { api } from '../services/api'
import { THEME } from '../theme'

function SignupPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSignup = async () => {
    if (!name || !email || !password || !confirmPassword || !role) {
      setError('Please fill in all fields')
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
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    setError('')
    setLoading(true)
    try {
      await api.signup(name, email, password, role);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      backgroundColor: THEME.colors.mainBg,
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
        background: THEME.colors.sidebarBg,
        borderRight: '1px solid rgba(255,255,255,0.06)'
      }}>
        <Box sx={{
          position: 'absolute', top: '10%', left: '60%',
          width: 300, height: 300, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)',
        }} />

        {/* Logo */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 8 }}>
          <Box sx={{
            width: 44, height: 44, borderRadius: 2,
            background: '#ffffff',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold', fontSize: 22, color: THEME.colors.sidebarBg
          }}>T</Box>
          <Typography variant="h5" fontWeight="bold" color="white" sx={{ letterSpacing: 0.5 }}>MyTask</Typography>
        </Box>

        <Typography variant="h2" fontWeight="bold" color="white"
          lineHeight={1.15} mb={3} sx={{ fontSize: { md: 38, lg: 46 } }}>
          Join your team<br />
          <Box component="span" sx={{ color: '#ffffff', opacity: 0.95 }}>
            today.
          </Box>
        </Typography>

        <Typography variant="body1" sx={{
          color: 'rgba(255,255,255,0.7)', mb: 6,
          lineHeight: 1.8, maxWidth: 380, fontSize: 16
        }}>
          Create your account and start collaborating with your team right away.
        </Typography>

        {/* Steps */}
        {[
          ['01', 'Create your account'],
          ['02', 'Verify your email'],
          ['03', 'Start managing tasks'],
        ].map(([num, text]) => (
          <Box key={num} sx={{
            display: 'flex', alignItems: 'center',
            gap: 3, mb: 3
          }}>
            <Box sx={{
              width: 36, height: 36, borderRadius: '50%',
              border: '2px solid rgba(255,255,255,0.6)',
              display: 'flex', alignItems: 'center',
              justifyContent: 'center', flexShrink: 0
            }}>
              <Typography variant="caption"
                sx={{ color: 'white', fontWeight: 'bold' }}>
                {num}
              </Typography>
            </Box>
            <Typography variant="body2"
              sx={{ color: 'rgba(255,255,255,0.8)' }}>
              {text}
            </Typography>
          </Box>
        ))}
      </Box>

      {/* Right side — form */}
      <Box sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        p: { xs: 3, md: 6 },
        backgroundColor: '#ffffff',
        overflowY: 'auto'
      }}>
        <Box sx={{ width: '100%', maxWidth: 400 }}>

          <Typography variant="h4" fontWeight="bold" sx={{ color: THEME.colors.textMain }} mb={0.8}>
            Create account
          </Typography>
          <Typography variant="body2"
            sx={{ color: THEME.colors.textMuted, mb: 4 }}>
            Fill in your details to get started
          </Typography>

          {error && (
            <Alert severity="error" sx={{
              mb: 3, borderRadius: 2.5,
              backgroundColor: '#fef2f2',
              border: '1px solid #fee2e2',
              color: '#ef4444'
            }}>{error}</Alert>
          )}

          {/* Name */}
          <Typography variant="body2" fontWeight={500}
            sx={{ color: THEME.colors.textMain, mb: 1 }}>
            Full name
          </Typography>
          <TextField fullWidth placeholder="John Smith"
            value={name} onChange={(e) => setName(e.target.value)}
            sx={{
              mb: 2.5,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2.5,
                backgroundColor: 'rgba(27,94,85,0.03)',
                color: THEME.colors.textMain,
                '& fieldset': { borderColor: 'rgba(27,94,85,0.1)' },
                '&:hover fieldset': { borderColor: THEME.colors.sidebarBg },
                '&.Mui-focused fieldset': { borderColor: THEME.colors.sidebarBg },
              },
              '& input': { color: THEME.colors.textMain },
              '& input::placeholder': { color: 'rgba(27,94,85,0.4)' }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PersonIcon sx={{ color: THEME.colors.textMuted, fontSize: 20 }} />
                </InputAdornment>
              )
            }}
          />

          {/* Email */}
          <Typography variant="body2" fontWeight={500}
            sx={{ color: THEME.colors.textMain, mb: 1 }}>
            Email address
          </Typography>
          <TextField fullWidth placeholder="you@example.com"
            type="email" value={email}
            onChange={(e) => setEmail(e.target.value)}
            sx={{
              mb: 2.5,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2.5,
                backgroundColor: 'rgba(27,94,85,0.03)',
                color: THEME.colors.textMain,
                '& fieldset': { borderColor: 'rgba(27,94,85,0.1)' },
                '&:hover fieldset': { borderColor: THEME.colors.sidebarBg },
                '&.Mui-focused fieldset': { borderColor: THEME.colors.sidebarBg },
              },
              '& input': { color: THEME.colors.textMain },
              '& input::placeholder': { color: 'rgba(27,94,85,0.4)' }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EmailIcon sx={{ color: THEME.colors.textMuted, fontSize: 20 }} />
                </InputAdornment>
              )
            }}
          />

          {/* Role */}
          <Typography variant="body2" fontWeight={500}
            sx={{ color: THEME.colors.textMain, mb: 1 }}>
            Role
          </Typography>
          <TextField fullWidth select value={role}
            onChange={(e) => setRole(e.target.value)}
            sx={{
              mb: 2.5,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2.5,
                backgroundColor: 'rgba(27,94,85,0.03)',
                color: THEME.colors.textMain,
                '& fieldset': { borderColor: 'rgba(27,94,85,0.1)' },
                '&:hover fieldset': { borderColor: THEME.colors.sidebarBg },
                '&.Mui-focused fieldset': { borderColor: THEME.colors.sidebarBg },
              },
              '& .MuiSelect-select': { color: role ? THEME.colors.textMain : 'rgba(27,94,85,0.4)' },
              '& .MuiSvgIcon-root': { color: THEME.colors.textMuted }
            }}
            SelectProps={{
              MenuProps: {
                PaperProps: {
                  sx: {
                    backgroundColor: '#ffffff',
                    border: '1px solid rgba(27,94,85,0.1)',
                    '& .MuiMenuItem-root': {
                      color: THEME.colors.textMain,
                      '&:hover': { backgroundColor: 'rgba(27,94,85,0.05)' }
                    }
                  }
                }
              }
            }}
          >
            <MenuItem value="Administrator">Administrator</MenuItem>
            <MenuItem value="Project Manager">Project Manager</MenuItem>
            <MenuItem value="Collaborator">Collaborator</MenuItem>
          </TextField>

          {/* Password */}
          <Typography variant="body2" fontWeight={500}
            sx={{ color: THEME.colors.textMain, mb: 1 }}>
            Password
          </Typography>
          <TextField fullWidth placeholder="Min. 6 characters"
            type={showPassword ? 'text' : 'password'}
            value={password} onChange={(e) => setPassword(e.target.value)}
            sx={{
              mb: 2.5,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2.5,
                backgroundColor: 'rgba(27,94,85,0.03)',
                color: THEME.colors.textMain,
                '& fieldset': { borderColor: 'rgba(27,94,85,0.1)' },
                '&:hover fieldset': { borderColor: THEME.colors.sidebarBg },
                '&.Mui-focused fieldset': { borderColor: THEME.colors.sidebarBg },
              },
              '& input': { color: THEME.colors.textMain },
              '& input::placeholder': { color: 'rgba(27,94,85,0.4)' }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockIcon sx={{ color: THEME.colors.textMuted, fontSize: 20 }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword(!showPassword)}>
                    {showPassword
                      ? <VisibilityOffIcon sx={{ color: THEME.colors.textMuted, fontSize: 20 }} />
                      : <VisibilityIcon sx={{ color: THEME.colors.textMuted, fontSize: 20 }} />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />

          {/* Confirm Password */}
          <Typography variant="body2" fontWeight={500}
            sx={{ color: THEME.colors.textMain, mb: 1 }}>
            Confirm password
          </Typography>
          <TextField fullWidth placeholder="Re-enter password"
            type={showConfirm ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            sx={{
              mb: 3,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2.5,
                backgroundColor: 'rgba(27,94,85,0.03)',
                color: THEME.colors.textMain,
                '& fieldset': { borderColor: 'rgba(27,94,85,0.1)' },
                '&:hover fieldset': { borderColor: THEME.colors.sidebarBg },
                '&.Mui-focused fieldset': { borderColor: THEME.colors.sidebarBg },
              },
              '& input': { color: THEME.colors.textMain },
              '& input::placeholder': { color: 'rgba(27,94,85,0.4)' }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockIcon sx={{ color: THEME.colors.textMuted, fontSize: 20 }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowConfirm(!showConfirm)}>
                    {showConfirm
                      ? <VisibilityOffIcon sx={{ color: THEME.colors.textMuted, fontSize: 20 }} />
                      : <VisibilityIcon sx={{ color: THEME.colors.textMuted, fontSize: 20 }} />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />

          <Button fullWidth variant="contained" size="large"
            onClick={handleSignup} disabled={loading}
            sx={{
              py: 1.6, fontSize: 15, fontWeight: 'bold',
              borderRadius: 2.5, textTransform: 'none',
              backgroundColor: THEME.colors.sidebarBg,
              boxShadow: '0 4px 14px rgba(27,94,85,0.15)',
              mb: 3,
              '&:hover': {
                backgroundColor: '#13463f',
                boxShadow: '0 6px 20px rgba(27,94,85,0.25)'
              },
              '&:disabled': {
                backgroundColor: 'rgba(27,94,85,0.4)',
                color: 'white'
              }
            }}
          >
            {loading ? 'Creating account...' : 'Create account'}
          </Button>

          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2"
              sx={{ color: THEME.colors.textMuted }}>
              Already have an account?{' '}
              <Link to="/" style={{
                color: THEME.colors.sidebarBg, fontWeight: 600,
                textDecoration: 'none'
              }}>
                Sign in
              </Link>
            </Typography>
          </Box>

        </Box>
      </Box>
    </Box>
  )
}

export default SignupPage