import React, { useState } from 'react';
import {
  DialogContent, DialogActions, TextField, Button, MenuItem, Grid, Snackbar, Alert
} from '@mui/material';

const EditTaskPopup = ({ task, onClose, onTaskEdited, agents, statuses }) => {
  const [formData, setFormData] = useState({
    titre: task?.titre || '',
    descriptionTache: task?.descriptionTache || '',
    idStatutTache: task?.idStatutTache || '',
    periorite: task?.periorite || 'Moyenne',
    assigne: task?.assigne || '',
    dateDebut: task?.dateDebut ? task.dateDebut.split('T')[0] : '',
    dateFin: task?.dateFin ? task.dateFin.split('T')[0] : '',
    duree: task?.duree || '',
    idProjet: task?.idProjet || '',
    prix: task?.prix || '',
  });
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.titre) return 'Le titre est requis';
    if (!formData.idStatutTache) return 'Le statut est requis';
    if (!formData.duree) return 'La durée est requise';
    if (!formData.idProjet) return 'L\'ID du projet est requis';
    if (formData.dateDebut && formData.dateFin && formData.dateFin < formData.dateDebut) {
      return 'La date de fin doit être après la date de début';
    }
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      setSnackbar({ open: true, message: validationError, severity: 'error' });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        idStatutTache: Number(formData.idStatutTache),
        assigne: formData.assigne ? Number(formData.assigne) : null,
        duree: Number(formData.duree),
        idProjet: Number(formData.idProjet),
        prix: formData.prix ? Number(formData.prix) : null,
      };

      const response = await fetch(`http://localhost:8080/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Échec de la mise à jour: ${errorText}`);
      }

      setSnackbar({ open: true, message: 'Tâche mise à jour avec succès', severity: 'success' });
      onTaskEdited();
      onClose();
    } catch (error) {
      setSnackbar({ open: true, message: error.message || 'Erreur lors de la mise à jour', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <>
      <DialogContent>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Titre"
              name="titre"
              value={formData.titre}
              onChange={handleChange}
              required
              error={!formData.titre}
              helperText={!formData.titre ? 'Ce champ est requis' : ''}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Description"
              name="descriptionTache"
              value={formData.descriptionTache}
              onChange={handleChange}
              multiline
              rows={4}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              select
              label="Statut"
              name="idStatutTache"
              value={formData.idStatutTache}
              onChange={handleChange}
              required
              error={!formData.idStatutTache}
              helperText={!formData.idStatutTache ? 'Ce champ est requis' : ''}
            >
              {statuses.map((status) => (
                <MenuItem key={status.id} value={status.id}>
                  {status.nomStatut}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              select
              label="Priorité"
              name="periorite"
              value={formData.periorite}
              onChange={handleChange}
            >
              <MenuItem value="Haute">Haute</MenuItem>
              <MenuItem value="Moyenne">Moyenne</MenuItem>
              <MenuItem value="Basse">Basse</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              select
              label="Assigné"
              name="assigne"
              value={formData.assigne}
              onChange={handleChange}
            >
              <MenuItem value="">Aucun</MenuItem>
              {agents.map((agent) => (
                <MenuItem key={agent.id} value={agent.id}>
                  {`${agent.prenom} ${agent.nom}`}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              label="Date de début"
              name="dateDebut"
              type="date"
              value={formData.dateDebut}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              label="Date de fin"
              name="dateFin"
              type="date"
              value={formData.dateFin}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
              error={formData.dateDebut && formData.dateFin && formData.dateFin < formData.dateDebut}
              helperText={formData.dateDebut && formData.dateFin && formData.dateFin < formData.dateDebut ? 'Doit être après la date de début' : ''}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              label="Durée (heures)"
              name="duree"
              type="number"
              value={formData.duree}
              onChange={handleChange}
              required
              error={!formData.duree}
              helperText={!formData.duree ? 'Ce champ est requis' : ''}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              label="ID Projet"
              name="idProjet"
              type="number"
              value={formData.idProjet}
              onChange={handleChange}
              required
              error={!formData.idProjet}
              helperText={!formData.idProjet ? 'Ce champ est requis' : ''}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              label="Prix"
              name="prix"
              type="number"
              value={formData.prix}
              onChange={handleChange}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary" disabled={loading}>
          Annuler
        </Button>
        <Button
          onClick={handleSubmit}
          color="primary"
          variant="contained"
          disabled={loading}
        >
          {loading ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
      </DialogActions>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default EditTaskPopup;