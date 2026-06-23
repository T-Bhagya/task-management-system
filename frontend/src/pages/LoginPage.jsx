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
import { api } from '../services/api'
import { THEME } from '../theme'

function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  // Password reset flow states
  const [mustReset, setMustReset] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)

  const handleLogin = async () => {
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
    try {
      const res = await api.login(email, password);
      localStorage.setItem('token', res.token);
      localStorage.setItem('user', JSON.stringify(res.user));
      
      if (res.user.must_reset_password) {
        setMustReset(true);
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  const handlePasswordReset = async () => {
    if (!newPassword || !confirmPassword) {
      setError('Please fill in both password fields')
      return
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    setError('')
    setLoading(true)
    try {
      await api.changePassword(newPassword);
      
      // Update local storage user object
      const storedUser = JSON.parse(localStorage.getItem('user'));
      storedUser.must_reset_password = false;
      localStorage.setItem('user', JSON.stringify(storedUser));
      
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to update password.');
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
        {/* Decorative blobs */}
        <Box sx={{
          position: 'absolute', top: '10%', left: '60%',
          width: 300, height: 300, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />
        <Box sx={{
          position: 'absolute', bottom: '15%', left: '20%',
          width: 250, height: 250, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        {/* Logo */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 8 }}>
          <Box sx={{
            width: 44, height: 44,
            borderRadius: 2,
            background: '#ffffff',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold', fontSize: 22, color: THEME.colors.sidebarBg
          }}>
            T
          </Box>
          <Typography variant="h5" fontWeight="bold" color="white" sx={{ letterSpacing: 0.5 }}>
            MyTask
          </Typography>
        </Box>

        <Typography variant="h2" fontWeight="bold" color="white"
          lineHeight={1.15} mb={3} sx={{ fontSize: { md: 38, lg: 46 } }}>
          Your team's<br />
          <Box component="span" sx={{ color: '#ffffff', opacity: 0.95 }}>
            work hub.
          </Box>
        </Typography>

        <Typography variant="body1" sx={{
          color: 'rgba(255,255,255,0.7)', mb: 6,
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
              <CheckCircleIcon sx={{ color: '#ffffff', fontSize: 20, opacity: 0.9 }} />
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)', fontSize: 14 }}>
                {item}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Stats row */}
        <Box sx={{
          display: 'flex', gap: 4, mt: 8,
          pt: 4, borderTop: '1px solid rgba(255,255,255,0.1)'
        }}>
          {[['500+', 'Teams'], ['10k+', 'Tasks done'], ['99%', 'Uptime']].map(([num, label]) => (
            <Box key={label}>
              <Typography variant="h5" fontWeight="bold" color="white">{num}</Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>{label}</Typography>
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
        backgroundColor: '#ffffff'
      }}>
        <Box sx={{ width: '100%', maxWidth: 400 }}>

          {/* Mobile logo */}
          <Box sx={{
            display: { xs: 'flex', md: 'none' },
            alignItems: 'center', gap: 1.5, mb: 4
          }}>
            <Box sx={{
              width: 36, height: 36, borderRadius: 2,
              background: THEME.colors.sidebarBg,
              display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: 'white', fontWeight: 'bold'
            }}>T</Box>
            <Typography variant="h6" fontWeight="bold" sx={{ color: THEME.colors.textMain }}>MyTask</Typography>
          </Box>

          <Typography variant="h4" fontWeight="bold" sx={{ color: THEME.colors.textMain }} mb={0.8}>
            {mustReset ? 'Reset Password' : 'Welcome back'}
          </Typography>
          <Typography variant="body2" sx={{ color: THEME.colors.textMuted, mb: 4 }}>
            {mustReset 
              ? 'You are logging in with a temporary password. Please create a new password.'
              : 'Sign in to continue to MyTask'}
          </Typography>

          {error && (
            <Alert severity="error" sx={{
              mb: 3, borderRadius: 2.5,
              backgroundColor: '#fef2f2',
              border: '1px solid #fee2e2',
              color: '#ef4444'
            }}>{error}</Alert>
          )}

          {mustReset ? (
            <>
              {/* New Password */}
              <Typography variant="body2" fontWeight={500}
                sx={{ color: THEME.colors.textMain, mb: 1 }}>
                New Password
              </Typography>
              <TextField
                fullWidth
                placeholder="••••••••"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handlePasswordReset()}
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
                  '& input::placeholder': { color: 'rgba(27,94,85,0.4)' },
                  '& input': { color: THEME.colors.textMain }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon sx={{ color: THEME.colors.textMuted, fontSize: 20 }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowNewPassword(!showNewPassword)} edge="end">
                        {showNewPassword
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
                Confirm New Password
              </Typography>
              <TextField
                fullWidth
                placeholder="••••••••"
                type={showNewPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handlePasswordReset()}
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
                  '& input::placeholder': { color: 'rgba(27,94,85,0.4)' },
                  '& input': { color: THEME.colors.textMain }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon sx={{ color: THEME.colors.textMuted, fontSize: 20 }} />
                    </InputAdornment>
                  )
                }}
              />

              <Button
                fullWidth variant="contained" size="large"
                onClick={handlePasswordReset} disabled={loading}
                sx={{
                  py: 1.6, fontSize: 15, fontWeight: 'bold',
                  borderRadius: 2.5, textTransform: 'none',
                  backgroundColor: THEME.colors.sidebarBg,
                  boxShadow: '0 4px 14px rgba(27,94,85,0.15)',
                  mb: 3,
                  '&:hover': {
                    backgroundColor: '#13463f',
                    boxShadow: '0 6px 20px rgba(27,94,85,0.25)',
                  },
                  '&:disabled': {
                    backgroundColor: 'rgba(27,94,85,0.4)',
                    color: 'white'
                  }
                }}
              >
                {loading ? 'Updating...' : 'Update Password'}
              </Button>
            </>
          ) : (
            <>
              {/* Email */}
              <Typography variant="body2" fontWeight={500}
                sx={{ color: THEME.colors.textMain, mb: 1 }}>
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
                    borderRadius: 2.5,
                    backgroundColor: 'rgba(27,94,85,0.03)',
                    color: THEME.colors.textMain,
                    '& fieldset': { borderColor: 'rgba(27,94,85,0.1)' },
                    '&:hover fieldset': { borderColor: THEME.colors.sidebarBg },
                    '&.Mui-focused fieldset': { borderColor: THEME.colors.sidebarBg },
                  },
                  '& input::placeholder': { color: 'rgba(27,94,85,0.4)' },
                  '& input': { color: THEME.colors.textMain }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon sx={{ color: THEME.colors.textMuted, fontSize: 20 }} />
                    </InputAdornment>
                  )
                }}
              />

              {/* Password */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" fontWeight={500}
                  sx={{ color: THEME.colors.textMain }}>
                  Password
                </Typography>
                <Typography variant="body2"
                  sx={{ color: THEME.colors.sidebarBg, cursor: 'pointer', fontWeight: 600,
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
                    borderRadius: 2.5,
                    backgroundColor: 'rgba(27,94,85,0.03)',
                    color: THEME.colors.textMain,
                    '& fieldset': { borderColor: 'rgba(27,94,85,0.1)' },
                    '&:hover fieldset': { borderColor: THEME.colors.sidebarBg },
                    '&.Mui-focused fieldset': { borderColor: THEME.colors.sidebarBg },
                  },
                  '& input::placeholder': { color: 'rgba(27,94,85,0.4)' },
                  '& input': { color: THEME.colors.textMain }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon sx={{ color: THEME.colors.textMuted, fontSize: 20 }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                        {showPassword
                          ? <VisibilityOffIcon sx={{ color: THEME.colors.textMuted, fontSize: 20 }} />
                          : <VisibilityIcon sx={{ color: THEME.colors.textMuted, fontSize: 20 }} />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />

              <FormControlLabel
                control={
                  <Checkbox size="small" checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    sx={{ color: 'rgba(27,94,85,0.2)',
                      '&.Mui-checked': { color: THEME.colors.sidebarBg }
                    }}
                  />
                }
                label={
                  <Typography variant="body2" sx={{ color: THEME.colors.textMuted }}>
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
                  borderRadius: 2.5, textTransform: 'none',
                  backgroundColor: THEME.colors.sidebarBg,
                  boxShadow: '0 4px 14px rgba(27,94,85,0.15)',
                  mb: 3,
                  '&:hover': {
                    backgroundColor: '#13463f',
                    boxShadow: '0 6px 20px rgba(27,94,85,0.25)',
                  },
                  '&:disabled': {
                    backgroundColor: 'rgba(27,94,85,0.4)',
                    color: 'white'
                  }
                }}
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </Button>

              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" sx={{ color: THEME.colors.textMuted }}>
                  Don't have an account?{' '}
                  <Link to="/signup" style={{
                    color: THEME.colors.sidebarBg, fontWeight: 600,
                    textDecoration: 'none'
                  }}>
                    Create account
                  </Link>
                </Typography>
              </Box>
            </>
          )}

        </Box>
      </Box>
    </Box>
  )
}

export default LoginPage