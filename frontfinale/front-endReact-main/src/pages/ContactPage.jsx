import { Box, Typography, useTheme, Button } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import { useNavigate } from "react-router-dom";
import { DataGrid } from "@mui/x-data-grid";
import { tokens } from "../theme";
import { users, mockDataContacts, mockDataEntreprise } from "../data/mockData"; // Import des données
import Header from "../components/Header";
import ThemeTableaux from "./themeTableaux";

// Ajouter l'email au tableau de contacts
const contactsWithEmail = mockDataContacts.map((contact) => {
  const user = users.find((user) => user.id === contact.id); // Trouver l'email correspondant
  return { ...contact, email: user ? user.email : "Non disponible" };
});

// Ajouter l'entreprise au tableau de contacts
const contactsWithEntreprise = contactsWithEmail.map((contact) => {
  const entreprise = mockDataEntreprise.find((entreprise) => entreprise.id === contact.idEntreprise); // Trouver l'entreprise correspondante
  return { ...contact, entreprise: entreprise ? entreprise.name : "Non disponible" };
});

const ContactPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const colors = tokens(theme.palette.mode); // Correction

  const columns = [
    { field: "id", headerName: "ID", width: 70 },
    {
      field: "name",
      headerName: "Nom",
      flex: 1,
      cellClassName: "name-column--cell",
    },
    {
      field: "adresse",
      headerName: "Adresse",
      flex: 1,
    },
    {
      field: "age",
      headerName: "Âge",
      type: "number",
      width: 90,
      headerAlign: "left",
      align: "left",
    },
    {
      field: "telephoneProfessionnel", // Correction du nom de champ
      headerName: "Téléphone professionnel",
      flex: 1,
    },
    {
      field: "telephonePortable",
      headerName: "Téléphone portable",
      flex: 1,
    },
    {
      field: "email",
      headerName: "Email",
      flex: 1,
    },
    {
      field: "entreprise",
      headerName: "Entreprise",
      flex: 1,
    },
  ];

  return (
    <Box m="20px">
      <Header title="Contacts" subtitle="Liste des contacts enregistrés" />
      
      {/* Bouton d'ajout */}
      <Box display="flex" justifyContent="flex-end" mb="20px">
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => navigate("/ajouter-contact")}
        >
          Nouveau contact
        </Button>
      </Box>

      {/* Tableau des contacts */}
      <Box
        m="20px 0 0 0"
        height="60vh"
        sx={ThemeTableaux} // Correction ici
      >
        <DataGrid checkboxSelection rows={contactsWithEntreprise} columns={columns} />
      </Box>
    </Box>
  );
};

export default ContactPage;
