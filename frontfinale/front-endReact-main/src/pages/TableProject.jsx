import React, { useState, useEffect } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress, Box,
  Container, Button, Dialog, DialogActions, DialogContent, DialogTitle, Snackbar,
  Typography, TextField, Alert, Select, MenuItem, InputLabel, FormControl, IconButton
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import FilterListIcon from '@mui/icons-material/FilterList';

// Fonction améliorée pour calculer le budget d'un projet
const calculateProjectBudget = (project, tasks) => {
  if (!tasks || tasks.length === 0) return 0;
  
  return tasks.reduce((total, tache) => {
    if (!tache) return total;
    
    // Pour les collaborateurs externes (durée * prix par heure)
    if (tache.assigne?.type_Agent === 'collaborateur') {
      const duration = tache.dure || '00:00';
      const [hours, minutes] = duration.split(':').map(Number);
      const durationInHours = hours + (minutes / 60);
      const hourlyRate = tache.prix || tache.assigne?.prixParHeure || 0;
      return total + (durationInHours * hourlyRate);
    } 
    // Pour les salariés internes (salaire)
    else if (tache.assigne?.type_Agent === 'salarie') {
      return total + (tache.prix || tache.assigne?.salaire || 0);
    }
    // Cas par défaut (si le type n'est pas spécifié)
    return total + (tache.prix || 0);
  }, 0);
};

// Nouvelle fonction pour mettre à jour les dates de fin des projets
const updateProjectEndDates = (projects, tasks) => {
  // Grouper les tâches par projet
  const tasksByProject = tasks.reduce((acc, task) => {
    const projectId = task.idProjet;
    if (!acc[projectId]) acc[projectId] = [];
    acc[projectId].push(task);
    return acc;
  }, {});

  // Mettre à jour la date de fin de chaque projet
  return projects.map(project => {
    const projectTasks = tasksByProject[project.id] || [];
    
    // Trouver la date de fin la plus tardive parmi les tâches
    const latestEndDate = projectTasks
      .filter(task => task.dateFin)
      .map(task => new Date(task.dateFin))
      .reduce((latest, current) => {
        return latest > current ? latest : current;
      }, null);

    // Si aucune date de fin n'est trouvée, garder la date de fin existante ou null
    return {
      ...project,
      dateFin: latestEndDate ? latestEndDate.toISOString() : project.dateFin || null
    };
  });
};

const TableProject = () => {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [clients, setClients] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterValue, setFilterValue] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [sortField, setSortField] = useState('id');
  const [sortDirection, setSortDirection] = useState('desc');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [alreadyArchivedDialogOpen, setAlreadyArchivedDialogOpen] = useState(false);
  const [notCompletedDialogOpen, setNotCompletedDialogOpen] = useState(false);
  const [archiveAlertOpen, setArchiveAlertOpen] = useState(false);
  const [projectToArchive, setProjectToArchive] = useState(null);

  const navigate = useNavigate();

  // Récupérer les projets, les tâches et les clients
  const fetchData = async () => {
    setLoading(true);
    try {
      // Récupérer les projets avec tentative d'expand client
      let projectsData;
      try {
        const projectsResponse = await fetch('http://localhost:8080/api/projects?_expand=client');
        if (!projectsResponse.ok) throw new Error('Erreur lors de la récupération des projets avec _expand');
        projectsData = await projectsResponse.json();
        console.log('Projects Data (_expand=client):', projectsData); // Debug: Vérifier les données avec _expand
      } catch (expandError) {
        console.warn('Échec de _expand=client, tentative sans _expand:', expandError.message);
        const projectsResponse = await fetch('http://localhost:8080/api/projects');
        if (!projectsResponse.ok) throw new Error('Erreur lors de la récupération des projets');
        projectsData = await projectsResponse.json();
        console.log('Projects Data (sans _expand):', projectsData); // Debug: Vérifier les données sans _expand
      }

      // Récupérer toutes les tâches
      const tasksResponse = await fetch('http://localhost:8080/api/tasks?_expand=assigne');
      if (!tasksResponse.ok) throw new Error('Erreur lors de la récupération des tâches');
      const tasksData = await tasksResponse.json();
      console.log('Tasks Data:', tasksData); // Debug: Vérifier les données des tâches

      // Récupérer tous les clients
      let clientsData = [];
      try {
        const clientsResponse = await fetch('http://localhost:8080/api/clients');
        if (!clientsResponse.ok) throw new Error('Erreur lors de la récupération des clients');
        clientsData = await clientsResponse.json();
        console.log('Clients Data:', clientsData); // Debug: Vérifier les données des clients
      } catch (clientError) {
        console.warn('Erreur lors de la récupération des clients:', clientError.message);
      }

      // Créer une map des clients par ID pour un accès rapide
      const clientsMap = clientsData.reduce((acc, client) => {
        acc[client.id] = client;
        return acc;
      }, {});
      console.log('Clients Map:', clientsMap); // Debug: Vérifier la map des clients

      // Grouper les tâches par projet
      const tasksByProject = tasksData.reduce((acc, task) => {
        const projectId = task.idProjet;
        if (!acc[projectId]) acc[projectId] = [];
        acc[projectId].push(task);
        return acc;
      }, {});

      // Calculer le budget pour chaque projet et associer les tâches et clients
      let projectsWithBudget = projectsData.map(project => {
        // Vérifier si le client est déjà inclus (via _expand) ou utiliser id_client
        let client = project.client || null;
        if (!client && project.id_client) {
          client = clientsMap[project.id_client] || null;
        }
        console.log(`Project ID ${project.id}: id_client=${project.id_client}, client=`, client); // Debug: Vérifier l'association client
        return {
          ...project,
          budget: calculateProjectBudget(project, tasksByProject[project.id] || []),
          taches: tasksByProject[project.id] || [],
          client: client
        };
      });

      // Mettre à jour les dates de fin des projets en fonction des tâches
      projectsWithBudget = updateProjectEndDates(projectsWithBudget, tasksData);

      setProjects(projectsWithBudget);
      setTasks(tasksData);
      setClients(clientsData);
      applyFiltersAndSort(projectsWithBudget, searchTerm, filterType, filterValue, sortField, sortDirection);
    } catch (err) {
      console.error('Fetch Error:', err); // Debug: Loguer l'erreur
      setError({ message: err.message || 'Erreur lors du chargement des données' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Gérer le tri
  const handleSort = (field) => {
    const isAsc = sortField === field && sortDirection === 'asc';
    setSortField(field);
    setSortDirection(isAsc ? 'desc' : 'asc');
    applyFiltersAndSort(projects, searchTerm, filterType, filterValue, field, isAsc ? 'desc' : 'asc');
  };

  // Appliquer les filtres et le tri
  const applyFiltersAndSort = (data, search, type, value, sort, direction) => {
    let filtered = [...data];

    // Filtre de recherche
    if (search) {
      filtered = filtered.filter(project =>
        project.nomProjet?.toLowerCase().includes(search.toLowerCase()) ||
        project.reference?.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Filtre par type
    if (type && value) {
      switch (type) {
        case 'status':
          filtered = filtered.filter(project => project.statutProjet?.nom === value);
          break;
        case 'type':
          filtered = filtered.filter(project => project.typeProjet?.nom === value);
          break;
        case 'client':
          filtered = filtered.filter(project => project.client?.nom === value);
          break;
        default:
          break;
      }
    }

    // Tri
    filtered.sort((a, b) => {
      let valueA, valueB;
      switch (sort) {
        case 'nomProjet':
          valueA = a.nomProjet?.toLowerCase() || '';
          valueB = b.nomProjet?.toLowerCase() || '';
          break;
        case 'dateDebut':
          valueA = new Date(a.dateDebut || 0);
          valueB = new Date(b.dateDebut || 0);
          break;
        case 'budget':
          valueA = a.budget || 0;
          valueB = b.budget || 0;
          break;
        case 'reference':
          valueA = a.reference || '';
          valueB = b.reference || '';
          break;
        default:
          valueA = a.id || 0;
          valueB = b.id || 0;
      }
      if (valueA < valueB) return direction === 'asc' ? -1 : 1;
      if (valueA > valueB) return direction === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredProjects(filtered);
  };

  return (
    <Container sx={{ paddingTop: '70px' }}>
      <div className="project-table">
        {/* En-tête avec boutons */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <Button
            variant="contained"
            sx={{
              backgroundColor: '#1e3a5f',
              '&:hover': { backgroundColor: '#152a4a' },
              minWidth: 120,
            }}
            onClick={() => navigate('/createProject')}
          >
            Créer un projet
          </Button>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton onClick={() => setShowFilter(!showFilter)}>
              <FilterListIcon />
            </IconButton>
            <Button
              variant="outlined"
              sx={{
                color: '#1e3a5f',
                borderColor: '#1e3a5f',
                '&:hover': { borderColor: '#152a4a' },
                minWidth: 120,
              }}
              onClick={() => {
                setSearchTerm('');
                setFilterType('');
                setFilterValue('');
                setSortField('id');
                setSortDirection('desc');
                applyFiltersAndSort(projects, '', '', '', 'id', 'desc');
              }}
            >
              Réinitialiser
            </Button>
          </Box>
        </Box>

        {/* Barre de recherche et filtres */}
        <Box sx={{ display: 'flex', gap: 2, marginBottom: '20px', flexWrap: 'wrap' }}>
          <TextField
            label="Rechercher par nom ou référence"
            variant="outlined"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              applyFiltersAndSort(projects, e.target.value, filterType, filterValue, sortField, sortDirection);
            }}
            sx={{ flex: 1, minWidth: 250 }}
            placeholder="Saisissez pour filtrer..."
          />
          
          {showFilter && (
            <>
              <FormControl sx={{ minWidth: 150 }}>
                <InputLabel>Type de filtre</InputLabel>
                <Select
                  value={filterType}
                  onChange={(e) => {
                    setFilterType(e.target.value);
                    setFilterValue('');
                    applyFiltersAndSort(projects, searchTerm, e.target.value, '', sortField, sortDirection);
                  }}
                  label="Type de filtre"
                >
                  <MenuItem value="">Aucun</MenuItem>
                  <MenuItem value="status">Statut</MenuItem>
                  <MenuItem value="type">Type</MenuItem>
                  <MenuItem value="client">Nom Client</MenuItem>
                </Select>
              </FormControl>
              
              {filterType && (
                <FormControl sx={{ minWidth: 150 }}>
                  <InputLabel>Valeur</InputLabel>
                  <Select
                    value={filterValue}
                    onChange={(e) => {
                      setFilterValue(e.target.value);
                      applyFiltersAndSort(projects, searchTerm, filterType, e.target.value, sortField, sortDirection);
                    }}
                    label="Valeur"
                  >
                    <MenuItem value="">Tous</MenuItem>
                    {filterType === 'status' && [...new Set(projects.map(p => p.statutProjet?.nom).filter(Boolean))].map(option => (
                      <MenuItem key={option} value={option}>{option}</MenuItem>
                    ))}
                    {filterType === 'type' && [...new Set(projects.map(p => p.typeProjet?.nom).filter(Boolean))].map(option => (
                      <MenuItem key={option} value={option}>{option}</MenuItem>
                    ))}
                    {filterType === 'client' && [...new Set(projects.map(p => p.client?.nom).filter(Boolean))].map(option => (
                      <MenuItem key={option} value={option}>{option}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </>
          )}
        </Box>

        {/* Tableau ou états de chargement/erreur */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error.message}
            <Button onClick={fetchData} sx={{ ml: 2 }}>Réessayer</Button>
          </Alert>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell onClick={() => handleSort('reference')} style={{ cursor: 'pointer' }}>
                      Référence {sortField === 'reference' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </TableCell>
                    <TableCell onClick={() => handleSort('nomProjet')} style={{ cursor: 'pointer' }}>
                      Nom du projet {sortField === 'nomProjet' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell onClick={() => handleSort('dateDebut')} style={{ cursor: 'pointer' }}>
                      Début {sortField === 'dateDebut' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </TableCell>
                    <TableCell>Fin</TableCell>
                    <TableCell onClick={() => handleSort('budget')} style={{ cursor: 'pointer' }}>
                      Budget {sortField === 'budget' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </TableCell>
                    <TableCell>Statut</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Nom Client</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredProjects.map(project => (
                    <TableRow key={project.id}>
                      <TableCell>{project.reference || 'N/A'}</TableCell>
                      <TableCell>{project.nomProjet || 'N/A'}</TableCell>
                      <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {project.description || 'N/A'}
                      </TableCell>
                      <TableCell>{project.dateDebut ? new Date(project.dateDebut).toLocaleDateString() : 'N/A'}</TableCell>
                      <TableCell>{project.dateFin ? new Date(project.dateFin).toLocaleDateString() : 'N/A'}</TableCell>
                      <TableCell>
                        {project.budget?.toLocaleString('fr-FR') || '0.00'}
                        {project.taches?.length > 0 && (
                          <Typography variant="caption" display="block" color="text.secondary">
                            {project.taches.length} tâche(s)
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>{project.statutProjet?.nom || 'Non spécifié'}</TableCell>
                      <TableCell>{project.typeProjet?.nom || 'Non spécifié'}</TableCell>
                      <TableCell>
                        {project.client?.nom || `Non spécifié (id_client: ${project.id_client || project.client?.id || 'N/A'})`}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            variant="outlined"
                            sx={{
                              color: '#1e3a5f',
                              borderColor: '#1e3a5f',
                              '&:hover': { borderColor: '#152a4a' },
                              minWidth: 120,
                            }}
                            onClick={() => {
                              if (project.archived) {
                                setAlreadyArchivedDialogOpen(true);
                              } else if (project.statutProjet?.nom !== 'Terminé' && project.statutProjet?.nom !== 'Clôturé') {
                                setNotCompletedDialogOpen(true);
                              } else {
                                setProjectToArchive(project);
                                setArchiveDialogOpen(true);
                              }
                            }}
                            disabled={project.archived}
                          >
                            {project.archived ? 'Archivé' : 'Archiver'}
                          </Button>
                          <Button
                            variant="contained"
                            sx={{
                              backgroundColor: '#1e3a5f',
                              '&:hover': { backgroundColor: '#152a4a' },
                              minWidth: 120,
                            }}
                            onClick={() => navigate(`/editProject/${project.id}`, { state: { project } })}
                          >
                            Modifier
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            {filteredProjects.length === 0 && !loading && (
              <Typography sx={{ mt: 2, textAlign: 'center' }}>Aucun projet trouvé</Typography>
            )}
          </>
        )}
      </div>

      {/* Dialogues d'archivage */}
      <Dialog open={archiveDialogOpen} onClose={() => setArchiveDialogOpen(false)}>
        <DialogTitle>Confirmation d'archivage</DialogTitle>
        <DialogContent>
          <Typography>Êtes-vous sûr de vouloir archiver le projet "{projectToArchive?.nomProjet}" ?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setArchiveDialogOpen(false)}>Annuler</Button>
          <Button onClick={async () => {
            try {
              const response = await fetch(`http://localhost:8080/api/projects/${projectToArchive.id}/archive`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ archived: true }),
              });
              if (!response.ok) throw new Error('Échec de l\'archivage');
              setArchiveAlertOpen(true);
              fetchData();
              setArchiveDialogOpen(false);
            } catch (err) {
              console.error('Archive Error:', err); // Debug: Loguer l'erreur d'archivage
              setError({ message: `Erreur lors de l'archivage: ${err.message}` });
              setArchiveDialogOpen(false);
            }
          }} color="primary">
            Confirmer
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={alreadyArchivedDialogOpen} onClose={() => setAlreadyArchivedDialogOpen(false)}>
        <DialogTitle>Projet déjà archivé</DialogTitle>
        <DialogContent>
          <Typography>Ce projet est déjà archivé et ne peut pas être modifié.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAlreadyArchivedDialogOpen(false)} color="primary">
            Fermer
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={notCompletedDialogOpen} onClose={() => setNotCompletedDialogOpen(false)}>
        <DialogTitle>Archivage impossible</DialogTitle>
        <DialogContent>
          <Typography>Seuls les projets terminés ou clôturés peuvent être archivés.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNotCompletedDialogOpen(false)} color="primary">
            Fermer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Alertes */}
      <Snackbar
        open={archiveAlertOpen}
        autoHideDuration={3000}
        onClose={() => setArchiveAlertOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setArchiveAlertOpen(false)} severity="success" sx={{ width: '100%' }}>
          Le projet a été archivé avec succès.
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default TableProject;