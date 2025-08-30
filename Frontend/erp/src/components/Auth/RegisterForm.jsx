
import React, { useState } from 'react';
import { 
  Box, TextField, Button, Typography, Paper, 
  CircularProgress, Alert, Snackbar, MenuItem, Grid
} from '@mui/material';

function RegisterForm() {
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    contract_type: '', contract_expiry: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false); // ✅ success toast

  const contractTypes = [
    { value: 'CDI', label: 'CDI (Contrat à durée indéterminée)' },
    { value: 'CDD', label: 'CDD (Contrat à durée déterminée)' },
    { value: 'Freelance', label: 'Freelance / Indépendant' },
    { value: 'Stage', label: 'Stage' },
    { value: 'Alternance', label: 'Alternance' },
  ];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    if (!formData.contract_type) {
      setError("Veuillez sélectionner un type de contrat");
      return;
    }

    if (!formData.contract_expiry) {
      setError("Veuillez sélectionner une date d'expiration du contrat");
      return;
    }

    setError('');
    setLoading(true);

    try {
      // Direct API call without touching AuthContext
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          contract_type: formData.contract_type,
          contract_expiry: formData.contract_expiry
        })
      });

      const data = await response.json();
      setLoading(false);

      if (response.ok) {
        setSuccess(true);
        setFormData({ 
          name: '', email: '', password: '', confirmPassword: '',
          contract_type: '', contract_expiry: '' 
        }); // clear form
      } else {
        setError(data.error || "Échec de l'ajout de l'utilisateur");
      }
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Une erreur est survenue');
    }
  };

  return (
    <Box 
      sx={{ 
        maxWidth: 800, 
        mx: 'auto', 
        mt: 4, 
        mb: 4,
        px: 2 
      }}
    >
      <Paper 
        elevation={0} 
        sx={{ 
          p: 4,
          borderRadius: 2,
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          background: "linear-gradient(to right bottom, #ffffff, #fafafa)",
        }}
      >
        {/* Header */}
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 700,
              background: 'linear-gradient(90deg, #2563eb, #3b82f6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 1
            }}
          >
            Ajouter un utilisateur
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Remplissez le formulaire ci-dessous pour créer un nouveau compte utilisateur
          </Typography>
        </Box>

        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 3, 
              borderRadius: 2,
              border: "1px solid #fecaca",
              '& .MuiAlert-icon': {
                color: '#dc2626'
              }
            }}
          >
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* User Information Section */}
            <Grid item xs={12}>
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  fontWeight: 600, 
                  color: '#1e293b',
                  mb: 2 
                }}
              >
                Informations personnelles
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Nom et prénom"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        backgroundColor: 'white',
                        '&:hover fieldset': {
                          borderColor: '#3b82f6',
                        },
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        backgroundColor: 'white',
                        '&:hover fieldset': {
                          borderColor: '#3b82f6',
                        },
                      }
                    }}
                  />
                </Grid>
              </Grid>
            </Grid>

            {/* Security Section */}
            <Grid item xs={12}>
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  fontWeight: 600, 
                  color: '#1e293b',
                  mb: 2 
                }}
              >
                Sécurité
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Mot de passe"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    inputProps={{ minLength: 8 }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        backgroundColor: 'white',
                        '&:hover fieldset': {
                          borderColor: '#3b82f6',
                        },
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Confirmer le mot de passe"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        backgroundColor: 'white',
                        '&:hover fieldset': {
                          borderColor: '#3b82f6',
                        },
                      }
                    }}
                  />
                </Grid>
              </Grid>
            </Grid>

            {/* Contract Section */}
            <Grid item xs={12}>
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  fontWeight: 600, 
                  color: '#1e293b',
                  mb: 2 
                }}
              >
                Informations du contrat
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    select
                    label="Type de contrat"
                    name="contract_type"
                    value={formData.contract_type}
                    onChange={handleChange}
                    required
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        backgroundColor: 'white',
                        '&:hover fieldset': {
                          borderColor: '#3b82f6',
                        },
                      },
                      '& .MuiSelect-select': {
                        py: 1.5,
                      },
                      '& .MuiMenuItem-root': {
                        py: 1.5,
                        px: 2,
                      }
                    }}
                    SelectProps={{
                      MenuProps: {
                        PaperProps: {
                          sx: {
                            maxHeight: 300,
                            mt: 0.5,
                            borderRadius: 2,
                            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                            '& .MuiMenuItem-root': {
                              px: 2,
                              py: 1.5,
                              my: 0.2,
                              borderRadius: 1,
                              '&:hover': {
                                backgroundColor: 'rgba(37, 99, 235, 0.08)',
                              },
                              '&.Mui-selected': {
                                backgroundColor: 'rgba(37, 99, 235, 0.12)',
                                '&:hover': {
                                  backgroundColor: 'rgba(37, 99, 235, 0.16)',
                                },
                              },
                            },
                          },
                        },
                      },
                    }}
                  >
                    {contractTypes.map((option) => (
                      <MenuItem 
                        key={option.value} 
                        value={option.value}
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-start'
                        }}
                      >
                        <Typography fontWeight={500} fontSize="0.95rem">
                          {option.value}
                        </Typography>
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            color: 'text.secondary',
                            mt: 0.5
                          }}
                        >
                          {option.label.split('(')[1]?.replace(')', '')}
                        </Typography>
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Date d'expiration du contrat"
                    name="contract_expiry"
                    type="date"
                    value={formData.contract_expiry}
                    onChange={handleChange}
                    InputLabelProps={{ shrink: true }}
                    required
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        backgroundColor: 'white',
                        '&:hover fieldset': {
                          borderColor: '#3b82f6',
                        },
                      }
                    }}
                  />
                </Grid>
              </Grid>
            </Grid>
          </Grid>

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading}
            sx={{
              mt: 4,
              mb: 2,
              py: 1.5,
              borderRadius: 2,
              fontSize: '1rem',
              textTransform: 'none',
              fontWeight: 600,
              background: 'linear-gradient(90deg, #2563eb, #3b82f6)',
              boxShadow: '0 4px 15px rgba(37, 99, 235, 0.3)',
              '&:hover': {
                background: 'linear-gradient(90deg, #1e40af, #2563eb)',
                boxShadow: '0 6px 20px rgba(37, 99, 235, 0.4)',
              }
            }}
          >
            {loading ? (
              <CircularProgress 
                size={24} 
                sx={{ 
                  color: 'white'
                }} 
              />
            ) : (
              'Ajouter Utilisateur'
            )}
          </Button>
        </form>
      </Paper>

      {/* Success notification */}
      <Snackbar
        open={success}
        autoHideDuration={4000}
        onClose={() => setSuccess(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          severity="success" 
          onClose={() => setSuccess(false)}
          sx={{
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            border: '1px solid #86efac',
            '& .MuiAlert-icon': {
              fontSize: '24px'
            },
            '& .MuiAlert-message': {
              fontSize: '1rem',
              fontWeight: 500
            }
          }}
        >
          Utilisateur ajouté avec succès !
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default RegisterForm;
