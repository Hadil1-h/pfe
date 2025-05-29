import React, { createContext, useState, useEffect, useRef } from "react";

export const TimerContext = createContext();

export const TimerProvider = ({ children }) => {
  const [activeTimer, setActiveTimer] = useState(null);
  const [remainingTime, setRemainingTime] = useState(null);
  const [timerRunning, setTimerRunning] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });
  const [timerPosition, setTimerPosition] = useState({ x: 20, y: 20 });
  const [openTimeUpDialog, setOpenTimeUpDialog] = useState(false);
  const [openCompletionDialog, setOpenCompletionDialog] = useState(false);

  // Référence pour le drag-and-drop
  const dragRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Logs pour déboguer
  useEffect(() => {
    console.log("TimerContext state:", {
      activeTimer,
      remainingTime,
      timerRunning,
      snackbar,
      openTimeUpDialog,
      openCompletionDialog,
    });
  }, [activeTimer, remainingTime, timerRunning, snackbar, openTimeUpDialog, openCompletionDialog]);

  // Timer logic
  useEffect(() => {
    let interval;
    if (timerRunning && activeTimer && remainingTime > 0) {
      console.log("Timer running, remaining time:", remainingTime);
      interval = setInterval(() => {
        setRemainingTime((prev) => {
          const newTime = prev - 1;
          if (newTime <= 0) {
            clearInterval(interval);
            setTimerRunning(false);
            setOpenTimeUpDialog(true); // Ouvre le popup au lieu d'un snackbar
            return 0;
          }

          // Notification when 5 minutes remaining
          if (newTime === 300) {
            setSnackbar({
              open: true,
              message: `Le temps alloué va bientôt se terminer. Il reste 5 minutes.`,
              severity: "info",
            });
          }

          return newTime;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning, activeTimer, remainingTime]);

  // Drag-and-drop logic
  const handleMouseDown = (e) => {
    setIsDragging(true);
    const rect = dragRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    e.preventDefault(); // Empêche la sélection de texte
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      setTimerPosition({ x: newX, y: newY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  // Formater le temps en HH:mm:ss
  const formatTime = (seconds) => {
    if (seconds == null) return "00:00:00";
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <TimerContext.Provider
      value={{
        activeTimer,
        setActiveTimer,
        remainingTime,
        setRemainingTime,
        timerRunning,
        setTimerRunning,
        snackbar,
        setSnackbar,
        timerPosition,
        setTimerPosition,
        dragRef,
        isDragging,
        handleMouseDown,
        formatTime,
        openTimeUpDialog,
        setOpenTimeUpDialog,
        openCompletionDialog,
        setOpenCompletionDialog,
      }}
    >
      {children}
    </TimerContext.Provider>
  );
};