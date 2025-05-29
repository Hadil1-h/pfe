import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  TextField,
  Button,
  Typography,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import EquipeSelector from './EquipeSelector';
import axios from 'axios';

const EditProject = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statuts, setStatuts] = useState([]);
  const [types, setTypes] = useState([]);
  const [clients, setClients] = useState([]);
  const [equipes, setEquipes] = useState([]);
  const [agents, setAgents] = useState([]);
  const [selectedEquipeAgents, setSelectedEquipeAgents] = useState([]);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [loadingLists, setLoadingLists] = useState({
    statuts: true,
    types: true,
    clients: true,
    equipes: true,
    agents: true,
  });

  const fetchLatestTaskEndDate = async (projectId) => {
    try {
      const { data: tasks } = await axios.get(`http://localhost:8080/api/tasks?projectId=${projectId}`);
      const taskDates = tasks
        .filter(task => task.dateFin)
        .map(task => new Date(task.dateFin));
      return taskDates.length > 0 ? new Date(Math.max(...taskDates)).toISOString().split('T')[0] : null;
    } catch (error) {
      console.error(`Erreur lors de la récupération des tâches pour le projet ${projectId}:`, error);
      return null;
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const projectResponse = await axios.get(`http://localhost:8080/api/projects/${id}`);
        const projectData = projectResponse.data;

        const latestEndDate = await fetchLatestTaskEndDate(id);

        setProject({
          ...projectData,
          equipe: projectData.equipe?.id || '',
          statutProjet: projectData.statutProjet?.id || '',
          typeProjet: projectData.typeProjet?.id || '',
          client: projectData.client?.id || '',
          reference: projectData.reference || '',
          nomProjet: projectData.nomProjet || '',
          description: projectData.description || '',
          dateDebut: projectData.dateDebut || '',
          dateFin: latestEndDate || projectData.dateFin || '',
          budget: projectData.budget || '',
          archived: projectData.archived || false,
        });

        if (projectData.equipe?.id) {
          const equipeResponse = await axios.get(`http://localhost:8080/api/projects/${projectData.equipe.id}/equipe`);
          setSelectedEquipeAgents(equipeResponse.data.agents || []);
        }

        const [statutsRes, typesRes, clientsRes, equipesRes, agentsRes] = await Promise.all([
          axios.get('http://localhost:8080/api/statut-projets').then(res => res.data),
          axios.get('http://localhost:8080/api/type-projets').then(res => res.data),
          axios.get('http://localhost:8080/api/clients').then(res => {
            console.log('Clients fetched:', res.data); // Debug log
            return res.data;
          }),
          axios.get('http://localhost:8080/api/equipes').then(res => res.data),
          axios.get('http://localhost:8080/api/agents').then(res => res.data),
        ]);

        setStatuts(statutsRes);
        setTypes(typesRes);
        setClients(clientsRes);
        setEquipes(equipesRes);
        setAgents(agentsRes);

        if (clientsRes.length === 0) {
          setErrorMessage('Aucun client disponible. Veuillez ajouter des clients.');
          setErrorDialogOpen(true);
        }

        setLoadingLists({
          statuts: false,
          types: false,
          clients: false,
          equipes: false,
          agents: false,
        });
      } catch (error) {
        console.error('Error loading data:', error); // Debug log
        setErrorMessage(error.response?.data?.message || 'Erreur lors du chargement des données');
        setErrorDialogOpen(true);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  const handleEquipeChange = (equipeId) => {
    setProject(prev => ({ ...prev, equipe: equipeId }));
    if (equipeId && equipeId !== 'create') {
      const selectedEquipe = equipes.find(equipe => equipe.id === parseInt(equipeId));
      setSelectedEquipeAgents(selectedEquipe?.agents || []);
    } else {
      setSelectedEquipeAgents([]);
    }
  };

  const validateForm = async () => {
    const { dateDebut, budget, description, nomProjet, statutProjet, typeProjet, client, reference } = project;
    const errors = {};

    if (!reference) errors.reference = 'La référence est requise.';
    if (!nomProjet) errors.nomProjet = 'Le nom du projet est requis.';
    if (!description) errors.description = 'La description est requise.';
    if (!dateDebut) errors.dateDebut = 'La date de début est requise.';
    if (!statutProjet) errors.statutProjet = 'Le statut est requis.';
    if (!typeProjet) errors.typeProjet = 'Le type est requis.';
    if (!client) errors.client = 'Le client est requis.';

    if (reference && !/^[a-zA-Z0-9-]{1,20}$/.test(reference)) {
      errors.reference = 'La référence doit être alphanumérique (1-20 caractères, tirets autorisés).';
    }

    if (dateDebut && project.dateFin && new Date(project.dateFin) < new Date(dateDebut)) {
      errors.dateFin = 'La date de fin ne peut pas être antérieure à la date de début.';
    }

    if (budget) {
      const budgetValue = parseFloat(budget);
      if (isNaN(budgetValue) || budgetValue <= 0) {
        errors.budget = 'Le budget doit être un nombre positif supérieur à zéro.';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUpdate = async () => {
    const isValid = await validateForm();
    if (!isValid) {
      setErrorMessage('Veuillez corriger les erreurs dans le formulaire.');
      setErrorDialogOpen(true);
      return;
    }

    const dataToSend = {
      reference: project.reference,
      nomProjet: project.nomProjet,
      description: project.description,
      dateDebut: project.dateDebut,
      dateFin: project.dateFin || null,
      budget: project.budget ? parseFloat(project.budget) : null,
      statutProjet: { id: parseInt(project.statutProjet) },
      typeProjet: { id: parseInt(project.typeProjet) },
      client: { id: parseInt(project.client) },
      equipe: project.equipe ? { id: parseInt(project.equipe) } : null,
      archived: project.archived,
    };

    try {
      const response = await axios.put(`http://localhost:8080/api/projects/${id}`, dataToSend);
      setSuccessDialogOpen(true);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Une erreur est survenue lors de la mise à jour.');
      setErrorDialogOpen(true);
    }
  };

  const handleSuccessDialogClose = () => {
    setSuccessDialogOpen(false);
    navigate('/tableProject');
  };

  const handleErrorDialogClose = () => {
    setErrorDialogOpen(false);
    setErrorMessage('');
  };

  if (loading || !project) return <Typography>Chargement...</Typography>;

  return (
    <Container sx={{ mt: 4 }}>
      <Typography variant="h5" gutterBottom>Modifier le projet</Typography>

      <TextField
        fullWidth
        label="Référence"
        value={project.reference || ''}
        onChange={(e) => setProject({ ...project, reference: e.target.value })}
        sx={{ mb: 2 }}
        error={!!formErrors.reference}
        helperText={formErrors.reference}
        inputProps={{ maxLength: 20 }}
      />
      <TextField
        fullWidth
        label="Nom du projet"
        value={project.nomProjet || ''}
        onChange={(e) => setProject({ ...project, nomProjet: e.target.value })}
        sx={{ mb: 2 }}
        error={!!formErrors.nomProjet}
        helperText={formErrors.nomProjet}
      />
      <TextField
        fullWidth
        label="Description"
        value={project.description || ''}
        onChange={(e) => setProject({ ...project, description: e.target.value })}
        sx={{ mb: 2 }}
        error={!!formErrors.description}
        helperText={formErrors.description}
      />
      <TextField
        fullWidth
        type="date"
        label="Date de début"
        value={project.dateDebut || ''}
        onChange={(e) => setProject({ ...project, dateDebut: e.target.value })}
        sx={{ mb: 2 }}
        InputLabelProps={{ shrink: true }}
        error={!!formErrors.dateDebut}
        helperText={formErrors.dateDebut}
      />
      <TextField
        fullWidth
        type="date"
        label="Date de fin (facultatif)"
        value={project.dateFin || ''}
        onChange={(e) => setProject({ ...project, dateFin: e.target.value })}
        sx={{ mb: 2 }}
        InputLabelProps={{ shrink: true }}
        error={!!formErrors.dateFin}
        helperText={formErrors.dateFin}
      />
      <TextField
        fullWidth
        type="number"
        label="Budget (facultatif)"
        value={project.budget || ''}
        onChange={(e) => setProject({ ...project, budget: e.target.value })}
        sx={{ mb: 2 }}
        error={!!formErrors.budget}
        helperText={formErrors.budget}
      />
      <FormControlLabel
        control={
          <Checkbox
            checked={project.archived || false}
            onChange={(e) => setProject({ ...project, archived: e.target.checked })}
          />
        }
        label="Archivé"
        sx={{ mb: 2 }}
      />

      <FormControl fullWidth sx={{ mb: 2 }} error={!!formErrors.statutProjet}>
        <InputLabel>Statut</InputLabel>
        <Select
          value={project.statutProjet || ''}
          onChange={(e) => setProject({ ...project, statutProjet: e.target.value })}
        >
          {loadingLists.statuts ? (
            <MenuItem disabled><CircularProgress size={20} /></MenuItem>
          ) : (
            statuts.map((statut) => (
              <MenuItem key={statut.id} value={statut.id}>
                {statut.nom}
              </MenuItem>
            ))
          )}
        </Select>
        {formErrors.statutProjet && <Typography color="error">{formErrors.statutProjet}</Typography>}
      </FormControl>

      <FormControl fullWidth sx={{ mb: 2 }} error={!!formErrors.typeProjet}>
        <InputLabel>Type</InputLabel>
        <Select
          value={project.typeProjet || ''}
          onChange={(e) => setProject({ ...project, typeProjet: e.target.value })}
        >
          {loadingLists.types ? (
            <MenuItem disabled><CircularProgress size={20} /></MenuItem>
          ) : (
            types.map((type) => (
              <MenuItem key={type.id} value={type.id}>
                {type.nom}
              </MenuItem>
            ))
          )}
        </Select>
        {formErrors.typeProjet && <Typography color="error">{formErrors.typeProjet}</Typography>}
      </FormControl>

      <FormControl fullWidth sx={{ mb: 2 }} error={!!formErrors.client}>
        <InputLabel>Client</InputLabel>
        <Select
          value={project.client || ''}
          onChange={(e) => setProject({ ...project, client: e.target.value })}
        >
          {loadingLists.clients ? (
            <MenuItem disabled><CircularProgress size={20} /></MenuItem>
          ) : clients.length === 0 ? (
            <MenuItem disabled>Aucun client disponible</MenuItem>
          ) : (
            clients.map((client) => (
              <MenuItem key={client.id} value={client.id}>
                {client.nom}
              </MenuItem>
            ))
          )}
        </Select>
        {formErrors.client && <Typography color="error">{formErrors.client}</Typography>}
      </FormControl>

      <EquipeSelector
        equipes={equipes}
        setEquipes={setEquipes}
        agents={agents}
        selectedEquipeId={project.equipe}
        onEquipeChange={handleEquipeChange}
        setSelectedEquipeAgents={setSelectedEquipeAgents}
        loading={loadingLists.equipes}
      />

      {selectedEquipeAgents.length > 0 && (
        <Box sx={{ mt: 2, mb: 2 }}>
          <Typography variant="subtitle1">Agents de l'équipe sélectionnée :</Typography>
          <ul>
            {selectedEquipeAgents.map(agent => (
              <li key={agent.id}>{`${agent.prenom} ${agent.nom}`}</li>
            ))}
          </ul>
        </Box>
      )}

      <Button variant="contained" onClick={handleUpdate} disabled={loading}>
        Enregistrer
      </Button>

      <Dialog open={successDialogOpen} onClose={handleSuccessDialogClose}>
        <DialogTitle>Succès</DialogTitle>
        <DialogContent>
          <Typography>Projet modifié avec succès !</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSuccessDialogClose} color="primary">
            Fermer
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={errorDialogOpen} onClose={handleErrorDialogClose}>
        <DialogTitle>Erreur</DialogTitle>
        <DialogContent>
          <Typography>{errorMessage}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleErrorDialogClose} color="primary">
            Fermer
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default EditProject;