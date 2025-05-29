import React, { useState, useEffect } from 'react';
import {
  TextField,
  Button,
  Container,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import EquipeSelector from './EquipeSelector';
import CreateTaskPopup from './CreateTaskPopup';

const CreateProject = () => {
  const [projectData, setProjectData] = useState({
    reference: '',
    nomProjet: '',
    description: '',
    dateDebut: '',
    dateFin: '',
    budget: '',
    statutProjet: '',
    client: '',
    typeProjet: '',
    equipe: '',
  });

  const [statuses, setStatuses] = useState([]);
  const [taskStatuses, setTaskStatuses] = useState([]);
  const [clients, setClients] = useState([]);
  const [types, setTypes] = useState([]);
  const [equipes, setEquipes] = useState([]);
  const [selectedEquipeAgents, setSelectedEquipeAgents] = useState([]);
  const [agents, setAgents] = useState([]);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [taskPopupOpen, setTaskPopupOpen] = useState(false);
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [createdProjectId, setCreatedProjectId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const navigate = useNavigate();

  const fetchData = async (url, setData) => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Erreur HTTP : ${response.status}`);
      const data = await response.json();
      setData(data);
    } catch (error) {
      console.error(`Erreur lors de la récupération des données (${url}):`, error);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/projects');
      if (!response.ok) throw new Error(`Erreur HTTP : ${response.status}`);
      const data = await response.json();
      const currentYear = new Date().getFullYear();
      const projectsInYear = data.filter(project =>
        project.reference?.startsWith(`${currentYear}-proj-`)
      );
      const projectCount = projectsInYear.length + 1;
      const newReference = `${currentYear}-proj-${String(projectCount).padStart(3, '0')}`;
      setProjectData(prev => ({ ...prev, reference: newReference }));
    } catch (error) {
      console.error('Erreur lors de la récupération des projets existants:', error);
      const currentYear = new Date().getFullYear();
      const fallbackReference = `${currentYear}-proj-001`;
      setProjectData(prev => ({ ...prev, reference: fallbackReference }));
      setErrorMessage('Référence générée localement en raison d’une erreur serveur.');
      setErrorDialogOpen(true);
    }
  };

  const fetchAgents = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/agents');
      if (!response.ok) throw new Error(`Erreur HTTP : ${response.status}`);
      const data = await response.json();
      setAgents(data);
    } catch (error) {
      console.error('Erreur lors de la récupération des agents:', error);
    }
  };

  useEffect(() => {
    const fetchAllData = async () => {
      setIsLoading(true);
      await Promise.all([
        fetchData('http://localhost:8080/api/statut-projets', setStatuses),
        fetchData('http://localhost:8080/api/statut-taches', setTaskStatuses),
        fetchData('http://localhost:8080/api/clients', setClients),
        fetchData('http://localhost:8080/api/type-projets', setTypes),
        fetchData('http://localhost:8080/api/equipes', setEquipes),
        fetchAgents(),
        fetchProjects(),
      ]);
      setIsLoading(false);
    };
    fetchAllData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProjectData(prevState => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleEquipeChange = (equipeId) => {
    setProjectData(prev => ({ ...prev, equipe: equipeId }));
    if (equipeId && equipeId !== 'create') {
      const selectedEquipe = equipes.find(equipe => equipe.id === parseInt(equipeId));
      setSelectedEquipeAgents(selectedEquipe?.agents || []);
    } else {
      setSelectedEquipeAgents([]);
    }
  };

  const validateForm = () => {
    const { dateDebut, budget, description, nomProjet, statutProjet, typeProjet, client } = projectData;

    if (!nomProjet || !description || !dateDebut || !statutProjet || !typeProjet || !client) {
      setErrorMessage('Veuillez remplir tous les champs obligatoires (sauf date de fin et budget).');
      return false;
    }

    if (nomProjet.length > 100) {
      setErrorMessage('Le nom du projet ne peut pas dépasser 100 caractères.');
      return false;
    }

    if (description.length > 100) {
      setErrorMessage('La description ne peut pas dépasser 100 caractères.');
      return false;
    }

    if (dateDebut && projectData.dateFin && new Date(projectData.dateFin) < new Date(dateDebut)) {
      setErrorMessage('La date de fin ne peut pas être antérieure à la date de début.');
      return false;
    }

    if (budget) {
      const budgetValue = parseFloat(budget);
      if (isNaN(budgetValue) || budgetValue <= 0) {
        setErrorMessage('Le budget, s’il est fourni, doit être un nombre positif supérieur à zéro.');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!projectData.reference) {
      setErrorMessage('Erreur : la référence du projet n’a pas pu être générée.');
      setErrorDialogOpen(true);
      return;
    }

    if (!validateForm()) {
      setErrorDialogOpen(true);
      return;
    }

    const dataToSend = {
      nomProjet: projectData.nomProjet,
      description: projectData.description,
      dateDebut: projectData.dateDebut,
      dateFin: projectData.dateFin || null,
      budget: projectData.budget ? parseFloat(projectData.budget) : null,
      reference: projectData.reference,
      client: { id: parseInt(projectData.client) },
      statutProjet: { id: parseInt(projectData.statutProjet) },
      typeProjet: { id: parseInt(projectData.typeProjet) },
      equipe: projectData.equipe ? { id: parseInt(projectData.equipe) } : null,
    };

    try {
      const response = await fetch('http://localhost:8080/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la création du projet');
      }

      const createdProject = await response.json();
      setCreatedProjectId(createdProject.id);
      setSuccessDialogOpen(true);
      setProjectData({
        reference: '',
        nomProjet: '',
        description: '',
        dateDebut: '',
        dateFin: '',
        budget: '',
        statutProjet: '',
        client: '',
        typeProjet: '',
        equipe: '',
      });
      setSelectedEquipeAgents([]);
      await fetchProjects();
    } catch (error) {
      console.error('Erreur:', error);
      setErrorMessage(error.message);
      setErrorDialogOpen(true);
    }
  };

  const handleSuccessDialogClose = () => {
    setSuccessDialogOpen(false);
    setTaskDialogOpen(true);
  };

  const handleTaskDialogClose = (createTasks) => {
    setTaskDialogOpen(false);
    if (createTasks && createdProjectId) {
      setTaskPopupOpen(true);
    } else {
      navigate('/TableProject');
    }
  };

  const handleTaskPopupClose = () => {
    setTaskPopupOpen(false);
    navigate('/TableProject');
  };

  const handleTaskCreated = (task) => {
    console.log('Tâche créée:', task);
  };

  const handleErrorDialogClose = () => {
    setErrorDialogOpen(false);
    setErrorMessage('');
  };

  return (
    <Container>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h2>Créer un projet</h2>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', width: '100%', mb: 2 }}>
          <Button
            variant="outlined"
            sx={{
              color: '#1e3a5f',
              borderColor: '#1e3a5f',
              '&:hover': { borderColor: '#152a4a' },
              minWidth: 120,
            }}
            onClick={() => navigate('/TableProject')}
          >
            Retour
          </Button>
        </Box>
        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              label="Nom du projet"
              name="nomProjet"
              value={projectData.nomProjet}
              onChange={handleChange}
              sx={{ flex: 1 }}
              required
              inputProps={{ maxLength: 100 }}
              helperText={`${projectData.nomProjet.length}/100 caractères`}
            />
            <TextField
              label="Description"
              name="description"
              value={projectData.description}
              onChange={handleChange}
              sx={{ flex: 1 }}
              required
              inputProps={{ maxLength: 100 }}
              helperText={`${projectData.description.length}/100 caractères`}
            />
          </Box>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              label="Date de début"
              name="dateDebut"
              type="date"
              value={projectData.dateDebut}
              onChange={handleChange}
              sx={{ flex: 1 }}
              required
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Date de fin (facultatif)"
              name="dateFin"
              type="date"
              value={projectData.dateFin}
              onChange={handleChange}
              sx={{ flex: 1 }}
              InputLabelProps={{ shrink: true }}
            />
          </Box>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <FormControl sx={{ flex: 1 }} required>
              <InputLabel>Type de projet</InputLabel>
              <Select
                value={projectData.typeProjet}
                onChange={handleChange}
                name="typeProjet"
              >
                {types.map(t => (
                  <MenuItem key={t.id} value={t.id}>
                    {t.nom}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl sx={{ flex: 1 }} required>
              <InputLabel>Client</InputLabel>
              <Select
                value={projectData.client}
                onChange={handleChange}
                name="client"
              >
                {clients.map(c => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.nom}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              label="Budget (facultatif)"
              name="budget"
              type="number"
              value={projectData.budget}
              onChange={handleChange}
              sx={{ flex: 1 }}
            />
            <FormControl sx={{ flex: 1 }} required>
              <InputLabel>Statut</InputLabel>
              <Select
                value={projectData.statutProjet}
                onChange={handleChange}
                name="statutProjet"
              >
                {statuses.map(s => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.nom}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ mb: 2 }}>
            <EquipeSelector
              equipes={equipes}
              setEquipes={setEquipes}
              agents={agents}
              selectedEquipeId={projectData.equipe}
              onEquipeChange={handleEquipeChange}
              setSelectedEquipeAgents={setSelectedEquipeAgents}
            />
          </Box>
          {selectedEquipeAgents.length > 0 && (
            <Box sx={{ marginTop: '16px', mb: 2 }}>
              <h4>Agents de l'équipe sélectionnée :</h4>
              <List>
                {selectedEquipeAgents.map(agent => (
                  <ListItem key={agent.id}>
                    <ListItemText
                      primary={`${agent.prenom} ${agent.nom}`}
                      secondary={agent.email}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, gap: 2 }}>
            <Button
              variant="contained"
              sx={{
                backgroundColor: '#1e3a5f',
                '&:hover': { backgroundColor: '#152a4a' },
                minWidth: 120,
              }}
              type="submit"
              disabled={isLoading}
            >
              Créer le projet
            </Button>
          </Box>
        </form>
      </Box>
      <Dialog open={successDialogOpen} onClose={handleSuccessDialogClose}>
        <DialogTitle>Succès</DialogTitle>
        <DialogContent>
          <Typography>Projet créé avec succès !</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSuccessDialogClose} color="primary">
            Continuer
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={taskDialogOpen} onClose={() => handleTaskDialogClose(false)}>
        <DialogTitle>Création des tâches</DialogTitle>
        <DialogContent>
          <Typography>Voulez-vous créer des tâches pour ce projet maintenant ?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleTaskDialogClose(false)} color="primary">
            Non, retourner à la liste
          </Button>
          <Button onClick={() => handleTaskDialogClose(true)} color="primary">
            Oui, créer des tâches
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={taskPopupOpen} onClose={handleTaskPopupClose}>
        <CreateTaskPopup
          onClose={handleTaskPopupClose}
          onTaskCreated={handleTaskCreated}
          statuses={taskStatuses}
          preSelectedProjectId={createdProjectId}
        />
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

export default CreateProject;