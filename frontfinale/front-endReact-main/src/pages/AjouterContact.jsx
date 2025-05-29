import React, { useState } from "react";
import AjouterEntreprise from "./AjouterEntreprise";
import { TextField,Link, Button, Box, Typography, FormControl, Select, MenuItem, Collapse } from "@mui/material";
import Header from "../components/Header";
import {mockDataEntreprise} from "../data/mockData";

const entreprises = mockDataEntreprise.map((entreprise) => ({
  ...entreprise,
  label: entreprise.name,
  value: entreprise.id,
}));


const AjouterContact = ({ onClose }) => {
  const [contactData, setContactData] = useState({
    name: "",
    email: "",
    entreprise: "",
    telephonePro: "",
    telephonePortable: "",
  });

  const [showAjouterEntreprise, setShowAjouterEntreprise] = useState(false);

  const handleChange = (e) => {
    setContactData({ ...contactData });
  };


  const handleSubmit = (e) => {
    e.preventDefault();
    if (contactData.telephonePro.length !== 8 || contactData.telephonePortable.length !== 8) {
      alert("Les numéros de téléphone doivent contenir exactement 8 chiffres.");
      return;
    }
    console.log(contactData);
    onClose();
  };

  return (
    <Box m="20px">
    <Header title=" nouveau contact" subtitle="Ajouter un nouveau contact" />
   
    <Box mt={4} ml={6} p={3} border={6} borderRadius={4} borderColor="#0A2540" display="flex" flexDirection="column" alignItems="center">
      <Typography variant="subtitle1">Ajouter un nouveau contact</Typography>
      <form onSubmit={handleSubmit}>
        <FormControl fullWidth margin="dense" size="small">
          <Typography variant="inherit">
            Nom <span style={{ color: "red" }}>*</span>
          </Typography>
          <TextField
            autoFocus
            size="small"
            type="text"
            fullWidth
            name="name"
            value={contactData.name}
            onChange={handleChange}
            required
          />
        </FormControl>
        <FormControl fullWidth margin="dense" size="small">
          <Typography variant="inherit">
            E-mail <span style={{ color: "red" }}>*</span>
          </Typography>
          <TextField
            size="small"
            type="email"
            fullWidth
            name="email"
            value={contactData.email}
            onChange={handleChange}
            required
          />
        </FormControl>
        <FormControl fullWidth margin="dense" size="small">
          <Typography>
            Entreprise <span style={{ color: "red" }}>*</span>
          </Typography>
          <Select name="entreprise" value={contactData.entreprise} onChange={handleChange} required>
            <MenuItem value="--">--</MenuItem>
            {
            entreprises.map((entreprise) => (
              <MenuItem key={entreprise.value} value={entreprise.value}>
                {entreprise.label}
              </MenuItem>
            )
            )
            }
          </Select>
          <Box display="flex" justifyContent="flex-end">
            <Link onClick={() => setShowAjouterEntreprise(!showAjouterEntreprise)}>Ajouter une nouvelle Entreprise</Link>
          </Box>
          <Collapse in={showAjouterEntreprise}>
            <AjouterEntreprise open={showAjouterEntreprise}/>
          </Collapse>
        </FormControl>
        <FormControl margin="dense" fullWidth size="small">
          <Typography>
            Téléphone Professionnel <span style={{ color: "red" }}>*</span>
          </Typography>
          <TextField
            size="small"
            type="tel"
            name="telephonePro"
            value={contactData.telephonePro}
            onChange={handleChange}
            inputProps={{ maxLength: 8 }}
            required
          />
        </FormControl>
        <FormControl size="small" fullWidth margin="dense">
          <Typography>Téléphone Portable</Typography>
          <TextField
            size="small"
            type="tel"
            fullWidth
            name="telephonePortable"
            value={contactData.telephonePortable}
            onChange={handleChange}
            inputProps={{ maxLength: 8 }}
            required
          />
        </FormControl>
        <Box mt={2} display="flex" justifyContent="space-between">
          <Button onClick={onClose} color="secondary">Annuler</Button>
          <Button type="submit" color="primary" variant="contained">Ajouter</Button>
        </Box>
      </form>
    </Box>
    </Box>
    
  );
};

export default AjouterContact;


