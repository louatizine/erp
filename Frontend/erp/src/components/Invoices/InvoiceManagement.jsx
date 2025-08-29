import React, { useEffect, useState } from "react";
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
  Tooltip,
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  CircularProgress,
  Backdrop,
  Button,
  Grid,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  Divider,
  IconButton
} from "@mui/material";
import { Search, CheckCircle, HourglassEmpty, Cancel as CancelIcon } from "@mui/icons-material";
import axios from "axios";

const SIDEBAR_WIDTH = 240;

const InvoiceManagement = () => {
  const [invoices, setInvoices] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const fetchInvoices = React.useCallback(async () => {
    try {
      setLoading(true);
      const params = { search: searchTerm };
      if (statusFilter !== "All") params.status = statusFilter;

      const response = await axios.get(
        "http://localhost:5000/api/invoices/list",
        { params }
      );

      setInvoices(response.data.invoices);
    } catch (error) {
      console.error("Error fetching invoices:", error.response?.data || error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    fetchInvoices();
  }, [searchTerm, statusFilter, fetchInvoices]);

  const handleStatusUpdate = async (invoiceId, newStatus) => {
    try {
      await axios.patch(
        `http://localhost:5000/api/invoices/update-status/${invoiceId}`,
        { status: newStatus }
      );
      fetchInvoices();
    } catch (error) {
      console.error("Error updating status:", error.response?.data || error);
    }
  };

  return (
    <Box
      sx={{
        p: { xs: 2, sm: 4 },
        ml: `${SIDEBAR_WIDTH}px`,
        width: `calc(100% - ${SIDEBAR_WIDTH}px)`,
        transition: "all 0.3s ease",
        backgroundColor: "#f8fafc",
        minHeight: "100vh",
      }}
    >
      {/* Header with Dynamix Services branding */}
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
            <Typography variant="h5" sx={{ letterSpacing: '3px', opacity: 0.9 }}>
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
            Gestion des factures
          </Typography>
          <Typography variant="body1" sx={{ color: "#64748b", mt: 1 }}>
            Gérez et suivez les factures de votre organisation.
          </Typography>
        </Box>

        {/* Filters */}
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            gap: 2,
            mb: 3,
          }}
        >
          <TextField
            fullWidth
            placeholder="Rechercher des factures..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />

          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) => setStatusFilter(e.target.value)}
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value="All">Toutes</MenuItem>
              <MenuItem value="pending">En attente</MenuItem>
              <MenuItem value="paid">Payé</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Loading Overlay */}
        <Backdrop open={loading} sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
          <CircularProgress color="inherit" />
        </Backdrop>

        {/* Table */}
        <TableContainer
          sx={{ borderRadius: 2, overflow: "hidden", border: "1px solid #e2e8f0" }}
        >
          <Table stickyHeader>
            <TableHead>
              <TableRow sx={{ backgroundColor: "#f1f5f9" }}>
                <TableCell sx={{ fontWeight: 600 }}>Entreprise</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Client</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Téléphone</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Total</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Date de la facture</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Date de paiement</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="center">Actions</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">Aucune facture trouvée</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((invoice, index) => (
                  <TableRow
                    key={invoice._id}
                    onClick={() => {
                      setSelectedInvoice(invoice);
                      setDetailsOpen(true);
                    }}
                    sx={{ 
                      backgroundColor: index % 2 === 0 ? "grey.50" : "white",
                      '&:last-child td, &:last-child th': { border: 0 },
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.04)'
                      }
                    }}
                  >
                    <TableCell>{invoice?.company_email || "-"}</TableCell>
                    <TableCell>{invoice?.client_email || "-"}</TableCell>
                    <TableCell>{invoice?.telephone || "-"}</TableCell>
                    <TableCell>{invoice?.total_amount ? `${invoice.total_amount} Dt` : "-"}</TableCell>

                    <TableCell>
                      <Chip
                        label={invoice?.status === "paid" ? "Payé" : "En attente"}
                        color={
                          invoice?.status === "paid" ? "success" : "warning"
                        }
                        variant="outlined"
                        sx={{ 
                          textTransform: "capitalize",
                          backgroundColor: invoice?.status === "paid" ? "#f0fdf4" : "#fffbeb",
                          borderColor: invoice?.status === "paid" ? "#bbf7d0" : "#fed7aa"
                        }}
                      />
                    </TableCell>

                    <TableCell>
                      {invoice.invoice_date
                        ? new Date(invoice.invoice_date).toLocaleDateString()
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {invoice.payment_date
                        ? new Date(invoice.payment_date).toLocaleDateString()
                        : "-"}
                    </TableCell>

                    <TableCell align="center">
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <Tooltip title="Marquer comme payé">
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            startIcon={<CheckCircle />}
                            onClick={() => handleStatusUpdate(invoice._id, "paid")}
                            sx={{ 
                              borderRadius: 1,
                              textTransform: 'none',
                              backgroundColor: "#16a34a",
                              '&:hover': { backgroundColor: "#15803d" }
                            }}
                          >
                            Payé
                          </Button>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Invoice Details Dialog */}
        <Dialog
          open={detailsOpen}
          onClose={() => setDetailsOpen(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 2,
              p: 2
            }
          }}
        >
          {selectedInvoice && (
            <>
              <DialogTitle>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="h5" fontWeight={600}>
                    Détails de la facture
                  </Typography>
                  <IconButton onClick={() => setDetailsOpen(false)} size="small">
                    <CancelIcon />
                  </IconButton>
                </Box>
              </DialogTitle>
              <DialogContent>
                <Grid container spacing={3}>
                  {/* Company Information */}
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2, height: '100%' }}>
                      <Typography variant="subtitle1" color="primary" gutterBottom fontWeight={600}>
                        Informations de l'entreprise
                      </Typography>
                      <Stack spacing={2}>
                        <Box>
                          <Typography variant="body2" color="textSecondary">
                            Email de l'entreprise
                          </Typography>
                          <Typography variant="body1">
                            {selectedInvoice.company_email || '-'}
                          </Typography>
                        </Box>
                        <Divider />
                        <Box>
                          <Typography variant="body2" color="textSecondary">
                            Téléphone
                          </Typography>
                          <Typography variant="body1">
                            {selectedInvoice.telephone || '-'}
                          </Typography>
                        </Box>
                      </Stack>
                    </Paper>
                  </Grid>

                  {/* Client Information */}
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2, height: '100%' }}>
                      <Typography variant="subtitle1" color="primary" gutterBottom fontWeight={600}>
                        Informations du client
                      </Typography>
                      <Stack spacing={2}>
                        <Box>
                          <Typography variant="body2" color="textSecondary">
                            Email du client
                          </Typography>
                          <Typography variant="body1">
                            {selectedInvoice.client_email || '-'}
                          </Typography>
                        </Box>
                        <Divider />
                        <Box>
                          <Typography variant="body2" color="textSecondary">
                            Montant total
                          </Typography>
                          <Typography variant="body1" fontWeight={600} color="primary">
                            {selectedInvoice.total_amount ? `${selectedInvoice.total_amount} Dt` : '-'}
                          </Typography>
                        </Box>
                      </Stack>
                    </Paper>
                  </Grid>

                  {/* Status and Dates */}
                  <Grid item xs={12}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="subtitle1" color="primary" gutterBottom fontWeight={600}>
                        État et dates
                      </Typography>
                      <Grid container spacing={3}>
                        <Grid item xs={12} sm={4}>
                          <Box>
                            <Typography variant="body2" color="textSecondary" gutterBottom>
                              Statut
                            </Typography>
                            <Chip
                              label={selectedInvoice.status === "paid" ? "Payé" : "En attente"}
                              color={selectedInvoice.status === "paid" ? "success" : "warning"}
                              variant="outlined"
                              sx={{ 
                                textTransform: "capitalize",
                                backgroundColor: selectedInvoice.status === "paid" ? "#f0fdf4" : "#fffbeb",
                                borderColor: selectedInvoice.status === "paid" ? "#bbf7d0" : "#fed7aa"
                              }}
                            />
                          </Box>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <Box>
                            <Typography variant="body2" color="textSecondary" gutterBottom>
                              Date de la facture
                            </Typography>
                            <Typography variant="body1">
                              {selectedInvoice.invoice_date
                                ? new Date(selectedInvoice.invoice_date).toLocaleDateString()
                                : '-'}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <Box>
                            <Typography variant="body2" color="textSecondary" gutterBottom>
                              Date de paiement
                            </Typography>
                            <Typography variant="body1">
                              {selectedInvoice.payment_date
                                ? new Date(selectedInvoice.payment_date).toLocaleDateString()
                                : '-'}
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>
                </Grid>
              </DialogContent>
            </>
          )}
        </Dialog>
      </Paper>
    </Box>
  );
};

export default InvoiceManagement;