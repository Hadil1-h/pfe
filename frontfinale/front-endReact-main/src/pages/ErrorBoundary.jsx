import React from 'react';
import { Box, Typography, Button } from '@mui/material';

class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 2, backgroundColor: '#d32f2f', color: '#e0e0e0', borderRadius: 2 }}>
          <Typography variant="h6">Une erreur s'est produite</Typography>
          <Typography>{this.state.error?.message || 'Erreur inconnue'}</Typography>
          <Button
            variant="contained"
            onClick={() => this.setState({ hasError: false, error: null })}
            sx={{ mt: 2 }}
          >
            Réessayer
          </Button>
        </Box>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;