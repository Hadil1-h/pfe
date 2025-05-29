import React, { useState, useEffect, useRef, useContext } from "react";
import {
  Box,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  Typography,
  Paper,
  Divider,
  Avatar,
  ListItemAvatar,
  Snackbar,
  Alert,
  useTheme,
  CircularProgress,
  Chip,
} from "@mui/material";
import { Send as SendIcon, Group as GroupIcon } from "@mui/icons-material";
import axios from "axios";
import { tokens } from "../theme";
import { AuthContext } from "../context/AuthContext";

const MessagingInterface = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const { user } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [agents, setAgents] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);

  // Scroll to bottom (instant, like Messenger/WhatsApp)
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "auto" });
    }
  };

  // Fetch agents
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const response = await axios.get("http://localhost:8080/api/agents");
        setAgents(response.data || []);
      } catch (error) {
        console.error("Erreur lors de la récupération des agents:", error);
        setSnackbar({ open: true, message: "Erreur lors du chargement des agents", severity: "error" });
      }
    };
    fetchAgents();
  }, []);

  // Fetch messages
  useEffect(() => {
    const fetchMessages = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get("http://localhost:8080/api/messagerie");
        const messagesWithSenderNames = response.data
          .map((msg) => {
            const senderAgent = agents.find((a) => a.id === msg.sender?.id) || {};
            const recipientAgent = msg.recipientId
              ? agents.find((a) => a.id === msg.recipientId) || {}
              : null;
            return {
              id: msg.id,
              senderId: msg.sender?.id || 0,
              sender: senderAgent.prenom ? `${senderAgent.prenom} ${senderAgent.nom}` : "Agent inconnu",
              recipient: recipientAgent ? `${recipientAgent.prenom} ${recipientAgent.nom}` : null,
              recipientId: msg.recipientId || null,
              content: msg.messageContent || "Contenu vide",
              timestamp: new Date(msg.sentAt).toLocaleTimeString("fr-FR", {
                hour: "2-digit",
                minute: "2-digit",
              }),
              date: new Date(msg.sentAt).toLocaleDateString("fr-FR"),
              sentAt: new Date(msg.sentAt),
              isPrivate: msg.isPrivate || !!msg.recipientId,
            };
          })
          .sort((a, b) => a.sentAt - b.sentAt);
        setMessages(messagesWithSenderNames);
        scrollToBottom(); // Direct call, no setTimeout
      } catch (error) {
        console.error("Erreur lors de la récupération des messages:", error);
        setSnackbar({ open: true, message: "Erreur lors du chargement des messages", severity: "error" });
      } finally {
        setIsLoading(false);
      }
    };
    if (agents.length > 0) {
      fetchMessages();
    }
  }, [agents]);

  // Scroll to bottom when selectedAgent or messages change
  useEffect(() => {
    scrollToBottom(); // Direct call, no setTimeout
  }, [selectedAgent, messages]);

  // Send message
  const handleSendMessage = async () => {
    if (!user) {
      setSnackbar({ open: true, message: "Vous devez être connecté pour envoyer un message", severity: "error" });
      return;
    }

    if (newMessage.trim() === "") {
      setSnackbar({ open: true, message: "Le message ne peut pas être vide", severity: "error" });
      return;
    }

    setIsSending(true);
    const messageData = {
      sender: { id: user.id },
      messageContent: newMessage,
      sentAt: new Date().toISOString(),
      recipientId: selectedAgent,
      isPrivate: !!selectedAgent,
    };

    try {
      const response = await axios.post("http://localhost:8080/api/messagerie", messageData);
      const senderAgent = agents.find((a) => a.id === response.data.sender?.id) || {};
      const recipientAgent = response.data.recipientId
        ? agents.find((a) => a.id === response.data.recipientId) || {}
        : null;
      const newMsg = {
        id: response.data.id,
        senderId: response.data.sender?.id || 0,
        sender: senderAgent.prenom ? `${senderAgent.prenom} ${senderAgent.nom}` : "Agent inconnu",
        recipient: recipientAgent ? `${recipientAgent.prenom} ${recipientAgent.nom}` : null,
        recipientId: response.data.recipientId || null,
        content: response.data.messageContent || "Contenu vide",
        timestamp: new Date(response.data.sentAt).toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        date: new Date(response.data.sentAt).toLocaleDateString("fr-FR"),
        sentAt: new Date(response.data.sentAt),
        isPrivate: response.data.isPrivate || !!response.data.recipientId,
      };
      setMessages((prev) => [...prev, newMsg].sort((a, b) => a.sentAt - b.sentAt));
      setNewMessage("");
      setSnackbar({
        open: true,
        message: newMsg.isPrivate ? "Message privé envoyé avec succès" : "Message envoyé avec succès",
        severity: "success",
      });
      scrollToBottom(); // Direct call
    } catch (error) {
      console.error("Erreur lors de l'envoi du message:", error);
      setSnackbar({ open: true, message: "Erreur lors de l'envoi du message", severity: "error" });
    } finally {
      setIsSending(false);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Filter messages based on selected agent
  const filteredMessages = selectedAgent
    ? messages.filter(
        (msg) =>
          msg.isPrivate &&
          ((msg.senderId === user.id && msg.recipientId === selectedAgent) ||
           (msg.senderId === selectedAgent && msg.recipientId === user.id))
      )
    : messages.filter((msg) => !msg.isPrivate);

  // Group messages by date and sort dates chronologically
  const groupedMessages = filteredMessages.reduce((acc, message) => {
    if (!acc[message.date]) {
      acc[message.date] = [];
    }
    acc[message.date].push(message);
    return acc;
  }, {});
  const sortedDates = Object.keys(groupedMessages).sort((a, b) =>
    new Date(a.split("/").reverse().join("-")) - new Date(b.split("/").reverse().join("-"))
  );

  // Generate avatar initials
  const getInitials = (name) => {
    const names = name.split(" ");
    return names.length > 1 ? `${names[0][0]}${names[1][0]}`.toUpperCase() : name[0]?.toUpperCase() || "?";
  };

  if (!user) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
          bgcolor: theme.palette.mode === "dark" ? "#000000" : "#FFFFFF",
          borderRadius: "12px",
          m: "20px",
        }}
      >
        <Typography variant="h6" color={colors.grey[100]}>
          Veuillez vous connecter pour accéder à la messagerie.
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        bgcolor: theme.palette.mode === "dark" ? "#000000" : "#FFFFFF",
        borderRadius: "12px",
        m: { xs: "10px", md: "20px" },
        overflow: "hidden",
        boxShadow: `0 4px 20px ${colors.grey[900]}33`,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          p: "15px",
          bgcolor: colors.primary[400],
          borderBottom: `1px solid ${colors.grey[700]}`,
          flexShrink: 0,
        }}
      >
        <Typography variant="h4" fontWeight="600" color={colors.grey[100]}>
          {selectedAgent
            ? `Chat avec ${
                agents.find((a) => a.id === selectedAgent)?.prenom || "Agent"
              } ${
                agents.find((a) => a.id === selectedAgent)?.nom || "inconnu"
              }`
            : "Messagerie de groupe"}
        </Typography>
      </Box>

      {isLoading ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            flexGrow: 1,
            bgcolor: theme.palette.mode === "dark" ? "#000000" : "#FFFFFF",
          }}
        >
          <CircularProgress sx={{ color: colors.blueAccent[500] }} />
        </Box>
      ) : (
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            flexGrow: 1,
            overflow: "hidden",
          }}
        >
          {/* Sidebar (Agent List) */}
          <Paper
            elevation={0}
            sx={{
              width: { xs: "100%", md: "280px" },
              bgcolor: colors.primary[400],
              borderRight: { md: `1px solid ${colors.grey[700]}` },
              borderBottom: { xs: `1px solid ${colors.grey[700]}`, md: "none" },
              overflowY: "auto",
              flexShrink: 0,
              height: { xs: "auto", md: "100%" }, // Auto height on mobile
              maxHeight: { xs: "50vh", md: "100%" }, // Limit mobile height
              p: "15px",
              scrollbarWidth: "none", // Firefox
              msOverflowStyle: "none", // Edge
              "&::-webkit-scrollbar": {
                display: "none", // Chrome/Safari
              },
              overscrollBehavior: "contain", // Prevent scroll chaining
            }}
          >
            <Typography
              variant="h6"
              sx={{ p: "10px 0", color: colors.grey[100], fontWeight: "500" }}
            >
              Discussions
            </Typography>
            <Divider sx={{ bgcolor: colors.grey[700], mb: "10px" }} />
            <List sx={{ p: 0 }}>
              <ListItem
                sx={{
                  p: "8px 10px",
                  borderRadius: "8px",
                  "&:hover": { bgcolor: colors.grey[800] },
                  cursor: "pointer",
                  transition: "background-color 0.2s",
                  backgroundColor: !selectedAgent ? colors.grey[800] : "transparent",
                }}
                onClick={() => setSelectedAgent(null)}
              >
                <ListItemAvatar>
                  <Avatar
                    sx={{
                      bgcolor: colors.blueAccent[500],
                      width: 36,
                      height: 36,
                    }}
                  >
                    <GroupIcon />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary="Groupe"
                  primaryTypographyProps={{ color: colors.grey[100], fontSize: "0.9rem" }}
                  secondary={
                    <Typography variant="caption" sx={{ color: colors.grey[300] }}>
                      Discussion générale
                    </Typography>
                  }
                />
              </ListItem>
              {agents.length === 0 ? (
                <Typography sx={{ p: "10px", color: colors.grey[300] }}>
                  Aucun agent disponible
                </Typography>
              ) : (
                agents
                  .filter((agent) => agent.id !== user.id)
                  .map((agent) => (
                    <ListItem
                      key={agent.id}
                      sx={{
                        p: "8px 10px",
                        borderRadius: "8px",
                        "&:hover": { bgcolor: colors.grey[800] },
                        cursor: "pointer",
                        transition: "background-color 0.2s",
                        backgroundColor: selectedAgent === agent.id ? colors.grey[800] : "transparent",
                      }}
                      onClick={() => setSelectedAgent(agent.id)}
                    >
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            bgcolor: colors.blueAccent[500],
                            width: 36,
                            height: 36,
                          }}
                        >
                          {getInitials(`${agent.prenom} ${agent.nom}`)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={`${agent.prenom} ${agent.nom}`}
                        primaryTypographyProps={{ color: colors.grey[100], fontSize: "0.9rem" }}
                      />
                    </ListItem>
                  ))
              )}
            </List>
          </Paper>

          {/* Message Area (Center Content) */}
          <Box
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              bgcolor: theme.palette.mode === "dark" ? "#000000" : "#FFFFFF",
              overflow: "hidden",
            }}
          >
            <Paper
              elevation={0}
              sx={{
                flex: 1,
                bgcolor: "transparent",
                overflowY: "auto",
                p: "20px",
                scrollbarWidth: "none", // Firefox
                msOverflowStyle: "none", // Edge
                "&::-webkit-scrollbar": {
                  display: "none", // Chrome/Safari
                },
                overscrollBehavior: "contain", // Prevent scroll chaining
              }}
            >
              <List sx={{ p: 0 }}>
                {sortedDates.length === 0 ? (
                  <Typography sx={{ p: "20px", color: colors.grey[300], textAlign: "center" }}>
                    Aucun message à afficher
                  </Typography>
                ) : (
                  sortedDates.map((date) => (
                    <Box key={date}>
                      <Divider
                        sx={{
                          margin: "20px 0",
                          bgcolor: colors.grey[700],
                          "&::before, &::after": { borderColor: colors.grey[700] },
                        }}
                        textAlign="center"
                      >
                        <Chip
                          label={date}
                          sx={{ bgcolor: colors.grey[800], color: colors.grey[100] }}
                        />
                      </Divider>
                      {groupedMessages[date].map((message) => (
                        <ListItem
                          key={message.id}
                          sx={{
                            display: "flex",
                            justifyContent: message.senderId === user.id ? "flex-end" : "flex-start",
                            p: "8px 12px",
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              flexDirection: message.senderId === user.id ? "row-reverse" : "row",
                              alignItems: "flex-start",
                              maxWidth: "70%",
                              gap: "10px",
                            }}
                          >
                            <Avatar
                              sx={{
                                bgcolor: colors.blueAccent[500],
                                width: 36,
                                height: 36,
                              }}
                            >
                              {getInitials(message.sender)}
                            </Avatar>
                            <Box
                              sx={{
                                bgcolor: message.senderId === user.id
                                  ? colors.blueAccent[700]
                                  : colors.grey[700],
                                borderRadius: message.senderId === user.id
                                  ? "12px 12px 0 12px"
                                  : "12px 12px 12px 0",
                                p: "12px",
                                boxShadow: `0 2px 4px ${colors.grey[900]}33`,
                                color: colors.grey[100],
                                maxWidth: "100%",
                              }}
                            >
                              <Typography variant="body1" sx={{ wordBreak: "break-word" }}>
                                {message.content}
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{
                                  color: colors.grey[300],
                                  mt: "4px",
                                  display: "block",
                                  textAlign: message.senderId === user.id ? "right" : "left",
                                }}
                              >
                                {message.sender} • {message.timestamp}
                                {message.isPrivate && ` • Privé`}
                              </Typography>
                            </Box>
                          </Box>
                        </ListItem>
                      ))}
                    </Box>
                  ))
                )}
                <div ref={messagesEndRef} />
              </List>
            </Paper>
            <Box
              sx={{
                p: "15px",
                bgcolor: colors.primary[400],
                borderTop: `1px solid ${colors.grey[700]}`,
                display: "flex",
                alignItems: "center",
                gap: "12px",
                flexShrink: 0,
              }}
            >
              <TextField
                fullWidth
                variant="outlined"
                placeholder={
                  selectedAgent
                    ? `Tapez votre message à ${
                        agents.find((a) => a.id === selectedAgent)?.prenom || "Agent"
                      }...`
                    : "Tapez votre message au groupe..."
                }
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && !isSending && handleSendMessage()}
                disabled={isSending}
                sx={{
                  bgcolor: colors.grey[800],
                  borderRadius: "8px",
                  "& .MuiOutlinedInput-root": {
                    color: colors.grey[100],
                    "& fieldset": { borderColor: colors.grey[700] },
                    "&:hover fieldset": { borderColor: colors.grey[100] },
                    "&.Mui-focused fieldset": { borderColor: colors.blueAccent[500] },
                  },
                  "& .MuiInputBase-input": { color: colors.grey[100], py: "12px" },
                }}
              />
              <Button
                variant="contained"
                endIcon={isSending ? null : <SendIcon />}
                onClick={handleSendMessage}
                disabled={isSending}
                sx={{
                  bgcolor: colors.blueAccent[500],
                  "&:hover": { bgcolor: colors.blueAccent[600] },
                  minWidth: { xs: "80px", md: "120px" },
                  p: "12px",
                  borderRadius: "8px",
                  transition: "all 0.2s",
                }}
              >
                {isSending ? <CircularProgress size={24} sx={{ color: colors.grey[100] }} /> : "Envoyer"}
              </Button>
            </Box>
          </Box>
        </Box>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          sx={{ width: "100%", bgcolor: colors.grey[800], color: colors.grey[100] }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MessagingInterface;