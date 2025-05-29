import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, TextField, Typography, IconButton, Snackbar, Alert, Card, CardHeader, CardContent,
  Grid, Chip, Autocomplete, Select, MenuItem, InputLabel, FormControl, Dialog, DialogTitle,
  DialogContent, DialogActions, Button, List, ListItem, ListItemText, ListItemSecondaryAction
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import axios from 'axios';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import GroupIcon from '@mui/icons-material/Group';
import FilterListIcon from '@mui/icons-material/FilterList';
import EditIcon from '@mui/icons-material/Edit';

const ProjectTeam = () => {
  const theme = useTheme();
  const [projects, setProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState({ type: 'Tous', value: 'Tous' });
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [availableAgents, setAvailableAgents] = useState([]);
  const [selectedAgents, setSelectedAgents] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:8080/api/projects');
      const validProjects = res.data
        .filter(p => p && p.id && p.nomProjet)
        .map(p => ({
          id: p.id,
          nomProjet: p.nomProjet || `Projet ${p.id}`,
          equipe: p.equipe ? {
            id: p.equipe.id,
            nomEquipe: p.equipe.nom,
            agents: Array.isArray(p.equipe.agents)
              ? p.equipe.agents.filter(a => a && a.id && a.prenom && a.nom)
                  .map(a => ({ id: a.id, prenom: a.prenom, nom: a.nom }))
              : []
          } : null,
          statutProjet: p.statutProjet ? { id: p.statutProjet.id, nom: p.statutProjet.nom } : null
        }));
      setProjects(validProjects);
    } catch (err) {
      setSnackbar({ open: true, message: `Erreur: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableAgents = async () => {
    try {
      const res = await axios.get('http://localhost:8080/api/agents');
      setAvailableAgents(res.data.filter(a => a && a.id && a.prenom && a.nom));
    } catch (err) {
      setSnackbar({ open: true, message: `Erreur lors du chargement des agents: ${err.message}` });
    }
  };

  const handleEditTeam = (project) => {
    setSelectedProject(project);
    setSelectedAgents(project.equipe?.agents || []);
    fetchAvailableAgents();
    setOpenDialog(true);
  };

  const handleAddAgent = (agent) => {
    if (!selectedAgents.some(a => a.id === agent.id)) {
      setSelectedAgents([...selectedAgents, agent]);
    }
  };

  const handleRemoveAgent = (agentId) => {
    setSelectedAgents(selectedAgents.filter(a => a.id !== agentId));
  };

  const handleSaveTeam = async () => {
    try {
      // Envoyer la mise à jour au backend
      await axios.put(`http://localhost:8080/api/equipes/${selectedProject.equipe.id}`, {
        agents: selectedAgents
      });
      // Mettre à jour tous les projets ayant la même équipe (même equipe.id)
      setProjects(projects.map(p =>
        p.equipe && p.equipe.id === selectedProject.equipe.id
          ? { ...p, equipe: { ...p.equipe, agents: selectedAgents } }
          : p
      ));
      setSnackbar({ open: true, message: 'Équipe mise à jour avec succès' });
      setOpenDialog(false);
    } catch (err) {
      setSnackbar({ open: true, message: `Erreur lors de la mise à jour: ${err.message}` });
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedProject(null);
    setSelectedAgents([]);
    setAvailableAgents([]);
  };

  const handleRefresh = () => {
    setSearchTerm('');
    setFilter({ type: 'Tous', value: 'Tous' });
    setShowFilters(false);
    fetchData();
    setSnackbar({ open: true, message: 'Données actualisées' });
  };

  const handleSearch = () => {
    const matched = projects.filter(p =>
      p.equipe && p.equipe.nomEquipe.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setSnackbar({
      open: true,
      message: searchTerm.trim() === '' ? 'Tous les projets affichés' :
        matched.length > 0 ? `Projets trouvés: ${matched.length}` : 'Aucun projet trouvé'
    });
  };

  const filterValues = useMemo(() => {
    const opts = ['Tous'];
    if (filter.type === 'Projet') {
      projects.forEach(p => opts.push(p.nomProjet));
    } else if (filter.type === 'Agent') {
      const agents = new Set();
      projects.forEach(p => p.equipe?.agents?.forEach(a => agents.add(`${a.prenom} ${a.nom}`)));
      opts.push(...Array.from(agents).sort());
    }
    return opts;
  }, [projects, filter.type]);

  const filteredProjects = useMemo(() => {
    let result = projects;
    if (searchTerm.trim()) {
      result = result.filter(p =>
        p.equipe && p.equipe.nomEquipe.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (filter.type !== 'Tous' && filter.value !== 'Tous') {
      result = result.filter(p => {
        if (filter.type === 'Projet') return p.nomProjet === filter.value;
        if (filter.type === 'Agent') {
          return p.equipe?.agents.some(a => `${a.prenom} ${a.nom}` === filter.value);
        }
        return true;
      });
    }
    return result;
  }, [projects, searchTerm, filter]);

  return (
    <Box sx={{ my: 2, p: 2, bgcolor: theme.palette.background.paper, boxShadow: 1 }}>
      {loading && <Typography>Chargement...</Typography>}
      {!loading && filteredProjects.length === 0 && (
        <Typography>Aucun projet trouvé.</Typography>
      )}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1, flexWrap: 'wrap' }}>
        <TextField
          label="Rechercher par équipe"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          sx={{ width: { xs: '100%', sm: 200 }, '& .MuiOutlinedInput-root': { boxShadow: 1 } }}
        />
        <IconButton onClick={handleSearch} sx={{ bgcolor: theme.palette.primary.main }} title="Rechercher">
          <SearchIcon sx={{ color: '#fff' }} />
        </IconButton>
        <IconButton
          onClick={() => setShowFilters(!showFilters)}
          sx={{ bgcolor: showFilters ? theme.palette.primary.main : theme.palette.grey[500] }}
          title="Filtres"
        >
          <FilterListIcon sx={{ color: '#fff' }} />
        </IconButton>
        {showFilters && (
          <>
            <FormControl sx={{ width: { xs: '100%', sm: 150 } }}>
              <InputLabel>Type de filtre</InputLabel>
              <Select
                value={filter.type}
                onChange={e => setFilter({ type: e.target.value, value: 'Tous' })}
                sx={{ boxShadow: 1 }}
              >
                <MenuItem value="Tous">Tous</MenuItem>
                <MenuItem value="Projet">Projet</MenuItem>
                <MenuItem value="Agent">Agent</MenuItem>
              </Select>
            </FormControl>
            <Autocomplete
              options={filterValues}
              value={filter.value}
              onChange={(e, val) => setFilter({ ...filter, value: val || 'Tous' })}
              renderInput={params => <TextField {...params} label="Filtrer par" sx={{ boxShadow: 1 }} />}
              sx={{ width: { xs: '100%', sm: 200 } }}
              disabled={filter.type === 'Tous'}
            />
          </>
        )}
        <IconButton onClick={handleRefresh} sx={{ bgcolor: theme.palette.grey[500] }} title="Rafraîchir">
          <RefreshIcon sx={{ color: theme.palette.primary.main }} />
        </IconButton>
      </Box>
      <Grid container spacing={2}>
        {filteredProjects.map(p => (
          <Grid item xs={12} sm={6} md={3} key={p.id}>
            <Card sx={{ bgcolor: theme.palette.background.paper, boxShadow: 1, '&:hover': { transform: 'scale(1.05)' } }}>
              <CardHeader
                title={p.nomProjet}
                subheader={`ID: ${p.id} | Statut: ${p.statutProjet?.nom || 'Inconnu'}`}
                sx={{ pb: 0.5 }}
                action={
                  <IconButton onClick={() => handleEditTeam(p)} title="Modifier l'équipe">
                    <EditIcon />
                  </IconButton>
                }
              />
              <CardContent sx={{ py: 1 }}>
                <Typography variant="subtitle2" gutterBottom>Équipe :</Typography>
                {p.equipe ? (
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      <GroupIcon sx={{ fontSize: 16, mr: 0.5 }} />
                      <Typography>{p.equipe.nomEquipe}</Typography>
                    </Box>
                    {p.equipe.agents.length > 0 ? (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {p.equipe.agents.map((a, i) => (
                          <Chip
                            key={`${a.prenom}-${a.nom}-${i}`}
                            label={`${a.prenom} ${a.nom}`}
                            sx={{ fontSize: '0.7rem', height: 24 }}
                          />
                        ))}
                      </Box>
                    ) : (
                      <Typography variant="caption">Aucun membre assigné</Typography>
                    )}
                  </Box>
                ) : (
                  <Typography variant="caption">Aucune équipe assignée</Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Modifier l'équipe: {selectedProject?.equipe?.nomEquipe}</DialogTitle>
        <DialogContent>
          <Typography variant="subtitle2" gutterBottom>Nom de l'équipe:</Typography>
          <TextField
            value={selectedProject?.equipe?.nomEquipe || ''}
            disabled
            fullWidth
            sx={{ mb: 2 }}
          />
          <Typography variant="subtitle2" gutterBottom>Ajouter un agent:</Typography>
          <Autocomplete
            options={availableAgents.filter(a => !selectedAgents.some(sa => sa.id === a.id))}
            getOptionLabel={(option) => `${option.prenom} ${option.nom}`}
            onChange={(e, value) => value && handleAddAgent(value)}
            renderInput={(params) => <TextField {...params} label="Sélectionner un agent" />}
            sx={{ mb: 2 }}
          />
          <Typography variant="subtitle2" gutterBottom>Membres actuels:</Typography>
          <List>
            {selectedAgents.map(agent => (
              <ListItem key={agent.id}>
                <ListItemText primary={`${agent.prenom} ${agent.nom}`} />
                <ListItemSecondaryAction>
                  <IconButton edge="end" onClick={() => handleRemoveAgent(agent.id)}>
                    <Chip label="Retirer" color="error" size="small" />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
            {selectedAgents.length === 0 && (
              <Typography variant="caption">Aucun agent assigné</Typography>
            )}
          </List>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCloseDialog}
            variant="outlined"
            sx={{
              color: '#1e3a5f',
              borderColor: '#1e3a5f',
              '&:hover': { borderColor: '#152a4a' },
              minWidth: 120
            }}
          >
            Annuler
          </Button>
          <Button
            onClick={handleSaveTeam}
            variant="contained"
            sx={{
              backgroundColor: '#1e3a5f',
              '&:hover': { backgroundColor: '#152a4a' },
              minWidth: 120
            }}
          >
            Enregistrer
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity="info">{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default ProjectTeam;