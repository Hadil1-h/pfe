import React, { useState, useContext } from "react";
import {
  Menu,
  MenuItem,
  Avatar,
  IconButton,
  Typography,
  Box,
  Divider,
} from "@mui/material";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";

const UserMenu = () => {
  const { user, logout, role } = useContext(AuthContext);
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  if (!user) return null;

  return (
    <Box>
      <IconButton onClick={handleMenuOpen} sx={{ ml: 2 }}>
        <Avatar sx={{ bgcolor: "#1E3A5F" }}>
          {user.name ? user.name.charAt(0).toUpperCase() : <PersonOutlinedIcon />}
        </Avatar>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        sx={{ mt: 1 }}
      >
        <MenuItem disabled>
          <Box>
            <Typography fontWeight="bold">{user.name}</Typography>
            <Typography variant="body2" color="textSecondary">
              {user.email}
            </Typography>
          </Box>
        </MenuItem>

        <Divider />

        {role === "agent" ? (
          <>
            <MenuItem onClick={() => { handleMenuClose(); navigate("/profil"); }}>Paramètres du profil</MenuItem>
            <MenuItem onClick={handleMenuClose}>Planifier l'absence</MenuItem>
          </>
        ) : (
          <MenuItem onClick={() => { handleMenuClose(); navigate("/profil"); }}>Paramètres du profil</MenuItem>
        )}
        
        <Divider />

        <MenuItem onClick={() => { handleMenuClose(); logout(); }} sx={{ color: "red" }}>
          Se déconnecter
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default UserMenu;

