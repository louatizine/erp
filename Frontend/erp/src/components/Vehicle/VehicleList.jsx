/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  IconButton,
  Chip,
  Grid,
  Dialog ,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  Tooltip,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  DirectionsCar as DirectionsCarIcon,
  Event as EventIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';

const SIDEBAR_WIDTH = 240;

const VehicleRow = React.memo(({ vehicle, onView }) => {
  const insuranceExpired =
    vehicle.documents?.insurance?.expiry_date &&
    new Date(vehicle.documents.insurance.expiry_date) < new Date();
  const vignetteExpired =
    vehicle.documents?.vignette?.expiry_date &&
    new Date(vehicle.documents.vignette.expiry_date) < new Date();
  const vesiteExpired =
    vehicle.documents?.vesite?.expiry_date &&
    new Date(vehicle.documents.vesite.expiry_date) < new Date();

  return (
    <TableRow hover key={vehicle._id}>
      <TableCell>
        <Box display="flex" alignItems="center">
          <DirectionsCarIcon color="primary" sx={{ mr: 1 }} />
          <Typography fontWeight={500}>{vehicle.plate_number}</Typography>
        </Box>
      </TableCell>
      <TableCell>{vehicle.owner_name}</TableCell>
      <TableCell>
        <Chip
          label={vehicle.vehicle_type}
          color={vehicle.vehicle_type === 'Commercial' ? 'secondary' : 'primary'}
          size="small"
        />
      </TableCell>
      <TableCell>
        {vehicle.documents?.insurance?.expiry_date ? (
          <Chip
            label={`${format(new Date(vehicle.documents.insurance.expiry_date), 'dd/MM/yyyy')}${
              insuranceExpired ? ' - Expiré' : ''
            }`}
            color={insuranceExpired ? 'error' : 'success'}
            size="small"
          />
        ) : (
          '-'
        )}
      </TableCell>
      <TableCell>
        {vehicle.documents?.vignette?.expiry_date ? (
          <Chip
            label={`${format(new Date(vehicle.documents.vignette.expiry_date), 'dd/MM/yyyy')}${
              vignetteExpired ? ' - Expiré' : ''
            }`}
            color={vignetteExpired ? 'error' : 'success'}
            size="small"
          />
        ) : (
          '-'
        )}
      </TableCell>
      <TableCell>
        {vehicle.documents?.vesite?.expiry_date ? (
          <Chip
            label={`${format(new Date(vehicle.documents.vesite.expiry_date), 'dd/MM/yyyy')}${
              vesiteExpired ? ' - Expiré' : ''
            }`}
            color={vesiteExpired ? 'error' : 'success'}
            size="small"
          />
        ) : (
          '-'
        )}
      </TableCell>
      <TableCell align="center">
        <Tooltip title="Voir détails">
          <IconButton
            onClick={() => onView(vehicle)}
            sx={{ backgroundColor: '#f0f9ff', '&:hover': { backgroundColor: '#e0f2fe' } }}
          >
            <VisibilityIcon />
          </IconButton>
        </Tooltip>
      </TableCell>
    </TableRow>
  );
});

const VehicleList = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchVehicles = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axios.get('/api/vehicles', {
        params: { page: page + 1, per_page: rowsPerPage, search: searchTerm },
      });
      setVehicles(data.data || []);
      setTotalCount(data.total || 0);
    } catch (err) {
      setError('Erreur lors de la récupération des véhicules');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, searchTerm]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  const handleChangePage = (e, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (e) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  const handleView = (vehicle) => {
    setSelectedVehicle(vehicle);
    setOpenDialog(true);
  };

  return (
    <Box
      sx={{
        p: 3,
        ml: `${SIDEBAR_WIDTH}px`,
        width: `calc(100% - ${SIDEBAR_WIDTH}px)`,
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
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
        <Typography variant="h3" fontWeight={800}>
          Gestion
        </Typography>
        <Typography variant="h5" sx={{ letterSpacing: 2, opacity: 0.9 }}>
          DES VÉHICULES
        </Typography>
      </Paper>

      {/* Search & Refresh */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} gap={2}>
          <TextField
            fullWidth
            placeholder="Rechercher par plaque ou propriétaire..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton onClick={() => setSearchTerm('')}>
                    <CloseIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Button variant="contained" onClick={fetchVehicles} disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Actualiser'}
          </Button>
        </Box>
      </Paper>

      {/* Table */}
      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ backgroundColor: '#f1f5f9' }}>
              <TableRow>
                <TableCell>Numéro de Plaque</TableCell>
                <TableCell>Propriétaire</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Assurance</TableCell>
                <TableCell>Vignette</TableCell>
                <TableCell>Visite Technique</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : vehicles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    Aucun véhicule trouvé
                  </TableCell>
                </TableRow>
              ) : (
                vehicles.map((v) => <VehicleRow key={v._id} vehicle={v} onView={handleView} />)
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Lignes par page:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} sur ${count}`}
        />
      </Paper>

      {/* Vehicle Details Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <Box sx={{ position: 'relative' }}>
          <IconButton
            onClick={() => setOpenDialog(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
          
          <Box sx={{ 
            p: 3,
            background: 'linear-gradient(90deg, #2563eb, #3b82f6)',
            color: 'white',
            borderTopLeftRadius: 8,
            borderTopRightRadius: 8,
          }}>
            <Box display="flex" alignItems="center" gap={2}>
              <DirectionsCarIcon sx={{ fontSize: 40 }} />
              <Box>
                <Typography variant="h5" fontWeight="bold">
                  {selectedVehicle?.plate_number}
                </Typography>
                <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                  Détails du Véhicule
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
              {/* Vehicle Information */}
              <Grid item xs={12} md={6}>
                <Paper 
                  elevation={0}
                  sx={{ 
                    p: 3,
                    height: '100%',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    backgroundColor: '#f8fafc'
                  }}
                >
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <EventIcon color="primary" />
                    <Typography variant="h6" color="primary">
                      Informations Générales
                    </Typography>
                  </Box>
                  
                  <Box display="flex" flexDirection="column" gap={2}>
                    <Box>
                      <Typography color="text.secondary" gutterBottom>
                        Propriétaire
                      </Typography>
                      <Typography variant="h6">
                        {selectedVehicle?.owner_name}
                      </Typography>
                    </Box>
                    
                    <Box>
                      <Typography color="text.secondary" gutterBottom>
                        Type de Véhicule
                      </Typography>
                      <Chip
                        label={selectedVehicle?.vehicle_type}
                        color={selectedVehicle?.vehicle_type === 'Commercial' ? 'secondary' : 'primary'}
                        sx={{ fontWeight: 500 }}
                      />
                    </Box>
                  </Box>
                </Paper>
              </Grid>

              {/* Documents */}
              <Grid item xs={12} md={6}>
                <Paper 
                  elevation={0}
                  sx={{ 
                    p: 3,
                    height: '100%',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    backgroundColor: '#f8fafc'
                  }}
                >
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <VisibilityIcon color="primary" />
                    <Typography variant="h6" color="primary">
                      Documents
                    </Typography>
                  </Box>

                  <Box display="flex" flexDirection="column" gap={3}>
                    {[
                      { key: 'insurance', label: 'Assurance' },
                      { key: 'vignette', label: 'Vignette' },
                      { key: 'vesite', label: 'Visite Technique' }
                    ].map((doc) => {
                      const expiryDate = selectedVehicle?.documents?.[doc.key]?.expiry_date;
                      const isExpired = expiryDate && new Date(expiryDate) < new Date();
                      
                      return (
                        <Box key={doc.key}>
                          <Typography color="text.secondary" gutterBottom>
                            {doc.label}
                          </Typography>
                          {expiryDate ? (
                            <Box display="flex" alignItems="center" gap={1}>
                              <Chip
                                label={format(new Date(expiryDate), 'dd/MM/yyyy')}
                                color={isExpired ? 'error' : 'success'}
                                variant="outlined"
                                sx={{ fontWeight: 500 }}
                              />
                              {isExpired && (
                                <Typography color="error" variant="caption">
                                  Expiré
                                </Typography>
                              )}
                            </Box>
                          ) : (
                            <Typography color="text.secondary">
                              Non disponible
                            </Typography>
                          )}
                        </Box>
                      );
                    })}
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Dialog>

      {error && (
        <Alert severity="error" sx={{ mt: 3 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
};

export default VehicleList;
