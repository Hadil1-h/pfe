import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { tokens } from '../theme';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';

const AddTask = ({ onTaskAdded }) => {
  const navigate = useNavigate();
  const { palette: { mode } } = useTheme();
  const colors = tokens(mode);

  const [task, setTask] = useState({
    idProjet: '',
    titre: '',
    descriptionTache: '',
    periorite: '',
    effortMax: '',
    prix: '',
    duree: '',
    dateDebut: '',
    dateFin: '',
    assigne: '',
  });
  const [openDialog, setOpenDialog] = useState(false);
  const [projects, setProjects] = useState([]);
  const [equipe, setEquipe] = useState(null);
  const [agents, setAgents] = useState([]);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    axios
      .get('http://localhost:8080/api/projects')
      .then(({ data }) => {
        const filteredProjects = data.filter((p) =>
          ['en cours', 'en attente', 'suspendu'].includes(p.statutProjet?.nom?.toLowerCase())
        );
        setProjects(filteredProjects);
      })
      .catch((err) => {
        setError(`Erreur lors du chargement des projets : ${err.message}`);
        console.error('Erreur projets :', err);
      });
  }, []);

  const fetchEquipeAndAgents = async (id) => {
    try {
      const { data: project } = await axios.get(`http://localhost:8080/api/projects/${id}`);
      if (project.equipe?.id) {
        const { data: equipeData } = await axios.get(
          `http://localhost:8080/api/equipes/${project.equipe.id}`
        );
        setEquipe(equipeData);
        setAgents(equipeData.agents || []);
      } else {
        setEquipe(null);
        setAgents([]);
      }
    } catch (err) {
      setError(`Erreur lors du chargement de l'équipe ou des agents : ${err.message}`);
      console.error('Erreur équipe/agents :', err);
    }
  };

  const handleChange = ({ target: { name, value } }) => {
    setTask((prev) => {
      let updatedTask = { ...prev, [name]: value };

      if (name === 'idProjet' && value) {
        fetchEquipeAndAgents(value);
        return { ...updatedTask, assigne: '', prix: '' };
      }

      if (name === 'assigne') {
        if (!agents.length) {
          setError('Aucun agent disponible. Veuillez sélectionner un projet valide.');
          return { ...updatedTask, prix: '' };
        }

        const selectedAgent = agents.find((a) => a.id === parseInt(value));
        if (!selectedAgent && value) {
          setError('Agent non trouvé dans l\'équipe.');
          return { ...updatedTask, prix: '' };
        }

        const salaire = selectedAgent?.salaire
          ? parseFloat(selectedAgent.salaire).toFixed(2)
          : '';
        if (!salaire && value) {
          setError('Le salaire de l\'agent n\'est pas défini.');
          return { ...updatedTask, prix: '' };
        }

        setError(null);
        return { ...updatedTask, prix: salaire };
      }

      setError(null);
      return updatedTask;
    });
  };

  const validateForm = () => {
    const checks = [
      [!task.idProjet, 'Le projet est requis.'],
      [!task.titre, 'Le titre est requis.'],
      [!task.periorite, 'La priorité est requise.'],
      [!task.duree || parseInt(task.duree) <= 0, 'La durée doit être supérieure à 0.'],
      [!task.effortMax || parseInt(task.effortMax) <= 0, 'L\'effort maximum doit être supérieur à 0.'],
      [!task.prix || parseFloat(task.prix) < 0, 'Le prix doit être un nombre non négatif.'],
      [
        task.dateDebut && task.dateFin && new Date(task.dateFin) <= new Date(task.dateDebut),
        'La date de fin doit être après la date de début.',
      ],
    ];
    const err = checks.find(([c]) => c)?.[1];
    setError(err || null);
    return !err;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const taskData = {
      idProjet: parseInt(task.idProjet),
      titre: task.titre,
      descriptionTache: task.descriptionTache || null,
      periorite: task.periorite,
      effortMax: parseInt(task.effortMax),
      prix: parseFloat(task.prix),
      duree: parseInt(task.duree),
      dateDebut: task.dateDebut || null,
      dateFin: task.dateFin || null,
      assigne: task.assigne ? parseInt(task.assigne) : null,
    };

    console.log('Données envoyées au backend :', taskData);

    try {
      const response = await axios.post('http://localhost:8080/api/tasks', taskData);
      setSnackbar({ open: true, message: 'Tâche ajoutée avec succès', severity: 'success' });
      setOpenDialog(false);
      setTask({
        idProjet: '',
        titre: '',
        descriptionTache: '',
        periorite: '',
        effortMax: '',
        prix: '',
        duree: '',
        dateDebut: '',
        dateFin: '',
        assigne: '',
      });
      setEquipe(null);
      setAgents([]);
      if (onTaskAdded) {
        onTaskAdded(response.data);
      }
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message;
      setError(`Erreur lors de l'ajout de la tâche : ${errorMessage}`);
      setSnackbar({ open: true, message: `Erreur : ${errorMessage}`, severity: 'error' });
      console.error('Erreur complète :', err.response || err);
    }
  };

  const resetForm = () => {
    setOpenDialog(false);
    setTask({
      idProjet: '',
      titre: '',
      descriptionTache: '',
      periorite: '',
      effortMax: '',
      prix: '',
      duree: '',
      dateDebut: '',
      dateFin: '',
      assigne: '',
    });
    setEquipe(null);
    setAgents([]);
    setError(null);
  };

  const fieldProps = {
    fullWidth: true,
    margin: 'dense',
    required: true,
    InputLabelProps: { sx: { color: colors.blueAccent[700] } },
    InputProps: { sx: { color: '#000', border: '1px solid #000' } },
  };

  const selectProps = {
    sx: { backgroundColor: '#fff', color: '#000', border: '1px solid #000' },
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <Button
        onClick={() => {
          setOpenDialog(true);
          setError(null);
        }}
        variant="contained"
        startIcon={<AddIcon />}
        sx={{
          backgroundColor: colors.blueAccent[700],
          '&:hover': { backgroundColor: colors.blueAccent[800] },
          borderRadius: '4px',
          padding: '8px 16px',
          color: colors.grey[100],
        }}
        title="Ajouter une tâche"
      >
        Ajouter
      </Button>

      <Dialog open={openDialog} onClose={resetForm}>
        <DialogTitle sx={{ backgroundColor: '#fff', border: 'none' }}>
          Ajouter une tâche
        </DialogTitle>
        <DialogContent sx={{ backgroundColor: '#fff' }}>
          {error && (
            <Typography color="error" sx={{ mb: 2 }}>
              {error}
            </Typography>
          )}

          <FormControl fullWidth margin="dense">
            <InputLabel sx={{ color: colors.blueAccent[700] }}>Projet</InputLabel>
            <Select
              name="idProjet"
              value={task.idProjet}
              onChange={handleChange}
              {...selectProps}
            >
              <MenuItem value="" sx={{ color: colors.blueAccent[700] }}>
                <em>Sélectionner un projet</em>
              </MenuItem>
              {projects.map((p) => (
                <MenuItem key={p.id} value={p.id} sx={{ color: colors.blueAccent[700] }}>
                  {p.nomProjet || p.nom || `Projet ${p.id}`}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {equipe && (
            <Typography sx={{ mt: 2, mb: 1, color: colors.blueAccent[700] }}>
              Équipe : <strong>{equipe.nom || 'Équipe non spécifiée'}</strong>
            </Typography>
          )}

          <FormControl fullWidth margin="dense" disabled={!equipe}>
            <InputLabel sx={{ color: colors.blueAccent[700] }}>Assigné à</InputLabel>
            <Select
              name="assigne"
              value={task.assigne}
              onChange={handleChange}
              {...selectProps}
            >
              <MenuItem value="" sx={{ color: colors.blueAccent[700] }}>
                <em>Sélectionner un agent</em>
              </MenuItem>
              {agents.map((a) => (
                <MenuItem
                  key={a.id}
                  value={a.id}
                  sx={{ color: colors.blueAccent[700] }}
                >
                  {(a.prenom || '') + ' ' + (a.nom || '') || `Agent ${a.id}`}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Prix (€)"
            name="prix"
            value={task.prix}
            onChange={handleChange}
            fullWidth
            margin="dense"
            InputProps={{
              readOnly: true,
              sx: {
                backgroundColor: '#e3f2fd',
                color: '#0d47a1',
                fontWeight: 'bold',
                border: '1px solid #0d47a1',
                borderRadius: '4px',
              },
            }}
            InputLabelProps={{
              sx: { color: '#0d47a1' },
            }}
          />

          <TextField
            label="Titre"
            name="titre"
            value={task.titre}
            onChange={handleChange}
            {...fieldProps}
          />
          <TextField
            label="Description"
            name="descriptionTache"
            value={task.descriptionTache}
            onChange={handleChange}
            multiline
            rows={4}
            {...fieldProps}
          />
          <FormControl fullWidth margin="dense">
            <InputLabel sx={{ color: colors.blueAccent[700] }}>Priorité</InputLabel>
            <Select
              name="periorite"
              value={task.periorite}
              onChange={handleChange}
              {...selectProps}
            >
              <MenuItem value="" sx={{ color: colors.blueAccent[700] }}>
                <em>Sélectionner une priorité</em>
              </MenuItem>
              {['haute', 'moyenne', 'basse'].map((p) => (
                <MenuItem
                  key={p}
                  value={p}
                  sx={{ color: colors.blueAccent[700] }}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Effort maximum"
            name="effortMax"
            type="number"
            value={task.effortMax}
            onChange={handleChange}
            {...fieldProps}
          />
          <TextField
            label="Durée (jours)"
            name="duree"
            type="number"
            value={task.duree}
            onChange={handleChange}
            {...fieldProps}
          />
          <TextField
            label="Date de début"
            name="dateDebut"
            type="date"
            value={task.dateDebut}
            onChange={handleChange}
            InputLabelProps={{ shrink: true, sx: { color: colors.blueAccent[700] } }}
            {...fieldProps}
          />
          <TextField
            label="Date de fin"
            name="dateFin"
            type="date"
            value={task.dateFin}
            onChange={handleChange}
            InputLabelProps={{ shrink: true, sx: { color: colors.blueAccent[700] } }}
            {...fieldProps}
          />
        </DialogContent>
        <DialogActions sx={{ backgroundColor: '#fff', border: 'none' }}>
          <Button onClick={resetForm}>Annuler</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            sx={{ backgroundColor: colors.blueAccent[700] }}
          >
            Ajouter
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};
export default AddTask;