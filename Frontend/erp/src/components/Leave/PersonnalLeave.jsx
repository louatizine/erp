import React, { useState, useEffect } from 'react';
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
  Chip,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Alert,
  Avatar,
  Divider,
  Grid,
  useTheme,
} from '@mui/material';
import {
  FilterList,
  Search,
  Refresh,
  Visibility,
  Cancel,
  Download,
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../Auth/AuthContext';
import { format, parseISO } from 'date-fns';

const SIDEBAR_WIDTH = 240;

const PersonnalLeave = () => {
  const theme = useTheme();
  const { user } = useAuth();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState('');
  const [cancelSuccess, setCancelSuccess] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const statusColors = {
    pending: 'warning',
    approved: 'success',
    rejected: 'error',
    cancelled: 'default',
  };

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get(`/api/leave/employee/${user.id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setRequests(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Échec de la récupération des demandes de congé");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleCancelRequest = async () => {
    if (!selectedRequest) return;
    setIsCancelling(true);
    setCancelError('');
    try {
      await axios.post(`/api/leave/cancel/${selectedRequest._id}`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setCancelSuccess(true);
      fetchRequests();
      setTimeout(() => {
        setOpenDialog(false);
        setCancelSuccess(false);
        setConfirmCancel(false);
      }, 1500);
    } catch (err) {
      setCancelError(err.response?.data?.message || "Échec de l'annulation de la demande");
    } finally {
      setIsCancelling(false);
    }
  };

  const filteredRequests = requests
    .filter(r => filter === 'all' || r.status === filter)
    .filter(r => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        r.leave_type.toLowerCase().includes(term) ||
        r.reason.toLowerCase().includes(term) ||
        r._id.toLowerCase().includes(term)
      );
    });

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'En attente',
      approved: 'Approuvé',
      rejected: 'Rejeté',
      cancelled: 'Annulé',
    };
    return labels[status] || status;
  };

  const getLeaveTypeIcon = (type) => {
    const icons = {
      vacation: '🏖️',
      sick: '🤒',
      personal: '👤',
      bereavement: '⚰️',
      maternity: '👶',
    };
    return icons[type] || '📅';
  };

  const calculateDuration = (start, end) => {
    return (
      Math.ceil(
        (new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24)
      ) + 1
    );
  };

  return (
    <Box
      sx={{
        p: { xs: 2, sm: 3 },
        ml: `${SIDEBAR_WIDTH}px`,
        width: `calc(100% - ${SIDEBAR_WIDTH}px)`,
        transition: 'all 0.3s ease',
      }}
    >
      {/* Header and Filters */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          mb: 3,
          gap: 2,
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Mes demandes de congé
        </Typography>

        <Box
          sx={{
            display: 'flex',
            gap: 2,
            width: { xs: '100%', sm: 'auto' },
            flexDirection: { xs: 'column', sm: 'row' },
          }}
        >
          <TextField
            size="small"
            placeholder="Rechercher..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search color="action" />
                </InputAdornment>
              ),
            }}
            sx={{
              minWidth: 200,
              bgcolor: theme.palette.background.paper,
              borderRadius: 1,
            }}
          />

          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Statut</InputLabel>
            <Select
              value={filter}
              onChange={e => setFilter(e.target.value)}
              label="Statut"
              startAdornment={
                <InputAdornment position="start">
                  <FilterList color="action" />
                </InputAdornment>
              }
            >
              <MenuItem value="all">Tous les statuts</MenuItem>
              <MenuItem value="pending">En attente</MenuItem>
              <MenuItem value="approved">Approuvé</MenuItem>
              <MenuItem value="rejected">Rejeté</MenuItem>
              <MenuItem value="cancelled">Annulé</MenuItem>
            </Select>
          </FormControl>

          <Tooltip title="Actualiser">
            <IconButton
              onClick={fetchRequests}
              color="primary"
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                alignSelf: 'center',
                bgcolor: 'background.paper',
                '&:hover': { bgcolor: 'background.default' },
              }}
            >
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Status Messages */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Loading */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Requests Table */}
          <TableContainer
            component={Paper}
            elevation={3}
            sx={{ borderRadius: 2, overflow: 'hidden' }}
          >
            <Table>
              <TableHead
                sx={{
                  backgroundColor: theme.palette.primary.light,
                }}
              >
                <TableRow>
                  {['Type', 'Dates', 'Durée', 'Statut', 'Actions'].map((head) => (
                    <TableCell key={head} sx={{ fontWeight: 700 }}>
                      {head}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>

              <TableBody>
                {filteredRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                      Aucune demande de congé trouvée
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRequests.map((req) => (
                    <TableRow key={req._id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar
                            sx={{
                              bgcolor: theme.palette.primary.light,
                              width: 34,
                              height: 34,
                              fontSize: 18,
                            }}
                          >
                            {getLeaveTypeIcon(req.leave_type)}
                          </Avatar>
                          <Typography sx={{ textTransform: 'capitalize', fontWeight: 600 }}>
                            {req.leave_type.replace(/-/g, ' ')}
                          </Typography>
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {format(parseISO(req.start_date), 'dd MMM yyyy')}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          à {format(parseISO(req.end_date), 'dd MMM yyyy')}
                        </Typography>
                      </TableCell>

                      <TableCell sx={{ fontWeight: 600 }}>
                        {calculateDuration(req.start_date, req.end_date)} jour
                        {calculateDuration(req.start_date, req.end_date) > 1 ? 's' : ''}
                      </TableCell>

                      <TableCell>
                        <Chip
                          label={getStatusLabel(req.status)}
                          color={statusColors[req.status]}
                          variant="outlined"
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                      </TableCell>

                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Tooltip title="Voir les détails">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => {
                                setSelectedRequest(req);
                                setOpenDialog(true);
                                setCancelError('');
                                setCancelSuccess(false);
                                setConfirmCancel(false);
                              }}
                            >
                              <Visibility fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          {req.status === 'pending' && (
                            <Tooltip title="Annuler la demande">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => {
                                  setSelectedRequest(req);
                                  setOpenDialog(true);
                                  setCancelError('');
                                  setCancelSuccess(false);
                                  setConfirmCancel(false);
                                }}
                              >
                                <Cancel fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Request Details Dialog */}
          <Dialog
            open={openDialog}
            onClose={() => {
              setOpenDialog(false);
              setCancelError('');
              setCancelSuccess(false);
              setConfirmCancel(false);
            }}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>Détails de la demande de congé</DialogTitle>

            <DialogContent dividers>
              {selectedRequest && (
                <>
                  {cancelError && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {cancelError}
                    </Alert>
                  )}

                  {cancelSuccess && (
                    <Alert severity="success" sx={{ mb: 2 }}>
                      La demande de congé a été annulée avec succès
                    </Alert>
                  )}

                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                      Résumé de la demande
                    </Typography>
                    <Divider sx={{ mb: 2 }} />

                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Type
                        </Typography>
                        <Typography sx={{ textTransform: 'capitalize' }}>
                          {selectedRequest.leave_type.replace(/-/g, ' ')}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Statut
                        </Typography>
                        <Chip
                          label={getStatusLabel(selectedRequest.status)}
                          color={statusColors[selectedRequest.status]}
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Date de début
                        </Typography>
                        <Typography>
                          {format(parseISO(selectedRequest.start_date), 'PPP')}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Date de fin
                        </Typography>
                        <Typography>
                          {format(parseISO(selectedRequest.end_date), 'PPP')}
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary">
                          Durée
                        </Typography>
                        <Typography>
                          {calculateDuration(selectedRequest.start_date, selectedRequest.end_date)} jours
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="body2" color="text.secondary">
                          Soumis le
                        </Typography>
                        <Typography>
                          {format(parseISO(selectedRequest.created_at), 'PPPpp')}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>

                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                      Raison
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Typography whiteSpace="pre-line">{selectedRequest.reason}</Typography>
                  </Box>

                  {selectedRequest.document_path && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                        Document justificatif
                      </Typography>
                      <Divider sx={{ mb: 2 }} />
                      <Button
                        variant="outlined"
                        startIcon={<Download />}
                        onClick={() => {
                          window.open(`/api/leave/document/${selectedRequest._id}`, '_blank');
                        }}
                      >
                        Télécharger le document
                      </Button>
                    </Box>
                  )}

                  {selectedRequest.status === 'rejected' && selectedRequest.rejection_reason && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle1" fontWeight={700} gutterBottom color="error">
                        Motif de rejet
                      </Typography>
                      <Divider sx={{ mb: 2 }} />
                      <Typography color="error" whiteSpace="pre-line">
                        {selectedRequest.rejection_reason}
                      </Typography>
                    </Box>
                  )}
                </>
              )}
            </DialogContent>

            <DialogActions>
              <Button
                onClick={() => {
                  setOpenDialog(false);
                  setCancelError('');
                  setCancelSuccess(false);
                  setConfirmCancel(false);
                }}
              >
                Fermer
              </Button>

              {selectedRequest?.status === 'pending' && (
                <>
                  {!confirmCancel ? (
                    <Button
                      color="error"
                      variant="outlined"
                      onClick={() => setConfirmCancel(true)}
                      disabled={isCancelling}
                    >
                      Annuler la demande
                    </Button>
                  ) : (
                    <>
                      <Button
                        onClick={() => setConfirmCancel(false)}
                        disabled={isCancelling}
                      >
                        Annuler
                      </Button>
                      <Button
                        color="error"
                        variant="contained"
                        onClick={handleCancelRequest}
                        disabled={isCancelling}
                        startIcon={
                          isCancelling ? (
                            <CircularProgress size={20} color="inherit" />
                          ) : (
                            <Cancel />
                          )
                        }
                        sx={{
                          transition: 'background-color 0.3s ease',
                          '&:hover': {
                            backgroundColor: theme.palette.error.dark,
                          },
                        }}
                      >
                        {isCancelling ? 'Annulation...' : 'Confirmer'}
                      </Button>
                    </>
                  )}
                </>
              )}
            </DialogActions>
          </Dialog>
        </>
      )}
    </Box>
  );
};

export default PersonnalLeave;
