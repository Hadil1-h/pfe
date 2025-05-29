import React, { useState, useEffect, useContext } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Paper,
  Tooltip,
  Divider,
  Chip,
  Snackbar,
  Alert,
  CircularProgress,
  TextField,
} from "@mui/material";
import {
  Info as InfoIcon,
  AccessTime as TimerIcon,
} from "@mui/icons-material";
import axios from "axios";
import { TimerContext } from "../context/TimerContext";
import { AuthContext } from "../context/AuthContext";

// Fonction utilitaire pour formater la durée de HH:mm:ss.fffffff à HH:mm
const formatDuration = (duration) => {
  if (!duration) return "00:00";
  return duration.split(':').slice(0, 2).join(':'); // Prend seulement HH:mm
};

// Fonction pour convertir les secondes en format HH:mm:ss
const secondsToTimeFormat = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.0000000`;
};

// Fonction pour convertir le temps en secondes
const timeToSeconds = (time) => {
  const [hours, minutes, seconds] = time.split(':').map(Number);
  return hours * 3600 + minutes * 60 + (seconds || 0);
};

const TasksByStatus = () => {
  const { user } = useContext(AuthContext);
  const [tasks, setTasks] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [openExtraTimeDialog, setOpenExtraTimeDialog] = useState(false);
  const [extraTime, setExtraTime] = useState("00:10:00"); // Format HH:mm:ss par défaut (10 minutes)
  const [usedExtraTime, setUsedExtraTime] = useState(false); // Suivi du temps supplémentaire
  const {
    activeTimer,
    setActiveTimer,
    remainingTime,
    setRemainingTime,
    timerRunning,
    setTimerRunning,
    snackbar,
    setSnackbar,
    openTimeUpDialog,
    setOpenTimeUpDialog,
    openCompletionDialog,
    setOpenCompletionDialog,
  } = useContext(TimerContext);

  // Fetch tasks and statuses from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tasksRes, statusesRes] = await Promise.all([
          axios.get("http://localhost:8080/api/tasks"),
          axios.get("http://localhost:8080/api/statuts"),
        ]);
        let filteredTasks = tasksRes.data;
        if (user) {
          const userType = user.typeUtilisateur?.toLowerCase();
          if (userType === "agent") {
            filteredTasks = tasksRes.data.filter(task => task.assigne === String(user.id));
          } else if (userType !== "admin") {
            filteredTasks = []; // Non-agent, non-admin users see no tasks
          }
          // Admin sees all tasks, no filtering needed
        } else {
          filteredTasks = []; // No user logged in
        }
        setTasks(filteredTasks);
        setStatuses(statusesRes.data);
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
        setSnackbar({ open: true, message: "Erreur lors du chargement des données", severity: "error" });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [setSnackbar, user]);

  // Trouver les IDs des statuts "En cours" et "Terminé"
  const getStatusId = (statusName) => {
    const status = statuses.find((s) => s.nomStatut.toLowerCase().includes(statusName.toLowerCase()));
    if (!status) {
      console.warn(`Statut "${statusName}" non trouvé dans les statuts:`, statuses);
    }
    return status ? status.id : null;
  };

  const handleInfoClick = (task) => {
    setSelectedTask(task);
    setOpenDialog(true);
  };

  const handleTimerClick = async (task) => {
    console.log("Timer clicked for task:", task);
    if (activeTimer && activeTimer.id === task.id) {
      // Toggle timer
      setTimerRunning(!timerRunning);
      console.log("Toggling timer, new running state:", !timerRunning);
    } else {
      // Vérifier si la tâche est "À faire" et la passer à "En cours"
      const toDoStatusId = getStatusId("À faire");
      const inProgressStatusId = getStatusId("En cours");
      if (task.idStatutTache === toDoStatusId && inProgressStatusId) {
        try {
          const updatedTask = {
            idProjet: task.idProjet,
            titre: task.titre,
            descriptionTache: task.descriptionTache || null,
            idStatutTache: inProgressStatusId,
            periorite: task.periorite,
            prix: task.prix,
            dure: task.dure,
            dateDebut: task.dateDebut || null,
            dateFin: task.dateFin || null,
            assigne: task.assigne ? parseInt(task.assigne) : null,
            avancement: 0, // Initialiser à 0% quand la tâche passe en "En cours"
          };
          console.log("Envoi de la mise à jour du statut 'En cours':", updatedTask);
          await axios.put(`http://localhost:8080/api/tasks/${task.id}`, updatedTask);
          setTasks((prevTasks) =>
            prevTasks.map((t) =>
              t.id === task.id ? { ...t, idStatutTache: inProgressStatusId, avancement: 0 } : t
            )
          );
          setSnackbar({
            open: true,
            message: "Tâche déplacée vers 'En cours'",
            severity: "info",
          });
        } catch (error) {
          console.error("Erreur lors de la mise à jour du statut 'En cours':", {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message,
          });
          setSnackbar({
            open: true,
            message: `Erreur lors du passage à 'En cours': ${error.response?.data?.message || error.message}`,
            severity: "error",
          });
          return; // Arrêter si la mise à jour échoue
        }
      } else if (!inProgressStatusId) {
        console.error("Statut 'En cours' non trouvé");
        setSnackbar({
          open: true,
          message: "Erreur : Statut 'En cours' non trouvé",
          severity: "error",
        });
        return;
      }

      // Parse duration (format: "HH:mm:ss.fffffff")
      const [hours, minutes, seconds] = task.dure.split(':').map(part => parseInt(part.split('.')[0]));
      const totalSeconds = hours * 3600 + minutes * 60 + seconds;

      setActiveTimer(task);
      setRemainingTime(totalSeconds);
      setTimerRunning(true);
      setUsedExtraTime(false); // Réinitialiser à false quand on démarre un nouveau timer
      console.log("Starting new timer:", { task, totalSeconds });
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedTask(null);
  };

  const handleSnackbarClose = () => {
    console.log("Closing snackbar, current snackbar state:", snackbar);
    setSnackbar({ ...snackbar, open: false });
  };

  const handleTimeUpDialogClose = async () => {
    setOpenTimeUpDialog(false);
   
    // Mettre à jour le statut de la tâche à "Terminé" avec avancement
    const completedStatusId = getStatusId("Terminé");
    if (activeTimer && completedStatusId) {
      try {
        // Calculer l'avancement final
        let finalProgress = 100; // Par défaut, 100% si pas de temps supplémentaire
        if (usedExtraTime) {
          // Calculer l'avancement avec la nouvelle formule
          const extraSeconds = timeToSeconds(extraTime);
          const originalSeconds = timeToSeconds(activeTimer.dure);
          const newTotalSeconds = originalSeconds + extraSeconds;
          finalProgress = Math.round((newTotalSeconds * 100) / originalSeconds);
        }

        const updatedTask = {
          idProjet: activeTimer.idProjet,
          titre: activeTimer.titre,
          descriptionTache: activeTimer.descriptionTache || null,
          idStatutTache: completedStatusId,
          periorite: activeTimer.periorite,
          prix: activeTimer.prix,
          dure: activeTimer.dure, // Durée inchangée
          dateDebut: activeTimer.dateDebut || null,
          dateFin: new Date().toISOString().split('T')[0], // Date du jour
          assigne: activeTimer.assigne ? parseInt(activeTimer.assigne) : null,
          avancement: finalProgress, // Avancement calculé
        };
        console.log("Envoi de la mise à jour du statut 'Terminé':", updatedTask);
        await axios.put(`http://localhost:8080/api/tasks/${activeTimer.id}`, updatedTask);
        setTasks((prevTasks) =>
          prevTasks.map((t) =>
            t.id === activeTimer.id ? {
              ...t,
              idStatutTache: completedStatusId,
              avancement: finalProgress,
              dateFin: updatedTask.dateFin
            } : t
          )
        );
        setSnackbar({
          open: true,
          message: `Tâche marquée comme terminée avec succès (Avancement: ${finalProgress}%)`,
          severity: "success",
        });
       
        // Ouvrir le popup de félicitations seulement si pas de temps supplémentaire utilisé
        if (!usedExtraTime) {
          setOpenCompletionDialog(true);
        }
      } catch (error) {
        console.error("Erreur lors de la mise à jour du statut 'Terminé':", {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
        });
        setSnackbar({
          open: true,
          message: `Erreur lors du marquage comme terminé: ${error.response?.data?.message || error.message}`,
          severity: "error",
        });
      }
    } else if (!completedStatusId) {
      console.error("Statut 'Terminé' non trouvé");
      setSnackbar({
        open: true,
        message: "Erreur : Statut 'Terminé' non trouvé",
        severity: "error",
      });
    }

    // Réinitialiser le minuteur
    setActiveTimer(null);
    setRemainingTime(null);
    setTimerRunning(false);
    setUsedExtraTime(false);
  };

  const handleAddExtraTime = () => {
    setOpenTimeUpDialog(false);
    setOpenExtraTimeDialog(true);
  };

  const handleExtraTimeChange = (e) => {
    setExtraTime(e.target.value);
  };

  const handleExtraTimeSubmit = async () => {
    if (!activeTimer) return;

    // Calculer la nouvelle durée totale (pour l'avancement uniquement)
    const extraSeconds = timeToSeconds(extraTime);
    const originalSeconds = timeToSeconds(activeTimer.dure);
    const newTotalSeconds = originalSeconds + extraSeconds;

    // Calculer le nouvel avancement avec la nouvelle formule
    const progressPercentage = Math.round((newTotalSeconds * 100) / originalSeconds);

    try {
      // Mettre à jour la tâche sans modifier la durée
      const updatedTask = {
        idProjet: activeTimer.idProjet,
        titre: activeTimer.titre,
        descriptionTache: activeTimer.descriptionTache || null,
        idStatutTache: getStatusId("En cours"), // Reste en "En cours"
        periorite: activeTimer.periorite,
        prix: activeTimer.prix,
        dure: activeTimer.dure, // Durée inchangée
        dateDebut: activeTimer.dateDebut || null,
        dateFin: null, // Réinitialiser la date de fin
        assigne: activeTimer.assigne ? parseInt(activeTimer.assigne) : null,
        avancement: progressPercentage, // Nouvel avancement
      };

      await axios.put(`http://localhost:8080/api/tasks/${activeTimer.id}`, updatedTask);
     
      // Mettre à jour l'état local
      setTasks((prevTasks) =>
        prevTasks.map((t) =>
          t.id === activeTimer.id ? {
            ...t,
            avancement: progressPercentage,
            idStatutTache: getStatusId("En cours"),
            dateFin: null
          } : t
        )
      );

      // Redémarrer le timer avec SEULEMENT le temps supplémentaire
      setRemainingTime(extraSeconds);
      setTimerRunning(true);
      setUsedExtraTime(true); // Marquer que du temps supplémentaire a été utilisé

      setSnackbar({
        open: true,
        message: `Temps supplémentaire ajouté. Avancement: ${progressPercentage}%`,
        severity: "info",
      });
    } catch (error) {
      console.error("Erreur lors de l'ajout de temps supplémentaire:", error);
      setSnackbar({
        open: true,
        message: `Erreur lors de l'ajout de temps supplémentaire: ${error.response?.data?.message || error.message}`,
        severity: "error",
      });
    }

    setOpenExtraTimeDialog(false);
  };

  const handleCompletionDialogClose = () => {
    setOpenCompletionDialog(false);
  };

  const groupTasksByStatus = () => {
    const grouped = {};
    statuses.forEach((status) => {
      grouped[status.id] = {
        name: status.nomStatut,
        tasks: tasks.filter((task) => task.idStatutTache === status.id),
      };
    });
    return grouped;
  };

  const groupedTasks = groupTasksByStatus();

  if (!user || (user.typeUtilisateur?.toLowerCase() !== 'agent' && user.typeUtilisateur?.toLowerCase() !== 'admin')) {
    return (
      <Box sx={{ paddingTop: "70px", padding: "20px", textAlign: "center" }}>
        <Typography variant="h5" color="error">
          Accès réservé aux agents et admins.
        </Typography>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ paddingTop: "70px", padding: "20px" }}>
      <Typography
        variant="h4"
        sx={{
          fontWeight: "bold",
          color: "#1e3a5f",
          marginBottom: "20px",
        }}
      >
        Tâches par statut
      </Typography>

      {tasks.length === 0 && user.typeUtilisateur?.toLowerCase() === 'agent' ? (
        <Typography variant="h6" sx={{ color: "#666", textAlign: "center" }}>
          Aucune tâche assignée.
        </Typography>
      ) : (
        <Grid container spacing={3}>
          {statuses.map((status) => (
            <Grid item xs={12} md={6} lg={3} key={status.id}>
              <Paper
                elevation={3}
                sx={{
                  p: 2,
                  backgroundColor: "#ffffff",
                  border: "1px solid #e0e0e0",
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    mb: 2,
                    color: "#1e3a5f",
                    fontWeight: "500",
                  }}
                >
                  {status.nomStatut} ({groupedTasks[status.id]?.tasks.length || 0})
                </Typography>

                {groupedTasks[status.id]?.tasks.map((task) => (
                  <Card
                    key={task.id}
                    sx={{
                      mb: 2,
                      backgroundColor: "#f5f5f5",
                      border: "1px solid #e0e0e0",
                    }}
                  >
                    <CardContent>
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="h6" sx={{ color: "#1e3a5f" }}>
                          {task.titre}
                        </Typography>
                        <Box>
                          <Tooltip title="Détails de la tâche">
                            <IconButton onClick={() => handleInfoClick(task)}>
                              <InfoIcon sx={{ color: "#1e3a5f" }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Démarrer le chrono">
                            <IconButton onClick={() => handleTimerClick(task)}>
                              <TimerIcon
                                sx={{
                                  color: activeTimer?.id === task.id ? "#1e3a5f" : "#1e3a5f",
                                }}
                              />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                      <Typography
                        variant="body2"
                        sx={{ mt: 1, color: "#666" }}
                      >
                        {task.descriptionTache?.substring(0, 50)}...
                      </Typography>
                      <Box
                        sx={{
                          mt: 1,
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <Chip
                          label={`Priorité: ${task.periorite}`}
                          size="small"
                          sx={{
                            backgroundColor: "#1e3a5f",
                            color: "white",
                          }}
                        />
                        <Typography variant="caption" sx={{ color: "#666" }}>
                          {task.dateDebut} - {task.dateFin || "En cours"}
                        </Typography>
                      </Box>
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" sx={{ color: "#666" }}>
                          Durée: {formatDuration(task.dure)}
                        </Typography>
                      </Box>
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" sx={{ color: "#666" }}>
                          Avancement: {task.avancement}%
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Task Details Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle sx={{ backgroundColor: "#1e3a5f", color: "white" }}>
          Détails de la tâche
        </DialogTitle>
        <DialogContent sx={{ backgroundColor: "#ffffff" }}>
          {selectedTask && (
            <>
              <DialogContentText sx={{ color: "#1e3a5f" }}>
                <strong>Titre:</strong> {selectedTask.titre}
              </DialogContentText>
              <Divider sx={{ my: 1 }} />
              <DialogContentText sx={{ color: "#1e3a5f" }}>
                <strong>Description:</strong> {selectedTask.descriptionTache || "Aucune description"}
              </DialogContentText>
              <Divider sx={{ my: 1 }} />
              <DialogContentText sx={{ color: "#1e3a5f" }}>
                <strong>Priorité:</strong> {selectedTask.periorite}
              </DialogContentText>
              <Divider sx={{ my: 1 }} />
              <DialogContentText sx={{ color: "#1e3a5f" }}>
                <strong>Durée:</strong> {formatDuration(selectedTask.dure)}
              </DialogContentText>
              <Divider sx={{ my: 1 }} />
              <DialogContentText sx={{ color: "#1e3a5f" }}>
                <strong>Dates:</strong> {selectedTask.dateDebut} - {selectedTask.dateFin || "En cours"}
              </DialogContentText>
              <Divider sx={{ my: 1 }} />
              <DialogContentText sx={{ color: "#1e3a5f" }}>
                <strong>Avancement:</strong> {selectedTask.avancement}%
              </DialogContentText>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ backgroundColor: "#ffffff" }}>
          <Button
            onClick={handleCloseDialog}
            sx={{
              color: "#1e3a5f",
              borderColor: "#1e3a5f",
              "&:hover": { borderColor: "#152a4a" },
            }}
            variant="outlined"
          >
            Fermer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Time Up Dialog */}
      <Dialog open={openTimeUpDialog} onClose={() => {}}>
        <DialogTitle sx={{ backgroundColor: "#1e3a5f", color: "white" }}>
          Temps écoulé
        </DialogTitle>
        <DialogContent sx={{ backgroundColor: "#ffffff" }}>
          <DialogContentText sx={{ color: "#1e3a5f" }}>
            Le temps alloué à votre tâche est écoulé. Que souhaitez-vous faire ?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ backgroundColor: "#ffffff" }}>
          <Button
            onClick={handleAddExtraTime}
            sx={{
              color: "#1e3a5f",
              borderColor: "#1e3a5f",
              "&:hover": { borderColor: "#152a4a" },
            }}
            variant="outlined"
          >
            Ajouter du temps supplémentaire
          </Button>
          <Button
            onClick={handleTimeUpDialogClose}
            sx={{
              backgroundColor: "#1e3a5f",
              color: "white",
              "&:hover": { backgroundColor: "#152a4a" },
            }}
            variant="contained"
          >
            Terminer la tâche
          </Button>
        </DialogActions>
      </Dialog>

      {/* Extra Time Dialog */}
      <Dialog open={openExtraTimeDialog} onClose={() => setOpenExtraTimeDialog(false)}>
        <DialogTitle sx={{ backgroundColor: "#1e3a5f", color: "white" }}>
          Ajouter du temps supplémentaire
        </DialogTitle>
        <DialogContent sx={{ backgroundColor: "#ffffff" }}>
          <DialogContentText sx={{ color: "#1e3a5f", mb: 2 }}>
            Veuillez saisir la durée supplémentaire nécessaire (format HH:mm:ss) :
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="extraTime"
            label="Durée supplémentaire"
            type="text"
            fullWidth
            variant="outlined"
            value={extraTime}
            onChange={handleExtraTimeChange}
            placeholder="HH:mm:ss"
          />
        </DialogContent>
        <DialogActions sx={{ backgroundColor: "#ffffff" }}>
          <Button
            onClick={() => setOpenExtraTimeDialog(false)}
            sx={{
              color: "#1e3a5f",
              borderColor: "#1e3a5f",
              "&:hover": { borderColor: "#152a4a" },
            }}
            variant="outlined"
          >
            Annuler
          </Button>
          <Button
            onClick={handleExtraTimeSubmit}
            sx={{
              backgroundColor: "#1e3a5f",
              color: "white",
              "&:hover": { backgroundColor: "#152a4a" },
            }}
            variant="contained"
          >
            Confirmer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Completion Dialog */}
      <Dialog open={openCompletionDialog} onClose={handleCompletionDialogClose}>
        <DialogTitle sx={{ backgroundColor: "#1e3a5f", color: "white" }}>
          Tâche terminée
        </DialogTitle>
        <DialogContent sx={{ backgroundColor: "#ffffff" }}>
          <DialogContentText sx={{ color: "#1e3a5f" }}>
            Félicitations ! Vous avez accompli votre tâche dans le temps imparti avec succès !
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ backgroundColor: "#ffffff" }}>
          <Button
            onClick={handleCompletionDialogClose}
            sx={{
              backgroundColor: "#1e3a5f",
              color: "white",
              "&:hover": { backgroundColor: "#152a4a" },
            }}
            variant="contained"
          >
            OK
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TasksByStatus;