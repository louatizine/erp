/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TextField,
  Select,
  MenuItem,
  Button,
  CircularProgress,
  Snackbar,
  Alert,
  Chip,
  Tooltip,
  IconButton,
  Stack,
  Paper,
  TableContainer,
  Grid,
  InputLabel,
  FormControl,
  Dialog,
  DialogTitle,
  DialogContent,
  Avatar,
  Pagination
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { format, differenceInMonths } from "date-fns";
import axios from "axios";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";

const SIDEBAR_WIDTH = 240;
const rolesOptions = ["user", "admin", "manager"];

const contractTypeLabels = {
  CDI: "CDI",
  CDD: "CDD",
  Freelance: "Freelance",
  Stage: "Stage",
  Alternance: "Alternance",
};

const UsersList = () => {
  const [users, setUsers] = useState([]);
  const [editingUsers, setEditingUsers] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Pagination state
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/users");
      const normalizedUsers = res.data.map((user) => ({
        ...user,
        roles: Array.isArray(user.roles) ? user.roles : [user.roles || "user"],
      }));
      setUsers(normalizedUsers);
    } catch (err) {
      setError("Échec de récupération des utilisateurs");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (userId, field, value) => {
    setEditingUsers((prev) => ({
      ...prev,
      [userId]: { ...(prev[userId] || {}), [field]: value },
    }));
  };

  const handleEdit = (userId) => {
    setEditingUsers((prev) => ({
      ...prev,
      [userId]: { ...users.find((u) => u.id === userId) },
    }));
  };

  const handleCancel = (userId) => {
    setEditingUsers((prev) => {
      const copy = { ...prev };
      delete copy[userId];
      return copy;
    });
  };

  const handleSave = async (userId) => {
    if (!editingUsers[userId]) return;
    setSaving((prev) => ({ ...prev, [userId]: true }));
    setError("");
    try {
      const payload = { ...editingUsers[userId] };
      if (payload.contract_expiry instanceof Date)
        payload.contract_expiry = payload.contract_expiry.toISOString();
      const res = await axios.patch(`/api/users/${userId}`, payload);
      setSuccessMsg("Utilisateur mis à jour avec succès");
      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId ? { ...user, ...res.data.user } : user
        )
      );
      handleCancel(userId);
    } catch (err) {
      setError(err.response?.data?.error || "Échec de mise à jour");
    } finally {
      setSaving((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const formatJoinDate = (dateString) =>
    dateString ? format(new Date(dateString), "MMM d, yyyy") : "-";

  const formatContractExpiry = (dateString) =>
    dateString ? format(new Date(dateString), "dd/MM/yyyy") : "-";

  const getSeniorityColor = (joinDate) => {
    if (!joinDate) return "default";
    const months = differenceInMonths(new Date(), new Date(joinDate));
    if (months > 24) return "success";
    if (months > 12) return "info";
    return "warning";
  };

  const getContractColor = (contractDate) => {
    if (!contractDate) return "default";
    const monthsLeft = differenceInMonths(new Date(contractDate), new Date());
    if (monthsLeft <= 1) return "error";
    if (monthsLeft <= 3) return "warning";
    return "success";
  };

  // Pagination helpers
  const handleChangePage = (event, value) => {
    setPage(value);
  };

  const paginatedUsers = users.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box
        sx={{
          p: 3,
          ml: `${SIDEBAR_WIDTH}px`,
          width: `calc(100% - ${SIDEBAR_WIDTH}px)`,
          transition: "all 0.3s ease",
          backgroundColor: "#f8fafc",
          minHeight: "100vh",
        }}
      >
        {/* Header */}
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
          <Grid container alignItems="center">
            <Grid item>
              <Typography variant="h3" fontWeight={800} sx={{ mb: 0.5 }}>
                Dynamix
              </Typography>
              <Typography
                variant="h5"
                sx={{ letterSpacing: "3px", opacity: 0.9 }}
              >
                SERVICES
              </Typography>
            </Grid>
          </Grid>
        </Paper>

        <Paper
          sx={{
            p: 3,
            borderRadius: 2,
            boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
            backgroundColor: "white",
          }}
        >
          <Box sx={{ mb: 3 }}>
            <Typography variant="h4" fontWeight={600} sx={{ color: "#1e293b" }}>
              Gestion des utilisateurs
            </Typography>
            <Typography variant="body1" sx={{ color: "#64748b", mt: 1 }}>
              Gérez les utilisateurs de votre organisation.
            </Typography>
          </Box>

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 6, mb: 6 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              <TableContainer sx={{ borderRadius: 2, border: "1px solid #e2e8f0" }}>
                <Table>
                  <TableHead sx={{ backgroundColor: "#f1f5f9" }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Nom</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Roles</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Type de contrat</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Date d'expiration</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Date d'inscription</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Solde des congés</TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="center">
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {paginatedUsers.map((user) => {
                      const isEditing = !!editingUsers[user.id];
                      const rolesArray = Array.isArray(user.roles)
                        ? user.roles
                        : [user.roles || "user"];
                      return (
                        <TableRow
                          key={user.id}
                          hover
                          sx={{
                            "&:last-child td, &:last-child th": { border: 0 },
                            cursor: "pointer",
                          }}
                          onClick={() => {
                            if (!editingUsers[user.id]) {
                              setSelectedUser(user);
                              setDetailsOpen(true);
                            }
                          }}
                        >
                          {/* --- TABLE CELLS --- */}
                          <TableCell>
                            {isEditing ? (
                              <TextField
                                size="small"
                                value={editingUsers[user.id].name}
                                onChange={(e) =>
                                  handleChange(user.id, "name", e.target.value)
                                }
                                sx={{ minWidth: 120 }}
                              />
                            ) : (
                              user.name
                            )}
                          </TableCell>

                          <TableCell>
                            {isEditing ? (
                              <TextField
                                size="small"
                                type="email"
                                value={editingUsers[user.id].email}
                                onChange={(e) =>
                                  handleChange(user.id, "email", e.target.value)
                                }
                                sx={{ minWidth: 150 }}
                              />
                            ) : (
                              user.email
                            )}
                          </TableCell>

                          <TableCell>
                            {isEditing ? (
                              <FormControl size="small" sx={{ minWidth: 120 }}>
                                <InputLabel>Roles</InputLabel>
                                <Select
                                  multiple
                                  value={editingUsers[user.id].roles}
                                  onChange={(e) =>
                                    handleChange(user.id, "roles", e.target.value)
                                  }
                                  label="Roles"
                                >
                                  {rolesOptions.map((role) => (
                                    <MenuItem key={role} value={role}>
                                      {role}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            ) : (
                              rolesArray.map((role) => (
                                <Chip
                                  key={role}
                                  label={role}
                                  size="small"
                                  sx={{
                                    mr: 0.5,
                                    mb: 0.5,
                                    backgroundColor:
                                      role === "admin"
                                        ? "#fee2e2"
                                        : role === "manager"
                                        ? "#dbeafe"
                                        : "#f0f9ff",
                                    color:
                                      role === "admin"
                                        ? "#dc2626"
                                        : role === "manager"
                                        ? "#2563eb"
                                        : "#0369a1",
                                  }}
                                />
                              ))
                            )}
                          </TableCell>

                          <TableCell>
                            {isEditing ? (
                              <FormControl size="small" sx={{ minWidth: 120 }}>
                                <InputLabel>Contrat</InputLabel>
                                <Select
                                  value={editingUsers[user.id].contract_type}
                                  onChange={(e) =>
                                    handleChange(
                                      user.id,
                                      "contract_type",
                                      e.target.value
                                    )
                                  }
                                  label="Contrat"
                                >
                                  {Object.entries(contractTypeLabels).map(
                                    ([value, label]) => (
                                      <MenuItem key={value} value={value}>
                                        {label}
                                      </MenuItem>
                                    )
                                  )}
                                </Select>
                              </FormControl>
                            ) : (
                              <Chip
                                label={
                                  contractTypeLabels[user.contract_type] ||
                                  user.contract_type ||
                                  "Non spécifié"
                                }
                                color="primary"
                                variant="outlined"
                                size="small"
                                sx={{
                                  backgroundColor: "#e0f2fe",
                                  color: "#0369a1",
                                  borderColor: "#bae6fd",
                                }}
                              />
                            )}
                          </TableCell>

                          <TableCell>
                            {isEditing ? (
                              <DatePicker
                                value={
                                  editingUsers[user.id].contract_expiry
                                    ? new Date(
                                        editingUsers[user.id].contract_expiry
                                      )
                                    : null
                                }
                                onChange={(date) =>
                                  handleChange(user.id, "contract_expiry", date)
                                }
                                slotProps={{
                                  textField: {
                                    size: "small",
                                    sx: { minWidth: 130 },
                                  },
                                }}
                              />
                            ) : user.contract_expiry ? (
                              <Tooltip
                                title={new Date(
                                  user.contract_expiry
                                ).toLocaleDateString()}
                              >
                                <Chip
                                  label={formatContractExpiry(user.contract_expiry)}
                                  color={getContractColor(user.contract_expiry)}
                                  variant="outlined"
                                  size="small"
                                />
                              </Tooltip>
                            ) : (
                              "Non spécifié"
                            )}
                          </TableCell>

                          <TableCell>
                            {user.join_date ? (
                              <Chip
                                label={formatJoinDate(user.join_date)}
                                color={getSeniorityColor(user.join_date)}
                                variant="outlined"
                                size="small"
                              />
                            ) : (
                              "-"
                            )}
                          </TableCell>

                          <TableCell>
                            {user.leave_balance !== undefined ? (
                              <Chip
                                label={`${user.leave_balance} jours`}
                                color={
                                  user.leave_balance > 10
                                    ? "success"
                                    : user.leave_balance > 5
                                    ? "warning"
                                    : "error"
                                }
                                variant="outlined"
                                size="small"
                              />
                            ) : (
                              "-"
                            )}
                          </TableCell>

                          <TableCell align="center">
                            <Stack
                              direction="row"
                              spacing={1}
                              justifyContent="center"
                            >
                              {isEditing ? (
                                <>
                                  <Tooltip title="Sauvegarder">
                                    <IconButton
                                      color="primary"
                                      onClick={() => handleSave(user.id)}
                                      disabled={saving[user.id]}
                                      sx={{
                                        backgroundColor: "#e0f2fe",
                                        "&:hover": { backgroundColor: "#bae6fd" },
                                      }}
                                    >
                                      {saving[user.id] ? (
                                        <CircularProgress size={20} />
                                      ) : (
                                        <SaveIcon />
                                      )}
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Annuler">
                                    <IconButton
                                      color="error"
                                      onClick={() => handleCancel(user.id)}
                                      sx={{
                                        backgroundColor: "#fee2e2",
                                        "&:hover": { backgroundColor: "#fecaca" },
                                      }}
                                    >
                                      <CancelIcon />
                                    </IconButton>
                                  </Tooltip>
                                </>
                              ) : (
                                <Tooltip title="Modifier">
                                  <IconButton
                                    color="secondary"
                                    onClick={() => handleEdit(user.id)}
                                    sx={{
                                      backgroundColor: "#f0f9ff",
                                      "&:hover": { backgroundColor: "#e0f2fe" },
                                    }}
                                  >
                                    <EditIcon />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </Stack>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Pagination Controls */}
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mt: 3 }}
              >
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <Select
                    value={rowsPerPage}
                    onChange={(e) => {
                      setRowsPerPage(e.target.value);
                      setPage(1);
                    }}
                  >
                    {[5, 10, 20, 50].map((num) => (
                      <MenuItem key={num} value={num}>
                        {num} / page
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Pagination
                  count={Math.ceil(users.length / rowsPerPage)}
                  page={page}
                  onChange={handleChangePage}
                  color="primary"
                  shape="rounded"
                  size="large"
                  sx={{
                    "& .MuiPaginationItem-root": {
                      borderRadius: "12px",
                      fontWeight: 600,
                    },
                  }}
                />
              </Box>
            </>
          )}

          {/* User Details Dialog */}
          {/* ... (your existing dialog code stays unchanged) ... */}

          <Snackbar
            open={!!successMsg}
            autoHideDuration={3000}
            onClose={() => setSuccessMsg("")}
            anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
          >
            <Alert
              severity="success"
              sx={{ width: "100%" }}
              onClose={() => setSuccessMsg("")}
            >
              {successMsg}
            </Alert>
          </Snackbar>

          <Snackbar
            open={!!error}
            autoHideDuration={4000}
            onClose={() => setError("")}
            anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
          >
            <Alert
              severity="error"
              sx={{ width: "100%" }}
              onClose={() => setError("")}
            >
              {error}
            </Alert>
          </Snackbar>
        </Paper>
      </Box>
    </LocalizationProvider>
  );
};

export default UsersList;
