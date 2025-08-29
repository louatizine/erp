import React, { useState } from 'react';
import { 
  Box, TextField, Button, Typography, 
  Link, CircularProgress, Alert, Paper 
} from '@mui/material';
import { useAuth } from './AuthContext';
import { useNavigate, Link as RouterLink } from 'react-router-dom';

function LoginForm() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(formData);
    setLoading(false);

    if (result.success) {
      // Redirect based on role
      if (result.user?.roles?.includes('admin')) {
        navigate('/dashboard'); // Admin goes to dashboard
      } else {
        navigate('/home'); // Non-admin goes to home page
      }
    } else {
      setError(result.error);
    }
  };

  return (
    <Box
      sx={{
        height: '100vh',
        width: '100vw',
        position: 'fixed',
        top: 0,
        left: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1e3a8a, #dc2626)',
        fontFamily: "'Inter', sans-serif",
        overflow: 'hidden',
      }}
    >
      <Paper 
        elevation={6}
        sx={{
          maxWidth: 450,
          width: '100%',
          borderRadius: 4,
          p: { xs: 4, md: 6 },
          textAlign: 'center',
          background: 'rgba(255,255,255,0.9)',
          backdropFilter: 'blur(12px)',
        }}
      >
        {/* Logo / Branding */}
        <Box sx={{ mb: 4 }}>
          <Typography 
            variant="h3" 
            fontWeight="800" 
            sx={{ 
              background: 'linear-gradient(90deg, #2563eb, #dc2626)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 0.5
            }}
          >
            Dynamix
          </Typography>
          <Typography variant="h6" sx={{ letterSpacing: 6, fontWeight: 500, color: '#374151' }}>
            SERVICES
          </Typography>
        </Box>

        <Typography variant="h5" fontWeight="600" gutterBottom>
          Bienvenue
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
          Entrez votre email et mot de passe pour accéder à votre compte.
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>{error}</Alert>}

        {/* Login Form */}
        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Adresse email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            margin="normal"
            required
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                backgroundColor: '#fff',
                '&.Mui-focused fieldset': {
                  borderWidth: 2,
                  borderImage: 'linear-gradient(90deg, #2563eb, #dc2626) 1',
                },
              },
            }}
          />
          <TextField
            fullWidth
            label="Mot de passe"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            margin="normal"
            required
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                backgroundColor: '#fff',
                '&.Mui-focused fieldset': {
                  borderWidth: 2,
                  borderImage: 'linear-gradient(90deg, #2563eb, #dc2626) 1',
                },
              },
              mt: 2,
            }}
          />

          {/* Remember + Forgot */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <input 
                type="checkbox" 
                id="remember" 
                style={{ 
                  marginRight: '8px', 
                  accentColor: '#2563eb',
                  width: '16px',
                  height: '16px'
                }} 
              />
              <Typography 
                variant="body2" 
                color="text.secondary" 
                component="label" 
                htmlFor="remember"
                sx={{ fontWeight: 500 }}
              >
                Se souvenir de moi
              </Typography>
            </Box>
            <Link 
              component={RouterLink} 
              to="/forgot-password" 
              variant="body2"
              sx={{ color: '#dc2626', fontWeight: '600' }}
            >
              Mot de passe oublié ?
            </Link>
          </Box>

          {/* Login Button */}
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ 
              mt: 4, 
              mb: 2, 
              background: 'linear-gradient(90deg, #2563eb, #dc2626)',
              py: 1.5, 
              fontWeight: 'bold',
              borderRadius: 2,
              fontSize: '1.1rem',
              boxShadow: '0 4px 6px rgba(37, 99, 235, 0.2)',
              '&:hover': {
                background: 'linear-gradient(90deg, #1e40af, #b91c1c)',
                boxShadow: '0 6px 12px rgba(37, 99, 235, 0.3)'
              }
            }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} sx={{ color: "#fff" }} /> : 'CONNEXION'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}

export default LoginForm;
