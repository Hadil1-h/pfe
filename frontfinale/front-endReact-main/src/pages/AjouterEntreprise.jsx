import React, { useState } from "react";
import { TextField, Button, Box, Typography, FormControl } from "@mui/material";

const AjouterEntreprise = ({ onClose }) => {
  const [formData, setFormData] = useState({
    name: "",
    adresse: "",
    codePostal: "",
    ville: "",
    secteur: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(formData);
    onClose();
  };

  return (
    <Box p={3} ml={6} mt={4} border={6} borderRadius={4} borderColor="#0A2540">
      <Typography variant="subtitle1">Ajouter une entreprise</Typography>
      <form onSubmit={handleSubmit}>
        <FormControl fullWidth margin="dense" size="small">
          <Typography>Nom de l'entreprise <span style={{ color: "red" }}>*</span></Typography>
          <TextField
            autoFocus
            size="small"
            type="text"
            fullWidth
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </FormControl>

        <FormControl fullWidth margin="dense" size="small">
          <Typography>Secteur <span style={{ color: "red" }}>*</span></Typography>
          <TextField
            size="small"
            type="text"
            fullWidth
            name="siret"
            value={formData.siret}
            onChange={handleChange}
            inputProps={{ maxLength: 14 }}
            required
          />
        </FormControl>

        <FormControl fullWidth margin="dense" size="small">
          <Typography>Adresse <span style={{ color: "red" }}>*</span></Typography>
          <TextField
            size="small"
            type="text"
            fullWidth
            name="adresse"
            value={formData.adresse}
            onChange={handleChange}
            required
          />
        </FormControl>

        <FormControl fullWidth margin="dense" size="small">
          <Typography>Code postal <span style={{ color: "red" }}>*</span></Typography>
          <TextField
            size="small"
            type="text"
            fullWidth
            name="codePostal"
            value={formData.codePostal}
            onChange={handleChange}
            inputProps={{ maxLength: 5 }}
            required
          />
        </FormControl>

        <FormControl fullWidth margin="dense" size="small">
          <Typography>Ville <span style={{ color: "red" }}>*</span></Typography>
          <TextField
            size="small"
            type="text"
            fullWidth
            name="ville"
            value={formData.ville}
            onChange={handleChange}
            required
          />
        </FormControl>
        <Box mt={2} display="flex" justifyContent="space-between">
          <Button onClick={onClose} color="secondary">Annuler</Button>
          <Button type="submit" color="primary" variant="contained">Ajouter</Button>
        </Box>
      </form>
    </Box>
  );
};

export default AjouterEntreprise;

