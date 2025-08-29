/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Paper,
  Alert,
  Divider,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Stack
} from "@mui/material";
import {
  DirectionsCar as CarIcon,
  Person as PersonIcon,
  Category as TypeIcon,
  Event as DateIcon,
  UploadFile as UploadIcon,
  Note as NoteIcon,
  Save as SaveIcon,
  Add as AddIcon,
} from "@mui/icons-material";
import axios from "axios";

function VehicleForm({ vehicleId, onSaved }) {
  const [formData, setFormData] = useState({
    plate_number: "",
    owner_name: "",
    vehicle_type: "Privé",
    insurance_expiry: "",
    vignette_expiry: "",
    insurance_file: "",
    vignette_file: "",
    vesite_file: "",
    vesite_expiry: "",
    notes: "",
    visits: { count: 0, last_visit: null },
  });

  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (vehicleId) {
      setLoading(true);
      axios
        .get(`http://localhost:5000/api/vehicles/${vehicleId}`)
        .then((res) => {
          const vehicle = res.data;
          setFormData({
            plate_number: vehicle.plate_number || "",
            owner_name: vehicle.owner_name || "",
            vehicle_type: vehicle.vehicle_type || "Privé",
            insurance_expiry: vehicle.documents?.insurance?.expiry_date || "",
            vignette_expiry: vehicle.documents?.vignette?.expiry_date || "",
            vesite_expiry: vehicle.documents?.Vesite?.expiry_date || "",
            insurance_file: "",
            vignette_file: "",
            vesite_file: "",
            notes: vehicle.notes || "",
            visits: vehicle.visits || { count: 0, last_visit: null },
          });
        })
        .catch((err) => setError(err.response?.data?.error || "Échec de la récupération du véhicule"))
        .finally(() => setLoading(false));
    }
  }, [vehicleId]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      const reader = new FileReader();
      reader.onload = () => {
        setFormData({ ...formData, [name]: reader.result.split(",")[1] });
      };
      reader.readAsDataURL(files[0]);
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleRecordVisit = async () => {
    try {
      const res = await axios.post(`http://localhost:5000/api/vehicles/${vehicleId}/visit`);
      setMessage("Visite enregistrée avec succès");
      const vehicleRes = await axios.get(`http://localhost:5000/api/vehicles/${vehicleId}`);
      const vehicle = vehicleRes.data;
      setFormData(prev => ({
        ...prev,
        visits: vehicle.visits || { count: 0, last_visit: null }
      }));
    } catch (err) {
      setError(err.response?.data?.error || "Échec de l'enregistrement de la visite");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    setLoading(true);

    try {
      const url = vehicleId
        ? `http://localhost:5000/api/vehicles/${vehicleId}`
        : "http://localhost:5000/api/vehicles";
      const method = vehicleId ? "put" : "post";

      const res = await axios({
        method,
        url,
        data: formData,
        headers: { "Content-Type": "application/json" },
      });

      setMessage(res.data.message);
      if (!vehicleId) {
        setFormData({
          plate_number: "",
          owner_name: "",
          vehicle_type: "Privé",
          insurance_expiry: "",
          vignette_expiry: "",
          vesite_expiry: "",
          insurance_file: "",
          vignette_file: "",
          vesite_file: "",
          notes: "",
          visits: { count: 0, last_visit: null },
        });
      }

      if (onSaved) onSaved();
    } catch (err) {
      setError(err.response?.data?.error || "Une erreur est survenue");
    } finally {
      setLoading(false);
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
      {/* Header with Dynamic Services branding */}
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
            {vehicleId ? "✏️ Modifier le véhicule" : "🚗 Enregistrement du véhicule"}
          </Typography>
          <Typography variant="body1" sx={{ color: "#64748b", mt: 1 }}>
            {vehicleId ? "Modifiez les informations du véhicule" : "Ajoutez un nouveau véhicule au système"}
          </Typography>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {vehicleId && formData.visits && (
          <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Chip 
                label={`Visites: ${formData.visits.count}`} 
                color="primary" 
                variant="outlined" 
              />
              <Typography variant="body2">
                Dernière visite: {formData.visits.last_visit
                  ? new Date(formData.visits.last_visit).toLocaleString()
                  : "N/A"}
              </Typography>
            </Box>
          </Alert>
        )}

        {message && <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>{message}</Alert>}
        {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

        <form onSubmit={handleSubmit}>
          <Typography variant="h6" gutterBottom fontWeight={600} sx={{ color: "#1e293b", mb: 2 }}>
            Informations sur le véhicule
          </Typography>
          
          <Grid container spacing={3} mb={4}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Numéro de plaque"
                name="plate_number"
                value={formData.plate_number}
                onChange={handleChange}
                fullWidth
                required
                disabled={loading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CarIcon color="primary" />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Nom du propriétaire"
                name="owner_name"
                value={formData.owner_name}
                onChange={handleChange}
                fullWidth
                required
                disabled={loading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon color="primary" />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="vehicle-type-label">Type de véhicule</InputLabel>
                <Select
                  labelId="vehicle-type-label"
                  name="vehicle_type"
                  value={formData.vehicle_type}
                  onChange={handleChange}
                  disabled={loading}
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="Privé">Privé</MenuItem>
                  <MenuItem value="Commercial">Commercial</MenuItem>
                  <MenuItem value="Gouvernement">Gouvernement</MenuItem>
                  <MenuItem value="Location">Location</MenuItem>
                  <MenuItem value="Taxi">Taxi</MenuItem>
                  <MenuItem value="Autre">Autre</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Typography variant="h6" gutterBottom fontWeight={600} sx={{ color: "#1e293b", mb: 2 }}>
            Documents
          </Typography>
          
          <Grid container spacing={3} mb={4}>
            <Grid item xs={12} md={6}>
              <TextField
                type="date"
                label="Expiration assurance"
                name="insurance_expiry"
                value={formData.insurance_expiry}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
                fullWidth
                disabled={loading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <DateIcon color="primary" />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
              />
              <Button
                variant="outlined"
                component="label"
                startIcon={<UploadIcon />}
                sx={{ mt: 1, borderRadius: 2 }}
                fullWidth
                disabled={loading}
              >
                Télécharger fichier assurance
                <input
                  type="file"
                  hidden
                  name="insurance_file"
                  onChange={handleChange}
                />
              </Button>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                type="date"
                label="Expiration vignette"
                name="vignette_expiry"
                value={formData.vignette_expiry}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
                fullWidth
                disabled={loading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <DateIcon color="primary" />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
              />
              <Button
                variant="outlined"
                component="label"
                startIcon={<UploadIcon />}
                sx={{ mt: 1, borderRadius: 2 }}
                fullWidth
                disabled={loading}
              >
                Télécharger fichier vignette
                <input
                  type="file"
                  hidden
                  name="vignette_file"
                  onChange={handleChange}
                />
              </Button>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                type="date"
                label="Expiration Visite Technique"
                name="vesite_expiry"
                value={formData.vesite_expiry}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
                fullWidth
                disabled={loading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <DateIcon color="primary" />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
              />
              <Button
                variant="outlined"
                component="label"
                startIcon={<UploadIcon />}
                sx={{ mt: 1, borderRadius: 2 }}
                fullWidth
                disabled={loading}
              >
                Télécharger fichier Visite Technique
                <input
                  type="file"
                  hidden
                  name="vesite_file"
                  onChange={handleChange}
                />
              </Button>
            </Grid>
          </Grid>

          <Typography variant="h6" gutterBottom fontWeight={600} sx={{ color: "#1e293b", mb: 2 }}>
            Notes
          </Typography>
          
          <TextField
            label="Notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            multiline
            rows={3}
            fullWidth
            disabled={loading}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <NoteIcon color="primary" />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              },
              mb: 4
            }}
          />

          <Stack direction="row" spacing={2} justifyContent="center">
            {vehicleId && (
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<AddIcon />}
                onClick={handleRecordVisit}
                disabled={loading}
                sx={{
                  px: 4,
                  py: 1.5,
                  borderRadius: 2,
                  fontWeight: 600,
                }}
              >
                Enregistrer visite
              </Button>
            )}
            <Button
              type="submit"
              variant="contained"
              size="large"
              startIcon={loading ? null : <SaveIcon />}
              disabled={loading}
              sx={{
                px: 4,
                py: 1.5,
                borderRadius: 2,
                fontWeight: 600,
                background: "linear-gradient(90deg, #2563eb, #3b82f6)",
                boxShadow: "0 4px 15px rgba(37, 99, 235, 0.3)",
                "&:hover": {
                  background: "linear-gradient(90deg, #1e40af, #2563eb)",
                  boxShadow: "0 6px 20px rgba(37, 99, 235, 0.4)",
                },
              }}
            >
              {loading ? "Traitement..." : vehicleId ? "Mettre à jour" : "Enregistrer"}
            </Button>
          </Stack>
        </form>
      </Paper>
    </Box>
  );
}

export default VehicleForm;