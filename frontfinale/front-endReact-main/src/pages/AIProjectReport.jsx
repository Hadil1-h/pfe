import React, { useState, useEffect } from 'react';
import {
  Box, Typography, CircularProgress, Alert, useTheme, Button, TextField, IconButton
} from '@mui/material';
import { tokens } from '../theme';
import Header from '../components/Header';
import SendIcon from '@mui/icons-material/Send';

const AIProjectReport = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [questions, setQuestions] = useState([]);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [userQuery, setUserQuery] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);

  // Simulated fetch for projects
  const fetchProjects = async () => {
    try {
      const projectData = [
        { id: 1, nomProjet: "Projet Alpha", dateDebut: "2023-01-01", dateFin: "2025-06-30", statutProjet: { nom: "En cours" }, budget: 100000, archived: false, societe: { raisonSociale: "Entreprise A" }, equipe_id: 1 },
        { id: 2, nomProjet: "Projet Beta", dateDebut: "2023-02-01", dateFin: "2025-05-31", statutProjet: { nom: "En cours" }, budget: 150000, archived: false, societe: { raisonSociale: "Entreprise B" }, equipe_id: 2 },
        { id: 3, nomProjet: "Projet Gamma", dateDebut: "2023-03-01", dateFin: "2025-07-31", statutProjet: { nom: "En cours" }, budget: 200000, archived: false, societe: { raisonSociale: "Entreprise C" }, equipe_id: 3 }
      ];
      setProjects(projectData);
    } catch (err) {
      setError({ message: `Erreur lors de la récupération des projets : ${err.message}` });
    }
  };

  // Simulated fetch for tasks
  const fetchTasks = async () => {
    try {
      const taskData = [
        { id: 1, idProjet: 1, dateFin: "2023-06-24", idStatutTache: 2 },
        { id: 2, idProjet: 2, dateFin: "2023-05-31", idStatutTache: 2 },
        { id: 3, idProjet: 3, dateFin: "2025-05-26", idStatutTache: 2 },
        { id: 4, idProjet: 1, dateFin: "2025-05-11", idStatutTache: 4 },
        { id: 5, idProjet: 2, dateFin: "2025-05-11", idStatutTache: 2 },
        { id: 6, idProjet: 3, dateFin: "2025-05-09", idStatutTache: 2 }
      ];
      setTasks(taskData);
    } catch (err) {
      setError({ message: `Erreur lors de la récupération des tâches : ${err.message}` });
    }
  };

  // Fetch suggested questions
  const fetchSuggestedQuestions = async () => {
    setLoading(true);
    try {
      const requestData = { projects, tasks, agents: [], equipes: [], language: 'fr' };
      const res = await fetch('http://localhost:8000/api/ai/suggest-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });
      if (!res.ok) throw new Error(`Erreur HTTP : ${res.status}`);
      const data = await res.json();
      const questions = data.questions || [];
      setQuestions(questions.slice(0, 2));
      setFilteredQuestions(questions.slice(0, 2));
      setLoading(false);
    } catch (err) {
      setError({ message: `Erreur lors de la récupération des questions suggérées : ${err.message}` });
      setLoading(false);
    }
  };

  // Handle question submission
  const handleAskQuestion = async () => {
    if (!userQuery.trim()) return;
    setLoading(true);
    setError(null);

    // Add user message to chat
    setMessages([...messages, { role: 'user', content: userQuery }]);

    try {
      const requestData = { query: userQuery, projects, tasks, agents: [], equipes: [], filterPeriod: 'all', language: 'fr' };
      const res = await fetch('http://localhost:8000/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });
      if (!res.ok) throw new Error(`Erreur HTTP : ${res.status}`);
      const data = await res.json();
      let responseText = data.response || "Aucune réponse pertinente reçue.";
      if (responseText.includes("Erreur") || responseText.includes("Désolé")) {
        responseText = "La réponse n'est pas disponible. Essayez de reformuler votre question.";
      }
      setMessages([...messages, { role: 'user', content: userQuery }, { role: 'assistant', content: responseText }]);
      setLoading(false);
      setUserQuery('');
    } catch (err) {
      setError({ message: `Erreur lors de la récupération de la réponse : ${err.message}` });
      setLoading(false);
    }
  };

  // Load projects and tasks on mount
  useEffect(() => {
    fetchProjects();
    fetchTasks();
  }, []);

  // Fetch suggested questions when projects and tasks are loaded
  useEffect(() => {
    if (projects.length > 0 && tasks.length > 0) {
      fetchSuggestedQuestions();
    }
  }, [projects, tasks]);

  // Filter suggested questions
  const handleSearchChange = (event) => {
    const value = event.target.value.toLowerCase();
    setSearchTerm(value);
    const filtered = questions.filter(question => question.toLowerCase().includes(value));
    setFilteredQuestions(filtered.slice(0, 2));
  };

  // Report incorrect response
  const handleReportError = () => {
    alert('Réponse signalée comme incorrecte. Merci pour votre feedback !');
  };

  return (
    <Box
      m="20px"
      display="flex"
      flexDirection="column"
      alignItems="center" // Center the entire component horizontally
      justifyContent="center" // Center the entire component vertically
      height="100vh" // Full viewport height
    >
      {/* HEADER */}
      <Box mb="20px" width="100%" maxWidth="800px">
        <Header title="Chat IA" subtitle="Discutez de vos projets" />
      </Box>

      {/* CHAT AREA */}
      <Box
        width="100%"
        maxWidth="800px" // Limit the width of the chat area
        height="60vh" // Set a fixed height for the chat area
        overflow="auto"
        p="20px"
        sx={{
          backgroundColor: colors.primary[400],
          borderRadius: '8px',
          mb: '20px',
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', // Subtle shadow for better appearance
        }}
      >
        {messages.length === 0 && !loading && !error && (
          <Typography color={colors.grey[100]} textAlign="center" mt="20px">
            Posez une question pour commencer la conversation.
          </Typography>
        )}
        {messages.map((msg, index) => (
          <Box
            key={index}
            display="flex"
            justifyContent={msg.role === 'user' ? 'flex-end' : 'flex-start'}
            mb="10px"
          >
            <Box
              p="10px"
              borderRadius="12px"
              maxWidth="70%"
              sx={{
                backgroundColor: msg.role === 'user' ? colors.blueAccent[700] : colors.grey[700],
                color: colors.grey[100],
                border: `1px solid ${colors.grey[500]}`,
              }}
            >
              <Typography>{msg.content}</Typography>
              {msg.role === 'assistant' && (
                <Button
                  variant="text"
                  size="small"
                  color="error"
                  onClick={handleReportError}
                  sx={{ mt: '5px', color: colors.redAccent[500] }}
                >
                  Signaler
                </Button>
              )}
            </Box>
          </Box>
        ))}
        {loading && (
          <Box display="flex" justifyContent="center" mt="10px">
            <CircularProgress size={24} />
          </Box>
        )}
        {error && (
          <Alert severity="error" sx={{ mt: '10px' }}>
            {error.message}
          </Alert>
        )}
      </Box>

      {/* INPUT AND SUGGESTED QUESTIONS */}
      <Box
        display="flex"
        flexDirection="column"
        gap="10px"
        width="100%"
        maxWidth="800px" // Match the chat area width
      >
        <Box display="flex" gap="10px">
          <TextField
            label="Posez votre question"
            variant="outlined"
            value={userQuery}
            onChange={(e) => setUserQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAskQuestion()}
            sx={{
              flexGrow: 1,
              backgroundColor: colors.blueAccent[700],
              '& .MuiOutlinedInput-root': {
                '& fieldset': { borderColor: colors.grey[500] },
                '&:hover fieldset': { borderColor: colors.primary[500] },
              },
              '& .MuiInputLabel-root': { color: colors.grey[100] },
              '& .MuiInputBase-input': { color: colors.grey[100] },
            }}
          />
          <IconButton
            onClick={handleAskQuestion}
            disabled={loading || !userQuery.trim()}
            sx={{ backgroundColor: colors.primary[500], '&:hover': { backgroundColor: colors.primary[600] } }}
          >
            <SendIcon sx={{ color: colors.grey[100] }} />
          </IconButton>
        </Box>

        {/* SUGGESTED QUESTIONS */}
        <Box display="flex" flexDirection="column" gap="10px">
          <Typography variant="h6" color={colors.grey[100]}>
            Questions suggérées :
          </Typography>
          {filteredQuestions.length > 0 ? (
            filteredQuestions.map((question, index) => (
              <Button
                key={index}
                variant="outlined"
                onClick={() => setUserQuery(question)}
                sx={{
                  justifyContent: 'flex-start',
                  textAlign: 'left',
                  borderColor: colors.grey[500],
                  color: colors.grey[100],
                  '&:hover': { borderColor: colors.blueAccent[700], backgroundColor: colors.primary[500] },
                }}
              >
                {question}
              </Button>
            ))
          ) : (
            <Typography color={colors.grey[100]}>Aucune question suggérée.</Typography>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default AIProjectReport;
