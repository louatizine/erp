/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { styled, useTheme, alpha } from "@mui/material/styles";
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Typography,
  Collapse,
  Avatar,
  Badge,
} from "@mui/material";
import {
  DashboardCustomizeOutlined as DashboardIcon,
  ReceiptLongOutlined as InvoiceIcon,
  DirectionsCarFilledOutlined as VehicleIcon,
  AddCircleOutline as AddIcon,
  EventAvailableOutlined as LeaveIcon,
  GroupOutlined as UsersIcon,
  KeyboardArrowDown as ExpandMore,
  KeyboardArrowRight as ChevronRight,
  VpnKeyOutlined as LicenseIcon,
  FolderZipOutlined as ArchiveIcon,
  LogoutOutlined as LogoutIcon,
  PersonAddOutlined as PersonAddIcon,
  AssignmentOutlined as TodoIcon,
  WorkHistoryOutlined as LeaveManageIcon,
} from "@mui/icons-material";
import { useAuth } from "./Auth/AuthContext";

// ------------------- Styled Components -------------------
const StyledDrawer = styled(Drawer)(({ theme }) => ({
  "& .MuiDrawer-paper": {
    width: 260,
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    borderRight: "none",
    backgroundColor: "#fff",
    boxShadow: "0 0 20px rgba(0,0,0,0.05)",
  },
}));

// Logo container
const LogoBox = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: theme.spacing(3, 2),
  background: "linear-gradient(to right, #f8fafc, #f1f5f9)",
  borderBottom: "1px solid #e2e8f0",
  flexShrink: 0,
  "& img": {
    height: 40,
    objectFit: "contain",
    transition: "transform 0.3s ease",
    "&:hover": {
      transform: "scale(1.05)",
    },
  },
}));

const SectionTitle = styled(Typography)(({ theme }) => ({
  fontSize: "0.75rem",
  fontWeight: 700,
  letterSpacing: "0.5px",
  textTransform: "uppercase",
  color: "#64748b",
  padding: theme.spacing(2.5, 2, 1, 2),
  position: "relative",
  "&:after": {
    content: '""',
    position: "absolute",
    bottom: 0,
    left: 16,
    width: 20,
    height: 2,
    backgroundColor: "#2563eb",
    borderRadius: 2,
  },
}));

const StyledListItemButton = styled(ListItemButton)(({ theme }) => ({
  borderRadius: 8,
  margin: theme.spacing(0.3, 1),
  padding: theme.spacing(1, 1.5),
  fontWeight: 500,
  color: theme.palette.text.secondary,
  transition: "all 0.2s ease",
  "&.Mui-selected": {
    backgroundColor: alpha("#2563eb", 0.08),
    color: "#2563eb",
    transform: "scale(1.02)",
    "& .MuiListItemIcon-root": {
      color: "#2563eb",
    },
    "&:before": {
      content: '""',
      position: "absolute",
      left: 0,
      top: "50%",
      transform: "translateY(-50%)",
      height: "60%",
      width: 3,
      backgroundColor: "#2563eb",
      borderRadius: "0 4px 4px 0",
    },
  },
  "&:hover": {
    backgroundColor: alpha("#2563eb", 0.05),
    color: "#2563eb",
    transform: "scale(1.02)",
    "& .MuiListItemIcon-root": {
      color: "#2563eb",
      transform: "scale(1.1)",
    },
  },
  "& .MuiListItemIcon-root": {
    transition: "transform 0.2s ease",
  },
}));

const DropdownHeader = styled(ListItemButton)(({ theme, open }) => ({
  borderRadius: 8,
  margin: theme.spacing(0.3, 1),
  padding: theme.spacing(1, 1.5),
  fontWeight: 500,
  color: open ? "#0052cc" : theme.palette.text.secondary,
  "&:hover": {
    backgroundColor: alpha("#0052cc", 0.08),
    color: "#0052cc",
  },
  "& .MuiListItemIcon-root": {
    minWidth: 36,
    color: "inherit",
  },
}));

const UserCard = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  padding: theme.spacing(2),
  background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
  borderRadius: 16,
  margin: theme.spacing(2),
  border: "1px solid #e2e8f0",
  transition: "all 0.3s ease",
  flexShrink: 0,
  "&:hover": {
    transform: "translateY(-2px)",
    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
  },
  "& .MuiAvatar-root": {
    border: "2px solid #fff",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    transition: "transform 0.3s ease",
    "&:hover": {
      transform: "scale(1.1)",
    },
  },
}));

// Container for the menu list with proper scrolling
const MenuListContainer = styled(Box)(({ theme }) => ({
  flex: 1,
  overflowY: 'auto',
  overflowX: 'hidden',
  '&::-webkit-scrollbar': {
    width: '4px',
  },
  '&::-webkit-scrollbar-track': {
    background: 'transparent',
  },
  '&::-webkit-scrollbar-thumb': {
    background: '#c1c1c1',
    borderRadius: '4px',
  },
  '&::-webkit-scrollbar-thumb:hover': {
    background: '#a1a1a1',
  },
}));

// ------------------- Main Component -------------------
function Navigation() {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, loading: authLoading } = useAuth();

  const [openMenus, setOpenMenus] = useState({
    invoices: location.pathname.startsWith("/invoices"),
    vehicles: location.pathname.startsWith("/vehicles"),
    licenses: location.pathname.startsWith("/licenses"),
    users: location.pathname.startsWith("/users"),
  });

  const toggleMenu = (menu) => {
    setOpenMenus((prev) => ({ ...prev, [menu]: !prev[menu] }));
  };

  const isSelected = (path) => location.pathname === path;

  const menuConfig = {
    invoices: [
      { label: "Créer une facture", path: "/invoices/new", icon: <AddIcon fontSize="small" /> },
      { label: "Gestion des factures", path: "/invoices", icon: <InvoiceIcon fontSize="small" /> },
    ],
    vehicles: [
      { label: "Ajouter un véhicule", path: "/vehicles/add", icon: <AddIcon fontSize="small" /> },
      { label: "Liste des véhicules", path: "/vehicles", icon: <VehicleIcon fontSize="small" /> },
    ],
    licenses: [
      { label: "Ajouter une licence", path: "/licenses/add", icon: <AddIcon fontSize="small" /> },
      { label: "Licences", path: "/licenses", icon: <LicenseIcon fontSize="small" /> },
    ],
    users: [
      { label: "Utilisateurs", path: "/users", icon: <UsersIcon fontSize="small" /> },
      { label: "Ajouter un utilisateur", path: "/register", icon: <PersonAddIcon fontSize="small" /> },
    ],
    admin: [
      { label: "Tableau de bord", path: "/dashboard", icon: <DashboardIcon /> },
      { label: "Gestion des congés", path: "/leave/request", icon: <LeaveManageIcon /> },
      { label: "Documents archivés", path: "/archiving", icon: <ArchiveIcon /> },
      { label: "Liste des tâches", path: "/todos", icon: <TodoIcon /> },
    ],
    user: [
      { label: "Ajouter une demande de congé", path: "/leave/add", icon: <LeaveIcon /> },
      { label: "Congé personnel", path: "/leave/personal", icon: <LeaveIcon /> },
    ],
  };

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login", { replace: true });
    }
  }, [user, authLoading, navigate]);

  const renderMenuItem = ({ path, label, icon, badge }) => (
    <ListItem key={path} disablePadding>
      <StyledListItemButton component={Link} to={path} selected={isSelected(path)}>
        <ListItemIcon sx={{ minWidth: 36, color: "inherit" }}>
          {badge ? <Badge badgeContent={badge} color="primary">{icon}</Badge> : icon}
        </ListItemIcon>
        <ListItemText primary={label} primaryTypographyProps={{ fontSize: "0.88rem", fontWeight: 500 }} />
      </StyledListItemButton>
    </ListItem>
  );

  const renderDropdownMenu = (menuKey, icon) => {
    const items = menuConfig[menuKey];
    const isOpen = openMenus[menuKey];
    const isActive = items.some((item) => isSelected(item.path));

    return (
      <React.Fragment key={menuKey}>
        <ListItem disablePadding>
          <DropdownHeader onClick={() => toggleMenu(menuKey)} open={isOpen || isActive}>
            <ListItemIcon>{icon}</ListItemIcon>
            <ListItemText
              primary={
                menuKey === "users" ? "Utilisateurs" :
                menuKey === "invoices" ? "Factures" :
                menuKey === "vehicles" ? "Véhicules" :
                menuKey === "licenses" ? "Licences" :
                menuKey.charAt(0).toUpperCase() + menuKey.slice(1)
              }
              primaryTypographyProps={{ fontSize: "0.88rem", fontWeight: 500 }}
            />
            {isOpen ? <ExpandMore sx={{ transition: "0.3s" }} /> : <ChevronRight />}
          </DropdownHeader>
        </ListItem>
        <Collapse in={isOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {items.map((item) => renderMenuItem(item))}
          </List>
        </Collapse>
      </React.Fragment>
    );
  };

  if (!user) return null;

  const roles = Array.isArray(user.roles) ? user.roles : [user.roles].filter(Boolean);

  return (
    <StyledDrawer variant="permanent" anchor="left">
      {/* Logo */}
      <LogoBox>
        <img src="/dynamix.jpg" alt="Dynamix Services Logo" />
      </LogoBox>

      {/* Menu */}
      <MenuListContainer>
        <List sx={{ px: 0.5 }}>
          {roles.includes("admin") && (
            <>
              <SectionTitle>Administration</SectionTitle>
              {menuConfig.admin.map((item) => renderMenuItem(item))}
              <SectionTitle>Gestion</SectionTitle>
              {renderDropdownMenu("users", <UsersIcon />)}
              {renderDropdownMenu("invoices", <InvoiceIcon />)}
              {renderDropdownMenu("vehicles", <VehicleIcon />)}
              {renderDropdownMenu("licenses", <LicenseIcon />)}
            </>
          )}
          {roles.includes("user") && (
            <>
              <SectionTitle>Utilisateur</SectionTitle>
              {menuConfig.user.map((item) => renderMenuItem(item))}
            </>
          )}
        </List>
      </MenuListContainer>

      {/* User Card */}
      <UserCard>
        <Avatar alt={user.name} src={user.avatar} />
        <Box ml={1}>
          <Typography variant="body2" fontWeight={600}>
            {user.name || "Utilisateur"}
          </Typography>
{/*           <Typography variant="caption" color="text.secondary">
            {roles.length > 0 ? roles.join(", ") : "Aucun rôle"}
          </Typography> */}
        </Box>
      </UserCard>

      {/* Logout */}
      <Box sx={{ px: 2, pb: 2, flexShrink: 0 }}>
        <StyledListItemButton
          onClick={logout}
          sx={{
            color: theme.palette.error.main,
            "&:hover": {
              backgroundColor: alpha(theme.palette.error.main, 0.08),
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 36, color: "inherit" }}>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText primary="Se déconnecter" />
        </StyledListItemButton>
      </Box>
    </StyledDrawer>
  );
}

export default Navigation;