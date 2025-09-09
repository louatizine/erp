/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import {
  Box,
  Grid,
  Paper,
  Typography,
  LinearProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert,
  useMediaQuery,
  useTheme,
  Pagination,
} from "@mui/material";
import {
  Person as PersonIcon,
  EventAvailable,
  AdminPanelSettings,
} from "@mui/icons-material";
import axios from "axios";

const SIDEBAR_WIDTH = 240;
const ROWS_PER_PAGE = 5;

export default function LeaveRequestsTable() {
  const [users, setUsers] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [page, setPage] = useState(1);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // Metrics
  const totalUsers = users.length;
  const adminCount = users.filter((u) => u.roles?.includes("admin")).length;
  const pendingRequests = leaveRequests.filter((r) => r.status === "pending").length;
  const approvedRequests = leaveRequests.filter((r) => r.status === "approved").length;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, leavesRes] = await Promise.all([
        axios.get("http://localhost:5000/api/users/"),
        axios.get("http://localhost:5000/api/leave/all"),
      ]);

      setUsers(usersRes.data || []);
      const sortedLeaves = (leavesRes.data?.data || []).sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );
      setLeaveRequests(sortedLeaves);
    } catch (err) {
      console.error(err);
      showSnackbar("Échec de la récupération des données", "error");
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleApprove = async (requestId) => {
    setActionLoadingId(requestId);
    try {
      const res = await axios.post(
        `http://localhost:5000/api/leave/approve/${requestId}`
      );
      showSnackbar(res.data.message || "Congé approuvé", "success");
      fetchData();
    } catch (err) {
      showSnackbar(err.response?.data?.message || err.message, "error");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async () => {
    if (!selectedRequestId) return;
    setActionLoadingId(selectedRequestId);
    try {
      const res = await axios.post(
        `http://localhost:5000/api/leave/reject/${selectedRequestId}`,
        { rejection_reason: rejectionReason }
      );
      showSnackbar(res.data.message || "Congé rejeté", "success");
      fetchData();
    } catch (err) {
      showSnackbar(err.response?.data?.message || err.message, "error");
    } finally {
      setActionLoadingId(null);
      setRejectDialogOpen(false);
      setRejectionReason("");
    }
  };

  const openRejectDialog = (requestId) => {
    setSelectedRequestId(requestId);
    setRejectDialogOpen(true);
  };
  const closeRejectDialog = () => setRejectDialogOpen(false);

  const getStatusChip = (status) => {
    const config = {
      pending: { color: "warning", label: "En attente" },
      approved: { color: "success", label: "Approuvé" },
      rejected: { color: "error", label: "Rejeté" },
    };
    return (
      <Chip
        label={config[status]?.label || status}
        color={config[status]?.color}
        size="small"
        sx={{ borderRadius: "16px", fontWeight: 500 }}
      />
    );
  };

  // Get all pending requests for a user
  const getPendingRequests = (userId) => {
    return leaveRequests.filter(
      (r) => r.employee_id === userId && r.status === "pending"
    );
  };

  // Pagination logic
  const paginatedUsers = users.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        p: { xs: 2, sm: 3 },
        ml: isMobile ? 0 : `${SIDEBAR_WIDTH}px`,
        width: isMobile ? "100%" : `calc(100% - ${SIDEBAR_WIDTH}px)`,
        minHeight: "100vh",
        backgroundColor: "#f9fafb",
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0, mr: isMobile ? 0 : 3 }}>
        {/* Key Metrics */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {[
            {
              title: "Utilisateurs totaux",
              value: totalUsers,
              subtitle: `${adminCount} administrateurs`,
              icon: <PersonIcon fontSize="large" />,
              bg: "linear-gradient(135deg,#3b82f6,#2563eb)",
            },
            {
              title: "Demandes en attente",
              value: pendingRequests,
              subtitle: "Nécessite un examen",
              icon: <EventAvailable fontSize="large" />,
              bg: "linear-gradient(135deg,#f59e0b,#d97706)",
            },
            {
              title: "Demandes approuvées",
              value: approvedRequests,
              subtitle: "Ce mois-ci",
              icon: <AdminPanelSettings fontSize="large" />,
              bg: "linear-gradient(135deg,#10b981,#059669)",
            },
          ].map((metric, idx) => (
            <Grid item xs={12} sm={6} md={4} key={idx}>
              <Paper
                sx={{
                  p: 3,
                  background: metric.bg,
                  color: "white",
                  borderRadius: 3,
                  boxShadow: 4,
                  transition: "all 0.3s ease",
                  "&:hover": { transform: "translateY(-5px)", boxShadow: 8 },
                }}
              >
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Box>
                    <Typography variant="subtitle2" sx={{ opacity: 0.9 }}>
                      {metric.title}
                    </Typography>
                    <Typography variant="h3" fontWeight="bold">
                      {metric.value}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      {metric.subtitle}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      width: 50,
                      height: 50,
                      backgroundColor: "rgba(255,255,255,0.2)",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {metric.icon}
                  </Box>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* User Management */}
        <Paper
          sx={{
            p: 3,
            borderRadius: 3,
            boxShadow: 2,
            background: "white",
          }}
        >
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Gestion des utilisateurs
          </Typography>
          <TableContainer>
            <Table sx={{ minWidth: 650 }}>
              <TableHead>
                <TableRow sx={{ backgroundColor: "#f3f4f6" }}>
                  <TableCell>Nom</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Rôle</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell>Solde de congé</TableCell>
                  <TableCell>Demandes en attente</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedUsers.map((user) => {
                  const pendingRequests = getPendingRequests(user.id);
                  return (
                    <TableRow
                      key={user.id}
                      hover
                      sx={{
                        "&:nth-of-type(odd)": { backgroundColor: "#fafafa" },
                        "&:hover": { backgroundColor: "#f1f5f9" },
                      }}
                    >
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Chip
                          label={user.roles?.includes("admin") ? "Admin" : "Utilisateur"}
                          color={user.roles?.includes("admin") ? "primary" : "default"}
                          size="small"
                          sx={{ borderRadius: "16px" }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label="Actif"
                          color="success"
                          size="small"
                          sx={{ borderRadius: "16px" }}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <Box sx={{ width: "60%", mr: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={Math.min(user.leave_balance || 0, 100)}
                              color={
                                user.leave_balance > 70
                                  ? "success"
                                  : user.leave_balance > 30
                                  ? "warning"
                                  : "error"
                              }
                              sx={{ height: 8, borderRadius: 4 }}
                            />
                          </Box>
                          <Typography variant="body2">
                            {user.leave_balance || 0} jours
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {pendingRequests.length > 0 ? (
                          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                            {pendingRequests.map((request) => (
                              <Box key={request._id} sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                                <Typography variant="body2" sx={{ mr: 1 }}>
                                  {request.leave_type} ({new Date(request.start_date).toLocaleDateString()} - {new Date(request.end_date).toLocaleDateString()})
                                </Typography>
                                <Button
                                  size="small"
                                  variant="contained"
                                  color="success"
                                  onClick={() => handleApprove(request._id)}
                                  disabled={actionLoadingId === request._id}
                                  sx={{ borderRadius: 2 }}
                                >
                                  Approuver
                                </Button>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="error"
                                  onClick={() => openRejectDialog(request._id)}
                                  disabled={actionLoadingId === request._id}
                                  sx={{ borderRadius: 2 }}
                                >
                                  Rejeter
                                </Button>
                              </Box>
                            ))}
                          </Box>
                        ) : (
                          <Typography variant="body2" color="textSecondary">
                            Aucune demande
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              mt: 3,
            }}
          >
            <Pagination
              count={Math.ceil(users.length / ROWS_PER_PAGE)}
              page={page}
              onChange={(e, value) => setPage(value)}
              shape="rounded"
              color="primary"
              sx={{
                "& .MuiPaginationItem-root": {
                  borderRadius: "12px",
                  fontWeight: 500,
                },
              }}
            />
          </Box>
        </Paper>
      </Box>

      {/* Reject Dialog */}
      <Dialog
        open={rejectDialogOpen}
        onClose={closeRejectDialog}
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        <DialogTitle>Rejeter la demande de congé</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Motif du rejet"
            fullWidth
            multiline
            rows={4}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeRejectDialog}>Annuler</Button>
          <Button
            onClick={handleReject}
            color="error"
            variant="contained"
            disabled={!rejectionReason.trim() || actionLoadingId === selectedRequestId}
          >
            Rejeter
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snackbar.severity} sx={{ width: "100%", borderRadius: 2 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}