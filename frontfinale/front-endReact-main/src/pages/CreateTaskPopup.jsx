import React, { useState, useEffect } from 'react';
import {
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Alert,
  Snackbar,
  Typography,
  Autocomplete,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { tokens } from '../theme';
import axios from 'axios';

const initialForm = {
  idProjet: '',
  titre: '',
  descriptionTache: '',
  idStatutTache: '',
  periorite: '',
  prix: '',
  duree: '',
  dateDebut: '',
  dateFin: '',
  assigne: '',
};

const CreateTaskPopup = ({ onClose, onTaskCreated, statuses, preSelectedProjectId }) => {
  const { palette: { mode } } = useTheme();
  const colors = tokens(mode);
  const [formData, setFormData] = useState(initialForm);
  const [projects, setProjects] = useState([]);
  const [team, setTeam] = useState(null);
  const [agents, setAgents] = useState([]);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });

  useEffect(() => {
    axios.get('http://localhost:8080/api/projects')
      .then(({ data }) => {
        const filteredProjects = data.filter(p => ['en cours', 'en attente', 'suspendu'].includes(p.statutProjet?.nom?.toLowerCase()));
        setProjects(filteredProjects);
        if (preSelectedProjectId) {
          const selectedProject = filteredProjects.find(p => p.id === preSelectedProjectId);
          if (selectedProject) {
            setFormData(prev => ({ ...prev, idProjet: preSelectedProjectId }));
            fetchTeamAndAgents(preSelectedProjectId);
          }
        }
      })
      .catch(() => setError('Impossible de charger les projets.'));
  }, [preSelectedProjectId]);

  const fetchTeamAndAgents = async id => {
    try {
      const { data: project } = await axios.get(`http://localhost:8080/api/projects/${id}`);
      if (project.equipe?.id) {
        const { data: teamData } = await axios.get(`http://localhost:8080/api/equipes/${project.equipe.id}`);
        setTeam(teamData);
        setAgents(teamData.agents || []);
      } else {
        setTeam(null);
        setAgents([]);
      }
    } catch {
      setError('Impossible de charger l\'équipe ou les agents.');
    }
  };

  const handleChange = ({ target: { name, value } }) => {
    setFormData(prev => {
      const updated = { ...prev, [name]: value };

      if (name === 'assigne') {
        if (!agents.length) {
          setError('Aucun agent disponible.');
          return { ...updated, prix: '' };
        }
        const agent = agents.find(a => a.id === parseInt(value));
        if (!agent) {
          setError('Agent non trouvé.');
          return { ...updated, prix: '' };
        }
        if (agent.type_Agent === 'collaborateur') {
          if (!agent.prixParHeure) {
            setError('Prix par heure non défini.');
            return { ...updated, prix: '' };
          }
          setError(null);
          return { ...updated, prix: parseFloat(agent.prixParHeure).toFixed(2) };
        } else {
          if (!agent.salaire) {
            setError('Salaire non défini.');
            return { ...updated, prix: '' };
          }
          setError(null);
          return { ...updated, prix: parseFloat(agent.salaire).toFixed(2) };
        }
      }
      if (name === 'prix') {
        setError(null);
        return { ...updated, prix: value };
      }
      return updated;
    });
  };

  const validateForm = () => {
    const checks = [
      [!formData.idProjet, 'Projet requis.'],
      [!formData.titre, 'Titre requis.'],
      [!formData.periorite, 'Priorité requise.'],
      [!formData.idStatutTache, 'Statut requis.'],
      [!formData.duree || !/^\d{2}:\d{2}$/.test(formData.duree), 'Durée au format HH:mm requise.'],
      [!formData.prix || parseFloat(formData.prix) < 0, 'Prix non négatif requis.'],
      [!formData.dateDebut || !/^\d{4}-\d{2}-\d{2}$/.test(formData.dateDebut), 'Date de début requise et au format AAAA-MM-JJ.'],
      [!formData.dateFin || !/^\d{4}-\d{2}-\d{2}$/.test(formData.dateFin), 'Date de fin requise et au format AAAA-MM-JJ.'],
      [formData.dateDebut && formData.dateFin && new Date(formData.dateFin) <= new Date(formData.dateDebut), 'Date de fin après début.'],
    ];
    const err = checks.find(([c]) => c)?.[1];
    setError(err || null);
    return !err;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    // Convert duree from HH:mm to HH:mm:ss.ffffff format
    const dureeFormatted = `${formData.duree}:00.0000000`;

    const taskData = {
      idProjet: parseInt(formData.idProjet),
      titre: formData.titre,
      descriptionTache: formData.descriptionTache || null,
      idStatutTache: parseInt(formData.idStatutTache),
      periorite: formData.periorite,
      prix: parseFloat(formData.prix),
      dure: dureeFormatted,
      dateDebut: formData.dateDebut || null,
      dateFin: formData.dateFin || null,
      assigne: formData.assigne ? parseInt(formData.assigne) : null,
    };

    try {
      const response = await axios.post('http://localhost:8080/api/tasks', taskData, {
        headers: { 'Content-Type': 'application/json' },
      });
      setSnackbar({ open: true, message: 'Tâche ajoutée avec succès' });
      setFormData(initialForm);
      onTaskCreated(response.data);
      setTimeout(() => onClose(), 2000);
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la tâche:', error.response?.data || error.message);
      setError(error.response?.data?.message || 'Erreur lors de l\'ajout de la tâche.');
    }
  };

  const styles = {
    field: {
      fullWidth: true,
      margin: 'normal',
      required: true,
      InputLabelProps: { sx: { color: colors.blueAccent[700] } },
      InputProps: { sx: { color: '#000', border: '1px solid #000' } },
    },
    select: { sx: { backgroundColor: '#fff', color: '#000', border: '1px solid #000' } },
    prix: { backgroundColor: '#e3f2fd', color: '#0d47a1', fontWeight: 'bold', border: '1px solid #0d47a1', borderRadius: '4px' },
  };

  return (
    <>
      <DialogContent sx={{ backgroundColor: '#fff' }}>
        {error && <Alert severity="error">{error}</Alert>}
        <Autocomplete
          options={projects}
          getOptionLabel={(option) => option.nomProjet || `Projet ${option.id}`}
          value={projects.find(p => p.id === formData.idProjet) || null}
          onChange={(event, newValue) => {
            setFormData(prev => ({
              ...prev,
              idProjet: newValue ? newValue.id : '',
            }));
            if (newValue) {
              fetchTeamAndAgents(newValue.id);
            } else {
              setTeam(null);
              setAgents([]);
            }
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Projet"
              margin="normal"
              fullWidth
              required
              InputLabelProps={{ sx: { color: colors.blueAccent[700] } }}
              InputProps={{
                ...params.InputProps,
                sx: { color: '#000', border: '1px solid #000' },
              }}
            />
          )}
          disabled={!!preSelectedProjectId}
          noOptionsText="Aucun projet trouvé"
          sx={{ margin: 'normal' }}
        />
        {team && (
          <Typography sx={{ mt: 2, mb: 1, color: colors.blueAccent[700] }}>
            Équipe : <strong>{team.nom || 'Non spécifiée'}</strong>
          </Typography>
        )}
        <FormControl fullWidth margin="normal" disabled={!team}>
          <InputLabel sx={{ color: colors.blueAccent[700] }}>Assigné à</InputLabel>
          <Select name="assigne" value={formData.assigne} onChange={handleChange} {...styles.select}>
            <MenuItem value=""><em>Sélectionner un agent</em></MenuItem>
            {agents.map(a => (
              <MenuItem key={a.id} value={a.id}>
                {(a.prenom || '') + ' ' + (a.nom || '') || `Agent ${a.id}`}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          label="Prix"
          name="prix"
          type="number"
          value={formData.prix}
          onChange={handleChange}
          {...styles.field}
          InputProps={{ sx: styles.prix }}
        />
        <TextField
          label="Titre"
          name="titre"
          value={formData.titre}
          onChange={handleChange}
          {...styles.field}
        />
        <TextField
          label="Description"
          name="descriptionTache"
          value={formData.descriptionTache}
          onChange={handleChange}
          multiline
          rows={4}
          {...styles.field}
        />
        <FormControl fullWidth margin="normal">
          <InputLabel sx={{ color: colors.blueAccent[700] }}>Statut</InputLabel>
          <Select
            name="idStatutTache"
            value={formData.idStatutTache}
            onChange={handleChange}
            {...styles.select}
          >
            <MenuItem value=""><em>Sélectionner un statut</em></MenuItem>
            {statuses.map(s => (
              <MenuItem key={s.id} value={s.id}>{s.nomStatut}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl fullWidth margin="normal">
          <InputLabel sx={{ color: colors.blueAccent[700] }}>Priorité</InputLabel>
          <Select
            name="periorite"
            value={formData.periorite}
            onChange={handleChange}
            {...styles.select}
          >
            <MenuItem value=""><em>Sélectionner une priorité</em></MenuItem>
            {['haute', 'moyenne', 'basse'].map(p => (
              <MenuItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          label="Durée (HH:mm)"
          name="duree"
          type="text"
          value={formData.duree}
          onChange={handleChange}
          placeholder="HH:mm"
          {...styles.field}
        />
        <TextField
          label="Date de début"
          name="dateDebut"
          type="date"
          value={formData.dateDebut}
          onChange={handleChange}
          InputLabelProps={{ shrink: true, sx: { color: colors.blueAccent[700] } }}
          {...styles.field}
        />
        <TextField
          label="Date de fin"
          name="dateFin"
          type="date"
          value={formData.dateFin}
          onChange={handleChange}
          InputLabelProps={{ shrink: true, sx: { color: colors.blueAccent[700] } }}
          {...styles.field}
        />
      </DialogContent>
      <DialogActions sx={{ backgroundColor: '#fff' }}>
        <Button
          onClick={onClose}
          variant="outlined"
          sx={{
            color: '#1e3a5f',
            borderColor: '#1e3a5f',
            '&:hover': { borderColor: '#152a4a' },
            minWidth: 120,
          }}
        >
          Annuler
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          sx={{
            backgroundColor: '#1e3a5f',
            '&:hover': { backgroundColor: '#152a4a' },
            minWidth: 120,
          }}
        >
          Créer
        </Button>
      </DialogActions>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" sx={{ width: '100%' }}>{snackbar.message}</Alert>
      </Snackbar>
    </>
  );
};

export default CreateTaskPopup;