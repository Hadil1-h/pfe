import React, { useState, useEffect, useContext } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress, Box,
  Container, Button, Dialog, DialogActions, DialogContent, DialogTitle, Snackbar,
  Typography, Alert, IconButton, Autocomplete, Chip, Select, MenuItem, FormControl, InputLabel,
  TextField
} from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import CreateTaskPopup from './CreateTaskPopup';
import EditTaskPopup from './EditTaskPopup';
import { AuthContext } from '../context/AuthContext';

const TaskTable = () => {
  const { user } = useContext(AuthContext);
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [agents, setAgents] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [projects, setProjects] = useState([]);
  const [filterField, setFilterField] = useState('');
  const [filterValue, setFilterValue] = useState(null);
  const [priorities, setPriorities] = useState([]);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [tempFilterField, setTempFilterField] = useState('');
  const [tempFilterValue, setTempFilterValue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingAgents, setLoadingAgents] = useState(true);
  const [loadingStatuses, setLoadingStatuses] = useState(true);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [error, setError] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);

  const filterFields = [
    { value: 'project', label: 'Projet' },
    { value: 'status', label: 'Statut' },
    { value: 'priority', label: 'Priorité' },
    { value: 'assignee', label: 'Assigné' },
    { value: 'title', label: 'Titre' },
    { value: 'description', label: 'Description' },
    { value: 'startDate', label: 'Date de début' },
    { value: 'endDate', label: 'Date de fin' },
    { value: 'progress', label: 'Avancement (%)' },
  ];

  const fetchStatuses = async () => {
    setLoadingStatuses(true);
    try {
      const res = await fetch('http://localhost:8080/api/statuts');
      if (!res.ok) throw new Error(`Erreur HTTP: ${res.status}`);
      const data = await res.json();
      setStatuses(data);
    } catch (err) {
      setError({ message: `Erreur lors de la récupération des statuts: ${err.message}` });
    } finally {
      setLoadingStatuses(false);
    }
  };

  const fetchAgents = async () => {
    setLoadingAgents(true);
    try {
      const res = await fetch('http://localhost:8080/api/agents');
      if (!res.ok) throw new Error(`Erreur HTTP: ${res.status}`);
      const data = await res.json();
      setAgents(data);
    } catch (err) {
      setError({ message: `Erreur lors de la récupération des agents: ${err.message}` });
    } finally {
      setLoadingAgents(false);
    }
  };

  const fetchProjects = async () => {
    setLoadingProjects(true);
    try {
      const res = await fetch('http://localhost:8080/api/projects');
      if (!res.ok) throw new Error(`Erreur HTTP: ${res.status}`);
      const data = await res.json();
      setProjects(data);
    } catch (err) {
      setError({ message: `Erreur lors de la récupération des projets: ${err.message}` });
    } finally {
      setLoadingProjects(false);
    }
  };

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8080/api/tasks');
      if (!res.ok) throw new Error(res.statusText);
      const data = await res.json();
      const sortedTasks = data.sort((a, b) => b.id - a.id);
      setTasks(sortedTasks);
      const uniquePriorities = [...new Set(sortedTasks.map(task => task.periorite).filter(p => p))];
      setPriorities(uniquePriorities);
      if (user && user.typeUtilisateur?.toLowerCase() === 'agent') {
        setFilteredTasks(sortedTasks.filter(task => task.assigne === String(user.id)));
      } else {
        setFilteredTasks(sortedTasks);
      }
    } catch (err) {
      setError({ message: 'Erreur lors de la récupération des tâches.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([fetchStatuses(), fetchAgents(), fetchProjects(), fetchTasks()]);
      } catch (err) {
        console.error('Erreur lors du chargement des données:', err);
      }
    };
    loadData();
  }, [user]);

  useEffect(() => {
    let filtered = [...tasks];

    if (user && user.typeUtilisateur?.toLowerCase() === 'agent') {
      filtered = filtered.filter(task => task.assigne === String(user.id));
    }

    if (filterField && filterValue !== null) {
      switch (filterField) {
        case 'project':
          filtered = filtered.filter(task => task.idProjet === Number(filterValue.id));
          break;
        case 'status':
          filtered = filtered.filter(task => task.idStatutTache === Number(filterValue.id));
          break;
        case 'priority':
          filtered = filtered.filter(task => task.periorite === filterValue);
          break;
        case 'assignee':
          filtered = filtered.filter(task => task.assigne === String(filterValue.id));
          break;
        case 'title':
          filtered = filtered.filter(task => task.titre?.toLowerCase().includes(filterValue.toLowerCase()));
          break;
        case 'description':
          filtered = filtered.filter(task => task.descriptionTache?.toLowerCase().includes(filterValue.toLowerCase()));
          break;
        case 'startDate':
          filtered = filtered.filter(task => task.dateDebut && new Date(task.dateDebut) >= new Date(filterValue));
          break;
        case 'endDate':
          filtered = filtered.filter(task => task.dateFin && new Date(task.dateFin) <= new Date(filterValue));
          break;
        case 'progress':
          filtered = filtered.filter(task => task.avancement !== null && Math.round(task.avancement * 100) === Number(filterValue));
          break;
        default:
          break;
      }
    }

    setFilteredTasks(filtered.sort((a, b) => b.id - a.id));
  }, [filterField, filterValue, tasks, user]);

  const getAgentName = (agentId) => {
    const agent = agents.find(agent => agent.id === Number(agentId));
    return agent ? `${agent.prenom} ${agent.nom}` : 'Non spécifié';
  };

  const getStatusName = (statusId) => {
    const status = statuses.find(status => status.id === Number(statusId));
    return status ? status.nomStatut : 'Non spécifié';
  };

  const getProjectName = (projectId) => {
    const project = projects.find(project => project.id === Number(projectId));
    return project ? project.nomProjet : 'Non spécifié';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Non spécifié';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatAvancement = (avancement) => {
    if (avancement === null || avancement === undefined) return '0%';
    return `${Math.round(avancement * 100)}%`;
  };

  const getFilterDisplayValue = () => {
    if (!filterField || filterValue === null) return '';
    switch (filterField) {
      case 'project':
        return `Projet: ${filterValue.nomProjet}`;
      case 'status':
        return `Statut: ${filterValue.nomStatut}`;
      case 'priority':
        return `Priorité: ${filterValue}`;
      case 'assignee':
        return `Assigné: ${getAgentName(filterValue.id)}`;
      case 'title':
        return `Titre: ${filterValue}`;
      case 'description':
        return `Description: ${filterValue}`;
      case 'startDate':
        return `Date de début: ${formatDate(filterValue)}`;
      case 'endDate':
        return `Date de fin: ${formatDate(filterValue)}`;
      case 'progress':
        return `Avancement: ${filterValue}%`;
      default:
        return '';
    }
  };

  const handleCreateTask = () => {
    setCreateDialogOpen(true);
  };

  const handleCreateDialogClose = () => {
    setCreateDialogOpen(false);
  };

  const handleTaskCreated = async () => {
    await fetchTasks();
    setSnackbar({ open: true, message: 'Tâche créée avec succès.', severity: 'success' });
  };

  const handleEditTask = (task) => {
    setTaskToEdit(task);
    setEditDialogOpen(true);
  };

  const handleEditDialogClose = () => {
    setEditDialogOpen(false);
    setTaskToEdit(null);
  };

  const handleTaskEdited = async () => {
    await fetchTasks();
    setSnackbar({ open: true, message: 'Tâche modifiée avec succès.', severity: 'success' });
    handleEditDialogClose();
  };

  const handleDeleteClick = (task) => {
    setTaskToDelete(task);
    setDeleteDialogOpen(true);
  };

  const handleDeleteTask = async () => {
    if (!taskToDelete) return;
    try {
      const res = await fetch(`http://localhost:8080/api/tasks/${taskToDelete.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('Échec de la suppression de la tâche');
      setSnackbar({ open: true, message: 'Tâche supprimée avec succès.', severity: 'success' });
      await fetchTasks();
    } catch (err) {
      setSnackbar({ open: true, message: `Erreur lors de la suppression: ${err.message}`, severity: 'error' });
    } finally {
      setDeleteDialogOpen(false);
      setTaskToDelete(null);
    }
  };

  const handleFilterDialogOpen = () => {
    setFilterDialogOpen(true);
    setTempFilterField(filterField);
    setTempFilterValue(filterValue);
  };

  const handleFilterDialogClose = () => {
    setFilterDialogOpen(false);
  };

  const handleApplyFilter = () => {
    setFilterField(tempFilterField);
    setFilterValue(tempFilterValue);
    setFilterDialogOpen(false);
    setSnackbar({ open: true, message: 'Filtre appliqué.', severity: 'success' });
  };

  const handleClearFilters = () => {
    setFilterField('');
    setFilterValue(null);
    setTempFilterField('');
    setTempFilterValue(null);
    if (user && user.typeUtilisateur?.toLowerCase() === 'agent') {
      setFilteredTasks(tasks.filter(task => task.assigne === String(user.id)));
    } else {
      setFilteredTasks([...tasks]);
    }
    setFilterDialogOpen(false);
    setSnackbar({ open: true, message: 'Filtres réinitialisés.', severity: 'success' });
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (!user) {
    return (
      <Container sx={{ paddingTop: '70px', textAlign: 'center' }}>
        <Typography variant="h5" color="error">
          Veuillez vous connecter pour accéder à vos tâches.
        </Typography>
      </Container>
    );
  }

  if (!['agent', 'admin'].includes(user.typeUtilisateur?.toLowerCase())) {
    return (
      <Container sx={{ paddingTop: '70px', textAlign: 'center' }}>
        <Typography variant="h5" color="error">
          Accès réservé aux agents et administrateurs.
        </Typography>
      </Container>
    );
  }

  return (
    <Container sx={{ paddingTop: '70px' }}>
      <Box sx={{ marginBottom: '20px' }}>
        <Box sx={{ display: 'flex', gap: 2, marginBottom: '20px' }}>
          <Button
            variant="contained"
            sx={{
              backgroundColor: '#1e3a5f',
              '&:hover': { backgroundColor: '#152a4a' },
              minWidth: 120,
            }}
            onClick={handleCreateTask}
          >
            Créer une tâche
          </Button>
          <Button
            variant="contained"
            sx={{
              backgroundColor: '#1e3a5f',
              '&:hover': { backgroundColor: '#152a4a' },
              minWidth: 120,
            }}
            onClick={handleFilterDialogOpen}
          >
            Filtrer
          </Button>
          <Button
            variant="outlined"
            sx={{
              color: '#1e3a5f',
              borderColor: '#1e3a5f',
              '&:hover': { borderColor: '#152a4a' },
            }}
            onClick={handleClearFilters}
          >
            Réinitialiser les filtres
          </Button>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {filterField && filterValue !== null && (
            <Chip
              label={getFilterDisplayValue()}
              onDelete={() => {
                setFilterField('');
                setFilterValue(null);
              }}
              sx={{ backgroundColor: '#1e3a5f', color: 'white' }}
            />
          )}
        </Box>
      </Box>

      {loading || loadingAgents || loadingStatuses || loadingProjects ? (
        <Box display="flex" justifyContent="center">
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error.message}</Alert>
      ) : filteredTasks.length === 0 ? (
        <Typography sx={{ textAlign: 'center', color: '#666' }}>
          Aucune tâche assignée.
        </Typography>
      ) : (
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nom du projet</TableCell>
                <TableCell>Titre</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Statut</TableCell>
                <TableCell>Priorité</TableCell>
                <TableCell>Assigné</TableCell>
                <TableCell>Date de début</TableCell>
                <TableCell>Date de fin</TableCell>
                <TableCell>Avancement</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTasks.map(task => (
                <TableRow key={task.id}>
                  <TableCell>{getProjectName(task.idProjet)}</TableCell>
                  <TableCell>{task.titre}</TableCell>
                  <TableCell>{task.descriptionTache}</TableCell>
                  <TableCell>{getStatusName(task.idStatutTache)}</TableCell>
                  <TableCell>{task.periorite || 'Non spécifié'}</TableCell>
                  <TableCell>{getAgentName(task.assigne)}</TableCell>
                  <TableCell>{formatDate(task.dateDebut)}</TableCell>
                  <TableCell>{formatDate(task.dateFin)}</TableCell>
                  <TableCell>{formatAvancement(task.avancement)}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton
                        color="error"
                        onClick={() => handleDeleteClick(task)}
                        title="Supprimer"
                      >
                        <DeleteIcon />
                      </IconButton>
                      <IconButton
                        color="primary"
                        onClick={() => handleEditTask(task)}
                        title="Modifier"
                      >
                        <EditIcon />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={createDialogOpen} onClose={handleCreateDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>Créer une nouvelle tâche</DialogTitle>
        <CreateTaskPopup
          onClose={handleCreateDialogClose}
          onTaskCreated={handleTaskCreated}
          agents={agents}
          statuses={statuses}
          projects={projects}
        />
      </Dialog>

      <Dialog open={editDialogOpen} onClose={handleEditDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>Modifier la tâche</DialogTitle>
        <EditTaskPopup
          task={taskToEdit}
          onClose={handleEditDialogClose}
          onTaskEdited={handleTaskEdited}
          agents={agents}
          statuses={statuses}
          projects={projects}
        />
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography>
            Êtes-vous sûr de vouloir supprimer la tâche "{taskToDelete?.titre}" ? Cette action est irréversible.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} color="primary">
            Annuler
          </Button>
          <Button onClick={handleDeleteTask} color="error" variant="contained">
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={filterDialogOpen} onClose={handleFilterDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>Appliquer un filtre</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ marginBottom: 2 }}>
            <InputLabel>Type de filtre</InputLabel>
            <Select
              value={tempFilterField}
              onChange={(e) => {
                setTempFilterField(e.target.value);
                setTempFilterValue(null);
              }}
              label="Type de filtre"
            >
              <MenuItem value="">Sélectionner un type</MenuItem>
              {filterFields.map(field => (
                <MenuItem key={field.value} value={field.value}>{field.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          {tempFilterField === 'project' && (
            <Autocomplete
              options={projects}
              getOptionLabel={(option) => option.nomProjet || ''}
              value={tempFilterValue}
              onChange={(e, newValue) => setTempFilterValue(newValue)}
              renderInput={(params) => (
                <TextField {...params} label="Rechercher un projet" variant="outlined" />
              )}
              sx={{ marginBottom: 2 }}
            />
          )}
          {tempFilterField === 'status' && (
            <Autocomplete
              options={statuses}
              getOptionLabel={(option) => option.nomStatut || ''}
              value={tempFilterValue}
              onChange={(e, newValue) => setTempFilterValue(newValue)}
              renderInput={(params) => (
                <TextField {...params} label="Rechercher un statut" variant="outlined" />
              )}
              sx={{ marginBottom: 2 }}
            />
          )}
          {tempFilterField === 'priority' && (
            <Autocomplete
              options={priorities}
              getOptionLabel={(option) => option || ''}
              value={tempFilterValue}
              onChange={(e, newValue) => setTempFilterValue(newValue)}
              renderInput={(params) => (
                <TextField {...params} label="Rechercher une priorité" variant="outlined" />
              )}
              sx={{ marginBottom: 2 }}
            />
          )}
          {tempFilterField === 'assignee' && (
            <Autocomplete
              options={agents}
              getOptionLabel={(option) => (option ? `${option.prenom} ${option.nom}` : '')}
              value={tempFilterValue}
              onChange={(e, newValue) => setTempFilterValue(newValue)}
              renderInput={(params) => (
                <TextField {...params} label="Rechercher un agent" variant="outlined" />
              )}
              sx={{ marginBottom: 2 }}
            />
          )}
          {tempFilterField === 'title' && (
            <TextField
              label="Titre"
              value={tempFilterValue || ''}
              onChange={(e) => setTempFilterValue(e.target.value)}
              variant="outlined"
              fullWidth
              sx={{ marginBottom: 2 }}
            />
          )}
          {tempFilterField === 'description' && (
            <TextField
              label="Description"
              value={tempFilterValue || ''}
              onChange={(e) => setTempFilterValue(e.target.value)}
              variant="outlined"
              fullWidth
              sx={{ marginBottom: 2 }}
            />
          )}
          {tempFilterField === 'startDate' && (
            <TextField
              label="Date de début"
              type="date"
              value={tempFilterValue || ''}
              onChange={(e) => setTempFilterValue(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
              sx={{ marginBottom: 2 }}
            />
          )}
          {tempFilterField === 'endDate' && (
            <TextField
              label="Date de fin"
              type="date"
              value={tempFilterValue || ''}
              onChange={(e) => setTempFilterValue(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
              sx={{ marginBottom: 2 }}
            />
          )}
          {tempFilterField === 'progress' && (
            <TextField
              label="Avancement (%)"
              type="number"
              value={tempFilterValue || ''}
              onChange={(e) => setTempFilterValue(e.target.value)}
              inputProps={{ min: 0, max: 100 }}
              variant="outlined"
              fullWidth
              sx={{ marginBottom: 2 }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleClearFilters}
            sx={{ color: '#1e3a5f', borderColor: '#1e3a5f' }}
            variant="outlined"
          >
            Réinitialiser
          </Button>
          <Button onClick={handleFilterDialogClose} color="primary">
            Annuler
          </Button>
          <Button
            onClick={handleApplyFilter}
            variant="contained"
            sx={{ backgroundColor: '#1e3a5f', '&:hover': { backgroundColor: '#152a4a' } }}
            disabled={!tempFilterField || tempFilterValue === null || tempFilterValue === ''}
          >
            Appliquer
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={handleSnackbarClose}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default TaskTable;