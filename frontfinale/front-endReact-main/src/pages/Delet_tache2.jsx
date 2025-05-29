import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Snackbar,
  Alert,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { tokens } from '../theme';

const DeleteTask = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const { taskIds, taskTitles } = useParams();
  const navigate = useNavigate();
  const [openDialog, setOpenDialog] = useState(true);
  const [error, setError] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Parse task IDs and titles
  const ids = taskIds ? taskIds.split(',') : [];
  const titles = taskTitles ? taskTitles.split(',').map(decodeURIComponent) : [];

  // Validate input
  if (!taskIds || ids.length === 0) {
    return (
      <Box sx={{ p: 3, maxWidth: 600, mx: 'auto', mt: 4 }}>
        <Typography color="error">
          Aucune tâche sélectionnée pour la suppression.
        </Typography>
        <Button
          onClick={() => navigate('/KanbanBoard')}
          variant="contained"
          sx={{ mt: 2 }}
        >
          Retour
        </Button>
      </Box>
    );
  }

  const handleDelete = async () => {
    setLoading(true);
    try {
      // Make DELETE requests for each task ID
      const deletePromises = ids.map(id =>
        fetch(`http://localhost:8080/api/tasks/${id}`, {
          method: 'DELETE',
        }).then(response => {
          if (!response.ok) {
            throw new Error(`Échec de la suppression de la tâche ID ${id}`);
          }
        })
      );

      await Promise.all(deletePromises);

      setSnackbarMessage(
        ids.length === 1 ? 'Tâche supprimée' : `${ids.length} tâches supprimées`
      );
      setSnackbarOpen(true);
      setTimeout(() => {
        navigate('/KanbanBoard', { state: { deletedIds: ids } });
      }, 1000);
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
      setError(`Erreur lors de la suppression : ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setOpenDialog(false);
    navigate('/KanbanBoard');
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const getDeleteMessage = () => {
    if (ids.length === 1) {
      return `Voulez-vous vraiment supprimer la tâche : ${titles[0] || 'Sans titre'} ?`;
    }
    return `Voulez-vous vraiment supprimer ${ids.length} tâches ?`;
  };

  return (
    <Box sx={{ p: 3, maxWidth: 600, mx: 'auto', mt: 4 }}>
      {error && (
        <Typography color="error" mb={2}>
          {error}
        </Typography>
      )}

      <Dialog
        open={openDialog}
        onClose={handleCancel}
        aria-labelledby="delete-dialog-title"
      >
        <DialogTitle id="delete-dialog-title">Confirmation de suppression</DialogTitle>
        <DialogContent>
          <DialogContentText>{getDeleteMessage()}</DialogContentText>
          {ids.length > 1 && (
            <Box mt={2}>
              <Typography variant="subtitle1">Tâches sélectionnées :</Typography>
              {titles.map((title, index) => (
                <Typography key={ids[index]} variant="body2">
                  - {title || 'Sans titre'}
                </Typography>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancel} color="primary" disabled={loading}>
            Annuler
          </Button>
          <Button
            onClick={handleDelete}
            color="error"
            autoFocus
            disabled={loading}
          >
            {loading ? 'Suppression...' : 'Supprimer'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity="success"
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default DeleteTask;
