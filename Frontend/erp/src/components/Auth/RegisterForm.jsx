
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
    <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom align="center">
          Ajouter un utilisateur
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nom et prénom"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
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
              />
            </Grid>
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
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Type de contrat"
                name="contract_type"
                value={formData.contract_type}
                onChange={handleChange}
                required
              >
                {contractTypes.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
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
              />
            </Grid>
          </Grid>

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Ajouter Utilisateur'}
          </Button>
        </form>
      </Paper>

      {/* ✅ Snackbar for success toast */}
      <Snackbar
        open={success}
        autoHideDuration={3000}
        onClose={() => setSuccess(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setSuccess(false)}>
          Utilisateur ajouté avec succès !
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default RegisterForm;
