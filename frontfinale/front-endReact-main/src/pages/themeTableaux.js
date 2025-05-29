import { useTheme } from "@mui/material/styles";/*باش نجيبو منه الثيم متاع MUI (light ولا dark). */
import { tokens } from "../theme";/**tokens هي فانكشون اللي ترجع الألوان متاع الثيم حسب الـ mode (light/dark).*/

const useThemeTableaux = () => {
  const theme = useTheme(); // Récupération du thème actuel
  const colors = tokens(theme.palette.mode); // Génération des couleurs dynamiques

  return {
    "& .MuiDataGrid-root": {
      border: "none",
    },
    "& .MuiDataGrid-cell": {
      borderBottom: "none",
    },
    "& .name-column--cell": {
      color: colors.greenAccent[400],
    },
    "& .MuiDataGrid-columnHeaders": {
      backgroundColor: colors.blueAccent[700],
      borderBottom: "none",
    },
    "& .MuiDataGrid-virtualScroller": {
      backgroundColor: colors.primary[400],
    },


    
    "& .MuiDataGrid-footerContainer": {
      borderTop: "none",
      backgroundColor: colors.blueAccent[1000],
    },
  };
};

export default useThemeTableaux;
