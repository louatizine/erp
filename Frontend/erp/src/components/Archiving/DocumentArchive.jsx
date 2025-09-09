import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Paper,
  CircularProgress,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Tooltip,
  TableContainer,
  Divider,
  Stack,
  Grid,
  useMediaQuery,
  useTheme,
  TablePagination, // Added import
} from "@mui/material";
import { Unarchive, Delete, Upload, Download } from "@mui/icons-material";
import axios from "axios";
import { useSnackbar } from "notistack";
import dayjs from "dayjs";

// Axios instance
const api = axios.create({
  baseURL: "http://localhost:5000/api/archive",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

export default function DocumentArchive() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const SIDEBAR_WIDTH = 240;

  const [loading, setLoading] = useState(false);
  const [archivedDocs, setArchivedDocs] = useState([]);
  const [openUpload, setOpenUpload] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [openRetentionConfirm, setOpenRetentionConfirm] = useState(false);
  const [retentionUntil, setRetentionUntil] = useState(null);
  const [departments] = useState(["HR", "Finance", "Legal", "IT"]);
  const { enqueueSnackbar } = useSnackbar();

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalDocs, setTotalDocs] = useState(0);

  const [uploadData, setUploadData] = useState({
    title: "",
    description: "",
    department: "HR",
    tags: [],
    file: null,
    newTag: "",
  });

  // Fetch archived documents with pagination
  const fetchArchived = async (page = 0, limit = rowsPerPage) => {
    setLoading(true);
    try {
      const response = await api.get(`/documents/archived?page=${page + 1}&limit=${limit}`);
      setArchivedDocs(response.data.documents || response.data);
      setTotalDocs(response.data.totalCount || response.data.length);
    } catch (err) {
      const errorMessage = err?.response?.data?.error || err.message;
      enqueueSnackbar(`Failed to load documents: ${errorMessage}`, {
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
    fetchArchived(newPage, rowsPerPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    setPage(0);
    fetchArchived(0, newRowsPerPage);
  };

  // Upload document
  const handleUpload = async () => {
    if (!uploadData.file) {
      enqueueSnackbar("Please select a file", { variant: "warning" });
      return;
    }

    const formData = new FormData();
    formData.append("file", uploadData.file);
    formData.append("title", uploadData.title);
    formData.append("description", uploadData.description);
    formData.append("department", uploadData.department);
    uploadData.tags.forEach((tag) => formData.append("tags", tag));

    try {
      await api.post("/documents", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      enqueueSnackbar("Document archived successfully", { variant: "success" });
      fetchArchived(page, rowsPerPage);
      setOpenUpload(false);
      setUploadData({
        title: "",
        description: "",
        department: "HR",
        tags: [],
        file: null,
        newTag: "",
      });
    } catch (err) {
      const errorMessage = err?.response?.data?.error || err.message;
      enqueueSnackbar(`Upload failed: ${errorMessage}`, { variant: "error" });
    }
  };

  // Unarchive a document
  const handleUnarchive = async (id) => {
    try {
      await api.post(`/documents/${id}/unarchive`);
      enqueueSnackbar("Document restored", { variant: "success" });
      fetchArchived(page, rowsPerPage);
    } catch (err) {
      const errorMessage = err?.response?.data?.error || err.message;
      enqueueSnackbar(`Failed to restore document: ${errorMessage}`, {
        variant: "error",
      });
    }
  };

  // Delete confirmation
  const confirmDelete = (doc) => {
    setSelectedDoc(doc);
    setOpenDelete(true);
  };

  // Delete document
  const handleDelete = async () => {
    if (!selectedDoc) return;
    try {
      await api.delete(`/documents/${selectedDoc.id}`);
      enqueueSnackbar("Document deleted", { variant: "success" });
      fetchArchived(page, rowsPerPage);
      setOpenDelete(false);
      setSelectedDoc(null);
    } catch (err) {
      if (err?.response?.status === 403) {
        const until = err.response.data?.retention_until || null;
        setRetentionUntil(until);
        setOpenDelete(false);
        setOpenRetentionConfirm(true);
      } else {
        const errorMessage = err?.response?.data?.error || err.message;
        enqueueSnackbar(`Delete failed: ${errorMessage}`, { variant: "error" });
        setOpenDelete(false);
        setSelectedDoc(null);
      }
    }
  };

  // Force delete
  const handleForceDelete = async () => {
    if (!selectedDoc) return;
    try {
      await api.delete(`/documents/${selectedDoc.id}?force=true`);
      enqueueSnackbar("Document force deleted", { variant: "warning" });
      fetchArchived(page, rowsPerPage);
    } catch (err) {
      const errorMessage = err?.response?.data?.error || err.message;
      enqueueSnackbar(`Force delete failed: ${errorMessage}`, {
        variant: "error",
      });
    } finally {
      setOpenRetentionConfirm(false);
      setSelectedDoc(null);
      setRetentionUntil(null);
    }
  };

  // Download document
  const handleDownload = async (id) => {
    try {
      const response = await api.get(`/documents/${id}/download`, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;

      const cd = response.headers["content-disposition"];
      let filename = "document";
      if (cd) {
        const match =
          cd.match(/filename\*?=(?:UTF-8'')?"?([^"]+)"?/i) ||
          cd.match(/filename="?(.+?)"?$/i);
        if (match && match[1]) filename = decodeURIComponent(match[1]);
      }

      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      const errorMessage = err?.response?.data?.error || err.message;
      enqueueSnackbar(`Download failed: ${errorMessage}`, { variant: "error" });
    }
  };

  // Tags handling
  const handleAddTag = () => {
    const value = uploadData.newTag.trim();
    if (value && !uploadData.tags.includes(value)) {
      setUploadData((s) => ({ ...s, tags: [...s.tags, value], newTag: "" }));
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setUploadData((s) => ({
      ...s,
      tags: s.tags.filter((t) => t !== tagToRemove),
    }));
  };

  useEffect(() => {
    fetchArchived(page, rowsPerPage);
  }, []);

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
      <Box
        sx={{
          maxWidth: 1200,
          mx: "auto",
          p: { xs: 2, sm: 4 },
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
          <Grid container alignItems="center" justifyContent="space-between">
            <Grid item>
              <Typography variant="h3" fontWeight={800} sx={{ mb: 0.5 }}>
                Dynamix
              </Typography>
              <Typography variant="h5" sx={{ letterSpacing: "3px", opacity: 0.9 }}>
                SERVICES
              </Typography>
            </Grid>
            <Grid item>
              <Button
                variant="contained"
                startIcon={<Upload />}
                onClick={() => setOpenUpload(true)}
                sx={{
                  backgroundColor: "white",
                  color: "#2563eb",
                  fontWeight: "bold",
                  "&:hover": { backgroundColor: "rgba(255,255,255,0.9)" },
                }}
              >
                Archive Document
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Content */}
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
              Document Archive
            </Typography>
            <Typography variant="body1" sx={{ color: "#64748b", mt: 1 }}>
              Manage archived files, restore them, or download them for review.
            </Typography>
          </Box>

          {/* Upload Dialog */}
          <Dialog
            open={openUpload}
            onClose={() => setOpenUpload(false)}
            maxWidth="sm"
            fullWidth
            PaperProps={{ sx: { borderRadius: 2 } }}
          >
            <DialogTitle
              sx={{
                background: "linear-gradient(90deg, #2563eb, #3b82f6)",
                color: "white",
                fontWeight: 600,
              }}
            >
              Archive New Document
            </DialogTitle>
            <DialogContent dividers sx={{ pt: 2 }}>
              <Stack spacing={2}>
                <TextField
                  fullWidth
                  label="Title"
                  value={uploadData.title}
                  onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
                  placeholder="e.g., Employee Contract - John Doe"
                />
                <TextField
                  fullWidth
                  label="Description"
                  multiline
                  minRows={3}
                  value={uploadData.description}
                  onChange={(e) =>
                    setUploadData({ ...uploadData, description: e.target.value })
                  }
                  placeholder="Optional description…"
                />
                <FormControl fullWidth>
                  <InputLabel>Department</InputLabel>
                  <Select
                    label="Department"
                    value={uploadData.department}
                    onChange={(e) =>
                      setUploadData({ ...uploadData, department: e.target.value })
                    }
                  >
                    {departments.map((dept) => (
                      <MenuItem key={dept} value={dept}>
                        {dept}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Tags */}
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                    Tags
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <TextField
                      size="small"
                      placeholder="Add a tag and press Enter"
                      value={uploadData.newTag}
                      onChange={(e) =>
                        setUploadData({ ...uploadData, newTag: e.target.value })
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                    />
                    <Button
                      variant="outlined"
                      onClick={handleAddTag}
                      disabled={!uploadData.newTag.trim()}
                      sx={{ borderRadius: 1 }}
                    >
                      Add
                    </Button>
                  </Stack>
                  <Box mt={1} sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                    {uploadData.tags.map((tag) => (
                      <Chip
                        key={tag}
                        label={tag}
                        onDelete={() => handleRemoveTag(tag)}
                        sx={{ backgroundColor: "#e0f2fe", color: "#0369a1" }}
                      />
                    ))}
                    {uploadData.tags.length === 0 && (
                      <Typography variant="caption" color="text.secondary">
                        No tags yet
                      </Typography>
                    )}
                  </Box>
                </Box>

                {/* File input */}
                <Box>
                  <input
                    id="document-upload"
                    type="file"
                    style={{ display: "none" }}
                    onChange={(e) =>
                      setUploadData({ ...uploadData, file: e.target.files?.[0] || null })
                    }
                  />
                  <label htmlFor="document-upload">
                    <Button
                      component="span"
                      variant="outlined"
                      startIcon={<Upload />}
                      sx={{ borderRadius: 1 }}
                    >
                      Choose File
                    </Button>
                  </label>
                  {uploadData.file && (
                    <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                      Selected file: <b>{uploadData.file.name}</b>
                    </Typography>
                  )}
                </Box>
              </Stack>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setOpenUpload(false)} sx={{ borderRadius: 1 }}>
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                variant="contained"
                disabled={!uploadData.file}
                sx={{ borderRadius: 1, background: "linear-gradient(90deg, #2563eb, #3b82f6)" }}
              >
                Archive
              </Button>
            </DialogActions>
          </Dialog>

          {/* Table */}
          {loading && archivedDocs.length === 0 ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : (
            <Paper
              elevation={0}
              sx={{ borderRadius: 2, overflow: "hidden", border: "1px solid #e2e8f0" }}
            >
              <TableContainer>
                <Table>
                  <TableHead sx={{ backgroundColor: "#f1f5f9" }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Title</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Department</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>File Name</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Archived At</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Tags</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 600 }}>
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {archivedDocs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                          <Typography variant="body2" color="text.secondary">
                            No archived documents found
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      archivedDocs.map((doc) => (
                        <TableRow
                          key={doc.id}
                          hover
                          sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                        >
                          <TableCell>{doc.title || "Untitled"}</TableCell>
                          <TableCell>{doc.department || "N/A"}</TableCell>
                          <TableCell>{doc.original_filename || "Unknown"}</TableCell>
                          <TableCell>
                            {doc.archived_at
                              ? dayjs(doc.archived_at).format("MMM D, YYYY h:mm A")
                              : "N/A"}
                          </TableCell>
                          <TableCell>
                            {doc.tags?.length ? (
                              doc.tags.map((tag) => (
                                <Chip
                                  key={tag}
                                  label={tag}
                                  size="small"
                                  sx={{
                                    mr: 0.5,
                                    mb: 0.5,
                                    backgroundColor: "#e0f2fe",
                                    color: "#0369a1",
                                  }}
                                />
                              ))
                            ) : (
                              <Typography variant="caption" color="text.secondary">
                                No tags
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title="Download">
                              <IconButton
                                color="primary"
                                onClick={() => handleDownload(doc.id)}
                                sx={{ color: "#2563eb" }}
                              >
                                <Download />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Restore">
                              <IconButton
                                color="secondary"
                                onClick={() => handleUnarchive(doc.id)}
                                sx={{ color: "#475569" }}
                              >
                                <Unarchive />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton
                                color="error"
                                onClick={() => confirmDelete(doc)}
                                sx={{ color: "#dc2626" }}
                              >
                                <Delete />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              
              {/* Pagination Component */}
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                component="div"
                count={totalDocs}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                sx={{
                  borderTop: "1px solid #e2e8f0",
                  "& .MuiTablePagination-toolbar": {
                    padding: "16px",
                  },
                  "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
                    marginBottom: 0,
                  },
                }}
              />
            </Paper>
          )}

          {/* Delete Confirmation */}
          <Dialog
            open={openDelete}
            onClose={() => setOpenDelete(false)}
            maxWidth="xs"
            fullWidth
            PaperProps={{ sx: { borderRadius: 2 } }}
          >
            <DialogTitle sx={{ fontWeight: 600 }}>Confirm Deletion</DialogTitle>
            <DialogContent dividers>
              <Typography>
                Are you sure you want to permanently delete{" "}
                <b>{selectedDoc?.title || "this document"}</b>?
              </Typography>
              <Divider sx={{ my: 1.5 }} />
              <Typography variant="body2" color="text.secondary">
                This action cannot be undone.
              </Typography>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setOpenDelete(false)} sx={{ borderRadius: 1 }}>
                Cancel
              </Button>
              <Button
                onClick={handleDelete}
                color="error"
                variant="contained"
                autoFocus
                sx={{ borderRadius: 1 }}
              >
                Delete
              </Button>
            </DialogActions>
          </Dialog>

          {/* Retention Policy Confirmation */}
          <Dialog
            open={openRetentionConfirm}
            onClose={() => setOpenRetentionConfirm(false)}
            maxWidth="xs"
            fullWidth
            PaperProps={{ sx: { borderRadius: 2 } }}
          >
            <DialogTitle sx={{ fontWeight: 600 }}>Retention Policy Active</DialogTitle>
            <DialogContent dividers>
              <Typography gutterBottom>
                This document is under a retention policy
                {retentionUntil
                  ? ` until ${dayjs(retentionUntil).format("MMM D, YYYY h:mm A")}`
                  : ""}.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Do you still want to <b>force delete</b> it?
              </Typography>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setOpenRetentionConfirm(false)} sx={{ borderRadius: 1 }}>
                Cancel
              </Button>
              <Button
                onClick={handleForceDelete}
                color="error"
                variant="contained"
                autoFocus
                sx={{ borderRadius: 1 }}
              >
                Force Delete
              </Button>
            </DialogActions>
          </Dialog>
        </Paper>
      </Box>
    </Box>
  );
}