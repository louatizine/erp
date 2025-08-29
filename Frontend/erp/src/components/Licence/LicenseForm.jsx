import React, { useState } from "react";
import {
  TextField,
  Button,
  Grid,
  Paper,
  Typography,
  Snackbar,
  Alert,
  CircularProgress,
  Box,
  Divider
} from "@mui/material";
import axios from "axios";

export default function LicenseForm() {
  const [formData, setFormData] = useState({
    license_name: "",
    license_key: "",
    purchase_date: "",
    expiry_date: ""
  });
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success"
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        license_name: formData.license_name,
        license_key: formData.license_key,
        expiry_date: new Date(formData.expiry_date).toISOString(),
        purchase_date: formData.purchase_date
          ? new Date(formData.purchase_date).toISOString()
          : undefined
      };

      const response = await axios.post(
        "http://localhost:5000/api/licenses/",
        payload,
        {
          headers: {
            "Content-Type": "application/json"
          }
        }
      );

      if (response.status === 201) {
        setSnackbar({
          open: true,
          message: "✅ Licence ajoutée avec succès !",
          severity: "success"
        });
        setFormData({
          license_name: "",
          license_key: "",
          purchase_date: "",
          expiry_date: ""
        });
      }
    } catch (err) {
      console.error("Error:", err);
      const errorMessage =
        err.response?.data?.error ||
        "❌ Échec de l'ajout de la licence. Veuillez vérifier vos données et réessayer.";

      setSnackbar({
        open: true,
        message: errorMessage,
        severity: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  return (
    <>
      <Box
        sx={{
          ml: "240px",
          width: "calc(100% - 240px)",
          p: 4,
          backgroundColor: "#f8fafc",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column"
        }}
      >
        {/* Header with Dynamix Services branding */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 3,
            borderRadius: 2,
            background: "linear-gradient(90deg, #2563eb, #3b82f6)",
            color: "white",
          }}
        >
          <Box>
            <Typography variant="h3" fontWeight={800} sx={{ mb: 0.5 }}>
              Dynamix
            </Typography>
            <Typography variant="h5" sx={{ letterSpacing: '3px', opacity: 0.9 }}>
              SERVICES
            </Typography>
          </Box>
        </Paper>

        <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <Paper
            elevation={0}
            sx={{
              p: 4,
              borderRadius: 2,
              boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
              backgroundColor: "white",
              flex: 1,
              display: "flex",
              flexDirection: "column"
            }}
          >
            <Box sx={{ mb: 4 }}>
              <Typography variant="h4" fontWeight={600} sx={{ color: "#1e293b" }}>
                Gestion des Licences
              </Typography>
              <Typography variant="body1" sx={{ color: "#64748b", mt: 1 }}>
                Ajoutez et gérez les licences de votre organisation.
              </Typography>
            </Box>

            <Divider sx={{ mb: 4 }} />

            <Box sx={{ maxWidth: 600, mx: "auto", width: "100%" }}>
              <Typography
                variant="h5"
                gutterBottom
                sx={{ fontWeight: 600, color: "#1e293b", mb: 3 }}
              >
                Ajouter une nouvelle licence
              </Typography>
              
              <form onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      label="Nom de la licence"
                      name="license_name"
                      value={formData.license_name}
                      onChange={handleChange}
                      fullWidth
                      required
                      disabled={loading}
                      variant="outlined"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                        }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Clé de la licence"
                      name="license_key"
                      value={formData.license_key}
                      onChange={handleChange}
                      fullWidth
                      required
                      disabled={loading}
                      variant="outlined"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                        }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Date d'achat"
                      name="purchase_date"
                      type="date"
                      value={formData.purchase_date}
                      onChange={handleChange}
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                      disabled={loading}
                      variant="outlined"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                        }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Date d'expiration"
                      name="expiry_date"
                      type="date"
                      value={formData.expiry_date}
                      onChange={handleChange}
                      fullWidth
                      required
                      InputLabelProps={{ shrink: true }}
                      disabled={loading}
                      variant="outlined"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                        }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      fullWidth
                      disabled={loading}
                      sx={{
                        textTransform: "none",
                        py: 1.5,
                        fontSize: "1rem",
                        fontWeight: 600,
                        borderRadius: 2,
                        background: "linear-gradient(90deg, #2563eb, #3b82f6)",
                        boxShadow: "0 4px 15px rgba(37, 99, 235, 0.3)",
                        "&:hover": {
                          background: "linear-gradient(90deg, #1e40af, #2563eb)",
                          boxShadow: "0 6px 20px rgba(37, 99, 235, 0.4)",
                        },
                      }}
                      startIcon={
                        loading ? <CircularProgress size={20} color="inherit" /> : null
                      }
                    >
                      {loading ? "Traitement en cours..." : "💾 Enregistrer la licence"}
                    </Button>
                  </Grid>
                </Grid>
              </form>
            </Box>

            {/* Additional content to fill space */}
            <Box sx={{ mt: 6, flex: 1 }}>
              <Typography variant="h6" sx={{ color: "#1e293b", mb: 2 }}>
                Instructions
              </Typography>
              <Box sx={{ pl: 2 }}>
                <Typography variant="body2" sx={{ color: "#64748b", mb: 1 }}>
                  • Assurez-vous que le nom de la licence est descriptif et unique
                </Typography>
                <Typography variant="body2" sx={{ color: "#64748b", mb: 1 }}>
                  • La clé de licence doit être exacte et complète
                </Typography>
                <Typography variant="body2" sx={{ color: "#64748b", mb: 1 }}>
                  • Les dates doivent être au format JJ/MM/AAAA
                </Typography>
                <Typography variant="body2" sx={{ color: "#64748b" }}>
                  • La date d'expiration est obligatoire pour le suivi
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Box>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: "100%", borderRadius: 2 }}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}