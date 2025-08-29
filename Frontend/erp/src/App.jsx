import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { Box, CssBaseline } from "@mui/material";

import InvoiceForm from "./components/Invoices/InvoiceForm";
import Navigation from "./components/Navigation";
import HomePage from "./components/Home/HomePage";
import InvoiceManagement from "./components/Invoices/InvoiceManagement";
import VehicleForm from "./components/Vehicle/VehicleForm";
import VehicleList from "./components/Vehicle/VehicleList";
import LoginForm from "./components/Auth/LoginForm";
import RegisterForm from "./components/Auth/RegisterForm";
import { AuthProvider } from "./components/Auth/AuthContext";
import LeaveRequestsTable from "./components/Leave/LeaveRequestsTable";
import LeaveRequestForm from "./components/Leave/LeaveRequestForm";
import PersonnalLeave from "./components/Leave/PersonnalLeave";
import UsersList from "./components/Users/usersList";
import LicenseForm from "./components/Licence/LicenseForm";
import ExpiringLicensesTable from "./components/Licence/LicenseTab.jsx";
import DocumentArchive from "./components/Archiving/DocumentArchive.jsx";
import TodoApp from "./components/TodoList/Todo.jsx";

const theme = createTheme({
  palette: {
    primary: { main: "#1976d2" },
    secondary: { main: "#dc004e" },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AuthProvider>
          <Box sx={{ display: "flex" }}>
            <Navigation />
            <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/dashboard" element={<HomePage />} />
                <Route path="/register" element={<RegisterForm />} />
                <Route path="/invoices/new" element={<InvoiceForm />} />
                <Route path="/invoices" element={<InvoiceManagement />} />
                <Route path="/vehicles/add" element={<VehicleForm />} />
                <Route path="/vehicles/edit/:id" element={<VehicleForm />} />
                <Route path="/vehicles" element={<VehicleList />} />
                <Route path="/login" element={<LoginForm />} />
                <Route path="/users" element={<UsersList />} />
                <Route path="/licenses/add" element={<LicenseForm />} />
                <Route path="/licenses" element={<ExpiringLicensesTable />} />
                <Route path="/archiving" element={<DocumentArchive />} />
                <Route path="/todos" element={<TodoApp />} /> 
                {/* FIXED leave routes */}
                <Route path="/leave/request" element={<LeaveRequestsTable />} />
                <Route path="/leave/add" element={<LeaveRequestForm />} />
                <Route path="/leave/personal" element={<PersonnalLeave />} />
                {/* Additional routes */}
                <Route path="/notifications" element={<div>Notifications Page</div>} />
                <Route path="/settings" element={<div>Settings Page</div>} />
              </Routes>
            </Box>
          </Box>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
