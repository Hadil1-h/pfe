import React, { useState, useEffect } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress, Alert, useTheme } from '@mui/material';
import { tokens } from '../theme';
import FolderIcon from '@mui/icons-material/Folder';
import DoneIcon from '@mui/icons-material/Done';
import ArchiveIcon from '@mui/icons-material/Archive';
import EventIcon from '@mui/icons-material/Event';
import Chip from '@mui/material/Chip';
import Header from '../components/Header';

const DashboardProject = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedView, setSelectedView] = useState('recent');

  // Fonction pour récupérer les projets
  const fetchProjects = () => {
    fetch('http://localhost:8080/api/projects')
      .then(res => res.ok ? res.json() : Promise.reject(res.statusText))
      .then(data => {
        setProjects(data);
        setLoading(false);
      })
      .catch(err => {
        setError({ message: 'Erreur lors de la récupération des projets.' });
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchProjects();
    const interval = setInterval(fetchProjects, 10000);
    return () => clearInterval(interval);
  }, []);

  // Calcul des statistiques
  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => !p.archived).length;
  const archivedProjects = projects.filter(p => p.archived).length;

  // Projets récents (démarrés dans les 30 derniers jours)
  const recentProjectsCount = projects.filter(p => {
    if (!p.dateDebut || p.archived) return false;
    const today = new Date();
    const startDate = new Date(p.dateDebut);
    const diffDays = (today - startDate) / (1000 * 60 * 60 * 24);
    return diffDays <= 30;
  }).length;

  // Données des statistiques
  const statsData = [
    {
      title: 'Total des projets',
      count: totalProjects,
      icon: <FolderIcon sx={{ color: colors.blueAccent[500], fontSize: '40px' }} />,
    },
    {
      title: 'Projets actifs',
      count: activeProjects,
      icon: <DoneIcon sx={{ color: colors.greenAccent[500], fontSize: '40px' }} />,
    },
    {
      title: 'Projets archivés',
      count: archivedProjects,
      icon: <ArchiveIcon sx={{ color: colors.redAccent[500], fontSize: '40px' }} />,
    },
    {
      title: 'Projets récents',
      count: recentProjectsCount,
      icon: <EventIcon sx={{ color: colors.grey[100], fontSize: '40px' }} />,
    },
  ];

  // Projets à afficher dans le tableau
  const displayedProjects = () => {
    switch (selectedView) {
      case 'total':
        return projects;
      case 'active':
        return projects.filter(p => !p.archived);
      case 'archived':
        return projects.filter(p => p.archived);
      case 'recent':
      default:
        return projects
          .filter(p => !p.archived)
          .sort((a, b) => new Date(b.dateDebut) - new Date(a.dateDebut))
          .slice(0, 5);
    }
  };

  // Titre du tableau
  const tableTitle = () => {
    switch (selectedView) {
      case 'total':
        return 'Tous les projets';
      case 'active':
        return 'Projets actifs';
      case 'archived':
        return 'Projets archivés';
      case 'recent':
      default:
        return 'Projets récents';
    }
  };

  return (
    <Box m="20px">
      {/* HEADER */}
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Header title="Tableau de bord Projets" subtitle="Vue d'ensemble des projets" />
      </Box>

      {/* GRID SECTION - STATISTIQUES DES PROJETS */}
      {loading ? (
        <CircularProgress />
      ) : error ? (
        <Alert severity="error">{error.message}</Alert>
      ) : (
        <>
          <Box display="grid" gridTemplateColumns="repeat(12, 1fr)" gap="20px" mt="20px">
            {statsData.map((item, index) => (
              <Box
                key={index}
                gridColumn="span 3"
                backgroundColor={colors.primary[400]}
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                p="20px"
                borderRadius="8px"
                textAlign="center"
                sx={{ cursor: 'pointer' }}
                onClick={() => setSelectedView(item.title.toLowerCase().includes('total') ? 'total' : 
                             item.title.toLowerCase().includes('actifs') ? 'active' : 
                             item.title.toLowerCase().includes('archivés') ? 'archived' : 'recent')}
              >
                {item.icon}
                <Typography variant="h5" fontWeight="bold" color={colors.grey[100]} mt="10px">
                  {item.count}
                </Typography>
                <Typography variant="body1" color={colors.grey[300]}>
                  {item.title}
                </Typography>
              </Box>
            ))}
          </Box>

          {/* Tableau des projets */}
          <Typography variant="h6" gutterBottom sx={{ mt: 4, fontWeight: 'medium', color: colors.grey[100] }}>
            {tableTitle()}
          </Typography>
          <TableContainer sx={{ backgroundColor: colors.primary[400], borderRadius: '8px' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: colors.grey[100] }}>Référence</TableCell>
                  <TableCell sx={{ color: colors.grey[100] }}>Nom du projet</TableCell>
                  <TableCell sx={{ color: colors.grey[100] }}>Statut</TableCell>
                  <TableCell sx={{ color: colors.grey[100] }}>Date de début</TableCell>
                  <TableCell sx={{ color: colors.grey[100] }}>Type</TableCell>
                  <TableCell sx={{ color: colors.grey[100] }}>Société</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {displayedProjects().length > 0 ? (
                  displayedProjects().map(project => (
                    <TableRow key={project.id}>
                      <TableCell sx={{ color: colors.grey[100] }}>{project.reference}</TableCell>
                      <TableCell sx={{ color: colors.grey[100] }}>{project.nomProjet}</TableCell>
                      <TableCell>
                        <Chip
                          label={project.statutProjet?.nom || 'Non spécifié'}
                          color={
                            project.statutProjet?.nom === 'En cours' ? 'primary' :
                            project.statutProjet?.nom === 'Terminé' ? 'success' :
                            'default'
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell sx={{ color: colors.grey[100] }}>{project.dateDebut}</TableCell>
                      <TableCell sx={{ color: colors.grey[100] }}>{project.typeProjet?.nom || 'Non spécifié'}</TableCell>
                      <TableCell sx={{ color: colors.grey[100] }}>{project.societe?.raisonSociale || 'Non spécifié'}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} sx={{ color: colors.grey[100] }}>
                      Aucun projet à afficher.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Box>
  );
};

export default DashboardProject;