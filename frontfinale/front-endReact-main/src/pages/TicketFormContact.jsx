import React, { useState, useContext } from "react";
import DescriptionComposent from "./DescriptionComposent";
import { AuthContext } from "../context/AuthContext";
import {mockDataTypePanne, mockDataTypeTicket,mockDataContacts, mockDataAgents } from "../data/mockData";

import {
  Box,
  TextField,
  MenuItem,
  Button,
  FormControl,
  Select,
  Typography,
 
} from "@mui/material";

const TicketFormContact = () => {
  const { user } = useContext(AuthContext);

  // Trouver le contact connecté (si l'utilisateur est un contact)
  const contactActuel = mockDataContacts.find((contact) => contact.id === user?.id);

  // Filtrer les agents favoris du contact connecté
  const agentsDisponibles = contactActuel
    ? mockDataAgents.filter((agent) =>
        contactActuel.agentsFavoris.some((fav) => fav.id === agent.id)
      )
    : [];

    const [formData, setFormData] = useState({
        contact: user?.role === "contact" ? user.id : "",
        objet: "",
        typeTicket: "--",
        typePanne: [],
        source: "Téléphone",
        statueTicket: "En attente", // Toujours "En attente" par défaut
        priorite: "Faible",
        agentAssigne: "--",
        description: "",
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
  
    // Ajouter la date de création (date système)
    const ticketData = {
      ...formData,
      dateCreation: new Date().toISOString(), // Prend la date et l'heure actuelle du système
    };
  
    console.log(ticketData);  // Vérification avant l'envoi
  };
  

  return (
    <Box p={3} ml={6} mt={4} border={6} borderRadius={4} borderColor="#0A2540">
      <Typography variant="h5" gutterBottom>
        Création d'un Ticket pour contact
      </Typography>
      <form onSubmit={handleSubmit}>
        {/* Champ Contact */}
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
                ? `${user?.name} - ${user?.email}`
                : formData.contact
            }
            onChange={handleChange}
            InputProps={{ readOnly: user?.role === "contact" }}
          />
        </FormControl>

        {/* Champ Objet */}
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

        {/* Champ Type Ticket */}
        <FormControl fullWidth margin="dense" size="small">
          <Typography>Type Ticket</Typography>
          <Select
            name="typeTicket"
            value={formData.typeTicket}
            onChange={handleChange}
            size="small"
          >
            <MenuItem value="--">--</MenuItem>
            {mockDataTypeTicket.map((type) => (
              <MenuItem key={type.id} value={type.id}>
                {type.descriptionTypeTicket}
              </MenuItem>
            ))}
           </Select>

        </FormControl>
        <FormControl fullWidth margin="dense" size="small">
          <Typography>Type Panne</Typography>
          <Select
            name="typePanne"
            value={formData.typePanne}
            onChange={handleChange}
            size="small"
          >
            {mockDataTypePanne.map((type) => (
              <MenuItem key={type.id} value={type.id}>
                {type.descriptionTypePanne}
              </MenuItem>
            ))}
           </Select>

        </FormControl>

        {/* Champ Agent (filtré selon agents favoris) */}
        <FormControl fullWidth margin="dense" size="small">
          <Typography>Agent</Typography>
          <Select
            name="agentAssigne"
            value={formData.agentAssigne}
            onChange={handleChange}
            size="small"
            required
          >
            <MenuItem value="--">--</MenuItem>
            {agentsDisponibles.map((agent) => (
              <MenuItem key={agent.id} value={agent.id}>
                {agent.name} - {agent.email}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Champ Source */}
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


        <FormControl fullWidth margin="dense" size="small">
          <Typography>Periorite</Typography>
          <Select
            name="priorite"
            value={formData.priorite}
            onChange={handleChange}
            size="small"
          >
            <MenuItem value="Faible">Faible</MenuItem>
            <MenuItem value="Forte">Forte</MenuItem>
          </Select>
        </FormControl>
        {/* Champ Description */}
        <DescriptionComposent
          value={formData.description}
          onChange={(value) => setFormData({ ...formData, description: value })}
        />

      

        {/* Boutons */}
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

export default TicketFormContact;

