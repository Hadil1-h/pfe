import React, { useState } from "react";
import { Box, List, ListItem, ListItemIcon, IconButton, Tooltip } from "@mui/material";
import ImportExportIcon from "@mui/icons-material/ImportExport";

import {

  DashboardOutlined as DashboardOutlinedIcon,
  Task as TaskIcon,
  Timeline as TimelineIcon,
  People as PeopleIcon,
  ArrowForwardIos as ArrowForwardIosIcon,
  ArrowBackIos as ArrowBackIosIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

const SidebarProject = () => {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false); // État pour cacher/afficher le menu

  const menuItems = [
    { icon: <DashboardOutlinedIcon />, title: "Dashboard", to: "/DashboardProject" },
    { icon: <ImportExportIcon />, title: "Projets", to: "/TableProject" },  // Remplacer l'icône ici
    { icon: <TaskIcon />, title: "Tâches", to: "/KanbanBoard" },
   
    { icon: <PeopleIcon />, title: "Équipe", to: "/ProjectTeam" },
    { icon: <TimelineIcon />, title: "Timeline", to: "/Timeline" },
  ];

  return (
    <Box
      sx={{
        width: collapsed ? "60px" : "200px", // Réduire la largeur du sidebar lorsqu'il est caché
        height: "100vh",
        backgroundColor: "#0A2540",
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: "20px",
        transition: "width 0.3s", // Transition pour l'animation de la largeur
      }}
    >
      <IconButton
        sx={{
          backgroundColor: "#1E3A5F",
          color: "#4CAF50",
          width: "50px",
          height: "50px",
          borderRadius: "50%",
          marginBottom: "20px",
        }}
        onClick={() => setCollapsed(!collapsed)} // Changer l'état de l'affichage du menu
      >
        {collapsed ? <ArrowForwardIosIcon /> : <ArrowBackIosIcon />}
      </IconButton>

      <List sx={{ width: "100%" }}>
        {!collapsed && menuItems.map((item, index) => (
          <Tooltip key={index} title={item.title} placement="right" arrow>
            <ListItem
              component="div"
              sx={{
                display: "flex",
                justifyContent: "center",
                padding: "15px 0",
                cursor: "pointer",
                "&:hover": { backgroundColor: "#1E3A5F" },
              }}
              onClick={() => navigate(item.to)}
            >
              <ListItemIcon sx={{ color: "#fff", minWidth: "unset" }}>
                {item.icon}
              </ListItemIcon>
            </ListItem>
          </Tooltip>
        ))}
      </List>
    </Box>
  );
};

export default SidebarProject;

