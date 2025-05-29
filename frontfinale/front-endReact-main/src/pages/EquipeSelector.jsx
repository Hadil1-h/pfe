import React, { useState } from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Checkbox,
  ListItemText,
  ListItemIcon,
  Avatar,
  Typography,
  Box,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

const EquipeSelector = ({ equipes, setEquipes, agents, selectedEquipeId, onEquipeChange, setSelectedEquipeAgents }) => {
  const [openEquipeDialog, setOpenEquipeDialog] = useState(false);
  const [newEquipeData, setNewEquipeData] = useState({
    nom: '',
    description: '',
    selectedAgents: [],
  });
  const [openAgentDialog, setOpenAgentDialog] = useState(false);
  const [selectedAgentDetails, setSelectedAgentDetails] = useState(null);
  const [openNotificationDialog, setOpenNotificationDialog] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationSeverity, setNotificationSeverity] = useState('info');

  // Récupérer les détails d'un agent
  const fetchAgentDetails = (agentId) => {
  const agent = agents.find(a => a.id === agentId);
  if (agent) {
    setSelectedAgentDetails(agent);
    setOpenAgentDialog(true);
  } else {
    setNotificationMessage('Détails de l\'agent non disponibles');
    setNotificationSeverity('error');
    setOpenNotificationDialog(true);
  }
};
  const handleNewEquipeChange = (e) => {
    const { name, value } = e.target;
    setNewEquipeData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAgentSelection = (agentId) => {
    setNewEquipeData((prev) => ({
      ...prev,
      selectedAgents: prev.selectedAgents.includes(agentId)
        ? prev.selectedAgents.filter((id) => id !== agentId)
        : [...prev.selectedAgents, agentId],
    }));
  };

  const handleCreateEquipe = async () => {
    // Validation des champs
    if (!newEquipeData.nom.trim()) {
      setNotificationMessage('Le nom de l\'équipe est obligatoire.');
      setNotificationSeverity('warning');
      setOpenNotificationDialog(true);
      return;
    }

    if (!newEquipeData.description.trim()) {
      setNotificationMessage('La description de l\'équipe est obligatoire.');
      setNotificationSeverity('warning');
      setOpenNotificationDialog(true);
      return;
    }

    // Vérifier que le nom contient des lettres
    const lettersRegex = /[a-zA-Z]/;
    if (!lettersRegex.test(newEquipeData.nom)) {
      setNotificationMessage('Le nom de l\'équipe doit contenir des lettres.');
      setNotificationSeverity('warning');
      setOpenNotificationDialog(true);
      return;
    }

    // Vérifier que la description contient des lettres
    if (!lettersRegex.test(newEquipeData.description)) {
      setNotificationMessage('La description doit contenir des lettres.');
      setNotificationSeverity('warning');
      setOpenNotificationDialog(true);
      return;
    }

    if (newEquipeData.selectedAgents.length === 0) {
      setNotificationMessage('Veuillez sélectionner au moins un agent.');
      setNotificationSeverity('warning');
      setOpenNotificationDialog(true);
      return;
    }

    const equipeToSend = {
      nom: newEquipeData.nom,
      description: newEquipeData.description,
      agents: newEquipeData.selectedAgents.map((id) => ({ id })),
    };

    try {
      console.log('Envoi de la requête avec:', JSON.stringify(equipeToSend));
      const response = await fetch('http://localhost:8080/api/equipes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(equipeToSend),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Erreur serveur:', errorData);
        throw new Error(errorData.message || 'Erreur lors de la création de l\'équipe');
      }

      const createdEquipe = await response.json();
      setEquipes((prev) => [...prev, createdEquipe]);
      onEquipeChange(createdEquipe.id);
      setSelectedEquipeAgents(createdEquipe.agents || []);
      setOpenEquipeDialog(false);
      setNewEquipeData({ nom: '', description: '', selectedAgents: [] });
      setNotificationMessage('Équipe créée avec succès !');
      setNotificationSeverity('success');
      setOpenNotificationDialog(true);
    } catch (error) {
      console.error('Erreur détaillée:', error.message);
      setNotificationMessage(`Erreur: ${error.message}`);
      setNotificationSeverity('error');
      setOpenNotificationDialog(true);
    }
  };

  const handleChange = (e) => {
    const value = e.target.value;
    if (value === 'create') {
      setOpenEquipeDialog(true);
    } else {
      onEquipeChange(value);
    }
  };

  const handleNotificationClose = () => {
    setOpenNotificationDialog(false);
  };

  return (
    <>
      <FormControl fullWidth margin="dense">
        <InputLabel>Équipe</InputLabel>
        <Select value={selectedEquipeId} onChange={handleChange} name="equipe">
          <MenuItem value="">
            <em>Aucune</em>
          </MenuItem>
          {equipes.map((e) => (
            <MenuItem key={e.id} value={e.id}>
              {e.nom}
            </MenuItem>
          ))}
          <MenuItem value="create">
            <ListItemIcon>
              <AddIcon />
            </ListItemIcon>
            Créer une nouvelle équipe
          </MenuItem>
        </Select>
      </FormControl>

      {/* Popup pour créer une nouvelle équipe */}
      <Dialog open={openEquipeDialog} onClose={() => setOpenEquipeDialog(false)}>
        <DialogTitle>Créer une nouvelle équipe</DialogTitle>
        <DialogContent>
          <TextField
            label="Nom de l'équipe"
            name="nom"
            value={newEquipeData.nom}
            onChange={handleNewEquipeChange}
            fullWidth
            margin="dense"
            required
          />
          <TextField
            label="Description"
            name="description"
            value={newEquipeData.description}
            onChange={handleNewEquipeChange}
            fullWidth
            margin="dense"
            multiline
            rows={4}
            required
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Agents</InputLabel>
            <Select
              multiple
              value={newEquipeData.selectedAgents}
              onChange={(e) =>
                setNewEquipeData((prev) => ({ ...prev, selectedAgents: e.target.value }))
              }
              renderValue={(selected) =>
                selected
                  .map(
                    (id) =>
                      agents.find((agent) => agent.id === id)?.prenom +
                      ' ' +
                      agents.find((agent) => agent.id === id)?.nom
                  )
                  .join(', ')
              }
            >
              {agents.map((agent) => (
                <MenuItem key={agent.id} value={agent.id}>
                  <Checkbox checked={newEquipeData.selectedAgents.includes(agent.id)} />
                  <Avatar
                    sx={{ mr: 1, cursor: 'pointer' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      fetchAgentDetails(agent.id);
                    }}
                  >
                    {agent.prenom[0]}
                    {agent.nom[0]}
                  </Avatar>
                  <ListItemText primary={`${agent.prenom} ${agent.nom}`} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEquipeDialog(false)}>Annuler</Button>
          <Button onClick={handleCreateEquipe} variant="contained" color="primary">
            Créer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Popup pour afficher les détails de l'agent */}
      <Dialog open={openAgentDialog} onClose={() => setOpenAgentDialog(false)}>
        <DialogTitle>Détails de l'agent</DialogTitle>
        <DialogContent>
          {selectedAgentDetails ? (
            <Box>
              <Typography>
                <strong>Nom:</strong> {selectedAgentDetails.prenom} {selectedAgentDetails.nom}
              </Typography>
              <Typography>
                <strong>Email:</strong> {selectedAgentDetails.email}
              </Typography>
              <Typography>
                <strong>Date de naissance:</strong>{' '}
                {new Date(selectedAgentDetails.dateNaiss).toLocaleDateString()}
              </Typography>
              <Typography>
                <strong>Adresse:</strong> {selectedAgentDetails.adresse}
              </Typography>
              <Typography>
                <strong>Année du diplôme:</strong> {selectedAgentDetails.anneeDiplome}
              </Typography>
              <Typography>
                <strong>Diplômes:</strong> {selectedAgentDetails.diplomes}
              </Typography>
              <Typography>
                <strong>Établissement:</strong> {selectedAgentDetails.etablissement}
              </Typography>
              <Typography>
                <strong>Années d'expérience:</strong> {selectedAgentDetails.nombreAnneeExperience}
              </Typography>
              <Typography>
                <strong>Expérience professionnelle:</strong>{' '}
                {selectedAgentDetails.experienceProfessionnelle}
              </Typography>
              <Typography>
                <strong>Compétences:</strong> {selectedAgentDetails.competences}
              </Typography>
              <Typography>
                <strong>Certifications:</strong> {selectedAgentDetails.certification}
              </Typography>
              <Typography>
                <strong>Langues:</strong> {selectedAgentDetails.langues}
              </Typography>
            </Box>
          ) : (
            <Typography>Chargement des détails...</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAgentDialog(false)} variant="contained" color="primary">
            Fermer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog pour les notifications */}
      <Dialog open={openNotificationDialog} onClose={handleNotificationClose}>
        <DialogTitle>
          {notificationSeverity === 'success'
            ? 'Succès'
            : notificationSeverity === 'error'
            ? 'Erreur'
            : 'Avertissement'}
        </DialogTitle>
        <DialogContent>
          <Typography
            sx={{
              color:
                notificationSeverity === 'success'
                  ? 'green'
                  : notificationSeverity === 'error'
                  ? 'red'
                  : 'orange',
            }}
          >
            {notificationMessage}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleNotificationClose} variant="contained" color="primary">
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default EquipeSelector;