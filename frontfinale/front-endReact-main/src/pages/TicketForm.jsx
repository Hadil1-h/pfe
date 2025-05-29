import React, { useState, useContext } from "react";
import DescriptionComposent from "./DescriptionComposent";
import { AuthContext } from "../context/AuthContext";
import {
  Box,
  TextField,
  MenuItem,
  Button,
  FormControl,
  Select,
  Typography,
  Checkbox,
  FormControlLabel,
} from "@mui/material";

const TicketForm = () => {
  const { user } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    contact: user?.role === "contact" ? user.id : "",
    objet: "",
    type: "--",
    source: "Téléphone",
    statut: "Ouvert",
    priorite: "Faible",
    groupe: "--",
    agent: "Youssef Weli",
    produit: "Example",
    description: "",
    creerAutre: false,
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.contact || !formData.objet) {
      alert("Veuillez remplir tous les champs obligatoires.");
      return;
    }
    console.log(formData);
  };

  return (
    <Box p={3} ml={6} mt={4} border={6} borderRadius={4} borderColor="#0A2540">
      <Typography variant="h5" gutterBottom>
        Création d'un Ticket
      </Typography>
      <form onSubmit={handleSubmit}>
        <FormControl fullWidth margin="dense" size="small">
          <Typography>
            Contact <span style={{ color: "red" }}>*</span>
          </Typography>
          <TextField
            size="small"
            fullWidth
            required
            name="contact"
            value={
              user?.role === "contact"
                ? `${user?.name}  - ${user?.email}`
                : formData.contact
            }
            onChange={handleChange}
            InputProps={{ readOnly: user?.role === "contact" }}
          />
        </FormControl>

        <FormControl fullWidth margin="dense" size="small">
          <Typography>
            Objet <span style={{ color: "red" }}>*</span>
          </Typography>
          <TextField
            size="small"
            fullWidth
            required
            name="objet"
            value={formData.objet}
            onChange={handleChange}
          />
        </FormControl>

        <FormControl fullWidth margin="dense" size="small">
          <Typography>Type</Typography>
          <Select
            name="type"
            value={formData.type}
            onChange={handleChange}
            size="small"
          >
            <MenuItem value="--">--</MenuItem>
            <MenuItem value="Bug">Bug</MenuItem>
            <MenuItem value="Demande">Demande</MenuItem>
          </Select>
        </FormControl>

        <FormControl fullWidth margin="dense" size="small">
          <Typography>Source</Typography>
          <Select
            name="source"
            value={formData.source}
            onChange={handleChange}
            size="small"
          >
            <MenuItem value="Téléphone">Téléphone</MenuItem>
            <MenuItem value="Email">Email</MenuItem>
          </Select>
        </FormControl>

        <DescriptionComposent
          value={formData.description}
          onChange={(value) => setFormData({ ...formData, description: value })}
        />

        <FormControlLabel
          control={
            <Checkbox
              name="creerAutre"
              checked={formData.creerAutre}
              onChange={(e) =>
                setFormData({ ...formData, creerAutre: e.target.checked })
              }
            />
          }
          label="Créer un autre"
        />

        <Box mt={2} display="flex" justifyContent="space-between">
          <Button variant="outlined" color="secondary">
            Annuler
          </Button>
          <Button variant="contained" color="primary" type="submit">
            Créer
          </Button>
        </Box>
      </form>
    </Box>
  );
};

export default TicketForm;



