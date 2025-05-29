import React, { useState, useEffect } from 'react';
import {
  Box, Container, Typography, CircularProgress, Alert, Paper, Divider,
  Button, TextField, Autocomplete, FormControl, Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';

const TimelineView = () => {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterProject, setFilterProject] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterAgent, setFilterAgent] = useState('all');
  const [filterDateStart, setFilterDateStart] = useState(null);
  const [filterDateEnd, setFilterDateEnd] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [agentDetails, setAgentDetails] = useState(null);

  const statuses = [
    { id: 'all', nom: 'Tous' },
    { id: 1, nom: 'En cours' },
    { id: 2, nom: 'Terminé' },
  ];

  const fetchProjects = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/projects');
      if (!res.ok) throw new Error(`Erreur HTTP: ${res.status}`);
      const data = await res.json();
      setProjects(data);
    } catch (err) {
      setError({ message: 'Erreur lors de la récupération des projets: ' + err.message });
    }
  };

  const fetchTasks = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/tasks');
      if (!res.ok) throw new Error(`Erreur HTTP: ${res.status}`);
      const data = await res.json();
      setTasks(data);
    } catch (err) {
      setError({ message: 'Erreur lors de la récupération des tâches: ' + err.message });
    }
  };

  const fetchAgents = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/agents');
      if (!res.ok) throw new Error(`Erreur HTTP: ${res.status}`);
      const data = await res.json();
      setAgents(data);
    } catch (err) {
      setError({ message: 'Erreur lors de la récupération des agents: ' + err.message });
    }
  };

  const fetchAgentDetails = async (agentId) => {
    try {
      const res = await fetch(`http://localhost:8080/api/agents/${agentId}`);
      if (!res.ok) throw new Error(`Erreur HTTP: ${res.status}`);
      const data = await res.json();
      setAgentDetails(data);
    } catch (err) {
      console.error('Erreur lors de la récupération des détails de l\'agent:', err);
      setAgentDetails(null);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchProjects(), fetchTasks(), fetchAgents()]);
      } catch (err) {
        console.error('Erreur lors du chargement des données:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const filteredTasks = tasks.filter(task => {
    const projectMatch = filterProject === 'all' || task.idProjet === Number(filterProject);
    const statusMatch = filterStatus === 'all' || task.idStatutTache === Number(filterStatus);
    const agentMatch = filterAgent === 'all' || String(task.assigne) === String(filterAgent);
    const startDateMatch = !filterDateStart || dayjs(task.dateDebut).isAfter(dayjs(filterDateStart).subtract(1, 'day'));
    const endDateMatch = !filterDateEnd || dayjs(task.dateFin).isBefore(dayjs(filterDateEnd).add(1, 'day'));
    return projectMatch && statusMatch && agentMatch && startDateMatch && endDateMatch;
  });

  const getTimelineRange = () => {
    const allDates = filteredTasks.flatMap(task => [
      task.dateDebut ? new Date(task.dateDebut) : null,
      task.dateFin ? new Date(task.dateFin) : null,
    ]).filter(date => date);

    if (allDates.length === 0) return { start: new Date(), end: new Date() };

    const start = new Date(Math.min(...allDates));
    const end = new Date(Math.max(...allDates));
    start.setDate(start.getDate() - 7);
    end.setDate(end.getDate() + 7);
    return { start, end };
  };

  const { start: timelineStart, end: timelineEnd } = getTimelineRange();
  const totalDays = dayjs(timelineEnd).diff(dayjs(timelineStart), 'day');
  const weeks = Math.ceil(totalDays / 7);

  const getProjectName = (projectId) => {
    const project = projects.find(p => p.id === Number(projectId));
    return project ? project.nomProjet : 'Non spécifié';
  };

  const getProjectReference = (projectId) => {
    const project = projects.find(p => p.id === Number(projectId));
    return project && project.reference ? project.reference : `Ref-${projectId}`;
  };

  const groupedTasks = projects
    .filter(project => {
      if (filterProject !== 'all' && project.id !== Number(filterProject)) return false;
      if (filterAgent === 'all') return true;
      return filteredTasks.some(task => task.idProjet === project.id);
    })
    .map(project => ({
      project,
      tasks: filteredTasks.filter(task => task.idProjet === project.id),
    }));

  const renderTaskBar = (task) => {
    const startDate = task.dateDebut ? new Date(task.dateDebut) : timelineStart;
    const endDate = task.dateFin ? new Date(task.dateFin) : timelineEnd;
    const startOffset = dayjs(startDate).diff(dayjs(timelineStart), 'day');
    const duration = dayjs(endDate).diff(dayjs(startDate), 'day') || 1;
    const leftPosition = (startOffset / totalDays) * 100;
    const width = (duration / totalDays) * 100;

    return (
      <Box
        key={task.id}
        sx={{
          position: 'absolute',
          left: `${leftPosition}%`,
          width: `${width}%`,
          height: '20px',
          backgroundColor: task.idStatutTache === 1 ? '#ff6d00' : '#1976d2',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          paddingLeft: '8px',
          color: '#fff',
          fontSize: '12px',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          transition: 'all 0.3s ease',
          cursor: 'pointer',
          '&:hover': { opacity: 0.9, transform: 'scale(1.05)' },
        }}
        onClick={() => {
          setSelectedTask(task);
          setOpenDialog(true);
          if (task.assigne) fetchAgentDetails(task.assigne);
          else setAgentDetails(null);
        }}
      >
        {task.titre}
      </Box>
    );
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedTask(null);
    setAgentDetails(null);
  };

  const resetFilters = () => {
    setFilterProject('all');
    setFilterStatus('all');
    setFilterAgent('all');
    setFilterDateStart(null);
    setFilterDateEnd(null);
  };

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error.message}</Alert>;

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Container sx={{ paddingTop: '70px', maxWidth: 'lg' }}>
        <Typography variant="h5" gutterBottom>
          Timeline des Projets et Tâches
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <FormControl sx={{ minWidth: 120 }}>
            <Autocomplete
              options={[{ id: 'all', nomProjet: 'Tous' }, ...projects]}
              getOptionLabel={(option) => option.nomProjet || 'Tous'}
              value={projects.find(p => p.id === filterProject) || { id: 'all', nomProjet: 'Tous' }}
              onChange={(event, newValue) => setFilterProject(newValue ? newValue.id : 'all')}
              renderInput={(params) => (
                <TextField {...params} label="Projet" />
              )}
              noOptionsText="Aucun projet trouvé"
            />
          </FormControl>

          <FormControl sx={{ minWidth: 120 }}>
            <Autocomplete
              options={statuses}
              getOptionLabel={(option) => option.nom}
              value={statuses.find(s => s.id === filterStatus) || { id: 'all', nom: 'Tous' }}
              onChange={(event, newValue) => setFilterStatus(newValue ? newValue.id : 'all')}
              renderInput={(params) => (
                <TextField {...params} label="Statut" />
              )}
              noOptionsText="Aucun statut trouvé"
            />
          </FormControl>

          <FormControl sx={{ minWidth: 120 }}>
            <Autocomplete
              options={[{ id: 'all', nom: 'Tous', prenom: '' }, ...agents]}
              getOptionLabel={(option) => option.nom ? `${option.prenom || ''} ${option.nom}`.trim() : 'Tous'}
              value={agents.find(a => a.id === filterAgent) || { id: 'all', nom: 'Tous', prenom: '' }}
              onChange={(event, newValue) => setFilterAgent(newValue ? newValue.id : 'all')}
              renderInput={(params) => (
                <TextField {...params} label="Agent" />
              )}
              noOptionsText="Aucun agent trouvé"
            />
          </FormControl>

          <DatePicker
            label="Date de début"
            value={filterDateStart}
            onChange={(newValue) => setFilterDateStart(newValue)}
            renderInput={(params) => <TextField {...params} />}
          />

          <DatePicker
            label="Date de fin"
            value={filterDateEnd}
            onChange={(newValue) => setFilterDateEnd(newValue)}
            renderInput={(params) => <TextField {...params} />}
          />

          <Button
            variant="outlined"
            onClick={resetFilters}
            sx={{
              color: '#1e3a5f',
              borderColor: '#1e3a5f',
              '&:hover': { borderColor: '#152a4a' },
              minWidth: 120,
              height: 'fit-content',
              alignSelf: 'center'
            }}
          >
            Réinitialiser
          </Button>
        </Box>

        <Box sx={{ display: 'flex', mb: 2, position: 'relative', overflowX: 'auto' }}>
          {Array.from({ length: weeks }).map((_, index) => {
            const weekStart = dayjs(timelineStart).add(index * 7, 'day');
            return (
              <Box
                key={index}
                sx={{
                  flex: `0 0 ${100 / weeks}%`,
                  textAlign: 'center',
                  borderRight: '1px solid #e0e0e0',
                  padding: '8px 0',
                  backgroundColor: '#f5f5f5',
                  minWidth: '100px',
                }}
              >
                {weekStart.format('DD MMM')}
              </Box>
            );
          })}
        </Box>

        {groupedTasks.length === 0 ? (
          <Typography>Aucun résultat pour ces filtres</Typography>
        ) : (
          groupedTasks.map(({ project, tasks }) => (
            <Paper key={project.id} sx={{ mb: 3, p: 2, borderRadius: 2, boxShadow: 3 }}>
              <Typography variant="h6">{getProjectName(project.id)}</Typography>
              <Divider sx={{ mb: 2 }} />
              {tasks.length === 0 ? (
                <Typography color="textSecondary">Aucune tâche associée</Typography>
              ) : (
                <Box sx={{ position: 'relative' }}>
                  {tasks.map(task => (
                    <Box key={task.id} sx={{ position: 'relative', height: '30px', mb: 1 }}>
                      {renderTaskBar(task)}
                    </Box>
                  ))}
                </Box>
              )}
            </Paper>
          ))
        )}

        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>Détails de la Tâche</DialogTitle>
          <DialogContent>
            {selectedTask && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography><strong>Tâche :</strong> {selectedTask.titre}</Typography>
                <Typography><strong>Projet :</strong> {getProjectName(selectedTask.idProjet)}</Typography>
                <Typography><strong>Référence Projet :</strong> {getProjectReference(selectedTask.idProjet)}</Typography>
                <Typography>
                  <strong>Agent Responsable :</strong>{' '}
                  {agentDetails ? (
                    <span
                      style={{ color: '#1976d2', cursor: 'pointer', textDecoration: 'underline' }}
                      onClick={() => {
                        setFilterAgent(agentDetails.id);
                        setOpenDialog(false);
                      }}
                    >
                      {`${agentDetails.prenom || ''} ${agentDetails.nom || ''}`.trim()}
                    </span>
                  ) : (
                    'Non assigné'
                  )}
                </Typography>
                <Typography>
                  <strong>Date de Début :</strong>{' '}
                  {selectedTask.dateDebut ? dayjs(selectedTask.dateDebut).format('DD/MM/YYYY') : 'Non spécifiée'}
                </Typography>
                <Typography>
                  <strong>Date de Fin :</strong>{' '}
                  {selectedTask.dateFin ? dayjs(selectedTask.dateFin).format('DD/MM/YYYY') : 'Non spécifiée'}
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} color="primary">
              Fermer
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </LocalizationProvider>
  );
};

export default TimelineView;