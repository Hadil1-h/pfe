import React, { useContext } from "react";
import { Box, IconButton, useTheme, InputBase } from "@mui/material";
import { ColorModeContext } from "../theme";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import NotificationsOutlinedIcon from "@mui/icons-material/NotificationsOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import SearchIcon from "@mui/icons-material/Search";
import UserMenu from "./UserMenu";

const Topbar = () => {
  const theme = useTheme();
  const colorMode = useContext(ColorModeContext);

  return (
    <Box display="flex" justifyContent="space-between" p={2}>
      {/* Barre de recherche */}
      <Box display="flex" backgroundColor={theme.palette.mode === "dark" ? "#333" : "#fff"} borderRadius="3px">
        <InputBase sx={{ ml: 2, flex: 1 }} placeholder="Rechercher..." />
        <IconButton type="button" sx={{ p: 1 }}>
          <SearchIcon />
        </IconButton>
      </Box>

      {/* Icônes */}
      <Box display="flex">
        <IconButton onClick={colorMode.toggleColorMode}>
          {theme.palette.mode === "dark" ? <DarkModeOutlinedIcon /> : <LightModeOutlinedIcon />}
        </IconButton>
        <IconButton>
          <NotificationsOutlinedIcon />
        </IconButton>
        <IconButton>
          <SettingsOutlinedIcon />
        </IconButton>

        {/* Menu utilisateur */}
        <UserMenu />
      </Box>
    </Box>
  );
};

export default Topbar;
