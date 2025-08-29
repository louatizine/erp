/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import {
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Chip, Typography, Box,
  CircularProgress, Alert, Button, IconButton, Tooltip,
  TextField, Dialog, DialogActions, DialogContent, 
  DialogTitle, TablePagination, InputAdornment, LinearProgress,
  Grid, Divider
} from "@mui/material";
import { 
  Refresh, ErrorOutline, Search, FilterList, Close,
  KeyOutlined, CalendarToday, Timer, CheckCircleOutline,
  Info
} from "@mui/icons-material";
import axios from "axios";
import dayjs from "dayjs";

const SIDEBAR_WIDTH = 240;
const API_BASE_URL = "http://localhost:5000/api/licenses";

export default function LicenseTab({ isSidebarOpen = true }) {
  const [licenses, setLicenses] = useState([]);
  const [filteredLicenses, setFilteredLicenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedLicense, setSelectedLicense] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(`${API_BASE_URL}/`);
      setLicenses(res.data);
      setFilteredLicenses(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Échec de la récupération des licences");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    let result = licenses;
    if (searchTerm) {
      result = result.filter(license => 
        license.license_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        license.license_key?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (statusFilter !== "all") {
      result = result.filter(license => license.status === statusFilter);
    }
    setFilteredLicenses(result);
    setPage(0);
  }, [searchTerm, statusFilter, licenses]);

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };



  const statusConfig = {
    expired: { color: "error", label: "Expirée" },
    about_to_expire: { color: "warning", label: "Bientôt expirée" },
    active: { color: "success", label: "Active" }
  };

  return (
    <Box
      sx={{
        p: 3,
        ml: isSidebarOpen ? `${SIDEBAR_WIDTH}px` : 0,
        width: isSidebarOpen ? `calc(100% - ${SIDEBAR_WIDTH}px)` : '100%',
        minHeight: '100vh',
        backgroundColor: '#f8fafc'
      }}
    >
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 2,
          background: 'linear-gradient(90deg, #2563eb, #3b82f6)',
          color: 'white',
        }}
      >
        <Typography variant="h3" fontWeight={800}>Gestion</Typography>
        <Typography variant="h5" sx={{ letterSpacing: 2, opacity: 0.9 }}>DES LICENCES</Typography>
      </Paper>

      {/* Search & Filter */}
      <Paper sx={{ p: 2, mb: 3, display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'center', borderRadius: 2 }}>
        <TextField
          fullWidth
          placeholder="Rechercher par nom ou clé..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <InputAdornment position="start"><Search /></InputAdornment>,
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <IconButton onClick={() => setSearchTerm('')}><Close /></IconButton>
              </InputAdornment>
            )
          }}
        />
        <Button variant="contained" onClick={fetchData} disabled={loading}>
          {loading ? <CircularProgress size={24} /> : 'Actualiser'}
        </Button>
      </Paper>

      {loading && <LinearProgress sx={{ mb: 2 }} />}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Table */}
      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <TableContainer>
          <Table stickyHeader>
            <TableHead sx={{ backgroundColor: '#f1f5f9' }}>
              <TableRow>
                {["Nom de la licence", "Clé de licence", "Date d'achat", "Date d'expiration", "Jours restants", "Statut"].map((head) => (
                  <TableCell key={head} sx={{ fontWeight: 600 }}>{head}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredLicenses.length === 0 && !loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <ErrorOutline sx={{ fontSize: 50, color: 'text.disabled', mb: 1 }} />
                    <Typography variant="body1" color="text.secondary">Aucune licence trouvée</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredLicenses
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((license) => {
                    const expiryDate = dayjs(license.expiry_date);
                    const daysRemaining = expiryDate.diff(dayjs(), "day");
                    const status = statusConfig[license.status] || statusConfig.active;

                    return (
                      <TableRow 
                        key={license._id} 
                        hover 
                        sx={{ 
                          "&:nth-of-type(even)": { bgcolor: "grey.50" },
                          cursor: 'pointer'
                        }}
                        onClick={() => {
                          setSelectedLicense({...license, daysRemaining, status});
                          setOpenDialog(true);
                        }}
                      >
                        <TableCell>{license.license_name}</TableCell>
                        <TableCell>{license.license_key}</TableCell>
                        <TableCell>{license.purchase_date ? dayjs(license.purchase_date).format("D MMM YYYY") : "-"}</TableCell>
                        <TableCell>{expiryDate.format("D MMM YYYY")}</TableCell>
                        <TableCell>
                          <Chip
                            label={`${daysRemaining} jours`}
                            color={daysRemaining <= 0 ? "error" : daysRemaining <= 7 ? "warning" : "success"}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip label={status.label} color={status.color} size="small" sx={{ fontWeight: 500 }} />
                        </TableCell>
                      </TableRow>
                    );
                  })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredLicenses.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Lignes par page:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} sur ${count}`}
        />
      </Paper>

      {/* License Details Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)} 
        maxWidth="md" 
        fullWidth
      >
        {selectedLicense && (
          <Box sx={{ position: 'relative' }}>
            <IconButton
              onClick={() => setOpenDialog(false)}
              sx={{
                position: 'absolute',
                right: 8,
                top: 8,
                color: (theme) => theme.palette.grey[500],
                zIndex: 1,
              }}
            >
              <Close />
            </IconButton>

            <Box sx={{ 
              p: 3,
              background: 'linear-gradient(90deg, #2563eb, #3b82f6)',
              color: 'white',
              borderTopLeftRadius: 8,
              borderTopRightRadius: 8,
            }}>
              <Box display="flex" alignItems="center" gap={2}>
                <KeyOutlined sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    {selectedLicense.license_name}
                  </Typography>
                  <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                    Détails de la Licence
                  </Typography>
                </Box>
              </Box>
            </Box>

            <Box sx={{ p: 3 }}>
              <Grid container spacing={3}>
                {/* License Key and Status */}
                <Grid item xs={12}>
                  <Paper 
                    elevation={0}
                    sx={{ 
                      p: 3,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                      backgroundColor: '#f8fafc'
                    }}
                  >
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <Info color="primary" />
                      <Typography variant="h6" color="primary">
                        Informations Générales
                      </Typography>
                    </Box>

                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Typography color="text.secondary" gutterBottom>
                          Clé de Licence
                        </Typography>
                        <Typography variant="body1" fontFamily="monospace" bgcolor="#f1f5f9" p={1} borderRadius={1}>
                          {selectedLicense.license_key}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography color="text.secondary" gutterBottom>
                          Statut
                        </Typography>
                        <Chip 
                          label={selectedLicense.status.label}
                          color={selectedLicense.status.color}
                          icon={<CheckCircleOutline />}
                          sx={{ fontWeight: 500 }}
                        />
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>

                {/* Dates Information */}
                <Grid item xs={12}>
                  <Paper 
                    elevation={0}
                    sx={{ 
                      p: 3,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 2,
                      backgroundColor: '#f8fafc'
                    }}
                  >
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      <CalendarToday color="primary" />
                      <Typography variant="h6" color="primary">
                        Informations Temporelles
                      </Typography>
                    </Box>

                    <Grid container spacing={3}>
                      <Grid item xs={12} md={4}>
                        <Typography color="text.secondary" gutterBottom>
                          Date d'achat
                        </Typography>
                        <Typography variant="body1" fontWeight={500}>
                          {selectedLicense.purchase_date 
                            ? dayjs(selectedLicense.purchase_date).format("D MMMM YYYY")
                            : "Non spécifiée"}
                        </Typography>
                      </Grid>

                      <Grid item xs={12} md={4}>
                        <Typography color="text.secondary" gutterBottom>
                          Date d'expiration
                        </Typography>
                        <Typography variant="body1" fontWeight={500}>
                          {dayjs(selectedLicense.expiry_date).format("D MMMM YYYY")}
                        </Typography>
                      </Grid>

                      <Grid item xs={12} md={4}>
                        <Typography color="text.secondary" gutterBottom>
                          Jours Restants
                        </Typography>
                        <Chip
                          icon={<Timer />}
                          label={`${selectedLicense.daysRemaining} jours`}
                          color={selectedLicense.daysRemaining <= 0 ? "error" : 
                                selectedLicense.daysRemaining <= 7 ? "warning" : "success"}
                          sx={{ fontWeight: 500 }}
                        />
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          </Box>
        )}
      </Dialog>

    </Box>
  );
}
