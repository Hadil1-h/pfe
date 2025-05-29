// src/components/ErrorBoundary.jsx
import React, { Component } from "react";
import { Snackbar, Alert, Button } from "@mui/material";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, open: false };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render shows the fallback UI
    return { hasError: true, error, open: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to the console or an external service
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleClose = () => {
    // Reset the error state to allow retrying
    this.setState({ hasError: false, error: null, errorInfo: null, open: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <>
          {this.props.children}
          <Snackbar
            open={this.state.open}
            autoHideDuration={6000}
            onClose={this.handleClose}
            anchorOrigin={{ vertical: "top", horizontal: "center" }}
          >
            <Alert
              onClose={this.handleClose}
              severity="error"
              sx={{ width: "100%" }}
              action={
                <Button color="inherit" size="small" onClick={this.handleClose}>
                  Réessayer
                </Button>
              }
            >
              Une erreur s'est produite : {this.state.error?.message || "Erreur inconnue"}
            </Alert>
          </Snackbar>
        </>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;