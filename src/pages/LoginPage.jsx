import { useState } from 'react'
import {
  Box, Button, TextField,
  Typography, Paper, Alert
} from '@mui/material'

function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleLogin = () => {
    if (!email || !password) {
      setError('Please enter email and password')
      return
    }
    alert('Login successful!')
  }

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f0f2f5'
    }}>
      <Paper elevation={3} sx={{ padding: 4, width: 400, borderRadius: 3 }}>

        <Typography variant="h4" align="center"
          gutterBottom sx={{ color: '#1976d2', fontWeight: 'bold' }}>
          Task Manager
        </Typography>

        <Typography variant="h6" align="center" gutterBottom
          sx={{ color: '#555', mb: 3 }}>
          Sign In to your account
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        )}

        <TextField
          fullWidth
          label="Email Address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          sx={{ mb: 2 }}
        />

        <TextField
          fullWidth
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          sx={{ mb: 3 }}
        />

        <Button
          fullWidth
          variant="contained"
          size="large"
          onClick={handleLogin}
          sx={{ backgroundColor: '#1976d2', py: 1.5 }}
        >
          Login
        </Button>

      </Paper>
    </Box>
  )
}

export default LoginPage