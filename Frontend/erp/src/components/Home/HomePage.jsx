/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import {
  Box,
  Grid,
  Paper,
  Typography,
  CircularProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  LinearProgress,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  Badge,
  Divider,
  useMediaQuery,
  useTheme
} from "@mui/material";
import {
  Refresh,
  Add,
  Edit,
  Delete,
  Warning,
  CheckCircle,
  Cancel,
  Notifications,
  Person,
  FileDownload,
  Settings,
  DirectionsCar,
  LocalShipping
} from "@mui/icons-material";
import { format, differenceInDays } from "date-fns";
import axios from "axios";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

const COLORS = ["#4caf50", "#f44336", "#ff9800"]; // Green, Red, Orange
const SIDEBAR_WIDTH = 240;

export default function LicenseDashboard() {
  const [licenses, setLicenses] = useState([]);
  const [users, setUsers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openVehicleDialog, setOpenVehicleDialog] = useState(false);
  const [currentLicense, setCurrentLicense] = useState(null);
  const [currentVehicle, setCurrentVehicle] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [licensesRes, usersRes, vehiclesRes] = await Promise.all([
        axios.get("http://localhost:5000/api/licenses/"),
        axios.get("http://localhost:5000/api/users/"),
        axios.get("http://localhost:5000/api/vehicles/"),
      ]);
      setLicenses(licensesRes.data);
      setUsers(usersRes.data);
      setVehicles(vehiclesRes.data?.data || []);
    } catch (err) {
      console.error("Erreur lors de la récupération des données:", err);
      showSnackbar("Échec de la récupération des données", "error");
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleDeleteLicense = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/licenses/${id}`);
      showSnackbar("Licence supprimée avec succès", "success");
      fetchData();
    } catch (err) {
      console.error("Erreur lors de la suppression de la licence:", err);
      showSnackbar("Échec de la suppression de la licence", "error");
    }
  };

  const handleSubmitLicense = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (currentLicense.id) {
        await axios.put(
          `http://localhost:5000/api/licenses/${currentLicense.id}`,
          currentLicense
        );
        showSnackbar("Licence mise à jour avec succès", "success");
      } else {
        await axios.post("http://localhost:5000/api/licenses", currentLicense);
        showSnackbar("Licence ajoutée avec succès", "success");
      }
      setOpenDialog(false);
      fetchData();
    } catch (err) {
      console.error("Erreur lors de l'enregistrement de la licence:", err);
      showSnackbar("Échec de l'enregistrement de la licence", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitVehicle = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (currentVehicle._id) {
        await axios.put(
          `http://localhost:5000/api/vehicles/${currentVehicle._id}`,
          currentVehicle
        );
        showSnackbar("Véhicule mis à jour avec succès", "success");
      } else {
        await axios.post("http://localhost:5000/api/vehicles", currentVehicle);
        showSnackbar("Véhicule ajouté avec succès", "success");
      }
      setOpenVehicleDialog(false);
      fetchData();
    } catch (err) {
      console.error("Erreur lors de l'enregistrement du véhicule:", err);
      showSnackbar("Échec de l'enregistrement du véhicule", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentLicense({
      ...currentLicense,
      [name]: value,
    });
  };

  const handleVehicleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentVehicle({
      ...currentVehicle,
      [name]: value,
    });
  };

  // Calculate dashboard metrics
  const totalLicenses = licenses.length;
  const activeLicenses = licenses.filter(l => l.status?.toLowerCase() === "active").length;
  const expiredLicenses = licenses.filter(l => new Date(l.expiry_date) < new Date()).length;
  const soonToExpire = licenses.filter(l => {
    const diffDays = differenceInDays(new Date(l.expiry_date), new Date());
    return diffDays > 0 && diffDays <= 30;
  }).length;
  const adminCount = users.filter(u => u.roles?.includes('admin')).length;

  // Vehicle metrics
  const totalVehicles = vehicles.length;
  const privateVehicles = vehicles.filter(v => v.vehicle_type === 'Private').length;
  const commercialVehicles = vehicles.filter(v => v.vehicle_type === 'Commercial').length;
  const expiringDocuments = vehicles.filter(v => {
    const insuranceExpiring = v.documents?.insurance?.expiry_date && 
      differenceInDays(new Date(v.documents.insurance.expiry_date), new Date()) <= 30;
    const vignetteExpiring = v.documents?.vignette?.expiry_date && 
      differenceInDays(new Date(v.documents.vignette.expiry_date), new Date()) <= 30;
    return insuranceExpiring || vignetteExpiring;
  }).length;

  // Chart data
  const statusChartData = [
    { name: "Act", value: activeLicenses },
    { name: "Exp", value: expiredLicenses },
    { name: "Bientôt expirées", value: soonToExpire },
  ];

  const expiryTrendData = [
    { name: "Jan", active: 12, expired: 2, soon: 3 },
    { name: "Fév", active: 15, expired: 1, soon: 2 },
    { name: "Mar", active: 18, expired: 0, soon: 4 },
    { name: "Avr", active: 20, expired: 3, soon: 5 },
    { name: "Mai", active: 22, expired: 1, soon: 2 },
    { name: "Juin", active: 25, expired: 2, soon: 3 },
  ];

  // System alerts
  const systemAlerts = [
    { id: 1, message: `${soonToExpire} licences expirent bientôt`, severity: "warning" },
    { id: 2, message: `${expiredLicenses} licences expirées`, severity: "error" },
    { id: 3, message: `${expiringDocuments} documents de véhicule expirent bientôt`, severity: "warning" },
    { id: 4, message: "Système fonctionnant normalement", severity: "success" }
  ];

  // Right Sidebar Components
  const RightSidebar = () => (
    <>
      {/* License Status */}
      <Paper sx={{ 
        p: 3, 
        mb: 3, 
        borderRadius: 2,
        transition: 'box-shadow 0.3s ease',
        '&:hover': {
          boxShadow: 3
        }
      }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Statut des Licences
        </Typography>
        <ResponsiveContainer width="110%" height={300}>
          <PieChart>
            <Pie
              data={statusChartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              innerRadius={40}
              paddingAngle={5}
              dataKey="value"
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            >
              {statusChartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <RechartsTooltip formatter={(value) => [`${value} licences`, 'Nombre']} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </Paper>

      {/* Quick Actions */}
      <Paper sx={{ 
        p: 3, 
        mb: 3, 
        borderRadius: 2,
        transition: 'box-shadow 0.3s ease',
        '&:hover': {
          boxShadow: 3
        }
      }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Actions Rapides
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<Add />}
              size="large"
              sx={{ py: 1.5 }}
              onClick={() => {
                setCurrentLicense({
                  license_name: "",
                  license_key: "",
                  status: "active",
                  expiry_date: format(new Date(), "yyyy-MM-dd"),
                });
                setOpenDialog(true);
              }}
            >
              AJOUTER LICENCE
            </Button>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<DirectionsCar />}
              size="large"
              sx={{ py: 1.5 }}
              onClick={() => {
                setCurrentVehicle({
                  plate_number: "",
                  owner_name: "",
                  vehicle_type: "Private",
                  documents: {
                    insurance: { expiry_date: "", file: "" },
                    vignette: { expiry_date: "", file: "" }
                  },
                  notes: ""
                });
                setOpenVehicleDialog(true);
              }}
            >
              AJOUTER VÉHICULE
            </Button>
          </Grid>
          <Grid item xs={6}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<FileDownload />}
              size="large"
              sx={{ py: 1.5 }}
              onClick={() => showSnackbar("Exportation bientôt disponible!", "info")}
            >
              EXPORTER
            </Button>
          </Grid>
          <Grid item xs={6}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Settings />}
              size="large"
              sx={{ py: 1.5 }}
            >
              PARAMÈTRES
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* System Alerts */}
      <Paper sx={{ 
        p: 3, 
        borderRadius: 2,
        transition: 'box-shadow 0.3s ease',
        '&:hover': {
          boxShadow: 3
        }
      }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Alertes Système
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {systemAlerts.map(alert => (
            <Alert 
              key={alert.id} 
              severity={alert.severity}
              icon={alert.severity === "warning" ? <Warning /> : 
                    alert.severity === "error" ? <Cancel /> : <CheckCircle />}
              sx={{ alignItems: 'center' }}
            >
              {alert.message}
            </Alert>
          ))}
        </Box>
      </Paper>
    </>
  );

  return (
    <Box sx={{ 
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      p: { xs: 2, sm: 3 },
      ml: isMobile ? 0 : `${SIDEBAR_WIDTH}px`,
      width: isMobile ? '100%' : `calc(100% - ${SIDEBAR_WIDTH}px)`,
      transition: 'all 0.3s ease',
      minHeight: '100vh',
      backgroundColor: '#f5f7fa'
    }}>
      {/* Main Content Area */}
      <Box sx={{ 
        flex: 1,
        minWidth: 0,
        mr: isMobile ? 0 : 3
      }}>
        {/* Key Metrics */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {[
            { 
              title: "Licences Totales", 
              value: totalLicenses, 
              subtitle: `${activeLicenses} actives`, 
              icon: "📄",
              color: "#5e72e4" 
            },
            { 
              title: "Licences Actives", 
              value: activeLicenses, 
              subtitle: `${soonToExpire} expirent bientôt`, 
              icon: "✅",
              color: "#2dce89" 
            },
            { 
              title: "Véhicules Totaux", 
              value: totalVehicles, 
              subtitle: `${privateVehicles} privés, ${commercialVehicles} commerciaux`, 
              icon: <DirectionsCar fontSize="large" />,
              color: "#6f42c1" 
            },
            { 
              title: "Documents Expirant", 
              value: expiringDocuments, 
              subtitle: "Nécessite attention", 
              icon: <LocalShipping fontSize="large" />,
              color: "#20c997" 
            },
            { 
              title: "Utilisateurs", 
              value: users.length, 
              subtitle: `${adminCount} administrateurs`, 
              icon: "👥",
              color: "#11cdef" 
            },
          ].map((metric, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Paper sx={{ 
                p: 3, 
                backgroundColor: metric.color,
                color: "white",
                borderRadius: 2,
                height: "100%",
                transition: 'transform 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-5px)'
                }
              }}>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Box>
                    <Typography variant="subtitle2">{metric.title}</Typography>
                    <Typography variant="h3" fontWeight="bold">{metric.value}</Typography>
                    <Typography variant="body2">{metric.subtitle}</Typography>
                  </Box>
                  <Box sx={{ 
                    width: 50, 
                    height: 50, 
                    backgroundColor: "rgba(255,255,255,0.2)",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}>
                    {typeof metric.icon === 'string' ? (
                      <Typography variant="h5">{metric.icon}</Typography>
                    ) : (
                      metric.icon
                    )}
                  </Box>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* License Table */}
        <Paper sx={{ 
          p: 3, 
          mb: 3, 
          borderRadius: 2,
          transition: 'box-shadow 0.3s ease',
          '&:hover': {
            boxShadow: 3
          }
        }}>
          <Box sx={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center",
            mb: 2
          }}>
            <Typography variant="h6" fontWeight="bold">Activité Récente des Licences</Typography>
            <Button 
              variant="outlined" 
              startIcon={<FileDownload />}
              onClick={() => showSnackbar("Exportation bientôt disponible!", "info")}
              sx={{ textTransform: 'none' }}
            >
              Exporter
            </Button>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nom de la Licence</TableCell>
                  <TableCell>Clé</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell>Date d'Expiration</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {licenses.slice(0, 7).map((license) => (
                  <TableRow 
                    key={license.id} 
                    hover
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <TableCell>{license.license_name || "-"}</TableCell>
                    <TableCell sx={{ fontFamily: "monospace" }}>
                      {license.license_key}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={license.status} 
                        color={
                          license.status?.toLowerCase() === "active" ? "success" : 
                          new Date(license.expiry_date) < new Date() ? "error" : "warning"
                        } 
                      />
                    </TableCell>
                    <TableCell>
                      {license.expiry_date ? 
                        format(new Date(license.expiry_date), "MMM dd, yyyy") : 
                        "N/A"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Vehicle Management */}
        <Paper sx={{ 
          p: 3, 
          mb: 3, 
          borderRadius: 2,
          transition: 'box-shadow 0.3s ease',
          '&:hover': {
            boxShadow: 3
          }
        }}>
          <Box sx={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center",
            mb: 2
          }}>
            <Typography variant="h6" fontWeight="bold">Gestion des Véhicules</Typography>
            <Button 
              variant="outlined" 
              startIcon={<Add />}
              onClick={() => {
                setCurrentVehicle({
                  plate_number: "",
                  owner_name: "",
                  vehicle_type: "Private",
                  documents: {
                    insurance: { expiry_date: "", file: "" },
                    vignette: { expiry_date: "", file: "" }
                  },
                  notes: ""
                });
                setOpenVehicleDialog(true);
              }}
              sx={{ textTransform: 'none' }}
            >
              Ajouter Véhicule
            </Button>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Plaque d'Immatriculation</TableCell>
                  <TableCell>Propriétaire</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Assurance</TableCell>
                  <TableCell>Vignette</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {vehicles.slice(0, 5).map((vehicle) => (
                  <TableRow 
                    key={vehicle._id} 
                    hover
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <TableCell sx={{ fontWeight: 'bold' }}>{vehicle.plate_number}</TableCell>
                    <TableCell>{vehicle.owner_name}</TableCell>
                    <TableCell>
                      <Chip 
                        label={vehicle.vehicle_type} 
                        color={vehicle.vehicle_type === "Commercial" ? "primary" : "default"} 
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {vehicle.documents?.insurance?.expiry_date ? (
                        <Chip 
                          label={format(new Date(vehicle.documents.insurance.expiry_date), "MMM yyyy")} 
                          color={new Date(vehicle.documents.insurance.expiry_date) < new Date() ? "error" : "warning"} 
                          size="small"
                        />
                      ) : (
                        <Chip label="N/A" color="default" size="small" />
                      )}
                    </TableCell>
                    <TableCell>
                      {vehicle.documents?.vignette?.expiry_date ? (
                        <Chip 
                          label={format(new Date(vehicle.documents.vignette.expiry_date), "MMM yyyy")} 
                          color={new Date(vehicle.documents.vignette.expiry_date) < new Date() ? "error" : "success"} 
                          size="small"
                        />
                      ) : (
                        <Chip label="N/A" color="default" size="small" />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* User Management */}
        <Paper sx={{ 
          p: 3, 
          borderRadius: 2,
          transition: 'box-shadow 0.3s ease',
          '&:hover': {
            boxShadow: 3
          }
        }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Gestion des Utilisateurs
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nom</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Rôle</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell>Solde de Congés</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.slice(0, 5).map((user) => (
                  <TableRow 
                    key={user.id} 
                    hover
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Chip 
                        label={user.roles?.includes('admin') ? 'Admin' : 'Utilisateur'} 
                        color={user.roles?.includes('admin') ? 'primary' : 'default'} 
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip label="Actif" color="success" size="small" />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <Box sx={{ width: "60%", mr: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={Math.min(user.leave_balance, 100)}
                            color={
                              user.leave_balance > 70 ? "success" :
                              user.leave_balance > 30 ? "warning" : "error"
                            }
                            sx={{ height: 8, borderRadius: 4 }}
                          />
                        </Box>
                        <Typography variant="body2">
                          {user.leave_balance} jours
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>

      {/* Right Sidebar - Only show on desktop */}
      {!isMobile && (
        <Box sx={{ width: 350, minWidth: 350 }}>
          <RightSidebar />
        </Box>
      )}

      {/* Mobile View - Show sidebar below main content */}
      {isMobile && (
        <Box sx={{ width: '100%', mt: 3 }}>
          <RightSidebar />
        </Box>
      )}

      {/* Add/Edit License Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          {currentLicense?.id ? "Modifier la Licence" : "Créer une Nouvelle Licence"}
        </DialogTitle>
        <form onSubmit={handleSubmitLicense}>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Nom de la Licence"
                  name="license_name"
                  value={currentLicense?.license_name || ""}
                  onChange={handleInputChange}
                  required
                  margin="normal"
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Clé de Licence"
                  name="license_key"
                  value={currentLicense?.license_key || ""}
                  onChange={handleInputChange}
                  required
                  margin="normal"
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Statut</InputLabel>
                  <Select
                    name="status"
                    value={currentLicense?.status || "active"}
                    label="Statut"
                    onChange={handleInputChange}
                    variant="outlined"
                  >
                    <MenuItem value="active">Actif</MenuItem>
                    <MenuItem value="inactive">Inactif</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Date d'Expiration"
                  name="expiry_date"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={currentLicense?.expiry_date || ""}
                  onChange={handleInputChange}
                  required
                  margin="normal"
                  variant="outlined"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button 
              onClick={() => setOpenDialog(false)}
              variant="outlined"
              sx={{ mr: 2 }}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting}
              startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
              sx={{ px: 3 }}
            >
              {currentLicense?.id ? "Mettre à jour" : "Créer"} Licence
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Add/Edit Vehicle Dialog */}
      <Dialog 
        open={openVehicleDialog} 
        onClose={() => setOpenVehicleDialog(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          {currentVehicle?._id ? "Modifier le Véhicule" : "Ajouter un Nouveau Véhicule"}
        </DialogTitle>
        <form onSubmit={handleSubmitVehicle}>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Plaque d'Immatriculation"
                  name="plate_number"
                  value={currentVehicle?.plate_number || ""}
                  onChange={handleVehicleInputChange}
                  required
                  margin="normal"
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Nom du Propriétaire"
                  name="owner_name"
                  value={currentVehicle?.owner_name || ""}
                  onChange={handleVehicleInputChange}
                  required
                  margin="normal"
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Type de Véhicule</InputLabel>
                  <Select
                    name="vehicle_type"
                    value={currentVehicle?.vehicle_type || "Private"}
                    label="Type de Véhicule"
                    onChange={handleVehicleInputChange}
                    variant="outlined"
                  >
                    <MenuItem value="Private">Privé</MenuItem>
                    <MenuItem value="Commercial">Commercial</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Expiration Assurance"
                  name="documents.insurance.expiry_date"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={currentVehicle?.documents?.insurance?.expiry_date || ""}
                  onChange={(e) => {
                    setCurrentVehicle({
                      ...currentVehicle,
                      documents: {
                        ...currentVehicle.documents,
                        insurance: {
                          ...currentVehicle.documents?.insurance,
                          expiry_date: e.target.value
                        }
                      }
                    });
                  }}
                  margin="normal"
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Expiration Vignette"
                  name="documents.vignette.expiry_date"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={currentVehicle?.documents?.vignette?.expiry_date || ""}
                  onChange={(e) => {
                    setCurrentVehicle({
                      ...currentVehicle,
                      documents: {
                        ...currentVehicle.documents,
                        vignette: {
                          ...currentVehicle.documents?.vignette,
                          expiry_date: e.target.value
                        }
                      }
                    });
                  }}
                  margin="normal"
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  name="notes"
                  value={currentVehicle?.notes || ""}
                  onChange={handleVehicleInputChange}
                  margin="normal"
                  variant="outlined"
                  multiline
                  rows={3}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button 
              onClick={() => setOpenVehicleDialog(false)}
              variant="outlined"
              sx={{ mr: 2 }}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting}
              startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
              sx={{ px: 3 }}
            >
              {currentVehicle?._id ? "Mettre à jour" : "Ajouter"} Véhicule
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%', boxShadow: 3 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}