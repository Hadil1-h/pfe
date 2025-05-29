// src/App.js
import { useState, useEffect, useContext } from "react";
import { CssBaseline, ThemeProvider, Box, Paper, Typography, Snackbar, Alert, IconButton } from "@mui/material";
import { ColorModeContext, useMode } from "./theme";
import TopBar from "./components/TopBar";
import Sidebar from "./components/Sidebar";
import AppRouter from "./routes/AppRouter";
import { AuthProvider } from "./context/AuthContext";
import { TimerProvider, TimerContext } from "./context/TimerContext";
import { BrowserRouter as Router } from "react-router-dom";
import { tokens } from "./theme";
import { Pause as PauseIcon, PlayArrow as PlayIcon } from "@mui/icons-material";
import ErrorBoundary from "./components/ErrorBoundary";

function Notification({ open, message, severity, onClose }) {
  return (
    <Snackbar
      open={open}
      autoHideDuration={3000}
      onClose={onClose}
      anchorOrigin={{ vertical: "top", horizontal: "center" }}
      sx={{
        top: "50%",
        transform: "translateY(-50%)",
      }}
    >
      <Alert onClose={onClose} severity={severity} sx={{ width: "100%" }}>
        {message}
      </Alert>
    </Snackbar>
  );
}

function TimerComponent() {
  const {
    activeTimer,
    remainingTime,
    timerRunning,
    setTimerRunning,
    timerPosition,
    dragRef,
    isDragging,
    handleMouseDown,
    formatTime,
  } = useContext(TimerContext);

  console.log("TimerComponent render:", { activeTimer, remainingTime, timerRunning });

  if (!activeTimer) {
    console.log("TimerComponent not rendered: activeTimer is null");
    return null;
  }

  return (
    <Paper
      ref={dragRef}
      elevation={3}
      sx={{
        position: "fixed",
        left: timerPosition.x,
        top: timerPosition.y,
        p: 2,
        backgroundColor: "#1e3a5f",
        color: "white",
        zIndex: 10000, // Increased zIndex to ensure visibility
        display: "flex",
        alignItems: "center",
        gap: 2,
        cursor: isDragging ? "grabbing" : "grab",
        userSelect: "none",
      }}
      onMouseDown={handleMouseDown}
    >
      <Typography variant="h6">
        Chrono: {formatTime(remainingTime)}
      </Typography>
      <IconButton onClick={() => setTimerRunning(!timerRunning)}>
        {timerRunning ? (
          <PauseIcon sx={{ color: "white" }} />
        ) : (
          <PlayIcon sx={{ color: "white" }} />
        )}
      </IconButton>
      <Typography variant="body2">{activeTimer.titre}</Typography>
    </Paper>
  );
}

function AppContent() {
  const [isSidebar, setIsSidebar] = useState(true);
  const theme = useMode()[0];
  const colors = tokens(theme.palette.mode);
  const [notificationQueue, setNotificationQueue] = useState([]);
  const [notification, setNotification] = useState({ open: false, message: "", severity: "info" });
  const { snackbar, setSnackbar } = useContext(TimerContext);

  useEffect(() => {
    if (notification.open) {
      setNotificationQueue((prev) => [...prev, { ...notification, id: Date.now() }]);
      setNotification({ open: false, message: "", severity: "info" });
    }
  }, [notification]);

  const handleCloseNotification = (id) => {
    setNotificationQueue((prev) => prev.filter((n) => n.id !== id));
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", position: "relative" }}>
      {notificationQueue.map((n) => (
        <Notification
          key={n.id}
          open={true}
          message={n.message}
          severity={n.severity}
          onClose={() => handleCloseNotification(n.id)}
        />
      ))}
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
      <Sidebar isSidebar={isSidebar} />
      <Box
        sx={{
          flexGrow: 1,
          marginLeft: isSidebar ? { xs: "60px", md: "200px" } : "60px",
          transition: "margin-left 0.3s",
          overflowY: "auto",
          height: "100vh",
          backgroundColor: theme.palette.background.default,
        }}
      >
        <TopBar setIsSidebar={setIsSidebar} />
        <Box sx={{ p: 2 }}>
          <ErrorBoundary>
            <AppRouter />
          </ErrorBoundary>
        </Box>
      </Box>
      <TimerComponent />
    </Box>
  );
}

function App() {
  const [theme, colorMode] = useMode();

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AuthProvider>
            <TimerProvider>
              <AppContent />
            </TimerProvider>
          </AuthProvider>
        </Router>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

export default App;