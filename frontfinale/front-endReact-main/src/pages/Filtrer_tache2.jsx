
import React, { useState } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { tokens } from '../theme';
import FilterListIcon from '@mui/icons-material/FilterList';
import DeleteIcon from '@mui/icons-material/Delete';

const Filter_tache2 = ({ tasks = [], setTasks, originalTasks = [] }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [searchTerm, setSearchTerm] = useState('');
  const [openFilterDialog, setOpenFilterDialog] = useState(false);
  const [filters, setFilters] = useState([{ column: 'id', operator: '=', value: '' }]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Define columns for filtering
  const columns = [
    { field: 'id', headerName: 'ID' },
    { field: 'idProjet', headerName: 'Projet' },
    { field: 'titre', headerName: 'Titre' },
    { field: 'descriptionTache', headerName: 'Description' },
    { field: 'duree', headerName: 'Durée (h)' },
    { field: 'periorite', headerName: 'Priorité' },
    { field: 'prix', headerName: 'Prix (€)' },
    { field: 'dateDebut', headerName: 'Date Début' },
    { field: 'dateFin', headerName: 'Date Fin' },
    { field: 'gestionnaireDeCompte', headerName: 'Gestionnaire' },
    { field: 'effortMax', headerName: 'Effort Max' },
    { field: 'assigne', headerName: 'Assigné à' },
  ];

  // Handle filter dialog open
  const handleFilterClick = () => {
    setOpenFilterDialog(true);
  };

  // Add new filter
  const addFilter = () => {
    setFilters([...filters, { column: 'id', operator: '=', value: '' }]);
  };

  // Update filter
  const updateFilter = (index, field, value) => {
    const newFilters = [...filters];
    newFilters[index][field] = value;
    setFilters(newFilters);
  };

  // Remove filter
  const removeFilter = (index) => {
    setFilters(filters.filter((_, i) => i !== index));
  };

  // Apply filters
  const applyFilters = () => {
    setOpenFilterDialog(false);
    const filtered = (Array.isArray(originalTasks) ? originalTasks : []).filter((task) =>
      filters.every((filter) => {
        const { column, operator, value } = filter;
        if (!value) return true;
        const taskValue =
          column === 'idProjet'
            ? task.idProjet
            : column === 'prix'
            ? task.prix != null
              ? task.prix.toString()
              : ''
            : column === 'dateDebut'
            ? task.dateDebut || ''
            : column === 'dateFin'
            ? task.dateFin || ''
            : task[column] ?? '';
        if (taskValue == null) return false;

        switch (operator) {
          case '=':
            return String(taskValue) === value;
          case '<':
            return Number(taskValue) < Number(value);
          case '>':
            return Number(taskValue) > Number(value);
          case 'contient':
            return String(taskValue).toLowerCase().includes(value.toLowerCase());
          default:
            return true;
        }
      })
    ).filter((task) =>
      task.titre.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setTasks(filtered);
    setSnackbarMessage('Filtres appliqués');
    setSnackbarOpen(true);
  };

  // Handle search change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    const filtered = (Array.isArray(originalTasks) ? originalTasks : []).filter((task) =>
      task.titre.toLowerCase().includes(e.target.value.toLowerCase())
    );
    setTasks(filtered);
  };

  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  return (
    <Box display="flex" gap="10px" flexWrap="wrap" alignItems="center">
      <TextField
        label="Rechercher une tâche"
        variant="outlined"
        value={searchTerm}
        onChange={handleSearchChange}
        sx={{
          width: { xs: '100%', sm: '250px' },
          '& .MuiOutlinedInput-root': {
            '& fieldset': { borderColor: colors.grey[100] },
            '&:hover fieldset': { borderColor: colors.greenAccent[400] },
          },
        }}
      />
      <IconButton
        onClick={handleFilterClick}
        sx={{
          backgroundColor: colors.grey[700],
          '&:hover': { backgroundColor: colors.grey[800] },
          borderRadius: '4px',
          padding: '8px',
        }}
        title="Filtrer les tâches"
      >
        <FilterListIcon sx={{ color: colors.grey[100] }} />
      </IconButton>

      <Dialog
        open={openFilterDialog}
        onClose={() => setOpenFilterDialog(false)}
        aria-labelledby="filter-dialog-title"
        maxWidth="md"
        fullWidth
      >
        <DialogTitle id="filter-dialog-title">Filtrer les tâches</DialogTitle>
        <DialogContent>
          {filters.map((filter, index) => (
            <Grid container spacing={2} key={index} alignItems="center" sx={{ mb: 2 }}>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>Colonne</InputLabel>
                  <Select
                    value={filter.column}
                    onChange={(e) => updateFilter(index, 'column', e.target.value)}
                    label="Colonne"
                  >
                    {columns.map((col) => (
                      <MenuItem key={col.field} value={col.field}>
                        {col.headerName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth>
                  <InputLabel>Opérateur</InputLabel>
                  <Select
                    value={filter.operator}
                    onChange={(e) => updateFilter(index, 'operator', e.target.value)}
                    label="Opérateur"
                  >
                    <MenuItem value="=">=</MenuItem>
                    <MenuItem value="<">{'<'}</MenuItem>
                    <MenuItem value=">">{'>'}</MenuItem>
                    <MenuItem value="contient">Contient</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Valeur"
                  variant="outlined"
                  value={filter.value}
                  onChange={(e) => updateFilter(index, 'value', e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={1}>
                <IconButton onClick={() => removeFilter(index)} color="error">
                  <DeleteIcon />
                </IconButton>
              </Grid>
            </Grid>
          ))}
          <Button onClick={addFilter} color="primary" variant="outlined" sx={{ mt: 2 }}>
            Ajouter un filtre
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenFilterDialog(false)} color="primary">
            Annuler
          </Button>
          <Button onClick={applyFilters} color="primary" variant="contained">
            Appliquer
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity="success" sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Filter_tache2;
