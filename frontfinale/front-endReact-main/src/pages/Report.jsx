import React, { useState, useEffect } from 'react';
import {
  Box, Typography, CircularProgress, Alert, useTheme, Button, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Select, MenuItem, FormControl, InputLabel, Snackbar, Autocomplete
} from '@mui/material';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import Header from '../components/Header';
import { tokens } from '../theme';
import axios from 'axios';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import autoTable from 'jspdf-autotable';
import { useTranslation } from 'react-i18next';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Report = () => {
  const { t } = useTranslation();
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterPeriod, setFilterPeriod] = useState('all');
  const [selectedProject, setSelectedProject] = useState(null);
  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [structuredData, setStructuredData] = useState(null);
  const [suggestedQuestions, setSuggestedQuestions] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'error' });

  const fetchData = async () => {
    try {
      const [projectsResponse, tasksResponse] = await Promise.all([
        axios.get('http://localhost:8080/api/projects'),
        axios.get('http://localhost:8080/api/tasks')
      ]);
      if (!Array.isArray(projectsResponse.data) || !Array.isArray(tasksResponse.data)) {
        throw new Error(t('Les données reçues ne sont pas au format attendu.'));
      }
      setProjects(projectsResponse.data);
      setTasks(tasksResponse.data);
      setLoading(false);
    } catch (err) {
      let errorMessage = t('Erreur lors de la récupération des données.');
      if (err.code === 'ERR_NETWORK') {
        errorMessage = t('Impossible de se connecter au serveur. Vérifiez votre connexion ou le backend.');
      } else if (err.response) {
        errorMessage = `${t('Erreur serveur')}: ${err.response.status} - ${err.response.data.message || t('Erreur inconnue.')}`;
      } else {
        errorMessage = err.message || errorMessage;
      }
      setError({ message: errorMessage });
      setLoading(false);
    }
  };

  const fetchSuggestedQuestions = async () => {
    try {
      const normalizedProjects = getFilteredProjects().map(project => ({
        id: parseInt(project.id, 10) || 0,
        nomProjet: project.nomProjet || 'Projet inconnu',
        dateDebut: project.dateDebut || null,
        dateFin: project.dateFin || null,
        statutProjet: project.statutProjet ? { nom: project.statutProjet.nom || 'Inconnu' } : null,
        budget: parseFloat(project.budget) || 0.0,
        archived: !!project.archived,
        societe: project.societe ? { raisonSociale: project.societe.raisonSociale || 'Inconnu' } : null,
      }));

      const normalizedTasks = tasks.map(task => ({
        id: parseInt(task.id, 10) || 0,
        idProjet: parseInt(task.idProjet, 10) || 0,
        dateFin: task.dateFin || null,
        idStatutTache: parseInt(task.idStatutTache, 10) || 0,
      }));

      const payload = {
        projects: normalizedProjects,
        tasks: normalizedTasks,
        language: 'fr',
      };

      const response = await axios.post('http://localhost:8000/api/ai/suggest-questions', payload);
      let questions = response.data.questions || [];
      if (!Array.isArray(questions)) {
        throw new Error(t('Les questions suggérées ne sont pas au format attendu.'));
      }
      const projectSpecificQuestions = normalizedProjects.flatMap(project => [
        `Comment motiver l'équipe du projet ${project.nomProjet} ?`,
        `Comment gérer les retards du projet ${project.nomProjet} ?`
      ]);
      questions = [...new Set([
        ...questions,
        ...projectSpecificQuestions,
        "Comment motiver les agents ?"
      ])];
      setSuggestedQuestions(questions.slice(0, 10));
    } catch (err) {
      setSuggestedQuestions(["Comment motiver les agents ?"]);
      setSnackbar({
        open: true,
        message: `${t('Erreur lors de la récupération des questions suggérées : ')} ${err.response?.data?.detail || err.message}`,
        severity: 'error',
      });
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (projects.length > 0 || tasks.length > 0) {
      fetchSuggestedQuestions();
    }
  }, [projects, tasks, filterPeriod]);

  const getFilteredProjects = () => {
    const today = new Date();
    let filtered = projects.filter(project => {
      if (filterPeriod === 'all') return true;
      const startDate = new Date(project.dateDebut);
      const diffDays = (today - startDate) / (1000 * 60 * 60 * 24);
      if (filterPeriod === '30days') return diffDays <= 30;
      if (filterPeriod === '90days') return diffDays <= 90;
      return true;
    });
    if (selectedProject) {
      filtered = filtered.filter(project => project.id === selectedProject.id);
    }
    return filtered;
  };

  const filteredProjects = getFilteredProjects();
  const totalProjects = filteredProjects.length;
  const activeProjects = filteredProjects.filter(p => !p.archived).length;
  const completedProjects = filteredProjects.filter(p => p.statutProjet?.nom === 'Terminé' || p.statutProjet?.nom === 'Clôturé').length;
  const delayedProjects = filteredProjects.filter(p => {
    if (!p.dateFin || p.statutProjet?.nom === 'Terminé') return false;
    return new Date(p.dateFin) < new Date();
  });
  const totalBudget = filteredProjects.reduce((sum, p) => sum + (p.budget || 0), 0);
  const delayedTasks = tasks.filter(t => {
    if (!t.dateFin || t.idStatutTache === 3) return false;
    if (selectedProject && t.idProjet !== selectedProject.id) return false;
    return new Date(t.dateFin) < new Date();
  });

  const chartData = {
    labels: [t('Total'), t('Actifs'), t('Terminés'), t('En retard')],
    datasets: [
      {
        label: t('Nombre de projets'),
        data: [totalProjects, activeProjects, completedProjects, delayedProjects.length],
        backgroundColor: [
          colors.blueAccent[500],
          colors.greenAccent[500],
          colors.grey[100],
          colors.redAccent[500],
        ],
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top', labels: { color: colors.grey[100] } },
      title: { display: true, text: t('Répartition des projets'), color: colors.grey[100] },
    },
    scales: {
      y: { beginAtZero: true, ticks: { color: colors.grey[100] } },
      x: { ticks: { color: colors.grey[100] } },
    },
  };

  const handleAiQuery = async () => {
    if (!aiQuery) {
      setSnackbar({ open: true, message: t('Veuillez entrer une question.'), severity: 'error' });
      return;
    }
    try {
      const normalizedProjects = filteredProjects.map(project => ({
        id: parseInt(project.id, 10) || 0,
        nomProjet: project.nomProjet || 'Projet inconnu',
        dateDebut: project.dateDebut || null,
        dateFin: project.dateFin || null,
        statutProjet: project.statutProjet ? { nom: project.statutProjet.nom || 'Inconnu' } : null,
        budget: parseFloat(project.budget) || 0.0,
        archived: !!project.archived,
        societe: project.societe ? { raisonSociale: project.societe.raisonSociale || 'Inconnu' } : null,
      }));

      const normalizedTasks = tasks.map(task => ({
        id: parseInt(task.id, 10) || 0,
        idProjet: parseInt(task.idProjet, 10) || 0,
        dateFin: task.dateFin || null,
        idStatutTache: parseInt(task.idStatutTache, 10) || 0,
      }));

      const payload = {
        query: aiQuery,
        projects: normalizedProjects,
        tasks: normalizedTasks,
        filterPeriod,
        language: 'fr',
      };

      const response = await axios.post('http://localhost:8000/api/ai/analyze', payload);
      setAiResponse(response.data.response || t('Aucune réponse disponible.'));
      setStructuredData(response.data.structured_data || null);
      setSnackbar({ open: true, message: t('Analyse IA effectuée.'), severity: 'success' });
    } catch (err) {
      setAiResponse(t('Erreur lors de l\'analyse IA.'));
      let errorMessage = t('Erreur lors de la requête IA.');
      if (err.code === 'ERR_NETWORK') {
        errorMessage = t('Impossible de se connecter au serveur IA. Vérifiez si FastAPI est en cours d\'exécution.');
      } else if (err.response) {
        errorMessage = `${t('Erreur serveur')}: ${err.response.status} - ${JSON.stringify(err.response.data.detail, null, 2)}`;
      } else {
        errorMessage = err.message || errorMessage;
      }
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
    }
  };

  const generateAIReport = async () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      let yOffset = margin;
      const today = new Date().toLocaleDateString('fr-FR');

      // Helper function to add footer
      const addFooter = () => {
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          doc.setFontSize(8);
          doc.setTextColor(150);
          doc.text(
            `${t('Rapport Généré le')} ${today} | Page ${i} / ${pageCount}`,
            pageWidth / 2,
            pageHeight - 10,
            { align: 'center' }
          );
        }
      };

      // Cover Page
      doc.setFontSize(30);
      doc.setFont('helvetica', 'bold');
      const reportTitle = selectedProject ? `${t('Rapport du Projet')} ${selectedProject.nomProjet}` : t('Rapport Général des Projets');
      doc.text(reportTitle, pageWidth / 2, pageHeight / 3, { align: 'center' });
      doc.setFontSize(16);
      doc.setFont('helvetica', 'normal');
      doc.text(t('Généré par IA'), pageWidth / 2, pageHeight / 3 + 20, { align: 'center' });
      doc.setFontSize(12);
      doc.text(`${t('Date')}: ${today}`, pageWidth / 2, pageHeight / 3 + 40, { align: 'center' });
      doc.addPage();

      // Table of Contents
      yOffset = margin;
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(t('Tableau des Matières'), margin, yOffset);
      yOffset += 10;
      const toc = [
        { title: t('Résumé Exécutif'), section: 1 },
        selectedProject ? 
          { title: t('Détails du Projet'), section: 2 } :
          { title: t('Statistiques des Projets'), section: 2 },
        { title: t('Analyse des Tâches'), section: 3 },
        { title: t('Projets/Tâches en Retard'), section: 4 },
        { title: t('Analyse IA et Recommandations'), section: 5 },
      ];
      toc.forEach((item, index) => {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(`${item.section}. ${item.title}`, margin + 5, yOffset);
        doc.text('...', margin + 100, yOffset);
        doc.text(`${index + 2}`, pageWidth - margin - 10, yOffset);
        yOffset += 7;
      });
      doc.addPage();

      // Section 1: Executive Summary
      yOffset = margin;
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(t('1. Résumé Exécutif'), margin, yOffset);
      yOffset += 10;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      const summaryText = selectedProject
        ? t('Ce rapport fournit une analyse détaillée du projet ') + selectedProject.nomProjet + t('. Il inclut les détails du projet, l\'état des tâches, les retards, et des recommandations basées sur une analyse IA.')
        : t('Ce rapport offre un aperçu complet des projets en cours, avec des statistiques globales, une analyse des tâches, des projets en retard, et des recommandations basées sur une analyse IA.');
      const splitSummary = doc.splitTextToSize(summaryText, pageWidth - 2 * margin);
      doc.text(splitSummary, margin, yOffset);
      yOffset += splitSummary.length * 7 + 10;
      if (!selectedProject) {
        const summaryStats = [
          `${t('Total des Projets')}: ${totalProjects}`,
          `${t('Projets Actifs')}: ${activeProjects}`,
          `${t('Projets Terminés')}: ${completedProjects}`,
          `${t('Projets en Retard')}: ${delayedProjects.length}`,
          `${t('Budget Total')}: $${totalBudget.toFixed(2)}`,
        ];
        autoTable(doc, {
          startY: yOffset,
          body: summaryStats.map(stat => [stat]),
          theme: 'plain',
          styles: { fontSize: 10, cellPadding: 2 },
        });
        yOffset = doc.lastAutoTable.finalY + 10;
      }
      doc.addPage();

      // Section 2: Project Details or Statistics
      yOffset = margin;
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(selectedProject ? t('2. Détails du Projet') : t('2. Statistiques des Projets'), margin, yOffset);
      yOffset += 10;

      if (selectedProject) {
        // Project Details
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        const projectDetails = [
          { title: t('Nom du Projet'), value: selectedProject.nomProjet || 'N/A' },
          { title: t('Statut'), value: selectedProject.statutProjet?.nom || t('Non spécifié') },
          { title: t('Date de Début'), value: selectedProject.dateDebut || 'N/A' },
          { title: t('Date de Fin'), value: selectedProject.dateFin || 'N/A' },
          { title: t('Budget'), value: `$${selectedProject.budget?.toFixed(2) || 0}` },
          { title: t('Société'), value: selectedProject.societe?.raisonSociale || t('Non spécifié') },
          { title: t('Archivé'), value: selectedProject.archived ? t('Oui') : t('Non') },
        ];
        autoTable(doc, {
          startY: yOffset,
          head: [[t('Attribut'), t('Valeur')]],
          body: projectDetails.map(detail => [detail.title, detail.value]),
          theme: 'grid',
          headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
          styles: { fontSize: 10, cellPadding: 4 },
        });
        yOffset = doc.lastAutoTable.finalY + 10;
      } else {
        // General Statistics
        const stats = [
          { title: t('Total des projets'), value: totalProjects },
          { title: t('Projets actifs'), value: activeProjects },
          { title: t('Projets terminés'), value: completedProjects },
          { title: t('Projets en retard'), value: delayedProjects.length },
          { title: t('Budget total'), value: `$${totalBudget.toFixed(2)}` },
          { title: t('Tâches en retard'), value: delayedTasks.length },
        ];
        autoTable(doc, {
          startY: yOffset,
          head: [[t('Statistique'), t('Valeur')]],
          body: stats.map(stat => [stat.title, stat.value]),
          theme: 'grid',
          headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
          styles: { fontSize: 10, cellPadding: 4 },
        });
        yOffset = doc.lastAutoTable.finalY + 10;

        // Chart
        const chartElement = document.getElementById('project-chart');
        if (chartElement) {
          const canvas = await html2canvas(chartElement);
          const imgData = canvas.toDataURL('image/png');
          const imgWidth = pageWidth - 2 * margin;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          doc.addImage(imgData, 'PNG', margin, yOffset, imgWidth, imgHeight);
          yOffset += imgHeight + 10;
        }
      }
      doc.addPage();

      // Section 3: Task Analysis
      yOffset = margin;
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(t('3. Analyse des Tâches'), margin, yOffset);
      yOffset += 10;
      if (selectedProject) {
        const projectTasks = tasks.filter(t => t.idProjet === selectedProject.id);
        const taskData = projectTasks.map(task => [
          task.titre || 'N/A',
          task.dateFin || 'N/A',
          task.idStatutTache === 3 ? t('Terminée') : t('En cours'),
          task.assigne || t('Non assigné'),
        ]);
        autoTable(doc, {
          startY: yOffset,
          head: [[t('Titre'), t('Date de Fin'), t('Statut'), t('Assigné à')]],
          body: taskData.length > 0 ? taskData : [[t('Aucune tâche associée.'), '', '', '']],
          theme: 'grid',
          headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
          styles: { fontSize: 10, cellPadding: 4 },
        });
        yOffset = doc.lastAutoTable.finalY + 10;
      } else {
        const taskSummary = [
          { title: t('Total des Tâches'), value: tasks.length },
          { title: t('Tâches Terminées'), value: tasks.filter(t => t.idStatutTache === 3).length },
          { title: t('Tâches en Cours'), value: tasks.filter(t => t.idStatutTache !== 3).length },
          { title: t('Tâches en Retard'), value: delayedTasks.length },
        ];
        autoTable(doc, {
          startY: yOffset,
          head: [[t('Métrique'), t('Valeur')]],
          body: taskSummary.map(summary => [summary.title, summary.value]),
          theme: 'grid',
          headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
          styles: { fontSize: 10, cellPadding: 4 },
        });
        yOffset = doc.lastAutoTable.finalY + 10;
      }
      doc.addPage();

      // Section 4: Delayed Projects/Tasks
      yOffset = margin;
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(t('4. Projets/Tâches en Retard'), margin, yOffset);
      yOffset += 10;

      // Delayed Projects
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(t('Projets en Retard'), margin, yOffset);
      yOffset += 7;
      const delayedProjectsData = delayedProjects.map(project => [
        project.nomProjet || 'N/A',
        project.dateFin || 'N/A',
        project.statutProjet?.nom || t('Non spécifié'),
        project.societe?.raisonSociale || t('Non spécifié'),
        delayedTasks.filter(t => t.idProjet === project.id).length,
      ]);
      autoTable(doc, {
        startY: yOffset,
        head: [[
          t('Nom du Projet'),
          t('Date de Fin'),
          t('Statut'),
          t('Société'),
          t('Tâches en Retard'),
        ]],
        body: delayedProjectsData.length > 0 ? delayedProjectsData : [[t('Aucun projet en retard.'), '', '', '', '']],
        theme: 'grid',
        headStyles: { fillColor: [231, 76, 60], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 10, cellPadding: 4 },
      });
      yOffset = doc.lastAutoTable.finalY + 10;

      // Delayed Tasks
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(t('Tâches en Retard'), margin, yOffset);
      yOffset += 7;
      const delayedTaskData = delayedTasks.map(task => [
        task.titre || 'N/A',
        task.dateFin || 'N/A',
        task.assigne || t('Non assigné'),
        projects.find(p => p.id === task.idProjet)?.nomProjet || 'N/A',
      ]);
      autoTable(doc, {
        startY: yOffset,
        head: [[t('Titre'), t('Date de Fin'), t('Assigné à'), t('Projet')]],
        body: delayedTaskData.length > 0 ? delayedTaskData : [[t('Aucune tâche en retard.'), '', '', '']],
        theme: 'grid',
        headStyles: { fillColor: [231, 76, 60], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 10, cellPadding: 4 },
      });
      yOffset = doc.lastAutoTable.finalY + 10;
      doc.addPage();

      // Section 5: AI Analysis and Recommendations
      yOffset = margin;
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(t('5. Analyse IA et Recommandations'), margin, yOffset);
      yOffset += 10;

      if (aiResponse) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(t('Analyse IA'), margin, yOffset);
        yOffset += 7;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        const splitText = doc.splitTextToSize(aiResponse, pageWidth - 2 * margin);
        doc.text(splitText, margin, yOffset);
        yOffset += splitText.length * 7 + 10;

        if (structuredData && structuredData.type) {
          doc.setFontSize(14);
          doc.setFont('helvetica', 'bold');
          doc.text(t('Données Structurées'), margin, yOffset);
          yOffset += 7;
          let structuredText = '';
          if (structuredData.type === 'bar' && Array.isArray(structuredData.project_names)) {
            structuredText = `${t('Projets en Retard')}: ${structuredData.delayed_projects || 0} (${
              structuredData.project_names.length > 0 ? structuredData.project_names.join(', ') : t('Aucun')
            })`;
          } else if (structuredData.type === 'list' && Array.isArray(structuredData.project_names)) {
            structuredText = `${t('Projets Terminés')}: ${structuredData.completed_projects || 0} (${
              structuredData.project_names.length > 0 ? structuredData.project_names.join(', ') : t('Aucun')
            })`;
          } else if (structuredData.type === 'task_count' && Array.isArray(structuredData.projects_with_tasks)) {
            structuredText = `${t('Projets avec le Plus de Tâches')}: ${
              structuredData.projects_with_tasks.length > 0
                ? structuredData.projects_with_tasks
                    .map(p => `${p.nomProjet || 'Inconnu'} (${p.task_count || 0})`)
                    .join(', ')
                : t('Aucun')
            }`;
          } else if (structuredData.type === 'text') {
            structuredText = `${t('Conseils')}: ${structuredData.response || t('Aucun')}`;
          }
          const splitStructuredText = doc.splitTextToSize(structuredText, pageWidth - 2 * margin);
          doc.text(splitStructuredText, margin, yOffset);
          yOffset += splitStructuredText.length * 7 + 10;
        }
      } else {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(t('Aucune analyse IA disponible. Veuillez effectuer une analyse IA avant de générer le rapport.'), margin, yOffset);
        yOffset += 10;
      }

      // Recommendations
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(t('Recommandations'), margin, yOffset);
      yOffset += 7;
      const recommendations = delayedTasks.length > 0 || delayedProjects.length > 0
        ? [
            t('Prioriser les tâches et projets en retard pour respecter les délais.'),
            t('Réévaluer l\'allocation des ressources pour les projets critiques.'),
            t('Organiser des réunions d\'équipe pour discuter des obstacles et des solutions.'),
            t('Utiliser l\'analyse IA pour identifier les tendances et anticiper les problèmes futurs.'),
          ]
        : [
            t('Maintenir la dynamique actuelle des projets pour assurer leur succès.'),
            t('Continuer à utiliser l\'analyse IA pour optimiser la gestion des projets.'),
            t('Planifier des évaluations régulières pour détecter les problèmes potentiels tôt.'),
          ];
      autoTable(doc, {
        startY: yOffset,
        body: recommendations.map(rec => [rec]),
        theme: 'plain',
        styles: { fontSize: 10, cellPadding: 2 },
      });
      yOffset = doc.lastAutoTable.finalY + 10;

      // Add Footer
      addFooter();

      // Save the PDF
      const fileName = selectedProject ? `Rapport_Projet_${selectedProject.nomProjet}_${today}.pdf` : `Rapport_Projets_General_${today}.pdf`;
      doc.save(fileName);
      setSnackbar({ open: true, message: t('Rapport généré avec succès.'), severity: 'success' });
    } catch (err) {
      setSnackbar({
        open: true,
        message: t('Erreur lors de la génération du rapport : ') + err.message,
        severity: 'error',
      });
    }
  };

  return (
    <Box m="20px">
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Header title={t('Rapport des Projets')} subtitle={t('Analyse et insights sur les projets et tâches')} />
      </Box>
      {loading ? (
        <CircularProgress />
      ) : error ? (
        <Alert severity="error">{error.message}</Alert>
      ) : projects.length === 0 && tasks.length === 0 ? (
        <Alert severity="info">{t('Aucun projet ou tâche disponible.')}</Alert>
      ) : projects.length === 0 ? (
        <Alert severity="info">{t('Aucun projet disponible.')}</Alert>
      ) : tasks.length === 0 ? (
        <Alert severity="info">{t('Aucune tâche disponible.')}</Alert>
      ) : (
        <>
          <Box display="flex" gap="20px" mb="20px" alignItems="center">
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>{t('Période')}</InputLabel>
              <Select
                value={filterPeriod}
                onChange={(e) => setFilterPeriod(e.target.value)}
                label={t('Période')}
              >
                <MenuItem value="all">{t('Toutes')}</MenuItem>
                <MenuItem value="30days">{t('30 derniers jours')}</MenuItem>
                <MenuItem value="90days">{t('90 derniers jours')}</MenuItem>
              </Select>
            </FormControl>
            <Autocomplete
              options={projects}
              getOptionLabel={(option) => option.nomProjet || 'N/A'}
              value={selectedProject}
              onChange={(event, newValue) => setSelectedProject(newValue)}
              renderInput={(params) => (
                <TextField {...params} label={t('Sélectionner un Projet')} variant="outlined" />
              )}
              sx={{ minWidth: 300 }}
            />
            <Button
              variant="outlined"
              onClick={generateAIReport}
              sx={{
                color: '#1e3a5f',
                borderColor: '#1e3a5f',
                '&:hover': { borderColor: '#152a4a' },
                minWidth: 120,
              }}
            >
              {t('Générer Rapport IA')}
            </Button>
          </Box>
          <Box display="grid" gridTemplateColumns="repeat(12, 1fr)" gap="20px">
            {[
              { title: t('Total des projets'), count: totalProjects, color: colors.blueAccent[500] },
              { title: t('Projets actifs'), count: activeProjects, color: colors.greenAccent[500] },
              { title: t('Projets terminés'), count: completedProjects, color: colors.grey[100] },
              { title: t('Projets en retard'), count: delayedProjects.length, color: colors.redAccent[500] },
              { title: t('Budget total'), count: `$${totalBudget.toFixed(2)}`, color: colors.blueAccent[500] },
              { title: t('Tâches en retard'), count: delayedTasks.length, color: colors.redAccent[500] },
            ].map((stat, index) => (
              <Box
                key={index}
                gridColumn="span 2"
                backgroundColor={colors.primary[400]}
                p="20px"
                borderRadius="8px"
                textAlign="center"
              >
                <Typography variant="h5" fontWeight="bold" color={stat.color}>
                  {stat.count}
                </Typography>
                <Typography variant="body1" color={colors.grey[300]}>
                  {stat.title}
                </Typography>
              </Box>
            ))}
          </Box>
          {!selectedProject && (
            <Box mt="20px" backgroundColor={colors.primary[400]} p="20px" borderRadius="8px">
              <Bar id="project-chart" data={chartData} options={chartOptions} />
            </Box>
          )}
          <Typography variant="h6" gutterBottom sx={{ mt: 4, color: colors.grey[100] }}>
            {t('Projets en retard')}
          </Typography>
          <TableContainer sx={{ backgroundColor: colors.primary[400], borderRadius: '8px' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: colors.grey[100] }}>{t('Nom du projet')}</TableCell>
                  <TableCell sx={{ color: colors.grey[100] }}>{t('Date de fin')}</TableCell>
                  <TableCell sx={{ color: colors.grey[100] }}>{t('Statut')}</TableCell>
                  <TableCell sx={{ color: colors.grey[100] }}>{t('Société')}</TableCell>
                  <TableCell sx={{ color: colors.grey[100] }}>{t('Tâches en retard')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {delayedProjects.length > 0 ? (
                  delayedProjects.map(project => (
                    <TableRow key={project.id}>
                      <TableCell sx={{ color: colors.grey[100] }}>{project.nomProjet || 'N/A'}</TableCell>
                      <TableCell sx={{ color: colors.grey[100] }}>{project.dateFin || 'N/A'}</TableCell>
                      <TableCell sx={{ color: colors.grey[100] }}>{project.statutProjet?.nom || t('Non spécifié')}</TableCell>
                      <TableCell sx={{ color: colors.grey[100] }}>{project.societe?.raisonSociale || t('Non spécifié')}</TableCell>
                      <TableCell sx={{ color: colors.grey[100] }}>
                        {delayedTasks.filter(t => t.idProjet === project.id).length}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} sx={{ color: colors.grey[100] }}>
                      {t('Aucun projet en retard.')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <Box mt="20px" backgroundColor={colors.primary[400]} p="20px" borderRadius="8px">
            <Typography variant="h6" gutterBottom sx={{ color: colors.grey[100] }}>
              {t('Analyse IA')}
            </Typography>
            <TextField
              label={t('Posez une question sur les projets ou tâches')}
              variant="outlined"
              fullWidth
              value={aiQuery}
              onChange={(e) => setAiQuery(e.target.value)}
              sx={{ mb: 2 }}
            />
            <Box mt="10px" mb="20px">
              <Typography variant="body2" color={colors.grey[300]}>
                {t('Questions suggérées :')}
              </Typography>
              {suggestedQuestions.length > 0 ? (
                suggestedQuestions.map((q, index) => (
                  <Button
                    key={index}
                    variant="outlined"
                    size="small"
                    onClick={() => setAiQuery(q)}
                    sx={{ mr: 1, mt: 1 }}
                  >
                    {q}
                  </Button>
                ))
              ) : (
                <Typography variant="body2" color={colors.grey[300]}>
                  {t('Aucune suggestion disponible. Essayez de modifier la période de filtre.')}
                </Typography>
              )}
            </Box>
            <Button
              variant="contained"
              onClick={handleAiQuery}
              sx={{
                backgroundColor: '#1e3a5f',
                '&:hover': { backgroundColor: '#152a4a' },
                minWidth: 120,
              }}
            >
              {t('Analyser')}
            </Button>
            {aiResponse && (
              <Box mt="20px">
                <Typography variant="body1" color={colors.grey[100]}>
                  {aiResponse}
                </Typography>
                {structuredData && structuredData.type && (
                  <Box mt="10px">
                    <Typography variant="body2" color={colors.grey[300]}>
                      {t('Données structurées :')}
                    </Typography>
                    {structuredData.type === 'bar' && Array.isArray(structuredData.project_names) && (
                      <Typography variant="body2" color={colors.grey[100]}>
                        {t('Projets en retard')} : {structuredData.delayed_projects || 0} (
                        {structuredData.project_names.length > 0 ? structuredData.project_names.join(', ') : t('Aucun')})
                      </Typography>
                    )}
                    {structuredData.type === 'list' && Array.isArray(structuredData.project_names) && (
                      <Typography variant="body2" color={colors.grey[100]}>
                        {t('Projets terminés')} : {structuredData.completed_projects || 0} (
                        {structuredData.project_names.length > 0 ? structuredData.project_names.join(', ') : t('Aucun')})
                      </Typography>
                    )}
                    {structuredData.type === 'task_count' && Array.isArray(structuredData.projects_with_tasks) && (
                      <Typography variant="body2" color={colors.grey[100]}>
                        {t('Projets avec le plus de tâches')} :{' '}
                        {structuredData.projects_with_tasks.length > 0
                          ? structuredData.projects_with_tasks
                              .map(p => `${p.nomProjet || 'Inconnu'} (${p.task_count || 0})`)
                              .join(', ')
                          : t('Aucun')}
                      </Typography>
                    )}
                    {structuredData.type === 'text' && (
                      <Typography variant="body2" color={colors.grey[100]}>
                        {t('Conseils')} : {structuredData.response || t('Aucun')}
                      </Typography>
                    )}
                  </Box>
                )}
              </Box>
            )}
          </Box>
          <Snackbar
            open={snackbar.open}
            autoHideDuration={3000}
            onClose={() => setSnackbar({ ...snackbar, open: false })}
          >
            <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
          </Snackbar>
        </>
      )}
    </Box>
  );
};

export default Report;