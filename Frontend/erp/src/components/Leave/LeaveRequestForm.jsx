import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  CircularProgress,
  FormHelperText,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../Auth/AuthContext';

const LeaveRequestForm = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    leaveType: '',
    startDate: '',
    endDate: '',
    reason: '',
    document: null,
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [leaveBalance, setLeaveBalance] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingSubmission, setPendingSubmission] = useState(false);

  useEffect(() => {
    const fetchLeaveBalance = async () => {
      try {
        if (user?.id) {
          const response = await axios.get(`/api/leave/balance/${user.id}`);
          setLeaveBalance(response.data.data.leave_balance);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération du solde de congés:', error);
      }
    };
    fetchLeaveBalance();
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      document: e.target.files[0],
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.leaveType) newErrors.leaveType = 'Le type de congé est requis';
    if (!formData.startDate) newErrors.startDate = 'La date de début est requise';
    if (!formData.endDate) newErrors.endDate = 'La date de fin est requise';
    if (
      formData.startDate &&
      formData.endDate &&
      new Date(formData.startDate) > new Date(formData.endDate)
    )
      newErrors.endDate = 'La date de fin doit être après la date de début';
    if (!formData.reason) newErrors.reason = 'La raison est requise';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateLeaveDays = () => {
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    return (end - start) / (1000 * 60 * 60 * 24) + 1;
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  if (!validateForm()) return;

  const leaveDays = calculateLeaveDays();

  if (leaveBalance !== null && leaveDays > leaveBalance && !pendingSubmission) {
    setShowConfirmDialog(true);
    return;
  }

  setIsSubmitting(true);
  setSubmitError('');

  try {
    const formPayload = new FormData();
    formPayload.append('employee_id', user.id);
    formPayload.append('leave_type', formData.leaveType);
    formPayload.append('start_date', formData.startDate);
    formPayload.append('end_date', formData.endDate);
    formPayload.append('reason', formData.reason);
    if (formData.document) {
      formPayload.append('document', formData.document);
    }

    await axios.post('/api/leave/request', formPayload, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });

    // ✅ Update solde localement après une demande réussie
    if (leaveBalance !== null) {
      setLeaveBalance((prev) => Math.max(prev - leaveDays, 0));
    }

    setSubmitSuccess(true);
    setTimeout(() => navigate('/leave/personal'), 2000);
  } catch (error) {
    setSubmitError(
      error.response?.data?.message || 'Échec de la soumission de la demande de congé'
    );
  } finally {
    setIsSubmitting(false);
    setPendingSubmission(false);
  }
};

  const handleConfirmDialogClose = (proceed) => {
    setShowConfirmDialog(false);
    if (proceed) {
      setPendingSubmission(true);
      handleSubmit(new Event('submit')); // trigger submission again
    }
  };

  return (
    <Box
      sx={{
        maxWidth: 850,
        mx: 'auto',
        p: { xs: 3, sm: 5 },
        backgroundColor: '#fff',
        borderRadius: 3,
        boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
      }}
    >
      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        sx={{ fontWeight: '700', color: 'primary.main', mb: 4 }}
      >
        Soumettre une demande de congé
      </Typography>

      {leaveBalance !== null && (
        <Alert severity="info" sx={{ mb: 4, fontWeight: 600 }}>
            Votre solde actuel de congés : {leaveBalance} jour{leaveBalance !== 1 ? 's' : ''}
        </Alert>
      )}

      {submitError && (
        <Alert severity="error" sx={{ mb: 3, fontWeight: 600 }}>
          {submitError}
        </Alert>
      )}

      {submitSuccess && (
        <Alert severity="success" sx={{ mb: 3, fontWeight: 600 }}>
          Demande de congé soumise avec succès ! Redirection...
        </Alert>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <Grid container spacing={4}>
          {/* Leave Type */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth error={!!errors.leaveType} variant="outlined" required>
              <InputLabel id="leave-type-label" sx={{ fontWeight: 600 }}>
                Type de congé
              </InputLabel>
              <Select
                labelId="leave-type-label"
                id="leaveType"
                name="leaveType"
                value={formData.leaveType}
                label="Type de congé"
                onChange={handleChange}
                sx={{ textTransform: 'capitalize' }}
              >
                <MenuItem value="vacation">Vacances</MenuItem>
                <MenuItem value="sick">Congé maladie</MenuItem>
                <MenuItem value="personal">Personnel</MenuItem>
                <MenuItem value="bereavement">Deuil</MenuItem>
                <MenuItem value="maternity">Maternité/Paternité</MenuItem>
              </Select>
              {errors.leaveType && <FormHelperText>{errors.leaveType}</FormHelperText>}
            </FormControl>
          </Grid>

          {/* Start Date */}
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              required
              label="Date de début"
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
              error={!!errors.startDate}
              helperText={errors.startDate}
            />
          </Grid>

          {/* End Date */}
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth
              required
              label="Date de fin"
              type="date"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
              error={!!errors.endDate}
              helperText={errors.endDate}
            />
          </Grid>

          {/* Document */}
          <Grid item xs={12} sm={6}>
            <Button
              variant="outlined"
              component="label"
              fullWidth
              startIcon={<UploadFileIcon />}
              sx={{
                height: 56,
                textTransform: 'none',
                justifyContent: 'flex-start',
                borderColor: errors.document ? 'error.main' : 'grey.400',
                '&:hover': { borderColor: 'primary.main' },
              }}
            >
              {formData.document ? formData.document.name : 'Télécharger un document justificatif'}
              <input
                type="file"
                hidden
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              />
            </Button>
            <Typography variant="caption" color="text.secondary" mt={0.5}>
              Optionnel — PDF, DOC, JPG, PNG (max 5 Mo)
            </Typography>
          </Grid>

          {/* Reason */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              required
              multiline
              rows={4}
              label="Raison"
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              error={!!errors.reason}
              helperText={errors.reason}
            />
          </Grid>

          {/* Buttons */}
          <Grid item xs={12}>
            <Stack direction="row" justifyContent="flex-end" spacing={2} mt={2}>
              <Button
                variant="outlined"
                onClick={() => navigate(-1)}
                disabled={isSubmitting}
                sx={{ fontWeight: 600, px: 4 }}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={isSubmitting}
                startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
                sx={{ fontWeight: 600, px: 5 }}
              >
                {isSubmitting ? 'Envoi en cours...' : 'Soumettre la demande'}
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </form>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onClose={() => handleConfirmDialogClose(false)}>
        <DialogTitle>Alerte solde insuffisant</DialogTitle>
        <DialogContent>
          Vous demandez plus de jours que votre solde actuel ({leaveBalance} jour
          {leaveBalance !== 1 ? 's' : ''}). Voulez-vous continuer malgré tout ?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleConfirmDialogClose(false)}>Annuler</Button>
          <Button onClick={() => handleConfirmDialogClose(true)} variant="contained">
            Oui, continuer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LeaveRequestForm;
