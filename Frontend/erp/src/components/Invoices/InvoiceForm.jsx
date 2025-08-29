import React, { useState } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Alert,
  Grid,
  Divider,
  MenuItem,
  InputAdornment,
} from "@mui/material";
import { Save, Email, Phone } from "@mui/icons-material";

export default function InvoiceForm() {
  const [formData, setFormData] = useState({
    company_email: "",
    client_email: "",
    telephone: "",
    total_amount: "",
    invoice_date: new Date().toISOString().split("T")[0],
    status: "pending",
  });

  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    // Prepare data for submission
    const submissionData = {
      ...formData,
      total_amount: parseFloat(formData.total_amount),
    };

    try {
      const response = await fetch(
        "http://localhost:5000/api/invoices/create",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(submissionData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save invoice");
      }

      setSuccess(true);
      setFormData({
        company_email: "",
        client_email: "",
        telephone: "",
        total_amount: "",
        invoice_date: new Date().toISOString().split("T")[0],
        status: "pending",
      });
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Box
      sx={{
        ml: "240px",
        width: "calc(100% - 240px)",
        p: 4,
        backgroundColor: "#f8fafc",
        minHeight: "100vh",
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

      <Box sx={{ maxWidth: 800, mx: "auto" }}>
        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: 2,
            boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
            backgroundColor: "white",
          }}
        >
          <Box sx={{ mb: 3 }}>
            <Typography variant="h4" fontWeight={600} sx={{ color: "#1e293b" }}>
              Créer une nouvelle facture
            </Typography>
            <Typography variant="body1" sx={{ color: "#64748b", mt: 1 }}>
              Remplissez les détails pour créer une nouvelle facture.
            </Typography>
          </Box>

          <form onSubmit={handleSubmit}>
            {/* Company Email */}
            <Box sx={{ mb: 4 }}>
              <Typography
                variant="h6"
                gutterBottom
                sx={{
                  fontWeight: "600",
                  color: "#1e293b",
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                Courriel de l'entreprise
              </Typography>
              <Divider sx={{ mb: 3, borderColor: "#e2e8f0" }} />

              <TextField
                fullWidth
                label="Courriel de l'entreprise"
                type="email"
                value={formData.company_email}
                onChange={(e) =>
                  handleInputChange("company_email", e.target.value)
                }
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email sx={{ color: "#64748b" }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                  },
                }}
              />
            </Box>

            {/* Client Information */}
            <Box sx={{ mb: 4 }}>
              <Typography
                variant="h6"
                gutterBottom
                sx={{
                  fontWeight: "600",
                  color: "#1e293b",
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                Informations client
              </Typography>
              <Divider sx={{ mb: 3, borderColor: "#e2e8f0" }} />

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Courriel du client"
                    type="email"
                    value={formData.client_email}
                    onChange={(e) =>
                      handleInputChange("client_email", e.target.value)
                    }
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Email sx={{ color: "#64748b" }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Téléphone"
                    value={formData.telephone}
                    onChange={(e) =>
                      handleInputChange("telephone", e.target.value)
                    }
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Phone sx={{ color: "#64748b" }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                      },
                    }}
                  />
                </Grid>
              </Grid>
            </Box>

            {/* Invoice Details */}
            <Box sx={{ mb: 4 }}>
              <Typography
                variant="h6"
                gutterBottom
                sx={{
                  fontWeight: "600",
                  color: "#1e293b",
                }}
              >
                Détails de la facture
              </Typography>
              <Divider sx={{ mb: 3, borderColor: "#e2e8f0" }} />

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Montant total (DT)"
                    type="number"
                    value={formData.total_amount}
                    onChange={(e) =>
                      handleInputChange("total_amount", e.target.value)
                    }
                    required
                    inputProps={{ min: 0, step: 0.01 }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Statut"
                    select
                    value={formData.status}
                    onChange={(e) =>
                      handleInputChange("status", e.target.value)
                    }
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                      },
                    }}
                  >
                    <MenuItem value="pending">En attente</MenuItem>
                    <MenuItem value="paid">Payé</MenuItem>
                    <MenuItem value="overdue">En retard</MenuItem>
                    <MenuItem value="cancelled">Annulé</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Date de la facture"
                    type="date"
                    value={formData.invoice_date}
                    onChange={(e) =>
                      handleInputChange("invoice_date", e.target.value)
                    }
                    InputLabelProps={{
                      shrink: true,
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                      },
                    }}
                  />
                </Grid>
              </Grid>
            </Box>

            {error && (
              <Alert
                severity="error"
                sx={{
                  mb: 3,
                  borderRadius: 2,
                  border: "1px solid #fecaca",
                }}
              >
                {error}
              </Alert>
            )}

            {success && (
              <Alert
                severity="success"
                sx={{
                  mb: 3,
                  borderRadius: 2,
                  border: "1px solid #bbf7d0",
                }}
              >
                Facture enregistrée avec succès !
              </Alert>
            )}

            <Button
              type="submit"
              variant="contained"
              size="large"
              startIcon={<Save />}
              sx={{
                mt: 2,
                borderRadius: 2,
                textTransform: "none",
                fontWeight: "600",
                px: 4,
                py: 1.5,
                background: "linear-gradient(90deg, #2563eb, #3b82f6)",
                boxShadow: "0 4px 15px rgba(37, 99, 235, 0.3)",
                "&:hover": {
                  background: "linear-gradient(90deg, #1e40af, #2563eb)",
                  boxShadow: "0 6px 20px rgba(37, 99, 235, 0.4)",
                },
              }}
            >
              Enregistrer la facture
            </Button>
          </form>
        </Paper>
      </Box>
    </Box>
  );
}