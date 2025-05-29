import { Box, Typography, useTheme, Button } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { useNavigate } from "react-router-dom";
import { DataGrid } from "@mui/x-data-grid";
import { tokens } from "../theme";
import { users, mockDataContacts, mockDataEntreprise } from "../data/mockData"; // Import des données
import Header from "../components/Header";
import ThemeTableaux from "./themeTableaux";

// Ajouter les contacts aux entreprises
const entreprisesWithContacts = mockDataEntreprise.map((entreprise) => {
  const contacts = entreprise.listContacts.map((contactRef) => {
    const contact = mockDataContacts.find((c) => c.id === contactRef.id);
    return contact ? contact.name : "Inconnu"; // Récupération du nom du contact
  });

  return {
    ...entreprise,
    contacts: contacts.length > 0 ? contacts.join(", ") : "Aucun contact",
  };
});

const EntreprisePage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const columns = [
    { field: "id", headerName: "ID", width: 70 },
    {
      field: "name",
      headerName: "Nom de l'Entreprise",
      flex: 1,
      cellClassName: "name-column--cell",
    },
    {
      field: "secteur",
      headerName: "Secteur",
      flex: 1,
    },
    {
      field: "address",
      headerName: "Adresse",
      flex: 1,
    },
    {
      field: "codePostal",
      headerName: "Code Postal",
      flex: 1,
    },
    {
      field: "ville",
      headerName: "Ville",
      flex: 1,
    },
    {
      field: "contacts",
      headerName: "Contacts",
      flex: 2,
    },
  ];

  return (
    <Box m="20px">
      <Header title="Entreprises" subtitle="Liste des entreprises et leurs contacts" />
      
      {/* Bouton d'ajout */}
      <Box display="flex" justifyContent="flex-end" mb="20px">
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => navigate("/ajouter-entreprise")}
        >
          Nouvelle Entreprise
        </Button>
      </Box>

      {/* Tableau des entreprises */}
      <Box
       m="20px 0 0 0"
       height="60vh"
        sx={ThemeTableaux}
      >
        <DataGrid checkboxSelection rows={entreprisesWithContacts} columns={columns} />
      </Box>
    </Box>
  );
};

export default EntreprisePage;
