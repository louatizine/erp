import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Stack,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  TablePagination,
  Grid,
  CircularProgress
} from "@mui/material";
import { Delete, Edit, Add } from "@mui/icons-material";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";

const API_URL = "http://localhost:5000/api/todos";
const SIDEBAR_WIDTH = 240;

export default function TodoApp() {
  const [tasks, setTasks] = useState([]);
  const [form, setForm] = useState({ title: "", description: "", due_date: null });
  const [editingId, setEditingId] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [loading, setLoading] = useState(false);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await axios.get(API_URL + "/");
      setTasks(res.data);
    } catch (err) {
      console.error(err);
      toast.error("❌ Échec de la récupération des tâches!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleDateChange = (value) => {
    setForm({ ...form, due_date: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!form.title || !form.due_date) {
        toast.error("❌ Le titre et la date d'échéance sont obligatoires!");
        return;
      }

      let payload = { ...form };
      payload.due_date = dayjs(payload.due_date).format("YYYY-MM-DDTHH:mm");

      if (editingId) {
        await axios.put(`${API_URL}/${editingId}`, payload);
        toast.success("✅ Tâche mise à jour avec succès!");
        setEditingId(null);
      } else {
        await axios.post(`${API_URL}/`, payload);
        toast.success("✅ Tâche ajoutée avec succès!");
      }

      setForm({ title: "", description: "", due_date: null });
      fetchTasks();
    } catch (err) {
      console.error(err);
      toast.error("❌ Échec de l'ajout/mise à jour de la tâche!");
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_URL}/${id}`);
      toast.success("🗑️ Tâche supprimée!");
      fetchTasks();
    } catch (err) {
      console.error(err);
      toast.error("❌ Échec de la suppression de la tâche!");
    }
  };

  const handleEdit = (task) => {
    setForm({
      title: task.title,
      description: task.description,
      due_date: task.due_date ? dayjs(task.due_date) : null,
    });
    setEditingId(task._id);
  };

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box
      sx={{
        p: { xs: 2, sm: 4 },
        ml: `${SIDEBAR_WIDTH}px`,
        width: `calc(100% - ${SIDEBAR_WIDTH}px)`,
        minHeight: "100vh",
        backgroundColor: "#f8fafc",
      }}
    >
      <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 2, background: "linear-gradient(90deg, #2563eb, #3b82f6)", color: "white" }}>
        <Grid container alignItems="center">
          <Grid item>
            <Typography variant="h3" fontWeight={800}>Dynamix</Typography>
            <Typography variant="h5" sx={{ letterSpacing: "3px", opacity: 0.9 }}>SERVICES</Typography>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 3, borderRadius: 2, boxShadow: "0 4px 20px rgba(0,0,0,0.08)", backgroundColor: "white", mb: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" fontWeight={600} sx={{ color: "#1e293b" }}>📋 Liste des Tâches</Typography>
          <Typography variant="body1" sx={{ color: "#64748b", mt: 1 }}>Gérez vos tâches et suivez leur progression.</Typography>
        </Box>

        <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: 2, border: "1px solid #e2e8f0", background: "#f8fafc" }}>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 3, color: "#1e293b" }}>{editingId ? "Modifier la Tâche" : "Ajouter une Nouvelle Tâche"}</Typography>

          <Stack component="form" onSubmit={handleSubmit} spacing={3} direction={{ xs: "column", sm: "row" }} flexWrap="wrap">
            <Stack spacing={2} sx={{ flex: 2, minWidth: 220 }}>
              <TextField label="Titre" name="title" value={form.title} onChange={handleChange} required fullWidth sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 }}} />
              <TextField label="Description" name="description" value={form.description} onChange={handleChange} multiline rows={3} fullWidth sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 }}} />
            </Stack>

            <Stack spacing={2} sx={{ flex: 1, minWidth: 180, justifyContent: "space-between" }}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker label="Date d'échéance" value={form.due_date} onChange={handleDateChange} slotProps={{ textField: { fullWidth: true, sx: { "& .MuiOutlinedInput-root": { borderRadius: 2 }}}}} />
              </LocalizationProvider>

              <Button type="submit" sx={{ mt: 1, background: "linear-gradient(90deg, #2563eb, #3b82f6)", color: "white", fontWeight: "bold", px: 4, py: 1.5, borderRadius: 2, boxShadow: "0 4px 15px rgba(37, 99, 235, 0.3)", "&:hover": { background: "linear-gradient(90deg, #1e40af, #2563eb)", boxShadow: "0 6px 20px rgba(37, 99, 235, 0.4)"}, }} startIcon={<Add />}>
                {editingId ? "Mettre à jour" : "Ajouter"}
              </Button>
            </Stack>
          </Stack>
        </Paper>

        <Paper elevation={0} sx={{ borderRadius: 2, overflow: "hidden", border: "1px solid #e2e8f0" }}>
          <TableContainer>
            <Table>
              <TableHead sx={{ backgroundColor: "#f1f5f9" }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Titre</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Date d'échéance</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Statut</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}><CircularProgress /></TableCell>
                  </TableRow>
                ) : tasks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}><Typography color="text.secondary">Aucune tâche trouvée</Typography></TableCell>
                  </TableRow>
                ) : (
                  tasks.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((task) => (
                    <TableRow key={task._id} hover sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                      <TableCell>{task.title}</TableCell>
                      <TableCell>{task.description}</TableCell>
                      <TableCell>{task.due_date ? dayjs(task.due_date).format("MMM D, YYYY") : "-"}</TableCell>
                      <TableCell>
                        <Chip label={task.status === "completed" ? "Complétée" : "En attente"} color={task.status === "completed" ? "success" : "warning"} sx={{ fontWeight: 600, backgroundColor: task.status === "completed" ? "#f0fdf4" : "#fffbeb", borderColor: task.status === "completed" ? "#bbf7d0" : "#fed7aa" }} variant="outlined"/>
                      </TableCell>
                      <TableCell align="center">
                        <IconButton onClick={() => handleEdit(task)} color="primary" sx={{ backgroundColor: "#e0f2fe", "&:hover": { backgroundColor: "#bae6fd" }, mr: 1 }}><Edit /></IconButton>
                        <IconButton onClick={() => handleDelete(task._id)} color="error" sx={{ backgroundColor: "#fee2e2", "&:hover": { backgroundColor: "#fecaca" }}}><Delete /></IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination component="div" count={tasks.length} page={page} onPageChange={handleChangePage} rowsPerPage={rowsPerPage} onRowsPerPageChange={handleChangeRowsPerPage} rowsPerPageOptions={[5, 10, 25]} labelRowsPerPage="Lignes par page:" labelDisplayedRows={({ from, to, count }) => `${from}-${to} sur ${count}`}/>
        </Paper>
      </Paper>

      <ToastContainer position="top-right" autoClose={3000} />
    </Box>
  );
}
