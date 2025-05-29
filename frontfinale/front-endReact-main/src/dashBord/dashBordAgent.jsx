import React from "react";
import { Box, Button, Typography, useTheme } from "@mui/material";
import { tokens } from "../theme";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import PendingActionsOutlinedIcon from "@mui/icons-material/PendingActionsOutlined";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import Header from "../components/Header";


const DashboardAgent = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  
  // Simulation des données des tickets (à remplacer avec une API si nécessaire)
  const ticketsData = [
    { title: "Total Tickets", count: "1,542", icon: <AssignmentOutlinedIcon sx={{ color: colors.greenAccent[600], fontSize: "40px" }} /> },
    { title: "Tickets Ouverts", count: "320", icon: <PendingActionsOutlinedIcon sx={{ color: colors.blueAccent[500], fontSize: "40px" }} /> },
    { title: "Tickets En Cours", count: "180", icon: <PendingActionsOutlinedIcon sx={{ color: colors.greenAccent[500], fontSize: "40px" }} /> },
    { title: "Tickets Résolus", count: "950", icon: <CheckCircleOutlineOutlinedIcon sx={{ color: colors.greenAccent[600], fontSize: "40px" }} /> },
    { title: "Tickets Fermés", count: "92", icon: <CancelOutlinedIcon sx={{ color: colors.redAccent[500], fontSize: "40px" }} /> }
  ];

  return (
  
    <Box m="20px">
      {/* HEADER */}
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Header title="tableaux de bord Agent " subtitle="Vue d'ensemble des tickets" />
      </Box>

      {/* GRID SECTION - STATISTIQUES DES TICKETS */}
      <Box display="grid" gridTemplateColumns="repeat(12, 1fr)" gap="20px" mt="20px">
        {ticketsData.map((item, index) => (
          <Box 
            key={index} 
            gridColumn="span 4" 
            backgroundColor={colors.primary[400]} 
            display="flex" 
            flexDirection="column"
            alignItems="center" 
            justifyContent="center" 
            p="20px"
            borderRadius="8px"
            textAlign="center"
          >
            {item.icon}
            <Typography variant="h5" fontWeight="bold" color={colors.grey[100]} mt="10px">
              {item.count}
            </Typography>
            <Typography variant="body1" color={colors.grey[300]}>
              {item.title}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};


export default DashboardAgent;

